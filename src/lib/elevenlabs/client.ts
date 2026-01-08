const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function getSignedAgentUrl(): Promise<string> {
  const response = await fetch('/api/voice/signed-url');
  if (!response.ok) throw new Error('Failed to get signed URL');
  const data = await response.json();
  return data.signedUrl;
}

export async function cloneVoice(name: string, audioBlob: Blob): Promise<{ voiceId: string }> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('files', audioBlob, 'voice-sample.webm');
  
  const response = await fetch('/api/voice/clone', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) throw new Error('Failed to clone voice');
  return response.json();
}

export async function generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  
  if (!response.ok) throw new Error('Failed to generate speech');
  return response.arrayBuffer();
}
