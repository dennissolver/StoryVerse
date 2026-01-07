export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Using OpenAI's Whisper for transcription (best multilingual support)
// Alternatively could use Deepgram, AssemblyAI, or Google Speech-to-Text

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'en';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert to format Whisper expects
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type || 'audio/webm' });

    // Create FormData for OpenAI API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioBlob, 'audio.webm');
    whisperFormData.append('model', 'whisper-1');
    
    // Only provide language hint if specified (Whisper auto-detects well)
    if (language && language !== 'auto') {
      whisperFormData.append('language', language);
    }
    
    // Add prompt to help with context (improves accuracy)
    whisperFormData.append('prompt', 'This is a conversation about setting up a family account for a children\'s book service. The speaker may discuss family, children, religion, culture, and personal preferences.');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Whisper transcription error:', error);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const result = await response.json();

    return NextResponse.json({
      transcript: result.text,
      language: result.language || language,
      duration: result.duration,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
