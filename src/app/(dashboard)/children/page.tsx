'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/stores/user';
import { useChildrenStore } from '@/stores/children';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, User } from 'lucide-react';
import { calculateAge } from '@/lib/utils';

export default function ChildrenPage() {
  const { profile } = useUserStore();
  const { children, fetchChildren, isLoading } = useChildrenStore();

  useEffect(() => {
    if (profile?.family_id) fetchChildren(profile.family_id);
  }, [profile?.family_id, fetchChildren]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Children</h1>
          <p className="text-muted-foreground">Manage your story heroes</p>
        </div>
        <Link href="/children/new">
          <Button><Plus className="mr-2 h-4 w-4" />Add Child</Button>
        </Link>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No children added yet</p>
            <p className="text-muted-foreground mb-4">Add your first child to start creating personalized stories</p>
            <Link href="/children/new">
              <Button><Plus className="mr-2 h-4 w-4" />Add Your First Child</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Link key={child.id} href={`/children/${child.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={child.photo_url || ''} />
                    <AvatarFallback className="text-lg">{child.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{child.name}</CardTitle>
                    <p className="text-muted-foreground">
                      {child.date_of_birth ? `${calculateAge(child.date_of_birth)} years old` : 'Age not set'}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {child.interests && child.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {child.interests.slice(0, 4).map((interest) => (
                        <span key={interest} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
