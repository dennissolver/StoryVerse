'use client';

import { JillianWidget } from '@/components/voice/jillian-widget';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConversationPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Talk to Jillian</h1>
        <p className="text-muted-foreground">Your AI story assistant is ready to help</p>
      </div>

      <JillianWidget />
    </div>
  );
}
