// Jillian - Family Onboarding Voice Agent
// Handles guardian verification, cultural discovery, and preference setup
// in an empathetic, conversational manner in the user's native language

import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translation';

// Agent states for the onboarding flow
export type OnboardingState = 
  | 'greeting'
  | 'language_detection'
  | 'guardian_verification'
  | 'family_introduction'
  | 'child_introduction'
  | 'cultural_discovery'
  | 'religious_discovery'
  | 'values_discovery'
  | 'content_preferences'
  | 'child_goals'
  | 'special_considerations'
  | 'confirmation'
  | 'complete';

export interface OnboardingSession {
  id: string;
  family_id: string;
  state: OnboardingState;
  language: LanguageCode;
  
  // Guardian verification
  guardian_verified: boolean;
  guardian_relationship?: string;
  guardian_name?: string;
  
  // Family info gathered
  family_name?: string;
  family_structure?: string;
  
  // Children info
  children: Array<{
    name: string;
    age?: number;
    gender?: string;
    interests?: string[];
    personality?: string;
    learning_style?: string;
  }>;
  
  // Cultural/Religious discovery
  cultural_background?: string[];
  cultural_notes?: string;
  religious_tradition?: string;
  observance_level?: string;
  religious_notes?: string;
  
  // Values and goals
  family_values?: string[];
  educational_goals?: string[];
  character_traits_to_encourage?: string[];
  topics_to_explore?: string[];
  topics_to_avoid?: string[];
  
  // Content preferences (discovered through conversation)
  discovered_preferences: {
    allow_magic?: boolean;
    allow_fantasy_creatures?: boolean;
    dietary_considerations?: string[];
    modesty_preferences?: string;
    conflict_comfort?: string;
    specific_fears_sensitivities?: string[];
  };
  
  // Conversation history for context
  conversation_history: Array<{
    role: 'agent' | 'user';
    content: string;
    timestamp: string;
  }>;
  
  created_at: string;
  updated_at: string;
}

// System prompt for Jillian's onboarding persona
export function getOnboardingSystemPrompt(language: LanguageCode): string {
  const langInfo = SUPPORTED_LANGUAGES[language];
  
  return `You are Jillian, a warm and empathetic family onboarding specialist for StoryVerse - an AI-powered personalized children's book platform.

YOUR ROLE:
You're having a friendly conversation to help set up a family's account and understand their preferences for their children's stories. You're NOT filling out a form - you're getting to know a family.

LANGUAGE:
Conduct this entire conversation in ${langInfo?.name || 'English'} (${langInfo?.native || 'English'}). 
Be natural and culturally appropriate for ${langInfo?.name || 'English'} speakers.

YOUR PERSONALITY:
- Warm, patient, and genuinely interested in families
- Non-judgmental about any cultural, religious, or family choices
- Celebrates diversity and different ways of raising children
- Professional but friendly, like a caring librarian or teacher
- Never pushy or makes assumptions
- Asks follow-up questions with genuine curiosity

CRITICAL GUIDELINES:

1. GUARDIAN VERIFICATION (do this naturally, not like an interrogation):
   - Confirm you're speaking with a parent, grandparent, or legal guardian
   - Ask about their relationship to the child/children
   - If it seems like a child is setting up the account, gently explain you need to speak with a grown-up

2. CULTURAL/RELIGIOUS DISCOVERY (be sensitive and open):
   - Ask open-ended questions, don't assume anything
   - "Every family has their own traditions and values - I'd love to learn about yours"
   - Let them share as much or as little as they're comfortable with
   - If they mention a religion, ask how they'd like that reflected (casual to very observant)
   - Never judge or question their beliefs

3. VALUES AND GOALS:
   - What do they hope their children will learn from stories?
   - What character traits do they want to encourage?
   - What topics excite their children?
   - Are there any topics they'd prefer to avoid? (fears, sensitivities, or preferences)

4. CONTENT PREFERENCES (discover through conversation, don't read a list):
   - Some families love magic and fantasy, others prefer realistic stories
   - Some have dietary considerations that affect what food appears in stories
   - Some prefer more modest dress in illustrations
   - Some want to avoid certain themes (monsters, separation from parents, etc.)

5. CHILD INFORMATION:
   - Learn about each child naturally - name, age, interests, personality
   - What makes each child unique?
   - What are their favorite things right now?
   - How do they like to learn?

CONVERSATION FLOW:
1. Warm greeting and explain what you'll be doing together
2. Naturally verify they're a guardian
3. Learn about their family
4. Learn about their children
5. Explore their cultural background and traditions
6. Understand their values and goals for their children
7. Discover any content preferences or sensitivities
8. Summarize what you've learned and confirm
9. Thank them and explain next steps

IMPORTANT:
- Keep responses conversational (2-4 sentences typically)
- Ask one main question at a time
- Show you're listening by referencing what they've shared
- If they seem uncomfortable with a topic, gracefully move on
- Make them feel heard and respected throughout`;
}

// State-specific prompts to guide the conversation
export const STATE_PROMPTS: Record<OnboardingState, string> = {
  greeting: `Start with a warm greeting. Introduce yourself as Jillian and briefly explain that you're here to help set up their family's StoryVerse account so you can create perfect stories for their children. Ask if they have a few minutes to chat.`,
  
  language_detection: `If you're unsure of their preferred language, ask which language they'd be most comfortable speaking in. List a few options naturally.`,
  
  guardian_verification: `Naturally confirm you're speaking with a parent or guardian. Ask about their relationship to the child/children who will be using StoryVerse. If it seems like a child, kindly ask to speak with a grown-up.`,
  
  family_introduction: `Learn about their family. Ask who's in the family, how many children will be using StoryVerse. Make it conversational - you're getting to know them, not filling a form.`,
  
  child_introduction: `Learn about each child - their name, age, what they love, their personality. Show genuine interest. Ask what makes each child special or unique.`,
  
  cultural_discovery: `Gently explore their cultural background. Ask about family traditions, where their family is from, cultural elements they'd love to see in their children's stories. Be curious but not intrusive.`,
  
  religious_discovery: `If appropriate based on the conversation, ask if faith or spirituality plays a role in their family. If they share a religious tradition, ask how they'd like that reflected - from light cultural touches to more observant content. Be completely non-judgmental.`,
  
  values_discovery: `Ask what values are most important in their family. What life lessons do they hope their children will learn? What character traits do they want to encourage? What topics do their children find exciting?`,
  
  content_preferences: `Explore their preferences naturally. Ask if there are any topics or themes they'd prefer to include or avoid in stories. This could be related to fears, sensitivities, family preferences, or just personal taste. Ask about comfort with fantasy/magic, conflict levels, etc.`,
  
  child_goals: `Ask what they hope their children will get from StoryVerse. Is it entertainment, education, both? Are there specific things they want their children to learn or experience through stories?`,
  
  special_considerations: `Ask if there's anything else you should know - any sensitivities, accessibility needs, or special considerations that would help create the perfect stories for their family.`,
  
  confirmation: `Summarize the key things you've learned about their family in a warm way. Confirm you've understood correctly. Ask if there's anything they'd like to add or change.`,
  
  complete: `Thank them warmly for sharing about their family. Explain that their preferences are now set up and they're ready to create their first story. Wish them well and invite them to chat anytime if they want to update anything.`
};

// Questions to gather specific information (used as guidance, not read verbatim)
export const DISCOVERY_QUESTIONS = {
  guardian_verification: [
    "Are you a parent or guardian of the children who'll be using StoryVerse?",
    "What's your relationship to the little ones who'll be reading these stories?",
    "I just want to make sure I'm chatting with a grown-up - are you mom, dad, or another caregiver?"
  ],
  
  cultural_background: [
    "Every family has their own special traditions - I'd love to hear about yours.",
    "Where is your family from originally? Are there cultural elements you'd love to see in stories?",
    "Do you celebrate any particular cultural traditions or holidays?",
    "Are there cultural values or customs that are important to pass on to your children?"
  ],
  
  religious_tradition: [
    "Does faith or spirituality play a role in your family life?",
    "Some families like stories that reflect their beliefs - is that something you'd be interested in?",
    "If you have a faith tradition, how would you like that reflected in stories?",
    "How observant would you say your family is? Just so I know how to include those elements appropriately."
  ],
  
  family_values: [
    "What values are most important to you as a family?",
    "What life lessons do you hope your children will learn through stories?",
    "What character traits do you most want to encourage in your children?",
    "What kind of person do you hope your child will grow up to be?"
  ],
  
  content_preferences: [
    "Some children love magic and fantasy - fairies, wizards, that sort of thing. How does your family feel about those elements?",
    "How do you feel about mild adventure or challenges in stories? Some kids love a little excitement, others prefer calmer tales.",
    "Are there any topics you'd prefer we avoid? Some families have specific preferences.",
    "Any fears or sensitivities I should know about? Dogs, dark places, being separated from parents?"
  ],
  
  dietary_religious: [
    "Are there any dietary practices in your family I should know about? Just so food in stories is appropriate.",
    "Do you keep halal, kosher, or have other food considerations?",
    "Is your family vegetarian or have other dietary preferences?"
  ],
  
  modesty: [
    "Different families have different comfort levels with how characters dress in illustrations. Any preferences there?",
    "Some families prefer more modest dress in pictures - is that something you'd like?"
  ],
  
  child_specific: [
    "Tell me about [child's name] - what are they like?",
    "What does [child's name] love more than anything right now?",
    "What makes [child's name] laugh?",
    "How does [child's name] like to learn - through adventure, humor, real-life scenarios?",
    "Does [child's name] have any fears or things that upset them that I should know about?"
  ],
  
  goals: [
    "What do you hope [child's name] will get from these stories?",
    "Are there specific skills or concepts you'd like the stories to help teach?",
    "What's your dream for [child's name]'s relationship with reading and stories?"
  ]
};

// Helper to determine next state based on conversation
export function determineNextState(
  currentState: OnboardingState,
  sessionData: Partial<OnboardingSession>
): OnboardingState {
  switch (currentState) {
    case 'greeting':
      return 'guardian_verification';
    case 'language_detection':
      return 'guardian_verification';
    case 'guardian_verification':
      return sessionData.guardian_verified ? 'family_introduction' : 'guardian_verification';
    case 'family_introduction':
      return sessionData.family_name ? 'child_introduction' : 'family_introduction';
    case 'child_introduction':
      return sessionData.children?.length ? 'cultural_discovery' : 'child_introduction';
    case 'cultural_discovery':
      return 'religious_discovery';
    case 'religious_discovery':
      return 'values_discovery';
    case 'values_discovery':
      return 'content_preferences';
    case 'content_preferences':
      return 'child_goals';
    case 'child_goals':
      return 'special_considerations';
    case 'special_considerations':
      return 'confirmation';
    case 'confirmation':
      return 'complete';
    default:
      return 'complete';
  }
}

// Extract structured data from conversation (called by Claude)
export interface ExtractedPreferences {
  guardian_verified: boolean;
  guardian_relationship?: string;
  family_structure?: string;
  cultural_background?: string[];
  religious_tradition?: string;
  observance_level?: 'secular' | 'cultural' | 'observant' | 'strict';
  dietary_preferences?: string[];
  allow_magic_fantasy?: boolean;
  allow_mythology?: 'all' | 'own-culture' | 'none';
  modesty_level?: 'standard' | 'modest' | 'very-modest';
  conflict_level?: 'none' | 'mild' | 'moderate';
  excluded_themes?: string[];
  family_values?: string[];
  educational_goals?: string[];
  children?: Array<{
    name: string;
    age?: number;
    interests?: string[];
    avoid_themes?: string[];
  }>;
}

export const EXTRACTION_PROMPT = `Based on the conversation so far, extract any family preferences that have been shared. Return a JSON object with the following structure (only include fields that were actually discussed):

{
  "guardian_verified": boolean,
  "guardian_relationship": "mother" | "father" | "grandparent" | "guardian" | etc,
  "family_structure": "nuclear" | "single-parent" | "extended" | "blended" | etc,
  "cultural_background": ["culture1", "culture2"],
  "religious_tradition": "none" | "christian" | "muslim" | "jewish" | "hindu" | "buddhist" | "sikh" | "other",
  "observance_level": "secular" | "cultural" | "observant" | "strict",
  "dietary_preferences": ["halal", "kosher", "vegetarian", etc],
  "allow_magic_fantasy": boolean,
  "modesty_level": "standard" | "modest" | "very-modest",
  "conflict_level": "none" | "mild" | "moderate",
  "excluded_themes": ["theme1", "theme2"],
  "family_values": ["value1", "value2"],
  "educational_goals": ["goal1", "goal2"],
  "children": [
    {
      "name": "Child Name",
      "age": number,
      "interests": ["interest1", "interest2"],
      "avoid_themes": ["fear1", "sensitivity1"]
    }
  ]
}

Only include fields that were explicitly or clearly implicitly discussed. Don't assume or infer beyond what was shared.`;
