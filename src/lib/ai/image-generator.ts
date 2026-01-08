import Replicate from 'replicate';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translation';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export interface ImageGenerationOptions {
  prompt: string;
  style: string;
  childDescription?: string;
  childAge?: number;
  culturalContext?: string;
  language?: LanguageCode;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  seed?: number;
}

// Style modifiers for different illustration styles
const STYLE_MODIFIERS: Record<string, string> = {
  watercolor: 'soft watercolor painting style, gentle colors, flowing brushstrokes, dreamy atmosphere, children\'s book illustration',
  cartoon: 'vibrant cartoon style, bold outlines, bright colors, playful and expressive, Pixar-inspired, children\'s animation',
  anime: 'soft anime style, large expressive eyes, pastel colors, Studio Ghibli inspired, gentle and whimsical',
  realistic: 'semi-realistic digital painting, warm lighting, detailed but approachable, professional children\'s book art',
  storybook: 'classic storybook illustration style, reminiscent of Beatrix Potter, soft muted colors, nostalgic charm',
  whimsical: 'whimsical fantasy illustration, magical sparkles, imaginative elements, Eric Carle meets Maurice Sendak',
};

// Age-appropriate content guidelines
const AGE_GUIDELINES: Record<string, { 
  allowed: string[]; 
  avoid: string[]; 
  style: string;
}> = {
  toddler: { // 0-2 years
    allowed: [
      'simple shapes', 'primary colors', 'friendly animals', 'smiling faces',
      'soft rounded edges', 'familiar objects (toys, food, family)',
      'gentle expressions', 'cozy indoor scenes', 'nature elements'
    ],
    avoid: [
      'complex scenes', 'sharp objects', 'dark shadows', 'scary creatures',
      'conflict', 'intense expressions', 'crowded compositions', 'small details'
    ],
    style: 'extremely simple, bold colors, minimal detail, soft and rounded, high contrast for visual development'
  },
  preschool: { // 3-5 years
    allowed: [
      'friendly characters', 'magical elements (sparkles, rainbows)', 'animals with expressions',
      'family scenes', 'playground settings', 'nature exploration', 'simple adventures',
      'fantasy creatures (friendly dragons, unicorns)', 'vehicles', 'weather phenomena'
    ],
    avoid: [
      'scary monsters', 'violence', 'dark themes', 'realistic danger',
      'separation anxiety triggers', 'complex emotional conflict', 'intense action'
    ],
    style: 'colorful and engaging, clear focal points, expressive characters, magical atmosphere'
  },
  earlyElementary: { // 6-8 years
    allowed: [
      'adventure scenes', 'problem-solving situations', 'diverse characters',
      'mild challenges (climbing, exploring)', 'friendship themes', 'school settings',
      'sports and activities', 'mild fantasy conflict (good vs mild antagonist)',
      'historical settings (age-appropriate)', 'science and discovery'
    ],
    avoid: [
      'realistic violence', 'intense fear', 'death themes', 'bullying depictions',
      'inappropriate relationships', 'graphic conflict'
    ],
    style: 'detailed and immersive, action-oriented, dynamic compositions, varied color palettes'
  },
  lateElementary: { // 9-12 years
    allowed: [
      'complex adventures', 'mystery elements', 'historical accuracy', 'diverse cultures',
      'emotional depth', 'team challenges', 'environmental themes', 'technology',
      'mild peril (resolved positively)', 'competition', 'personal growth challenges'
    ],
    avoid: [
      'graphic violence', 'romantic content', 'substance use', 'mature themes',
      'realistic weapons in threatening context', 'body image negativity'
    ],
    style: 'sophisticated illustration, cinematic compositions, emotional lighting, rich detail'
  },
  teen: { // 13-17 years
    allowed: [
      'complex narratives', 'identity exploration', 'meaningful challenges',
      'diverse representation', 'historical events', 'social issues (age-appropriate)',
      'adventure and action', 'emotional complexity', 'aspirational themes'
    ],
    avoid: [
      'explicit content', 'gratuitous violence', 'substance glorification',
      'self-harm imagery', 'discriminatory content', 'inappropriate relationships'
    ],
    style: 'mature illustration style, nuanced lighting, complex compositions, artistic depth'
  }
};

// Cultural context guidelines for diverse representation
const CULTURAL_GUIDELINES: Record<string, {
  elements: string[];
  considerations: string[];
  celebrations: string[];
}> = {
  // East Asian
  zh: {
    elements: ['lanterns', 'cherry blossoms', 'traditional architecture', 'tea culture', 'calligraphy', 'dragons (lucky)'],
    considerations: ['respect for elders shown', 'family togetherness', 'red as lucky color', 'moon imagery'],
    celebrations: ['Lunar New Year', 'Mid-Autumn Festival', 'Dragon Boat Festival']
  },
  ja: {
    elements: ['cherry blossoms (sakura)', 'traditional gardens', 'Mt Fuji', 'origami', 'seasonal elements'],
    considerations: ['nature appreciation', 'attention to seasons', 'respect and bowing', 'group harmony'],
    celebrations: ['Obon', 'Children\'s Day', 'Tanabata']
  },
  ko: {
    elements: ['hanbok elements', 'traditional patterns', 'palace architecture', 'Korean landscapes'],
    considerations: ['respect for family', 'educational themes', 'seasons and nature'],
    celebrations: ['Chuseok', 'Seollal', 'Children\'s Day']
  },
  
  // South Asian
  hi: {
    elements: ['rangoli patterns', 'vibrant colors', 'traditional dress', 'diverse landscapes', 'elephants', 'peacocks'],
    considerations: ['family values', 'diverse representation', 'regional diversity', 'festivals of light'],
    celebrations: ['Diwali', 'Holi', 'Eid', 'Christmas']
  },
  
  // Middle Eastern
  ar: {
    elements: ['geometric patterns', 'desert landscapes', 'traditional architecture', 'calligraphy art', 'moon and stars'],
    considerations: ['modest dress', 'family importance', 'hospitality themes', 'diverse Arab cultures'],
    celebrations: ['Eid', 'Ramadan themes (togetherness, charity)']
  },
  he: {
    elements: ['olive trees', 'Mediterranean landscapes', 'traditional symbols', 'Jerusalem imagery'],
    considerations: ['family gatherings', 'educational themes', 'historical awareness'],
    celebrations: ['Hanukkah', 'Passover', 'Purim']
  },
  
  // European
  es: {
    elements: ['vibrant fiestas', 'Mediterranean settings', 'diverse Latin American elements'],
    considerations: ['extended family', 'regional diversity (Spain vs Latin America)', 'warm colors'],
    celebrations: ['Día de los Muertos (respectfully)', 'Three Kings Day', 'local festivals']
  },
  fr: {
    elements: ['Parisian landmarks', 'countryside', 'patisserie', 'art and culture'],
    considerations: ['culinary culture', 'artistic appreciation', 'diverse French-speaking cultures'],
    celebrations: ['Bastille Day', 'Epiphany']
  },
  de: {
    elements: ['fairy tale forests', 'castles', 'Alpine scenery', 'traditional crafts'],
    considerations: ['nature appreciation', 'precision and craft', 'regional diversity'],
    celebrations: ['Christmas markets', 'Easter traditions', 'Oktoberfest (family aspects)']
  },
  
  // African
  sw: {
    elements: ['savanna landscapes', 'wildlife', 'vibrant patterns', 'community scenes'],
    considerations: ['Ubuntu philosophy', 'community importance', 'diverse cultures', 'oral tradition'],
    celebrations: ['various regional celebrations']
  },
  
  // Default/Universal
  en: {
    elements: ['diverse settings', 'multicultural characters', 'universal themes'],
    considerations: ['inclusive representation', 'avoid stereotypes', 'global awareness'],
    celebrations: ['diverse holiday representation']
  }
};

function getAgeGroup(age: number): keyof typeof AGE_GUIDELINES {
  if (age <= 2) return 'toddler';
  if (age <= 5) return 'preschool';
  if (age <= 8) return 'earlyElementary';
  if (age <= 12) return 'lateElementary';
  return 'teen';
}

function buildSafetyPrompt(age: number, culturalContext?: string, language?: LanguageCode): string {
  const ageGroup = getAgeGroup(age);
  const ageGuidelines = AGE_GUIDELINES[ageGroup];
  const culture = CULTURAL_GUIDELINES[language || 'en'] || CULTURAL_GUIDELINES.en;
  
  return `
STRICT REQUIREMENTS FOR CHILD-SAFE CONTENT:
- Age group: ${ageGroup} (${age} years old)
- Style guidance: ${ageGuidelines.style}
- Include elements like: ${ageGuidelines.allowed.slice(0, 5).join(', ')}
- MUST AVOID: ${ageGuidelines.avoid.join(', ')}

CULTURAL SENSITIVITY:
- Cultural elements to consider: ${culture.elements.slice(0, 4).join(', ')}
- Cultural considerations: ${culture.considerations.slice(0, 3).join(', ')}

MANDATORY SAFETY RULES:
- All characters must be appropriately dressed
- No scary, violent, or threatening imagery
- Expressions should be friendly and warm
- Safe environments only (no dangerous situations)
- Diverse, positive representation
- No stereotypes or cultural insensitivity
- Body-positive representation
- Inclusive of different abilities when showing groups
`;
}

function buildDiversityPrompt(childAge: number): string {
  return `
DIVERSITY & REPRESENTATION:
- Show diverse skin tones, hair types, and features naturally
- Include characters of various abilities when appropriate
- Avoid stereotypical depictions of any group
- Represent families in diverse configurations
- Show both genders in active, positive roles
- Include culturally diverse clothing and settings naturally
`;
}

export async function generateIllustration(options: ImageGenerationOptions): Promise<string> {
  const styleModifier = STYLE_MODIFIERS[options.style] || STYLE_MODIFIERS.storybook;
  const childAge = options.childAge || 5;
  
  const safetyPrompt = buildSafetyPrompt(childAge, options.culturalContext, options.language);
  const diversityPrompt = buildDiversityPrompt(childAge);
  
  const enhancedPrompt = `${options.prompt}

Art Style: ${styleModifier}

${options.childDescription ? `Main character: ${options.childDescription}` : ''}

${safetyPrompt}
${diversityPrompt}

FINAL OUTPUT: High-quality children's book illustration, professionally rendered, warm and inviting atmosphere, perfect for a child aged ${childAge}.`;

  // Additional negative prompt for safety
  const negativePrompt = `scary, frightening, violence, weapons, blood, death, horror, dark themes, 
inappropriate, suggestive, mature content, realistic injury, monsters (scary), 
nightmares, abuse, neglect, stereotypes, discrimination, drugs, alcohol, smoking,
inappropriate clothing, body shaming, bullying depiction, realistic danger`;

  try {
    // Using FLUX Pro via Replicate with safety settings
    const output = await replicate.run(
      'black-forest-labs/flux-1.1-pro',
      {
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: options.aspectRatio || '4:3',
          output_format: 'webp',
          output_quality: 90,
          safety_tolerance: 1, // Most strict safety for children's content (1 = strictest)
          prompt_upsampling: true,
        }
      }
    );

    // FLUX returns the image URL directly
    if (typeof output === 'string') {
      return output;
    }
    
    if (Array.isArray(output) && output.length > 0) {
      return output[0];
    }

    throw new Error('Unexpected output format from FLUX');
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

export async function generateBookCover(
  title: string,
  childName: string,
  theme: string,
  style: string,
  childAge: number = 5,
  language?: LanguageCode
): Promise<string> {
  const prompt = `Children's book cover illustration for a story called "${title}".
Theme: ${theme}
A magical, inviting scene featuring a child named ${childName} as the hero.
The composition should be eye-catching and make children excited to read.
DO NOT include any text or letters in the image.`;

  return generateIllustration({
    prompt,
    style,
    aspectRatio: '3:4', // Book cover ratio
    childAge,
    language,
  });
}

export async function generateCharacterReference(
  characterName: string,
  description: string,
  style: string,
  childAge: number = 5
): Promise<string> {
  const prompt = `Character design for ${characterName}: ${description}.
Full body view, friendly welcoming expression, children's book character.
Clean simple background, character-focused, warm colors.
The character should be appealing and relatable for children.`;

  return generateIllustration({
    prompt,
    style,
    aspectRatio: '1:1',
    childAge,
  });
}

// Generate consistent child appearance description for all illustrations
export function generateChildDescription(
  name: string,
  age: number,
  gender?: string,
  favoriteColor?: string,
  culturalBackground?: string
): string {
  const ageDescriptor = age <= 2 ? 'toddler' : age <= 5 ? 'young child' : age <= 8 ? 'child' : age <= 12 ? 'preteen' : 'teenager';
  
  let description = `${name}, a friendly ${ageDescriptor}`;
  
  if (gender && gender !== 'prefer-not-to-say') {
    description += ` (${gender})`;
  }
  
  description += `, with a warm genuine smile and bright curious eyes`;
  
  if (favoriteColor) {
    description += `, wearing comfortable ${favoriteColor} clothing`;
  }
  
  description += `, adventurous spirit, kind-hearted, and relatable`;
  
  return description;
}

// Validate prompt for inappropriate content before sending to API
export function validatePromptSafety(prompt: string, childAge: number): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  const lowerPrompt = prompt.toLowerCase();
  
  // Words that should never appear in children's content prompts
  const bannedTerms = [
    'violent', 'violence', 'blood', 'death', 'kill', 'weapon', 'gun', 'knife',
    'scary', 'horror', 'nightmare', 'monster', 'demon', 'evil',
    'sexy', 'nude', 'naked', 'inappropriate', 'adult',
    'drug', 'alcohol', 'cigarette', 'smoking', 'drunk',
    'abuse', 'bullying', 'hate', 'racist', 'discrimination'
  ];
  
  for (const term of bannedTerms) {
    if (lowerPrompt.includes(term)) {
      issues.push(`Prohibited term detected: "${term}"`);
    }
  }
  
  // Age-specific checks
  if (childAge <= 5) {
    const toddlerBanned = ['dark', 'shadow', 'alone', 'lost', 'crying', 'sad'];
    for (const term of toddlerBanned) {
      if (lowerPrompt.includes(term)) {
        issues.push(`Term "${term}" not recommended for ages 0-5`);
      }
    }
  }
  
  return {
    safe: issues.length === 0,
    issues
  };
}

export { replicate };
