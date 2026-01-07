#!/usr/bin/env bash
set -e

BASE="src/lib"

echo "Rebuilding $BASE …"

rm -rf "$BASE"
mkdir -p \
  "$BASE/ai" \
  "$BASE/supabase" \
  "$BASE/stripe" \
  "$BASE/translation" \
  "$BASE/voice"

# -----------------------
# supabase/server.ts
# -----------------------
cat <<'TS' > "$BASE/supabase/server.ts"
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
TS

# -----------------------
# supabase/client.ts
# -----------------------
cat <<'TS' > "$BASE/supabase/client.ts"
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
TS

# -----------------------
# supabase/storage.ts
# -----------------------
cat <<'TS' > "$BASE/supabase/storage.ts"
import { createClient } from "./server";

export async function uploadFile(
  bucket: string,
  path: string,
  file: Blob
) {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) throw error;
  return data;
}
TS

# -----------------------
# ai/story-generator.ts
# -----------------------
cat <<'TS' > "$BASE/ai/story-generator.ts"
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface StoryContext {
  childName: string;
  theme: string;
  age: number;
}

export async function generateStory(context: StoryContext) {
  const response = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: \`Write a bedtime story for a \${context.age}-year-old child named \${context.childName}. Theme: \${context.theme}.\`,
      },
    ],
  });

  return response.content[0].text;
}
TS

# -----------------------
# ai/index.ts
# -----------------------
cat <<'TS' > "$BASE/ai/index.ts"
export { generateStory } from "./story-generator";
export type { StoryContext } from "./story-generator";
TS

# -----------------------
# stripe/server.ts
# -----------------------
cat <<'TS' > "$BASE/stripe/server.ts"
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});
TS

# -----------------------
# stripe/client.ts
# -----------------------
cat <<'TS' > "$BASE/stripe/client.ts"
import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
TS

# -----------------------
# stripe/products.ts
# -----------------------
cat <<'TS' > "$BASE/stripe/products.ts"
export const PLANS = {
  BASIC: {
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
  },
  PREMIUM: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
  },
};
TS

# -----------------------
# translation/client.ts
# -----------------------
cat <<'TS' > "$BASE/translation/client.ts"
export async function translateText(text: string, targetLang: string) {
  return text;
}
TS

# -----------------------
# translation/index.ts
# -----------------------
cat <<'TS' > "$BASE/translation/index.ts"
export { translateText } from "./client";
TS

# -----------------------
# utils.ts
# -----------------------
cat <<'TS' > "$BASE/utils.ts"
export function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(\`Missing environment variable: \${name}\`);
  }
  return value;
}
TS

# -----------------------
# voice/index.ts
# -----------------------
cat <<'TS' > "$BASE/voice/index.ts"
export { runOnboardingAgent } from "./onboarding-agent";
TS

# -----------------------
# voice/onboarding-agent.ts
# -----------------------
cat <<'TS' > "$BASE/voice/onboarding-agent.ts"
export async function runOnboardingAgent(input: string) {
  return {
    message: "Voice onboarding initialized",
    input,
  };
}
TS

# -----------------------
# voice/empathetic-discovery.ts
# -----------------------
cat <<'TS' > "$BASE/voice/empathetic-discovery.ts"
export function runEmpathyFlow(text: string) {
  return {
    response: text,
  };
}
TS

echo "✅ src/lib rebuilt successfully"
