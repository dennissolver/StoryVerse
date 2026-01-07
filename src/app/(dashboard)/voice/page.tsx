'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Plus, MessageSquare } from 'lucide-react';

export default function VoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Voice Studio</h1>
        <p className="text-muted-foreground">Clone your voice and talk to Jillian</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5" />Voice Cloning</CardTitle>
            <CardDescription>Record your voice to narrate your children's stories</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              With just 60 seconds of recording, we can clone your voice to narrate bedtime stories - even when you're traveling!
            </p>
            <Link href="/voice/clone">
              <Button className="w-full"><Plus className="mr-2 h-4 w-4" />Clone Your Voice</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Talk to Jillian</CardTitle>
            <CardDescription>Your AI story assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with Jillian to brainstorm story ideas, customize your books, and get creative inspiration.
            </p>
            <Link href="/voice/conversation">
              <Button variant="outline" className="w-full">Start Conversation</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
