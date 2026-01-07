'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translation';

interface OnboardingVoiceWidgetProps {
  onComplete?: () => void;
  defaultLanguage?: LanguageCode;
}

const STATES_ORDER = [
  'greeting',
  'guardian_verification', 
  'family_introduction',
  'child_introduction',
  'cultural_discovery',
  'religious_discovery',
  'values_discovery',
  'content_preferences',
  'child_goals',
  'special_considerations',
  'confirmation',
  'complete'
];

export function OnboardingVoiceWidget({ onComplete, defaultLanguage = 'en' }: OnboardingVoiceWidgetProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<string>('greeting');
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useTextMode, setUseTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'agent' | 'user'; content: string }>>([]);
  const [currentAgentMessage, setCurrentAgentMessage] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate progress
  const progressPercent = ((STATES_ORDER.indexOf(currentState) + 1) / STATES_ORDER.length) * 100;

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start or resume session
  const initSession = useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/voice');
      const data = await response.json();
      
      if (data.session) {
        setSessionId(data.session.id);
        setCurrentState(data.session.state);
        setLanguage(data.session.language);
        // Restore conversation history
        if (data.session.conversation_history) {
          setMessages(data.session.conversation_history.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })));
        }
      } else {
        // Start new session with greeting
        await sendMessage(null, true);
      }
    } catch (error) {
      console.error('Failed to init session:', error);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Send message to voice agent
  const sendMessage = async (userMessage: string | null, isStart = false) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/onboarding/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userMessage: userMessage || (isStart ? '[START]' : ''),
          language
        })
      });

      const data = await response.json();

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      if (data.agentResponse) {
        setCurrentAgentMessage(data.agentResponse);
        setMessages(prev => [
          ...prev,
          ...(userMessage ? [{ role: 'user' as const, content: userMessage }] : []),
          { role: 'agent' as const, content: data.agentResponse }
        ]);
        
        // Speak the response
        if (!isMuted && !useTextMode) {
          await speakResponse(data.agentResponse, data.language);
        }
      }

      if (data.state) {
        setCurrentState(data.state);
      }

      if (data.isComplete) {
        onComplete?.();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Text-to-speech using ElevenLabs
  const speakResponse = async (text: string, lang: string) => {
    setIsSpeaking(true);
    
    try {
      // Get voice ID for language (Jillian or language-appropriate voice)
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          audioRef.current.onended = () => setIsSpeaking(false);
        }
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Start voice recording
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAndSend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Microphone error:', error);
      // Fall back to text mode
      setUseTextMode(true);
    }
  };

  // Stop recording and transcribe
  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // Transcribe audio and send
  const transcribeAndSend = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Send to transcription API
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.transcript) {
        await sendMessage(data.transcript);
      }
    } catch (error) {
      console.error('Transcription error:', error);
    }
  };

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendMessage(textInput.trim());
      setTextInput('');
    }
  };

  // Language selector for initial setup
  const LanguageSelector = () => (
    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
        <button
          key={code}
          onClick={() => setLanguage(code as LanguageCode)}
          className={`p-2 rounded-lg text-center transition-colors ${
            language === code 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <span className="text-xl">{info.flag}</span>
          <span className="text-xs block">{info.native}</span>
        </button>
      ))}
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        {/* Header with progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Welcome to StoryVerse</h2>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercent)}% complete
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Language selection (shown at start) */}
        {currentState === 'greeting' && messages.length === 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">
              Choose your preferred language:
            </p>
            <LanguageSelector />
          </div>
        )}

        {/* Conversation display */}
        <div className="bg-muted/30 rounded-lg p-4 mb-4 h-64 overflow-y-auto">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {msg.role === 'agent' && (
                    <span className="text-xs text-primary font-medium block mb-1">
                      Jillian
                    </span>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isProcessing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Jillian is thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Voice/Text toggle */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={useTextMode ? 'outline' : 'default'}
              size="sm"
              onClick={() => setUseTextMode(false)}
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </Button>
            <Button
              variant={useTextMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseTextMode(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Text
            </Button>
          </div>

          {/* Voice mode controls */}
          {!useTextMode && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              
              <Button
                size="lg"
                className={`rounded-full w-16 h-16 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || isSpeaking}
              >
                {isListening ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              
              <div className="w-10" /> {/* Spacer for alignment */}
            </div>
          )}

          {/* Text mode input */}
          {useTextMode && (
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isProcessing}
              />
              <Button type="submit" disabled={isProcessing || !textInput.trim()}>
                Send
              </Button>
            </form>
          )}

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {isListening && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening...
              </span>
            )}
            {isSpeaking && (
              <span className="flex items-center gap-1">
                <Volume2 className="h-4 w-4 animate-pulse" />
                Speaking...
              </span>
            )}
            {currentState === 'complete' && (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                Setup complete!
              </span>
            )}
          </div>
        </div>

        {/* Hidden audio element for TTS playback */}
        <audio ref={audioRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
