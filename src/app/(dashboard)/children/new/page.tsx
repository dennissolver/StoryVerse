'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/user';
import { useChildrenStore } from '@/stores/children';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const INTERESTS = ['dinosaurs', 'space', 'animals', 'sports', 'music', 'art', 'science', 'nature', 'vehicles', 'fantasy', 'superheroes', 'princesses'];

export default function NewChildPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { addChild } = useChildrenStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: '',
    favorite_color: '',
    interests: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.family_id) return;
    setLoading(true);
    try {
      await addChild({ ...formData, family_id: profile.family_id });
      router.push('/children');
    } catch (error) {
      console.error('Error adding child:', error);
    }
    setLoading(false);
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add a Child</CardTitle>
          <CardDescription>Create a profile for your story hero</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Boy</SelectItem>
                  <SelectItem value="female">Girl</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Favorite Color</Label>
              <Input id="color" value={formData.favorite_color} onChange={(e) => setFormData({ ...formData, favorite_color: e.target.value })} placeholder="e.g., blue, purple" />
            </div>

            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.interests.includes(interest)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-input'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Child'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
