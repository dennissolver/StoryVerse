import Stripe from 'stripe';

// Lazy initialization
let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }
  return _stripe;
}

// Keep for backward compatibility but use lazy getter
export const stripe = {
  get webhooks() { return getStripe().webhooks; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get products() { return getStripe().products; },
  get prices() { return getStripe().prices; },
};

export const SUBSCRIPTION_TIERS = {
  free: { name: 'Free', price: 0, booksPerMonth: 1, voiceClones: 0 },
  starter: { name: 'Starter', price: 999, booksPerMonth: 3, voiceClones: 0 },
  family: { name: 'Family', price: 1999, booksPerMonth: 8, voiceClones: 2 },
  premium: { name: 'Premium', price: 3499, booksPerMonth: 20, voiceClones: 5 },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;