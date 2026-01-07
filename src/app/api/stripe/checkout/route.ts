import { createClient } from '@/lib/supabase/server';
import { stripe, SUBSCRIPTION_TIERS } from '@/lib/stripe/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tier } = await request.json();
    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

    if (!tierConfig || !tierConfig.priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('family_id', profile?.family_id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id, family_id: profile?.family_id || '' },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: tierConfig.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      metadata: { user_id: user.id, family_id: profile?.family_id || '', tier },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
