export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { translateBookPages, isLanguageSupported, type LanguageCode } from '@/lib/translation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetLanguage } = await request.json();

    if (!targetLanguage || !isLanguageSupported(targetLanguage)) {
      return NextResponse.json({ error: 'Invalid target language' }, { status: 400 });
    }

    // Get book pages
    const { data: pages, error } = await supabase
      .from('book_pages')
      .select('id, page_number, text_content')
      .eq('book_id', bookId)
      .order('page_number');

    if (error || !pages) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if translation already exists
    const { data: existingTranslation } = await supabase
      .from('book_translations')
      .select('*')
      .eq('book_id', bookId)
      .eq('language', targetLanguage)
      .single();

    if (existingTranslation) {
      return NextResponse.json({
        translatedPages: existingTranslation.translated_pages,
        cached: true
      });
    }

    // Translate pages
    const translatedPages = await translateBookPages(
      pages.map(p => ({ pageNumber: p.page_number, text: p.text_content || '' })),
      targetLanguage as LanguageCode
    );

    // Cache the translation
    await supabase
      .from('book_translations')
      .insert({
        book_id: bookId,
        language: targetLanguage,
        translated_pages: translatedPages,
      });

    return NextResponse.json({ translatedPages, cached: false });
  } catch (error: any) {
    console.error('Book translation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all available translations for this book
  const { data: translations } = await supabase
    .from('book_translations')
    .select('language, created_at')
    .eq('book_id', bookId);

  return NextResponse.json({
    availableLanguages: translations?.map(t => t.language) || ['en']
  });
}