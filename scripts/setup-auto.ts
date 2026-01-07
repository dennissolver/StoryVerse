#!/usr/bin/env node

/**
 * StoryVerse Non-Interactive Setup
 * 
 * Reads from environment variables and sets up services automatically.
 * Perfect for CI/CD pipelines.
 * 
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   ELEVENLABS_API_KEY (optional)
 *   VERCEL_TOKEN (optional)
 *   VERCEL_PROJECT_ID (optional)
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... npx ts-node scripts/setup-auto.ts
 */

import Stripe from 'stripe';

const PRODUCTS = {
  STARTER: { name: 'StoryVerse Starter', metadata: { tier: 'starter', books_per_month: '3' } },
  FAMILY: { name: 'StoryVerse Family', metadata: { tier: 'family', books_per_month: '8' } },
  PREMIUM: { name: 'StoryVerse Premium', metadata: { tier: 'premium', books_per_month: '20' } },
  GIFT_STARTER_12: { name: 'Gift: Starter (12mo)', metadata: { is_gift: 'true', tier: 'starter' } },
  GIFT_FAMILY_12: { name: 'Gift: Family (12mo)', metadata: { is_gift: 'true', tier: 'family' } },
  GIFT_PREMIUM_12: { name: 'Gift: Premium (12mo)', metadata: { is_gift: 'true', tier: 'premium' } },
};

const PRICES = {
  STARTER_MONTHLY: { product: 'STARTER', amount: 999, interval: 'month' as const },
  FAMILY_MONTHLY: { product: 'FAMILY', amount: 1999, interval: 'month' as const },
  PREMIUM_MONTHLY: { product: 'PREMIUM', amount: 3499, interval: 'month' as const },
  STARTER_ANNUAL: { product: 'STARTER', amount: 9999, interval: 'year' as const },
  FAMILY_ANNUAL: { product: 'FAMILY', amount: 19999, interval: 'year' as const },
  PREMIUM_ANNUAL: { product: 'PREMIUM', amount: 34999, interval: 'year' as const },
  GIFT_STARTER_12: { product: 'GIFT_STARTER_12', amount: 9999 },
  GIFT_FAMILY_12: { product: 'GIFT_FAMILY_12', amount: 19999 },
  GIFT_PREMIUM_12: { product: 'GIFT_PREMIUM_12', amount: 34999 },
};

async function setupStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY not set');
    return null;
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  const results: Record<string, string> = {};
  const productIds: Record<string, string> = {};

  console.log('🔧 Setting up Stripe...\n');

  // Check for existing products
  const existingProducts = await stripe.products.list({ limit: 100 });
  const existingByName = new Map(existingProducts.data.map(p => [p.name, p.id]));

  // Create or get products
  for (const [key, product] of Object.entries(PRODUCTS)) {
    if (existingByName.has(product.name)) {
      productIds[key] = existingByName.get(product.name)!;
      console.log(`  ⏭️  Product exists: ${product.name}`);
    } else {
      const created = await stripe.products.create({
        name: product.name,
        metadata: product.metadata,
      });
      productIds[key] = created.id;
      console.log(`  ✅ Created product: ${product.name}`);
    }
    results[`STRIPE_PRODUCT_${key}`] = productIds[key];
  }

  // Check for existing prices
  const existingPrices = await stripe.prices.list({ limit: 100, active: true });
  const existingPriceMap = new Map<string, string>();
  for (const price of existingPrices.data) {
    const key = `${price.product}-${price.unit_amount}-${price.recurring?.interval || 'one_time'}`;
    existingPriceMap.set(key, price.id);
  }

  // Create or get prices
  for (const [key, price] of Object.entries(PRICES)) {
    const productId = productIds[price.product];
    const interval = 'interval' in price ? price.interval : 'one_time';
    const lookupKey = `${productId}-${price.amount}-${interval}`;

    if (existingPriceMap.has(lookupKey)) {
      results[`STRIPE_PRICE_${key}`] = existingPriceMap.get(lookupKey)!;
      console.log(`  ⏭️  Price exists: ${key}`);
    } else {
      const priceData: Stripe.PriceCreateParams = {
        product: productId,
        unit_amount: price.amount,
        currency: 'usd',
      };
      if ('interval' in price) {
        priceData.recurring = { interval: price.interval };
      }
      const created = await stripe.prices.create(priceData);
      results[`STRIPE_PRICE_${key}`] = created.id;
      console.log(`  ✅ Created price: ${key} ($${(price.amount / 100).toFixed(2)})`);
    }
  }

  // Create webhook if APP_URL is set
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const webhookUrl = `${appUrl}/api/webhooks/stripe`;
    const existingWebhooks = await stripe.webhookEndpoints.list();
    const existing = existingWebhooks.data.find(w => w.url === webhookUrl);

    if (existing) {
      console.log(`  ⏭️  Webhook exists: ${webhookUrl}`);
      // Note: Can't retrieve secret for existing webhook
    } else {
      try {
        const webhook = await stripe.webhookEndpoints.create({
          url: webhookUrl,
          enabled_events: [
            'checkout.session.completed',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'invoice.payment_failed',
          ],
        });
        results['STRIPE_WEBHOOK_SECRET'] = webhook.secret!;
        console.log(`  ✅ Created webhook: ${webhookUrl}`);
        console.log(`  🔑 Webhook secret: ${webhook.secret}`);
      } catch (error: any) {
        console.log(`  ⚠️  Webhook creation failed: ${error.message}`);
      }
    }
  }

  return results;
}

async function setupElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log('⏭️  Skipping ElevenLabs (no API key)');
    return null;
  }

  console.log('\n🎙️ Setting up ElevenLabs...\n');

  const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) {
    console.log('  ⚠️  Could not list agents');
    return null;
  }

  const agents = await response.json();
  const existing = agents.agents?.find((a: any) => a.name?.includes('Jillian'));

  if (existing) {
    console.log(`  ⏭️  Agent exists: ${existing.agent_id}`);
    return { NEXT_PUBLIC_ELEVENLABS_AGENT_ID: existing.agent_id };
  }

  // Create new agent
  const createResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Jillian - StoryVerse Onboarding',
      conversation_config: {
        agent: {
          first_message: "Hi there! I'm Jillian, and I'm so excited to help you set up StoryVerse for your family!",
          prompt: { prompt: 'You are Jillian, a warm onboarding specialist for StoryVerse.' },
          language: 'en',
        },
        tts: { voice_id: '21m00Tcm4TlvDq8ikWAM' },
      },
    }),
  });

  if (!createResponse.ok) {
    console.log('  ⚠️  Could not create agent');
    return null;
  }

  const agent = await createResponse.json();
  console.log(`  ✅ Created agent: ${agent.agent_id}`);
  return { NEXT_PUBLIC_ELEVENLABS_AGENT_ID: agent.agent_id };
}

async function deployToVercel(envVars: Record<string, string>) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    console.log('⏭️  Skipping Vercel (no token/project ID)');
    return;
  }

  console.log('\n🚀 Deploying to Vercel...\n');

  for (const [key, value] of Object.entries(envVars)) {
    if (!value) continue;

    try {
      await fetch(`https://api.vercel.com/v1/projects/${projectId}/env`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          type: key.includes('SECRET') || key.includes('KEY') ? 'encrypted' : 'plain',
          target: ['production', 'preview', 'development'],
        }),
      });
      console.log(`  ✅ Set: ${key}`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed: ${key}`);
    }
  }
}

async function main() {
  console.log('\n🚀 StoryVerse Auto Setup\n');
  console.log('=' .repeat(50));

  const results: Record<string, string> = {};

  // Stripe
  const stripeResults = await setupStripe();
  if (stripeResults) Object.assign(results, stripeResults);

  // ElevenLabs
  const elevenLabsResults = await setupElevenLabs();
  if (elevenLabsResults) Object.assign(results, elevenLabsResults);

  // Deploy to Vercel if configured
  if (Object.keys(results).length > 0) {
    await deployToVercel(results);
  }

  // Output results
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Add these to your .env.local:\n');
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}=${value}`);
  }
  console.log('\n✅ Done!');
}

main().catch(console.error);
