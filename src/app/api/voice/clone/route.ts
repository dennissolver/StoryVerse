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
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const audioFile = formData.get('files') as Blob;

    if (!name || !audioFile) {
      return NextResponse.json({ error: 'Name and audio file required' }, { status: 400 });
    }

    // Get user's family_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!profile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 404 });
    }

    // Upload audio to Supabase Storage first
    const fileName = `voice-samples/${user.id}/${Date.now()}.webm`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    // Call ElevenLabs Voice Cloning API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('name', name);
    elevenLabsFormData.append('files', audioFile);
    elevenLabsFormData.append('description', `Voice clone for StoryVerse user ${user.id}`);

    const elevenLabsResponse = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: elevenLabsFormData,
    });

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.json();
      throw new Error(errorData.detail?.message || 'ElevenLabs API error');
    }

    const { voice_id } = await elevenLabsResponse.json();

    // Save voice profile to database
    const { data: voiceProfile, error: dbError } = await supabase
      .from('voice_profiles')
      .insert({
        family_id: profile.family_id,
        user_id: user.id,
        name,
        elevenlabs_voice_id: voice_id,
        sample_audio_url: publicUrl,
        status: 'ready',
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ voiceId: voice_id, profile: voiceProfile });
  } catch (error: any) {
    console.error('Voice clone error:', error);
    return NextResponse.json({ error: error.message || 'Voice cloning failed' }, { status: 500 });
  }
}
