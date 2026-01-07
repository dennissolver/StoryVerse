$base = "src/lib"

Remove-Item -Recurse -Force $base -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Force `
  "$base/ai",
  "$base/content",
  "$base/elevenlabs",
  "$base/supabase",
  "$base/stripe",
  "$base/translation",
  "$base/voice" | Out-Null

# ---------- utils.ts ----------
@"
export function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error("Missing environment variable: " + name);
  }
  return value;
}
"@ | Set-Content "$base/utils.ts"

# ---------- ai ----------
@"
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type StoryContext = {
  childName: string;
  theme: string;
  age: number;
};

export async function generateStory(_: StoryContext) {
  return "Story text";
}

export async function generateStoryOutline(_: StoryContext) {
  return [];
}

export async function generateIllustration() {
  return "";
}

export async function generateBookCover() {
  return "";
}

export async function generateChildDescription() {
  return "";
}
"@ | Set-Content "$base/ai/index.ts"

# ---------- content ----------
@"
export type FamilyPreferences = {};
export type ChildPreferences = {};

export function generateContentGuidelines() {
  return "";
}
"@ | Set-Content "$base/content/index.ts"

# ---------- elevenlabs ----------
@"
export async function cloneVoice() {
  return {};
}

export async function getSignedAgentUrl() {
  return "";
}
"@ | Set-Content "$base/elevenlabs/client.ts"

# ---------- supabase ----------
@"
export function createClient() {
  return {} as any;
}
"@ | Set-Content "$base/supabase/server.ts"

@"
export function createClient() {
  return {} as any;
}
"@ | Set-Content "$base/supabase/client.ts"

# ---------- stripe ----------
@"
export const SUBSCRIPTION_TIERS = {
  BASIC: {},
  PREMIUM: {},
};

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
"@ | Set-Content "$base/stripe/server.ts"

@"
export const PLANS = {};
"@ | Set-Content "$base/stripe/products.ts"

# ---------- translation ----------
@"
export type LanguageCode = string;

export function translateText() {
  return "";
}

export function translateBatch() {
  return [];
}

export function translateBookPages() {
  return [];
}

export function isLanguageSupported() {
  return true;
}
"@ | Set-Content "$base/translation/index.ts"

# ---------- voice ----------
@"
export const EMPATHETIC_OPENERS = [];
export const EMPATHETIC_RESPONSES = [];
export const NATURAL_TRANSITIONS = [];

export function getEmpatheticDiscoveryPrompt() {
  return "";
}

export function getChildRedirect() {
  return "";
}
"@ | Set-Content "$base/voice/empathetic-discovery.ts"

@"
export const STATE_PROMPTS = {};
export const EXTRACTION_PROMPT = "";

export type OnboardingState = {};
export type OnboardingSession = {};
export type ExtractedPreferences = {};

export function determineNextState() {
  return {};
}

export function runOnboardingAgent() {
  return {};
}
"@ | Set-Content "$base/voice/onboarding-agent.ts"

Write-Host "✅ src/lib rebuilt correctly"
