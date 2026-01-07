'use client';

import { useState, useEffect, useRef } from 'react';
import { useVoiceStore } from '@/stores/voice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { getSignedAgentUrl } from '@/lib/elevenlabs/client';

interface JillianWidgetProps {
  context?: string;
  onMessage?: (message: string) => void;
}

export function JillianWidget({ context, onMessage }: JillianWidgetProps) {
  const { isConnected, setConnected } = useVoiceStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const connect = async () => {
    try {
      const signedUrl = await getSignedAgentUrl();
      const ws = new WebSocket(signedUrl);
      
      ws.onopen = () => {
        setConnected(true);
        console.log('Connected to Jillian');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
          setTranscript(data.text);
        } else if (data.type === 'response') {
          setResponse(data.text);
          onMessage?.(data.text);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('Disconnected from Jillian');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const disconnect = () => {
    wsRef.current?.close();
    setConnected(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleListening = () => setIsListening(!isListening);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🧙‍♀️</span>
          Jillian - Story Assistant
          <span className={`ml-auto w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button onClick={connect} className="w-full">
            <Mic className="mr-2 h-4 w-4" />
            Start Conversation
          </Button>
        ) : (
          <>
            <div className="flex gap-2">
              <Button variant={isListening ? 'default' : 'outline'} onClick={toggleListening} className="flex-1">
                {isListening ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
                {isListening ? 'Listening...' : 'Press to Talk'}
              </Button>
              <Button variant="outline" size="icon" onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="destructive" onClick={disconnect}>
                End
              </Button>
            </div>

            {transcript && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">You said:</p>
                <p>{transcript}</p>
              </div>
            )}

            {response && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Jillian:</p>
                <p>{response}</p>
              </div>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Talk to Jillian to help create your story. She'll ask questions about your child's adventure!
        </p>
      </CardContent>
    </Card>
  );
}
