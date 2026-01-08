import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translation';

// ElevenLabs multilingual voice IDs
// Using voices that work well across languages with the multilingual model
const JILLIAN_VOICE_CONFIG = {
  // Primary voice - warm, maternal, trustworthy
  primary: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm and clear
  
  // Language-optimized voices (if you want different voices per language)
  voices: {
    en: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    es: 'EXAVITQu4vr4xnSDxMaL', // Sarah (multilingual)
    fr: 'EXAVITQu4vr4xnSDxMaL', 
    de: 'EXAVITQu4vr4xnSDxMaL',
    zh: 'EXAVITQu4vr4xnSDxMaL',
    ja: 'EXAVITQu4vr4xnSDxMaL',
    ko: 'EXAVITQu4vr4xnSDxMaL',
    ar: 'EXAVITQu4vr4xnSDxMaL',
    hi: 'EXAVITQu4vr4xnSDxMaL',
    he: 'EXAVITQu4vr4xnSDxMaL',
    pt: 'EXAVITQu4vr4xnSDxMaL',
    it: 'EXAVITQu4vr4xnSDxMaL',
    ru: 'EXAVITQu4vr4xnSDxMaL',
  } as Record<string, string>
};

// Voice settings optimized for warm, conversational delivery
const VOICE_SETTINGS = {
  stability: 0.5,        // Balance between consistency and expressiveness
  similarity_boost: 0.75, // Keep Jillian's voice recognizable
  style: 0.4,            // Some style variation for natural feel
  use_speaker_boost: true // Enhance clarity
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text, language = 'en' } = await request.json();

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  // Get voice ID for language
  const voiceId = JILLIAN_VOICE_CONFIG.voices[language as string] || JILLIAN_VOICE_CONFIG.primary;

  try {
    // Call ElevenLabs text-to-speech API
    // Using multilingual v2 model for accurate pronunciation across languages
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2', // Best for non-English languages
          voice_settings: VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs TTS error:', error);
      return NextResponse.json({ error: 'Speech synthesis failed' }, { status: 500 });
    }

    // Stream the audio response
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Speech synthesis failed' }, { status: 500 });
  }
}

// GET - Get available voices for language selection
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'en';

  return NextResponse.json({
    voiceId: JILLIAN_VOICE_CONFIG.voices[language] || JILLIAN_VOICE_CONFIG.primary,
    voiceName: 'Jillian',
    language,
    supportsMultilingual: true
  });
}
