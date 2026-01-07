// Stripe Products & Pricing Configuration
// Run: npx ts-node scripts/setup-stripe-products.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// ============================================
// PRODUCT DEFINITIONS
// ============================================

export const PRODUCTS = {
  // Subscription tiers
  STARTER: {
    name: 'StoryVerse Starter',
    description: '3 personalized books per month with narration',
    features: [
      '3 books per month',
      'AI narration included',
      'Unlimited children profiles',
      '30+ languages',
      'Story memory continuity',
    ],
    metadata: {
      tier: 'starter',
      books_per_month: '3',
      includes_narration: 'true',
    },
  },
  FAMILY: {
    name: 'StoryVerse Family',
    description: '8 personalized books per month - perfect for multiple children',
    features: [
      '8 books per month',
      'AI narration included',
      'Unlimited children profiles',
      '30+ languages',
      'Story memory continuity',
      'Voice cloning (2 voices)',
      'Priority generation',
    ],
    metadata: {
      tier: 'family',
      books_per_month: '8',
      includes_narration: 'true',
      voice_clones: '2',
    },
  },
  PREMIUM: {
    name: 'StoryVerse Premium',
    description: '20 personalized books per month for story-loving families',
    features: [
      '20 books per month',
      'AI narration included',
      'Unlimited children profiles',
      '30+ languages',
      'Story memory continuity',
      'Voice cloning (5 voices)',
      'Priority generation',
      'Early access to new features',
      'Premium illustration styles',
    ],
    metadata: {
      tier: 'premium',
      books_per_month: '20',
      includes_narration: 'true',
      voice_clones: '5',
      priority: 'true',
    },
  },
  // Gift products (one-time purchase, generates gift code)
  GIFT_STARTER_12: {
    name: 'Gift: StoryVerse Starter (12 months)',
    description: 'Give the gift of personalized stories - 12 month Starter subscription',
    metadata: {
      is_gift: 'true',
      tier: 'starter',
      duration_months: '12',
    },
  },
  GIFT_FAMILY_12: {
    name: 'Gift: StoryVerse Family (12 months)',
    description: 'Give the gift of personalized stories - 12 month Family subscription',
    metadata: {
      is_gift: 'true',
      tier: 'family',
      duration_months: '12',
    },
  },
  GIFT_PREMIUM_12: {
    name: 'Gift: StoryVerse Premium (12 months)',
    description: 'Give the gift of personalized stories - 12 month Premium subscription',
    metadata: {
      is_gift: 'true',
      tier: 'premium',
      duration_months: '12',
    },
  },
  // Add-ons
  EXTRA_BOOKS_3: {
    name: 'Extra Book Pack (3 books)',
    description: 'Add 3 more books to your monthly allowance',
    metadata: {
      is_addon: 'true',
      extra_books: '3',
    },
  },
  PREMIUM_VOICE_CLONE: {
    name: 'Premium Voice Clone',
    description: 'Add an additional custom voice clone to your account',
    metadata: {
      is_addon: 'true',
      voice_clone: 'true',
    },
  },
} as const;

// ============================================
// PRICING DEFINITIONS (in cents)
// ============================================

export const PRICING = {
  // Monthly subscriptions
  STARTER_MONTHLY: {
    product: 'STARTER',
    unit_amount: 999, // $9.99
    currency: 'usd',
    recurring: { interval: 'month' as const },
  },
  FAMILY_MONTHLY: {
    product: 'FAMILY',
    unit_amount: 1999, // $19.99
    currency: 'usd',
    recurring: { interval: 'month' as const },
  },
  PREMIUM_MONTHLY: {
    product: 'PREMIUM',
    unit_amount: 3499, // $34.99
    currency: 'usd',
    recurring: { interval: 'month' as const },
  },
  
  // Annual subscriptions (2 months free)
  STARTER_ANNUAL: {
    product: 'STARTER',
    unit_amount: 9999, // $99.99/year ($8.33/mo)
    currency: 'usd',
    recurring: { interval: 'year' as const },
  },
  FAMILY_ANNUAL: {
    product: 'FAMILY',
    unit_amount: 19999, // $199.99/year ($16.67/mo)
    currency: 'usd',
    recurring: { interval: 'year' as const },
  },
  PREMIUM_ANNUAL: {
    product: 'PREMIUM',
    unit_amount: 34999, // $349.99/year ($29.17/mo)
    currency: 'usd',
    recurring: { interval: 'year' as const },
  },
  
  // Gift subscriptions (one-time)
  GIFT_STARTER_12: {
    product: 'GIFT_STARTER_12',
    unit_amount: 9999, // $99.99 (same as annual)
    currency: 'usd',
  },
  GIFT_FAMILY_12: {
    product: 'GIFT_FAMILY_12',
    unit_amount: 19999, // $199.99
    currency: 'usd',
  },
  GIFT_PREMIUM_12: {
    product: 'GIFT_PREMIUM_12',
    unit_amount: 34999, // $349.99
    currency: 'usd',
  },
  
  // Add-ons
  EXTRA_BOOKS_3: {
    product: 'EXTRA_BOOKS_3',
    unit_amount: 499, // $4.99
    currency: 'usd',
  },
  PREMIUM_VOICE_CLONE: {
    product: 'PREMIUM_VOICE_CLONE',
    unit_amount: 999, // $9.99
    currency: 'usd',
  },
} as const;

// ============================================
// TIER LIMITS (for enforcement)
// ============================================

export const TIER_LIMITS = {
  starter: {
    books_per_month: 3,
    voice_clones: 0,
    children: Infinity,
    narration: true,
    priority: false,
  },
  family: {
    books_per_month: 8,
    voice_clones: 2,
    children: Infinity,
    narration: true,
    priority: true,
  },
  premium: {
    books_per_month: 20,
    voice_clones: 5,
    children: Infinity,
    narration: true,
    priority: true,
  },
  free: {
    books_per_month: 1,
    voice_clones: 0,
    children: 1,
    narration: false,
    priority: false,
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

// ============================================
// SETUP SCRIPT
// ============================================

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');
  
  const createdProducts: Record<string, string> = {};
  const createdPrices: Record<string, string> = {};
  
  // Create products
  for (const [key, product] of Object.entries(PRODUCTS)) {
    console.log(`Creating product: ${product.name}`);
    
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: product.metadata,
    });
    
    createdProducts[key] = stripeProduct.id;
    console.log(`  ✓ Created: ${stripeProduct.id}`);
  }
  
  // Create prices
  for (const [key, price] of Object.entries(PRICING)) {
    const productKey = price.product as keyof typeof PRODUCTS;
    const productId = createdProducts[productKey];
    
    console.log(`Creating price: ${key}`);
    
    const priceData: Stripe.PriceCreateParams = {
      product: productId,
      unit_amount: price.unit_amount,
      currency: price.currency,
      metadata: { price_key: key },
    };
    
    if ('recurring' in price && price.recurring) {
      priceData.recurring = price.recurring;
    }
    
    const stripePrice = await stripe.prices.create(priceData);
    createdPrices[key] = stripePrice.id;
    console.log(`  ✓ Created: ${stripePrice.id}`);
  }
  
  // Output environment variables
  console.log('\n📋 Add these to your .env.local:\n');
  console.log('# Stripe Product IDs');
  for (const [key, id] of Object.entries(createdProducts)) {
    console.log(`STRIPE_PRODUCT_${key}=${id}`);
  }
  console.log('\n# Stripe Price IDs');
  for (const [key, id] of Object.entries(createdPrices)) {
    console.log(`STRIPE_PRICE_${key}=${id}`);
  }
  
  console.log('\n✅ Setup complete!');
}

// Run if called directly
if (require.main === module) {
  setupStripeProducts().catch(console.error);
}

export { setupStripeProducts };
