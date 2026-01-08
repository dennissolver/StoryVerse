import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const SUBSCRIPTION_TIERS = {
  free: { name: 'Free', price: 0, booksPerMonth: 1, voiceClones: 0 },
  seedling: { name: 'Seedling', price: 999, booksPerMonth: 2, voiceClones: 1, priceId: process.env.STRIPE_PRICE_SEEDLING },
  growing: { name: 'Growing', price: 1999, booksPerMonth: 4, voiceClones: 2, priceId: process.env.STRIPE_PRICE_GROWING },
  family: { name: 'Family', price: 2999, booksPerMonth: 999, voiceClones: 5, priceId: process.env.STRIPE_PRICE_FAMILY },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
