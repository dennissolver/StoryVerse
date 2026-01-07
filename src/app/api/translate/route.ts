export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch, isLanguageSupported, type LanguageCode } from '@/lib/translation';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, texts, targetLanguage, sourceLanguage } = await request.json();

    // Validate target language
    if (!targetLanguage || !isLanguageSupported(targetLanguage)) {
      return NextResponse.json({ error: 'Invalid target language' }, { status: 400 });
    }

    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      const translations = await translateBatch(
        texts,
        targetLanguage as LanguageCode,
        sourceLanguage as LanguageCode | undefined
      );
      return NextResponse.json({ translations });
    }

    // Handle single text translation
    if (text) {
      const result = await translateText(
        text,
        targetLanguage as LanguageCode,
        sourceLanguage as LanguageCode | undefined
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
