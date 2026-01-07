import Anthropic from '@anthropic-ai/sdk';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translation';
import { type ContentGuidelines } from '@/lib/content';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface StoryContext {
  childName: string;
  childAge: number;
  interests: string[];
  favoriteColor?: string;
  theme: string;
  illustrationStyle: string;
  customElements?: string;
  // Language for story generation (generates directly in target language)
  language?: LanguageCode;
  // Content guidelines from family preferences
  contentGuidelines?: ContentGuidelines;
  // Story memory for continuity
  existingCharacters?: Array<{
    name: string;
    description: string;
    relationship: string;
  }>;
  previousEvents?: Array<{
    event: string;
    bookTitle: string;
  }>;
  ongoingArcs?: Array<{
    arcName: string;
    status: string;
  }>;
}

export interface GeneratedStory {
  title: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
    layout: 'full' | 'split' | 'text-only';
  }>;
  newCharacters: Array<{
    name: string;
    description: string;
    relationship: string;
    traits: string[];
  }>;
  storyEvent: {
    event: string;
    significance: string;
  };
}

function getReadingLevelGuidance(age: number): string {
  if (age <= 2) {
    return `
      - Use very simple words (1-2 syllables max)
      - Short sentences (3-5 words)
      - Lots of repetition and rhythm
      - Focus on sounds, colors, and familiar objects
      - 2-3 sentences per page maximum
      - Total story: 5-6 pages`;
  } else if (age <= 4) {
    return `
      - Simple vocabulary with some new words introduced
      - Short sentences (5-8 words)
      - Repetitive patterns and predictable text
      - Focus on emotions, family, and daily routines
      - 3-4 sentences per page
      - Total story: 8-10 pages`;
  } else if (age <= 6) {
    return `
      - Expanding vocabulary, explain new concepts
      - Medium sentences (8-12 words)
      - Simple plot with clear beginning, middle, end
      - Include humor and wordplay
      - 4-5 sentences per page
      - Total story: 10-12 pages`;
  } else if (age <= 8) {
    return `
      - Rich vocabulary with context clues
      - Varied sentence structure
      - More complex plots with minor conflicts
      - Character development and growth
      - 5-6 sentences per page
      - Total story: 12-15 pages`;
  } else if (age <= 10) {
    return `
      - Advanced vocabulary and descriptive language
      - Complex sentences with dialogue
      - Multi-layered plots with subplots
      - Moral dilemmas and problem-solving
      - 6-8 sentences per page
      - Total story: 15-18 pages`;
  } else if (age <= 13) {
    return `
      - Sophisticated vocabulary and literary devices
      - Nuanced character development
      - Complex themes (friendship, identity, courage)
      - Foreshadowing and plot twists
      - 8-10 sentences per page
      - Total story: 18-22 pages`;
  } else {
    return `
      - Young adult level prose
      - Deep character psychology
      - Complex themes (coming of age, relationships, purpose)
      - Subtle symbolism and metaphor
      - 10-12 sentences per page
      - Total story: 22-25 pages`;
  }
}

function getThemeGuidance(theme: string): string {
  const themes: Record<string, string> = {
    adventure: 'Exciting journey with challenges to overcome, discovery of new places, brave decisions',
    friendship: 'Making new friends, resolving conflicts, loyalty, teamwork, understanding differences',
    family: 'Family bonds, siblings, grandparents, traditions, unconditional love, home',
    learning: 'Curiosity, trying new things, making mistakes and learning, growth mindset',
    nature: 'Animals, plants, seasons, environmental awareness, outdoor exploration',
    fantasy: 'Magic, mythical creatures, enchanted worlds, imagination, wonder',
    bedtime: 'Calming, gentle, dreams, nighttime routines, feeling safe and cozy',
    holidays: 'Celebrations, traditions, giving, togetherness, seasonal joy',
    emotions: 'Understanding feelings, coping strategies, empathy, self-expression',
  };
  return themes[theme] || themes.adventure;
}

export async function generateStory(context: StoryContext): Promise<GeneratedStory> {
  const readingLevel = getReadingLevelGuidance(context.childAge);
  const themeGuidance = getThemeGuidance(context.theme);
  
  // Get language info
  const targetLanguage = context.language || 'en';
  const languageInfo = SUPPORTED_LANGUAGES[targetLanguage];
  const languageInstruction = targetLanguage !== 'en' 
    ? `\n\n**IMPORTANT - LANGUAGE:**
Write the entire story in ${languageInfo?.name || targetLanguage} (${languageInfo?.native || targetLanguage}).
- All story text must be in ${languageInfo?.name || targetLanguage}
- Keep the JSON structure keys in English
- Only the "text" values and "title" should be in ${languageInfo?.name || targetLanguage}
- Image prompts should remain in English for the image generation model`
    : '';

  const systemPrompt = `You are a world-class children's book author who creates personalized, engaging stories. 
You write stories where the child is the main character, making them feel special and seen.

Your stories:
- Are age-appropriate and educational
- Have clear moral lessons without being preachy
- Include vivid, imaginative scenes perfect for illustration
- Maintain consistency with any existing characters/events from previous stories
- End on a positive, satisfying note
${targetLanguage !== 'en' ? `- Are written in ${languageInfo?.name || targetLanguage} with cultural sensitivity` : ''}

You output stories in a specific JSON format for our book generation system.`;

  const userPrompt = `Create a personalized children's story with these specifications:

**CHILD PROFILE:**
- Name: ${context.childName}
- Age: ${context.childAge} years old
- Interests: ${context.interests.join(', ')}
${context.favoriteColor ? `- Favorite Color: ${context.favoriteColor}` : ''}

**STORY PARAMETERS:**
- Theme: ${context.theme} (${themeGuidance})
- Illustration Style: ${context.illustrationStyle}
${context.customElements ? `- Special Elements to Include: ${context.customElements}` : ''}
${languageInstruction}

**READING LEVEL REQUIREMENTS:**
${readingLevel}

${context.contentGuidelines ? `
**FAMILY CONTENT GUIDELINES (MUST FOLLOW):**
${context.contentGuidelines.storyGuidelines}

**TONE:**
${context.contentGuidelines.toneGuidelines}
` : ''}

${context.existingCharacters && context.existingCharacters.length > 0 ? `
**EXISTING CHARACTERS (from previous stories - include naturally if relevant):**
${context.existingCharacters.map(c => `- ${c.name}: ${c.description} (${c.relationship})`).join('\n')}
` : ''}

${context.previousEvents && context.previousEvents.length > 0 ? `
**PREVIOUS STORY EVENTS (reference subtly for continuity):**
${context.previousEvents.slice(-3).map(e => `- "${e.bookTitle}": ${e.event}`).join('\n')}
` : ''}

${context.ongoingArcs && context.ongoingArcs.length > 0 ? `
**ONGOING STORY ARCS:**
${context.ongoingArcs.map(a => `- ${a.arcName} (${a.status})`).join('\n')}
` : ''}

**OUTPUT FORMAT:**
Return a JSON object with this exact structure:
{
  "title": "Story title that includes the child's name",
  "pages": [
    {
      "pageNumber": 1,
      "text": "The story text for this page",
      "imagePrompt": "Detailed image generation prompt for illustration in ${context.illustrationStyle} style, featuring ${context.childName} as described: [describe scene vividly]",
      "layout": "full" // or "split" or "text-only"
    }
  ],
  "newCharacters": [
    {
      "name": "Character name",
      "description": "Physical and personality description",
      "relationship": "Relationship to ${context.childName}",
      "traits": ["trait1", "trait2"]
    }
  ],
  "storyEvent": {
    "event": "Brief summary of main story event",
    "significance": "Why this matters for ${context.childName}'s story journey"
  }
}

Create an engaging, personalized story now:`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: systemPrompt,
  });

  // Extract the text content
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse the JSON from the response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse story JSON from response');
  }

  const story: GeneratedStory = JSON.parse(jsonMatch[0]);
  return story;
}

export async function generateStoryOutline(context: StoryContext): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Create a brief story outline for a ${context.theme} story starring ${context.childName} (age ${context.childAge}).
        
Their interests include: ${context.interests.join(', ')}.
${context.customElements ? `Include these elements: ${context.customElements}` : ''}

Provide a 3-4 sentence outline of the story premise, main conflict, and resolution. Keep it appropriate for their age.`
      }
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  return textContent?.type === 'text' ? textContent.text : '';
}

export async function improveStoryPage(
  pageText: string,
  feedback: string,
  context: StoryContext
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Improve this story page text based on the feedback.

Original text: "${pageText}"

Feedback: ${feedback}

Child's age: ${context.childAge}
Theme: ${context.theme}

Provide only the improved text, nothing else.`
      }
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  return textContent?.type === 'text' ? textContent.text : pageText;
}

export { anthropic };
