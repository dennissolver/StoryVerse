'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/stores/user';
import { useBooksStore } from '@/stores/books';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus } from 'lucide-react';

export default function BooksPage() {
  const { profile } = useUserStore();
  const { books, fetchBooks, isLoading } = useBooksStore();

  useEffect(() => {
    if (profile?.family_id) fetchBooks(profile.family_id);
  }, [profile?.family_id, fetchBooks]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Books</h1>
          <p className="text-muted-foreground">Your story library</p>
        </div>
        <Link href="/books/create">
          <Button><Plus className="mr-2 h-4 w-4" />Create Book</Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No books yet</p>
            <p className="text-muted-foreground mb-4">Create your first magical story</p>
            <Link href="/books/create">
              <Button><Plus className="mr-2 h-4 w-4" />Create Your First Book</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{book.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{book.description}</p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{book.theme}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">{book.status}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
