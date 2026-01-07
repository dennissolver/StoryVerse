import { BookOpen, Mic, Sparkles, Gift } from 'lucide-react';

export const metadata = { title: 'How It Works - StoryVerse' };

const steps = [
  { icon: BookOpen, title: 'Add Your Child', description: 'Create a profile with their name, interests, and photo' },
  { icon: Sparkles, title: 'Create a Story', description: 'Choose a theme and let our AI craft a personalized adventure' },
  { icon: Mic, title: 'Add Your Voice', description: 'Clone your voice to narrate the story (optional)' },
  { icon: Gift, title: 'Enjoy Together', description: 'Read digitally or order a beautiful printed book' },
];

export default function HowItWorksPage() {
  return (
    <div className="container py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">How StoryVerse Works</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Creating magical, personalized stories is easier than you think
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex gap-6 mb-12 last:mb-0">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                {index < steps.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
              </div>
              <div className="flex-1 pb-12">
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
