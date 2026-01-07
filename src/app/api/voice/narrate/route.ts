export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookId, voiceProfileId } = await request.json();

    // Get book pages
    const { data: pages } = await supabase
      .from('book_pages')
      .select('text_content')
      .eq('book_id', bookId)
      .order('page_number');

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No pages found' }, { status: 404 });
    }

    // Get voice profile
    const { data: voiceProfile } = await supabase
      .from('voice_profiles')
      .select('elevenlabs_voice_id')
      .eq('id', voiceProfileId)
      .single();

    if (!voiceProfile?.elevenlabs_voice_id) {
      return NextResponse.json({ error: 'Voice profile not found' }, { status: 404 });
    }

    // Combine all text
    const fullText = pages.map(p => p.text_content).join(' ');

    // Generate narration with ElevenLabs
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceProfile.elevenlabs_voice_id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: fullText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate narration');
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Upload to Supabase Storage
    const fileName = `narrations/${bookId}/${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBuffer, { contentType: 'audio/mpeg' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    // Save narration record
    const { data: narration } = await supabase
      .from('narrations')
      .insert({
        book_id: bookId,
        voice_profile_id: voiceProfileId,
        audio_url: publicUrl,
        status: 'ready',
      })
      .select()
      .single();

    return NextResponse.json({ narration });
  } catch (error: any) {
    console.error('Narration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
