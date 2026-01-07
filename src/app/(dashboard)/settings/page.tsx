'use client';

import { useState } from 'react';
import { useUserStore } from '@/stores/user';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { user, profile, fetchUser } = useUserStore();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName })
      .eq('id', user?.id);

    if (error) {
      setMessage('Error updating profile');
    } else {
      setMessage('Profile updated successfully');
      fetchUser();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            {message && (
              <p className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
