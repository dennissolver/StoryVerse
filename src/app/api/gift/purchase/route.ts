import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Price IDs from Stripe (set in env)
const GIFT_PRICES = {
  starter: process.env.STRIPE_PRICE_GIFT_STARTER_12!,
  family: process.env.STRIPE_PRICE_GIFT_FAMILY_12!,
  premium: process.env.STRIPE_PRICE_GIFT_PREMIUM_12!,
};

const TIER_NAMES = {
  starter: 'Starter',
  family: 'Family',
  premium: 'Premium',
};

const TIER_PRICES = {
  starter: 9999,
  family: 19999,
  premium: 34999,
};

// POST - Create gift purchase checkout session
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  // Auth is optional for gift purchases (allow guest checkout)
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const {
    tier,
    recipientName,
    recipientEmail,
    giftMessage,
    occasion,
    sendToRecipient,
    sendDate,
    purchaserName,
    purchaserEmail,
  } = body;

  // Validate tier
  if (!tier || !['starter', 'family', 'premium'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
  }

  // Require purchaser email if not logged in
  if (!user && !purchaserEmail) {
    return NextResponse.json({ error: 'Email required for guest checkout' }, { status: 400 });
  }

  const email = purchaserEmail || user?.email;
  const priceId = GIFT_PRICES[tier as keyof typeof GIFT_PRICES];
  
  if (!priceId) {
    return NextResponse.json({ error: 'Gift pricing not configured' }, { status: 500 });
  }

  try {
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        type: 'gift_purchase',
        tier,
        duration_months: '12',
        recipient_name: recipientName || '',
        recipient_email: recipientEmail || '',
        gift_message: giftMessage || '',
        occasion: occasion || 'just_because',
        send_to_recipient: sendToRecipient ? 'true' : 'false',
        send_date: sendDate || '',
        purchaser_name: purchaserName || '',
        purchaser_id: user?.id || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/gift?canceled=true`,
      // Allow promotion codes
      allow_promotion_codes: true,
    });

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Gift checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get gift purchase details after success
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Get the gift code that was created by the webhook
    const supabase = await createClient();
    const { data: giftCode } = await supabase
      .from('gift_codes')
      .select('*')
      .eq('stripe_payment_intent_id', session.payment_intent)
      .single();

    if (!giftCode) {
      // Webhook might not have processed yet, return session info
      return NextResponse.json({
        status: 'processing',
        tier: session.metadata?.tier,
        recipientName: session.metadata?.recipient_name,
        message: 'Your gift is being prepared. Check your email shortly.',
      });
    }

    return NextResponse.json({
      status: 'complete',
      giftCode: giftCode.code,
      tier: giftCode.tier,
      recipientName: giftCode.recipient_name,
      recipientEmail: giftCode.recipient_email,
      giftMessage: giftCode.gift_message,
      expiresAt: giftCode.expires_at,
      // Generate shareable link
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gift/redeem?code=${giftCode.code}`,
    });

  } catch (error: any) {
    console.error('Gift status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
