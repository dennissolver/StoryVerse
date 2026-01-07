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
