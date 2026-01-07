'use client';

import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mic, Square, Play, Trash2, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  minDuration?: number; // in seconds
  maxDuration?: number; // in seconds
}

export function VoiceRecorder({ onRecordingComplete, minDuration = 30, maxDuration = 60 }: VoiceRecorderProps) {
  const { isRecording, audioBlob, audioUrl, startRecording, stopRecording, clearRecording } = useMediaRecorder();
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((d) => {
          if (d >= maxDuration) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxDuration, stopRecording]);

  const handleStart = () => {
    setDuration(0);
    startRecording();
  };

  const handleSubmit = () => {
    if (audioBlob && duration >= minDuration) {
      onRecordingComplete(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Your Voice</CardTitle>
        <CardDescription>
          Record {minDuration}-{maxDuration} seconds of your voice reading a sample text.
          This will be used to clone your voice for story narration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-2">Please read the following:</p>
          <p className="italic">
            "Once upon a time, in a magical land far away, there lived a brave little hero who loved adventures.
            Every day brought new discoveries and wonderful friends. The sun would shine, the birds would sing,
            and our hero would set off on amazing journeys through enchanted forests and sparkling streams."
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{formatTime(duration)}</span>
            <span>{formatTime(maxDuration)}</span>
          </div>
          <Progress value={(duration / maxDuration) * 100} />
          {duration < minDuration && duration > 0 && (
            <p className="text-xs text-amber-500">
              Keep recording! Need at least {minDuration - duration} more seconds.
            </p>
          )}
        </div>

        <div className="flex justify-center gap-4">
          {!isRecording && !audioBlob && (
            <Button onClick={handleStart} size="lg">
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" size="lg">
              <Square className="mr-2 h-5 w-5" />
              Stop Recording
            </Button>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button variant="outline" onClick={() => {
                const audio = new Audio(audioUrl!);
                audio.play();
                setIsPlaying(true);
                audio.onended = () => setIsPlaying(false);
              }}>
                <Play className="mr-2 h-4 w-4" />
                {isPlaying ? 'Playing...' : 'Play'}
              </Button>
              <Button variant="outline" onClick={() => { clearRecording(); setDuration(0); }}>
                <Trash2 className="mr-2 h-4 w-4" />
                Re-record
              </Button>
              <Button onClick={handleSubmit} disabled={duration < minDuration}>
                <Upload className="mr-2 h-4 w-4" />
                Use Recording
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
