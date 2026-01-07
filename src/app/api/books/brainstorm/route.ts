import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messages, childId, theme } = await request.json();

    // Get child details for context
    let childContext = '';
    if (childId) {
      const { data: child } = await supabase
        .from('children')
        .select('name, date_of_birth, interests, favorite_color')
        .eq('id', childId)
        .single();

      if (child) {
        const birthDate = new Date(child.date_of_birth);
        const today = new Date();
        const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        childContext = `
The story is for ${child.name}, who is ${age} years old.
Their interests include: ${child.interests?.join(', ') || 'various activities'}.
${child.favorite_color ? `Their favorite color is ${child.favorite_color}.` : ''}`;
      }
    }

    const systemPrompt = `You are Jillian, a friendly and creative story brainstorming assistant for StoryVerse - an AI-powered children's book platform.

Your role is to help parents and children brainstorm ideas for personalized stories. You should:
- Be warm, encouraging, and enthusiastic about their ideas
- Ask clarifying questions to understand what kind of story they want
- Suggest creative elements, characters, and plot ideas
- Help them refine their vision for the perfect story
- Keep suggestions age-appropriate and positive
- Reference the child's interests and favorite things when relevant

${childContext}
${theme ? `The selected story theme is: ${theme}` : ''}

Keep responses concise (2-4 sentences) and conversational. End with a question to keep the brainstorming flowing.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find(block => block.type === 'text');
    const reply = textContent?.type === 'text' ? textContent.text : '';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Brainstorm chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
