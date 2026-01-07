'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/stores/user';
import { useChildrenStore } from '@/stores/children';
import { useBooksStore } from '@/stores/books';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { JillianWidget } from '@/components/voice/jillian-widget';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const THEMES = [
  { value: 'adventure', label: '🗺️ Adventure' },
  { value: 'friendship', label: '🤝 Friendship' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'fantasy', label: '🧙 Fantasy' },
  { value: 'nature', label: '🌳 Nature' },
  { value: 'bedtime', label: '🌙 Bedtime' },
];

const STYLES = [
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'storybook', label: 'Classic Storybook' },
  { value: 'whimsical', label: 'Whimsical' },
];

export default function CreateBookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useUserStore();
  const { children, fetchChildren } = useChildrenStore();
  const { createBook } = useBooksStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    childId: searchParams.get('childId') || '',
    title: '',
    theme: '',
    illustrationStyle: 'storybook',
    customElements: '',
  });

  useEffect(() => {
    if (profile?.family_id) fetchChildren(profile.family_id);
  }, [profile?.family_id, fetchChildren]);

  const selectedChild = children.find((c) => c.id === formData.childId);
  const progress = (step / 4) * 100;

  const handleCreate = async () => {
    if (!profile?.family_id || !formData.childId) return;
    setLoading(true);
    try {
      const book = await createBook({
        family_id: profile.family_id,
        child_id: formData.childId,
        title: formData.title || `${selectedChild?.name}'s ${formData.theme} Adventure`,
        theme: formData.theme,
        illustration_style: formData.illustrationStyle,
        description: formData.customElements,
        status: 'generating',
      });
      router.push(`/books/${book.id}`);
    } catch (error) {
      console.error('Error creating book:', error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-1">Step {step} of 4</p>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Story Hero</CardTitle>
            <CardDescription>Select which child this book is for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {children.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No children added yet</p>
                <Button onClick={() => router.push('/children/new')}>Add a Child First</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setFormData({ ...formData, childId: child.id })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${formData.childId === child.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={child.photo_url || ''} />
                        <AvatarFallback>{child.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{child.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!formData.childId}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a Theme</CardTitle>
            <CardDescription>What kind of adventure will {selectedChild?.name} go on?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setFormData({ ...formData, theme: theme.value })}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${formData.theme === theme.value ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50'}`}
                >
                  <span className="text-2xl block mb-1">{theme.label.split(' ')[0]}</span>
                  <span className="text-sm">{theme.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={() => setStep(3)} disabled={!formData.theme}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Story Details</CardTitle>
            <CardDescription>Customize your story (or talk to Jillian for help!)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title (optional)</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder={`${selectedChild?.name}'s ${formData.theme} Adventure`} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Illustration Style</Label>
              <Select value={formData.illustrationStyle} onValueChange={(v) => setFormData({ ...formData, illustrationStyle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom">Special Elements (optional)</Label>
              <Input id="custom" value={formData.customElements} onChange={(e) => setFormData({ ...formData, customElements: e.target.value })} placeholder="Include their pet Max, best friend Sarah..." />
            </div>

            <JillianWidget context={`Creating a ${formData.theme} story for ${selectedChild?.name}`} />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={() => setStep(4)}>Review <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Create!</CardTitle>
            <CardDescription>Review your story settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p><strong>Hero:</strong> {selectedChild?.name}</p>
              <p><strong>Theme:</strong> {formData.theme}</p>
              <p><strong>Title:</strong> {formData.title || `${selectedChild?.name}'s ${formData.theme} Adventure`}</p>
              <p><strong>Style:</strong> {formData.illustrationStyle}</p>
              {formData.customElements && <p><strong>Special Elements:</strong> {formData.customElements}</p>}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={handleCreate} disabled={loading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? 'Creating...' : 'Create My Book'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
