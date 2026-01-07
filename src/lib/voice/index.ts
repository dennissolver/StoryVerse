// Voice module exports

export {
  getOnboardingSystemPrompt,
  STATE_PROMPTS,
  DISCOVERY_QUESTIONS,
  EXTRACTION_PROMPT,
  determineNextState,
  type OnboardingState,
  type OnboardingSession,
  type ExtractedPreferences,
} from './onboarding-agent';

export {
  getEmpatheticDiscoveryPrompt,
  EMPATHETIC_OPENERS,
  EMPATHETIC_RESPONSES,
  NATURAL_TRANSITIONS,
  CHILD_REDIRECT_SCRIPTS,
  getChildRedirect,
} from './empathetic-discovery';
