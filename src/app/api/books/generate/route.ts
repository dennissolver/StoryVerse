import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { 
  generateStory, 
  generateIllustration, 
  generateBookCover,
  generateChildDescription,
  type StoryContext 
} from '@/lib/ai';
import { generateContentGuidelines, type FamilyPreferences, type ChildPreferences } from '@/lib/content';

export const maxDuration = 300; // 5 minute timeout for AI generation

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId } = await request.json();

  // Update book status to generating
  await supabase
    .from('books')
    .update({ status: 'generating' })
    .eq('id', bookId);

  // Get book details with child info
  const { data: book } = await supabase
    .from('books')
    .select('*, children(*)')
    .eq('id', bookId)
    .single();

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // Get child's story memory for continuity
  const { data: memory } = await supabase
    .from('story_memory')
    .select('*')
    .eq('child_id', book.child_id)
    .single();

  // Get family preferences for content guidelines
  const { data: familyPrefs } = await supabase
    .from('family_preferences')
    .select('*')
    .eq('family_id', book.family_id)
    .single();

  // Get child-specific content preferences if any
  const { data: childPrefs } = await supabase
    .from('child_content_preferences')
    .select('*')
    .eq('child_id', book.child_id)
    .single();

  try {
    // Calculate child's age
    const birthDate = new Date(book.children?.date_of_birth);
    const today = new Date();
    const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Get child's preferred language for cultural context
    const childLanguage = book.children?.preferred_language || 'en';

    // Generate content guidelines from family/child preferences
    const contentGuidelines = generateContentGuidelines(
      (familyPrefs as FamilyPreferences) || {},
      (childPrefs as ChildPreferences) || undefined,
      childAge,
      childLanguage as any
    );

    console.log('Content guidelines generated for family:', book.family_id);

    // Build story context
    const storyContext: StoryContext = {
      childName: book.children?.name || 'Friend',
      childAge: childAge || 5,
      interests: book.children?.interests || [],
      favoriteColor: book.children?.favorite_color,
      theme: book.theme || 'adventure',
      illustrationStyle: book.illustration_style || 'storybook',
      customElements: book.description,
      language: childLanguage as any,
      contentGuidelines, // Pass family content guidelines
      existingCharacters: memory?.characters || [],
      previousEvents: memory?.story_events || [],
      ongoingArcs: memory?.ongoing_arcs || [],
    };

    console.log('Generating story for:', storyContext.childName);

    // Step 1: Generate the story with Claude
    const generatedStory = await generateStory(storyContext);

    console.log('Story generated:', generatedStory.title, `(${generatedStory.pages.length} pages)`);

    // Step 2: Generate book cover (age and culturally appropriate)
    const coverUrl = await generateBookCover(
      generatedStory.title,
      storyContext.childName,
      storyContext.theme,
      storyContext.illustrationStyle,
      storyContext.childAge,
      childLanguage as any
    );

    // Update book with title and cover
    await supabase
      .from('books')
      .update({ 
        title: generatedStory.title,
        cover_url: coverUrl,
      })
      .eq('id', bookId);

    // Step 3: Generate illustrations for each page and save
    const childDescription = generateChildDescription(
      storyContext.childName,
      storyContext.childAge,
      book.children?.gender,
      storyContext.favoriteColor
    );

    const pages = [];
    for (const page of generatedStory.pages) {
      console.log(`Generating illustration for page ${page.pageNumber}...`);
      
      let imageUrl = null;
      if (page.layout !== 'text-only') {
        try {
          imageUrl = await generateIllustration({
            prompt: page.imagePrompt,
            style: storyContext.illustrationStyle,
            childDescription,
            childAge: storyContext.childAge,
            language: childLanguage as any,
            aspectRatio: page.layout === 'full' ? '4:3' : '1:1',
          });
        } catch (imgError) {
          console.error(`Failed to generate image for page ${page.pageNumber}:`, imgError);
          // Continue without image rather than failing entire book
        }
      }

      pages.push({
        book_id: bookId,
        page_number: page.pageNumber,
        text_content: page.text,
        image_url: imageUrl,
        image_prompt: page.imagePrompt,
        layout: page.layout,
      });
    }

    // Insert all pages
    await supabase.from('book_pages').insert(pages);

    // Step 4: Update story memory with new characters and events
    const updatedCharacters = [
      ...(memory?.characters || []),
      ...generatedStory.newCharacters.map(char => ({
        ...char,
        first_appeared_book_id: bookId,
      }))
    ];

    const updatedEvents = [
      ...(memory?.story_events || []),
      {
        book_id: bookId,
        book_title: generatedStory.title,
        event: generatedStory.storyEvent.event,
        significance: generatedStory.storyEvent.significance,
        date: new Date().toISOString(),
      }
    ];

    await supabase
      .from('story_memory')
      .upsert({
        child_id: book.child_id,
        characters: updatedCharacters,
        story_events: updatedEvents,
        updated_at: new Date().toISOString(),
      });

    // Step 5: Calculate reading time (approx 150 words per minute for children)
    const totalWords = pages.reduce((sum, p) => sum + (p.text_content?.split(' ').length || 0), 0);
    const readingTime = Math.ceil(totalWords / 150);

    // Update book status to ready
    await supabase
      .from('books')
      .update({ 
        status: 'ready', 
        page_count: pages.length,
        reading_time_minutes: readingTime,
      })
      .eq('id', bookId);

    console.log('Book generation complete:', generatedStory.title);

    return NextResponse.json({ 
      success: true, 
      bookId,
      title: generatedStory.title,
      pageCount: pages.length,
    });

  } catch (error: any) {
    console.error('Book generation failed:', error);
    
    // Update book status to failed
    await supabase
      .from('books')
      .update({ status: 'failed' })
      .eq('id', bookId);

    return NextResponse.json({ 
      error: error.message || 'Generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
