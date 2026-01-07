'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Volume2, Download, RefreshCw } from 'lucide-react';
import type { Book, BookPage } from '@/types/database';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book & { pages: BookPage[] } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      const response = await fetch(`/api/books/${params.bookId}`);
      const data = await response.json();
      setBook(data);
      setLoading(false);
      
      if (data.status === 'generating') {
        setGenerating(true);
        // Poll for updates
        const interval = setInterval(async () => {
          const res = await fetch(`/api/books/${params.bookId}`);
          const updated = await res.json();
          if (updated.status !== 'generating') {
            setBook(updated);
            setGenerating(false);
            clearInterval(interval);
          }
        }, 3000);
      }
    };
    fetchBook();
  }, [params.bookId]);

  const handleGenerate = async () => {
    setGenerating(true);
    await fetch('/api/books/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: params.bookId }),
    });
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!book) return <div>Book not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{book.title}</h1>
          <p className="text-muted-foreground">{book.theme} • {book.illustration_style}</p>
        </div>
      </div>

      {generating ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Creating Your Story...</p>
            <p className="text-muted-foreground mb-4">This may take a few minutes</p>
            <Progress value={33} className="max-w-md mx-auto" />
          </CardContent>
        </Card>
      ) : book.status === 'draft' ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium mb-4">Ready to Generate</p>
            <Button onClick={handleGenerate}>
              <RefreshCw className="mr-2 h-4 w-4" />Generate Story
            </Button>
          </CardContent>
        </Card>
      ) : book.pages && book.pages.length > 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="min-h-[400px] flex items-center justify-center bg-muted rounded-lg p-8 mb-6">
              <div className="text-center max-w-2xl">
                <p className="text-lg leading-relaxed">{book.pages[currentPage]?.text_content}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />Previous
              </Button>

              <span className="text-muted-foreground">
                Page {currentPage + 1} of {book.pages.length}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(book.pages.length - 1, currentPage + 1))}
                disabled={currentPage === book.pages.length - 1}
              >
                Next<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>

          <div className="border-t p-4 flex gap-2 justify-center">
            <Button variant="outline" size="sm">
              <Volume2 className="mr-2 h-4 w-4" />Listen
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />Download PDF
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pages generated yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}
