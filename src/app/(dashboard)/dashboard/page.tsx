'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/stores/user';
import { useChildrenStore } from '@/stores/children';
import { useBooksStore } from '@/stores/books';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Mic, Plus, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useUserStore();
  const { children, fetchChildren } = useChildrenStore();
  const { books, fetchBooks } = useBooksStore();

  useEffect(() => {
    if (profile?.family_id) {
      fetchChildren(profile.family_id);
      fetchBooks(profile.family_id);
    }
  }, [profile?.family_id, fetchChildren, fetchBooks]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!</h1>
        <p className="text-muted-foreground mt-1">Let's create some magical stories today.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
            <p className="text-xs text-muted-foreground">story heroes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Books Created</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{books.length}</div>
            <p className="text-xs text-muted-foreground">magical stories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voice Profiles</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">narration voices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start creating right away</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/books/create">
              <Button className="w-full justify-start" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Create New Book
              </Button>
            </Link>
            <Link href="/children/new">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add a Child
              </Button>
            </Link>
            <Link href="/voice/clone">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Mic className="mr-2 h-5 w-5" />
                Clone Your Voice
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Books</CardTitle>
            <CardDescription>Your latest creations</CardDescription>
          </CardHeader>
          <CardContent>
            {books.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No books yet. Create your first story!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {books.slice(0, 3).map((book) => (
                  <Link key={book.id} href={`/books/${book.id}`} className="block p-3 rounded-lg hover:bg-muted transition-colors">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.status}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
