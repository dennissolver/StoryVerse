import Stripe from "stripe";
import { assertEnv } from "@/lib/utils";

/**
 * Server-side Stripe client
 */
export const stripe = new Stripe(assertEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-04-10",
});

/**
 * Subscription tiers used by UI + billing logic
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: "free",
    priceId: null,
    features: ["Basic access"],
  },
  PRO: {
    id: "pro",
    priceId: "price_pro",
    features: ["Unlimited stories", "Voice narration"],
  },
};

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
