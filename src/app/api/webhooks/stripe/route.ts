import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use service role for webhooks (no user context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        
        // Check if this is a gift purchase
        if (metadata.type === 'gift_purchase') {
          await handleGiftPurchase(session, metadata);
        } else if (metadata.family_id && metadata.tier) {
          // Regular subscription
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              family_id: metadata.family_id,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              tier: metadata.tier,
              status: 'active',
            });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', tier: 'free' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle gift subscription purchase
async function handleGiftPurchase(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const {
    tier,
    duration_months,
    recipient_name,
    recipient_email,
    gift_message,
    occasion,
    send_to_recipient,
    send_date,
    purchaser_name,
    purchaser_id,
  } = metadata;

  // Generate unique gift code
  const { data: codeResult } = await supabaseAdmin.rpc('generate_gift_code');
  const giftCode = codeResult || generateFallbackCode();

  // Calculate expiry (1 year from purchase)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Create gift code record
  const { data: gift, error } = await supabaseAdmin
    .from('gift_codes')
    .insert({
      code: giftCode,
      tier,
      duration_months: parseInt(duration_months) || 12,
      purchased_by: purchaser_id || null,
      purchaser_email: session.customer_email || session.customer_details?.email || '',
      purchaser_name: purchaser_name || session.customer_details?.name || '',
      stripe_payment_intent_id: session.payment_intent as string,
      amount_paid: session.amount_total || 0,
      currency: session.currency || 'usd',
      recipient_name: recipient_name || null,
      recipient_email: recipient_email || null,
      gift_message: gift_message || null,
      occasion: occasion || 'just_because',
      send_to_recipient: send_to_recipient === 'true',
      send_date: send_date ? new Date(send_date) : null,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create gift code:', error);
    throw error;
  }

  // If sending directly to recipient, queue the email
  if (send_to_recipient === 'true' && recipient_email) {
    const sendAt = send_date ? new Date(send_date) : new Date();
    
    await supabaseAdmin
      .from('gift_email_queue')
      .insert({
        gift_code_id: gift.id,
        recipient_email,
        send_at: sendAt.toISOString(),
        status: 'pending',
      });
  }

  // Send confirmation email to purchaser
  // (In production, integrate with email service like Resend, SendGrid, etc.)
  console.log(`Gift code created: ${giftCode} for ${recipient_email || 'purchaser to share'}`);
}

// Fallback code generator if DB function fails
function generateFallbackCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'STORY-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
