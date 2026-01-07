'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlanCard } from '@/components/subscription/plan-card';
import type { SubscriptionTier } from '@/lib/stripe/server';

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentTier = 'free'; // TODO: Get from user profile

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === 'free') return;
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Manage your plan</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['free', 'seedling', 'growing', 'family'] as SubscriptionTier[]).map((tier) => (
          <PlanCard key={tier} tier={tier} currentTier={currentTier} onSelect={handleSelectPlan} loading={loading} />
        ))}
      </div>
    </div>
  );
}
