export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateStoryOutline, type StoryContext } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { childId, theme, customElements } = await request.json();

    // Get child details
    const { data: child } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Calculate age
    const birthDate = new Date(child.date_of_birth);
    const today = new Date();
    const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const context: StoryContext = {
      childName: child.name,
      childAge: childAge || 5,
      interests: child.interests || [],
      favoriteColor: child.favorite_color,
      theme: theme || 'adventure',
      illustrationStyle: 'storybook',
      customElements,
    };

    const outline = await generateStoryOutline(context);

    return NextResponse.json({ outline });
  } catch (error: any) {
    console.error('Outline generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
