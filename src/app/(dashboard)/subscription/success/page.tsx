'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="text-center">
        <CardHeader>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Welcome to StoryVerse!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your subscription is now active. You can start creating magical stories for your children.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/books/create">
              <Button className="w-full">Create Your First Book</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">Go to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
