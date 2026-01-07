import { BookOpen, Mic, Brain, Users, TrendingUp, Gift } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Personalized Stories',
    description: 'Every story features your child as the hero, with their friends, pets, and favorite places.',
  },
  {
    icon: Mic,
    title: 'Parent Voice Narration',
    description: "Clone your voice to narrate bedtime stories, even when you're traveling.",
  },
  {
    icon: Brain,
    title: 'Story Memory',
    description: 'Stories remember characters, events, and preferences across books.',
  },
  {
    icon: TrendingUp,
    title: 'Grows With Your Child',
    description: 'From picture books to novels - the platform evolves as they grow.',
  },
  {
    icon: Users,
    title: 'Family Collaboration',
    description: 'Parents create early, children take over as authors by teen years.',
  },
  {
    icon: Gift,
    title: 'Graduation Anthology',
    description: 'At 18, receive a hardcover collection of their entire story journey.',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Makes StoryVerse Different
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're not just another personalized book platform. We're building a lifelong companion for your child's creative journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
