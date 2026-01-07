import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    
    if (!agentId) {
      throw new Error('Agent ID not configured');
    }

    // Get signed URL from ElevenLabs for the conversational agent
    const response = await fetch(
      `${ELEVENLABS_API_URL}/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get signed URL from ElevenLabs');
    }

    const { signed_url } = await response.json();

    return NextResponse.json({ signedUrl: signed_url });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
