'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, BookOpen, Edit } from 'lucide-react';
import { calculateAge } from '@/lib/utils';
import type { Child, Book } from '@/types/database';
import Link from 'next/link';

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: childData } = await supabase.from('children').select('*').eq('id', params.childId).single();
      if (childData) {
        setChild(childData);
        const { data: booksData } = await supabase.from('books').select('*').eq('child_id', params.childId).order('created_at', { ascending: false });
        setBooks(booksData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [params.childId]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!child) return <div>Child not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />Back
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={child.photo_url || ''} />
            <AvatarFallback className="text-3xl">{child.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{child.name}</CardTitle>
            <p className="text-muted-foreground">
              {child.date_of_birth ? `${calculateAge(child.date_of_birth)} years old` : 'Age not set'}
            </p>
            {child.interests && (
              <div className="flex flex-wrap gap-1 mt-2">
                {child.interests.map((interest) => (
                  <span key={interest} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{interest}</span>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Edit</Button>
        </CardHeader>
      </Card>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{child.name}'s Books</h2>
          <Link href={`/books/create?childId=${child.id}`}>
            <Button><BookOpen className="mr-2 h-4 w-4" />Create Book</Button>
          </Link>
        </div>
        {books.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No books created yet for {child.name}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.theme} • {book.status}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
