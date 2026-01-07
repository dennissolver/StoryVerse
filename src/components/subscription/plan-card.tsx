import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/stripe/server';

interface PlanCardProps {
  tier: SubscriptionTier;
  currentTier?: string;
  onSelect: (tier: SubscriptionTier) => void;
  loading?: boolean;
}

export function PlanCard({ tier, currentTier, onSelect, loading }: PlanCardProps) {
  const plan = SUBSCRIPTION_TIERS[tier];
  const isCurrentPlan = currentTier === tier;
  const isUpgrade = currentTier && Object.keys(SUBSCRIPTION_TIERS).indexOf(tier) > Object.keys(SUBSCRIPTION_TIERS).indexOf(currentTier as SubscriptionTier);

  return (
    <Card className={`relative ${tier === 'growing' ? 'border-primary shadow-lg' : ''}`}>
      {tier === 'growing' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">${(plan.price / 100).toFixed(2)}</span>
          {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            {plan.booksPerMonth === 999 ? 'Unlimited' : plan.booksPerMonth} books/month
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            {plan.voiceClones} voice clone{plan.voiceClones !== 1 ? 's' : ''}
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : 'default'}
          disabled={isCurrentPlan || loading}
          onClick={() => onSelect(tier)}
        >
          {isCurrentPlan ? 'Current Plan' : isUpgrade ? 'Upgrade' : 'Select'}
        </Button>
      </CardFooter>
    </Card>
  );
}
