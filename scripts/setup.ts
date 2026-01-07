#!/usr/bin/env node

/**
 * StoryVerse Automated Setup Script
 * 
 * This script automates:
 * 1. Stripe products, prices, and webhook creation
 * 2. ElevenLabs agent creation with prompts
 * 3. Environment variable generation
 * 4. Vercel environment variable deployment
 * 
 * Usage:
 *   npx ts-node scripts/setup.ts
 *   npx ts-node scripts/setup.ts --stripe-only
 *   npx ts-node scripts/setup.ts --elevenlabs-only
 *   npx ts-node scripts/setup.ts --env-only
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  appName: 'StoryVerse',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Stripe Products
  stripeProducts: {
    STARTER: {
      name: 'StoryVerse Starter',
      description: '3 personalized books per month with narration',
      metadata: { tier: 'starter', books_per_month: '3' },
    },
    FAMILY: {
      name: 'StoryVerse Family',
      description: '8 personalized books per month - perfect for multiple children',
      metadata: { tier: 'family', books_per_month: '8' },
    },
    PREMIUM: {
      name: 'StoryVerse Premium',
      description: '20 personalized books per month for story-loving families',
      metadata: { tier: 'premium', books_per_month: '20' },
    },
    GIFT_STARTER_12: {
      name: 'Gift: StoryVerse Starter (12 months)',
      description: 'Give the gift of personalized stories - 12 month Starter subscription',
      metadata: { is_gift: 'true', tier: 'starter', duration_months: '12' },
    },
    GIFT_FAMILY_12: {
      name: 'Gift: StoryVerse Family (12 months)',
      description: 'Give the gift of personalized stories - 12 month Family subscription',
      metadata: { is_gift: 'true', tier: 'family', duration_months: '12' },
    },
    GIFT_PREMIUM_12: {
      name: 'Gift: StoryVerse Premium (12 months)',
      description: 'Give the gift of personalized stories - 12 month Premium subscription',
      metadata: { is_gift: 'true', tier: 'premium', duration_months: '12' },
    },
  },
  
  // Stripe Prices (in cents)
  stripePrices: {
    STARTER_MONTHLY: { product: 'STARTER', amount: 999, interval: 'month' },
    FAMILY_MONTHLY: { product: 'FAMILY', amount: 1999, interval: 'month' },
    PREMIUM_MONTHLY: { product: 'PREMIUM', amount: 3499, interval: 'month' },
    STARTER_ANNUAL: { product: 'STARTER', amount: 9999, interval: 'year' },
    FAMILY_ANNUAL: { product: 'FAMILY', amount: 19999, interval: 'year' },
    PREMIUM_ANNUAL: { product: 'PREMIUM', amount: 34999, interval: 'year' },
    GIFT_STARTER_12: { product: 'GIFT_STARTER_12', amount: 9999 },
    GIFT_FAMILY_12: { product: 'GIFT_FAMILY_12', amount: 19999 },
    GIFT_PREMIUM_12: { product: 'GIFT_PREMIUM_12', amount: 34999 },
  },
  
  // ElevenLabs Agent Config
  elevenLabsAgent: {
    name: 'Jillian - StoryVerse Onboarding',
    firstMessage: "Hi there! I'm Jillian, and I'm so excited to help you set up StoryVerse for your family. Before we begin creating magical personalized stories, I'd love to learn a little bit about you and the children in your life. Are you a parent, grandparent, or another caring adult?",
    systemPrompt: `You are Jillian, a warm and empathetic onboarding specialist for StoryVerse, an AI-powered personalized children's book platform. Your role is to have a natural conversation to learn about the family and their preferences.

PERSONALITY:
- Warm, friendly, and genuinely curious
- Patient and encouraging
- Culturally sensitive and inclusive
- Never judgmental about family structures or beliefs

CONVERSATION GOALS:
1. Verify the user is an adult/guardian
2. Learn about the children (names, ages, interests)
3. Discover cultural and religious background (gently, optionally)
4. Understand content preferences and any sensitivities
5. Get excited about creating their first story!

IMPORTANT GUIDELINES:
- Ask ONE question at a time
- Use the child's name once you learn it
- Be encouraging about their interests
- If they mention religious/cultural background, be respectful and curious
- Never push for information they seem hesitant to share
- Keep responses concise (2-3 sentences max)

CONVERSATION FLOW:
1. Greeting → Verify adult
2. Ask about children (how many, names, ages)
3. Learn interests and favorites
4. Gently explore cultural/religious preferences (optional)
5. Ask about any content to avoid
6. Summarize and express excitement

Remember: You're building a relationship, not filling out a form.`,
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
    language: 'en',
  },
};

// ============================================
// UTILITIES
// ============================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[type]} ${message}`);
}

// ============================================
// STRIPE SETUP
// ============================================

async function setupStripe(secretKey: string, webhookUrl: string) {
  log('Setting up Stripe products, prices, and webhooks...', 'info');
  
  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  
  const results: Record<string, string> = {};
  
  // Create products
  log('Creating products...', 'info');
  const productIds: Record<string, string> = {};
  
  for (const [key, product] of Object.entries(CONFIG.stripeProducts)) {
    try {
      const created = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: product.metadata,
      });
      productIds[key] = created.id;
      results[`STRIPE_PRODUCT_${key}`] = created.id;
      log(`  Created product: ${product.name}`, 'success');
    } catch (error: any) {
      log(`  Failed to create product ${key}: ${error.message}`, 'error');
    }
  }
  
  // Create prices
  log('Creating prices...', 'info');
  
  for (const [key, price] of Object.entries(CONFIG.stripePrices)) {
    const productKey = price.product;
    const productId = productIds[productKey];
    
    if (!productId) {
      log(`  Skipping price ${key}: product not created`, 'warn');
      continue;
    }
    
    try {
      const priceData: Stripe.PriceCreateParams = {
        product: productId,
        unit_amount: price.amount,
        currency: 'usd',
      };
      
      if ('interval' in price && price.interval) {
        priceData.recurring = { interval: price.interval as 'month' | 'year' };
      }
      
      const created = await stripe.prices.create(priceData);
      results[`STRIPE_PRICE_${key}`] = created.id;
      log(`  Created price: ${key} ($${(price.amount / 100).toFixed(2)})`, 'success');
    } catch (error: any) {
      log(`  Failed to create price ${key}: ${error.message}`, 'error');
    }
  }
  
  // Create webhook endpoint
  log('Creating webhook endpoint...', 'info');
  
  try {
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed',
        'invoice.payment_succeeded',
      ],
    });
    
    results['STRIPE_WEBHOOK_SECRET'] = webhook.secret!;
    log(`  Created webhook: ${webhookUrl}`, 'success');
    log(`  Webhook secret: ${webhook.secret}`, 'info');
  } catch (error: any) {
    log(`  Failed to create webhook: ${error.message}`, 'error');
    log('  You may need to create the webhook manually in Stripe Dashboard', 'warn');
  }
  
  return results;
}

// ============================================
// ELEVENLABS SETUP
// ============================================

async function setupElevenLabs(apiKey: string) {
  log('Setting up ElevenLabs conversational agent...', 'info');
  
  const results: Record<string, string> = {};
  
  try {
    // Create agent
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: CONFIG.elevenLabsAgent.name,
        conversation_config: {
          agent: {
            first_message: CONFIG.elevenLabsAgent.firstMessage,
            prompt: {
              prompt: CONFIG.elevenLabsAgent.systemPrompt,
            },
            language: CONFIG.elevenLabsAgent.language,
          },
          tts: {
            voice_id: CONFIG.elevenLabsAgent.voiceId,
          },
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }
    
    const agent = await response.json();
    results['NEXT_PUBLIC_ELEVENLABS_AGENT_ID'] = agent.agent_id;
    
    log(`  Created agent: ${agent.agent_id}`, 'success');
    log(`  Agent name: ${CONFIG.elevenLabsAgent.name}`, 'info');
    
  } catch (error: any) {
    log(`  Failed to create agent: ${error.message}`, 'error');
    log('  You may need to create the agent manually at elevenlabs.io', 'warn');
  }
  
  return results;
}

// ============================================
// VERCEL DEPLOYMENT
// ============================================

async function deployToVercel(projectId: string, token: string, envVars: Record<string, string>) {
  log('Deploying environment variables to Vercel...', 'info');
  
  for (const [key, value] of Object.entries(envVars)) {
    if (!value) continue;
    
    try {
      // Check if env var exists
      const checkResponse = await fetch(
        `https://api.vercel.com/v1/projects/${projectId}/env?key=${key}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const existing = await checkResponse.json();
      
      if (existing.envs?.length > 0) {
        // Update existing
        const envId = existing.envs[0].id;
        await fetch(
          `https://api.vercel.com/v1/projects/${projectId}/env/${envId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value }),
          }
        );
        log(`  Updated: ${key}`, 'success');
      } else {
        // Create new
        await fetch(
          `https://api.vercel.com/v1/projects/${projectId}/env`,
          {
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
          }
        );
        log(`  Created: ${key}`, 'success');
      }
    } catch (error: any) {
      log(`  Failed to set ${key}: ${error.message}`, 'error');
    }
  }
}

// ============================================
// ENV FILE GENERATION
// ============================================

function generateEnvFile(envVars: Record<string, string>, existingPath?: string) {
  let existing: Record<string, string> = {};
  
  // Read existing .env.local if it exists
  if (existingPath && fs.existsSync(existingPath)) {
    const content = fs.readFileSync(existingPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        existing[match[1]] = match[2];
      }
    });
  }
  
  // Merge with new values (new values take precedence)
  const merged = { ...existing, ...envVars };
  
  // Generate .env.local content
  const sections: Record<string, string[]> = {
    '# Supabase': [],
    '# AI Services': [],
    '# ElevenLabs': [],
    '# Stripe': [],
    '# App': [],
  };
  
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;
    
    const line = `${key}=${value}`;
    
    if (key.includes('SUPABASE')) {
      sections['# Supabase'].push(line);
    } else if (key.includes('ANTHROPIC') || key.includes('REPLICATE') || key.includes('OPENAI') || key.includes('GOOGLE')) {
      sections['# AI Services'].push(line);
    } else if (key.includes('ELEVENLABS')) {
      sections['# ElevenLabs'].push(line);
    } else if (key.includes('STRIPE')) {
      sections['# Stripe'].push(line);
    } else {
      sections['# App'].push(line);
    }
  }
  
  let output = '';
  for (const [header, lines] of Object.entries(sections)) {
    if (lines.length > 0) {
      output += `${header}\n${lines.join('\n')}\n\n`;
    }
  }
  
  return output.trim();
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🚀 StoryVerse Automated Setup                    ║
╠═══════════════════════════════════════════════════════════╣
║  This script will help you set up:                        ║
║  • Stripe products, prices & webhooks                     ║
║  • ElevenLabs conversational agent                        ║
║  • Environment variables (.env.local)                     ║
║  • Vercel environment deployment (optional)               ║
╚═══════════════════════════════════════════════════════════╝
`);

  const envVars: Record<string, string> = {};
  const args = process.argv.slice(2);
  
  // Check for selective setup
  const stripeOnly = args.includes('--stripe-only');
  const elevenLabsOnly = args.includes('--elevenlabs-only');
  const envOnly = args.includes('--env-only');
  const runAll = !stripeOnly && !elevenLabsOnly && !envOnly;
  
  // ============================================
  // COLLECT EXISTING KEYS
  // ============================================
  
  console.log('\n📋 First, let\'s collect your API keys:\n');
  
  // Supabase
  const supabaseUrl = await prompt('Supabase URL (or press Enter to skip): ');
  if (supabaseUrl) envVars['NEXT_PUBLIC_SUPABASE_URL'] = supabaseUrl;
  
  const supabaseAnonKey = await prompt('Supabase Anon Key: ');
  if (supabaseAnonKey) envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = supabaseAnonKey;
  
  const supabaseServiceKey = await prompt('Supabase Service Role Key: ');
  if (supabaseServiceKey) envVars['SUPABASE_SERVICE_ROLE_KEY'] = supabaseServiceKey;
  
  // AI Services
  const anthropicKey = await prompt('Anthropic API Key: ');
  if (anthropicKey) envVars['ANTHROPIC_API_KEY'] = anthropicKey;
  
  const replicateToken = await prompt('Replicate API Token (for FLUX images): ');
  if (replicateToken) envVars['REPLICATE_API_TOKEN'] = replicateToken;
  
  const openaiKey = await prompt('OpenAI API Key (for Whisper): ');
  if (openaiKey) envVars['OPENAI_API_KEY'] = openaiKey;
  
  // ============================================
  // STRIPE SETUP
  // ============================================
  
  if (runAll || stripeOnly) {
    console.log('\n💳 Stripe Setup\n');
    
    const stripeSecretKey = await prompt('Stripe Secret Key (sk_...): ');
    const stripePublishableKey = await prompt('Stripe Publishable Key (pk_...): ');
    
    if (stripeSecretKey) {
      envVars['STRIPE_SECRET_KEY'] = stripeSecretKey;
      envVars['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] = stripePublishableKey;
      
      const appUrl = await prompt(`App URL for webhooks (default: ${CONFIG.appUrl}): `) || CONFIG.appUrl;
      const webhookUrl = `${appUrl}/api/webhooks/stripe`;
      
      const stripeResults = await setupStripe(stripeSecretKey, webhookUrl);
      Object.assign(envVars, stripeResults);
    }
  }
  
  // ============================================
  // ELEVENLABS SETUP
  // ============================================
  
  if (runAll || elevenLabsOnly) {
    console.log('\n🎙️ ElevenLabs Setup\n');
    
    const elevenLabsKey = await prompt('ElevenLabs API Key: ');
    
    if (elevenLabsKey) {
      envVars['ELEVENLABS_API_KEY'] = elevenLabsKey;
      
      const createAgent = await prompt('Create new Jillian agent? (y/n): ');
      
      if (createAgent.toLowerCase() === 'y') {
        const elevenLabsResults = await setupElevenLabs(elevenLabsKey);
        Object.assign(envVars, elevenLabsResults);
      } else {
        const existingAgentId = await prompt('Existing Agent ID: ');
        if (existingAgentId) {
          envVars['NEXT_PUBLIC_ELEVENLABS_AGENT_ID'] = existingAgentId;
        }
      }
    }
  }
  
  // ============================================
  // APP URL
  // ============================================
  
  const appUrl = await prompt(`App URL (default: ${CONFIG.appUrl}): `) || CONFIG.appUrl;
  envVars['NEXT_PUBLIC_APP_URL'] = appUrl;
  
  // ============================================
  // GENERATE .ENV.LOCAL
  // ============================================
  
  console.log('\n📄 Generating .env.local\n');
  
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = generateEnvFile(envVars, fs.existsSync(envPath) ? envPath : undefined);
  
  fs.writeFileSync(envPath, envContent);
  log(`Created/updated: ${envPath}`, 'success');
  
  // ============================================
  // VERCEL DEPLOYMENT (OPTIONAL)
  // ============================================
  
  const deployVercel = await prompt('\nDeploy env vars to Vercel? (y/n): ');
  
  if (deployVercel.toLowerCase() === 'y') {
    const vercelToken = await prompt('Vercel Token: ');
    const vercelProjectId = await prompt('Vercel Project ID: ');
    
    if (vercelToken && vercelProjectId) {
      await deployToVercel(vercelProjectId, vercelToken, envVars);
    }
  }
  
  // ============================================
  // SUMMARY
  // ============================================
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    ✅ Setup Complete!                      ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📄 .env.local has been created/updated                   ║
║                                                           ║
║  Next steps:                                              ║
║  1. Review .env.local and fill in any missing values      ║
║  2. Run: npm run dev                                      ║
║  3. Test Stripe webhooks with: stripe listen --forward-to ║
║     localhost:3000/api/webhooks/stripe                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

  rl.close();
}

main().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
