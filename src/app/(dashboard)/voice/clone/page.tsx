'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceRecorder } from '@/components/voice/voice-recorder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { cloneVoice } from '@/lib/elevenlabs/client';

export default function VoiceClonePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [voiceName, setVoiceName] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!audioBlob || !voiceName) return;
    setLoading(true);
    try {
      await cloneVoice(voiceName, audioBlob);
      router.push('/voice?success=cloned');
    } catch (error) {
      console.error('Error cloning voice:', error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />Back
      </Button>

      {step === 1 && <VoiceRecorder onRecordingComplete={handleRecordingComplete} />}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Name Your Voice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Voice Name</Label>
              <Input id="name" value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="e.g., Mom's Voice, Dad's Voice" />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>Re-record</Button>
              <Button onClick={handleSubmit} disabled={!voiceName || loading}>
                {loading ? 'Creating...' : 'Create Voice Clone'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
