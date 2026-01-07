import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Try StoryVerse',
    features: ['1 book per month', 'Basic customization', 'Digital eBook format'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Seedling',
    price: '$9.99',
    period: '/month',
    description: 'For new families',
    features: ['2 books per month', 'All illustration styles', '1 voice clone', 'Print-ready PDFs'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Growing',
    price: '$19.99',
    period: '/month',
    description: 'Most popular',
    features: ['4 books per month', 'Story memory & continuity', '2 voice clones', 'Priority generation', 'Print fulfillment'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Family',
    price: '$29.99',
    period: '/month',
    description: 'For the whole family',
    features: ['Unlimited books', 'All features', '5 voice clones', 'Up to 5 children', 'Premium support'],
    cta: 'Start Free Trial',
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade as your family grows. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/signup" className="w-full">
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
