export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*, children(name)')
    .eq('id', bookId)
    .single();

  if (bookError) {
    return NextResponse.json({ error: bookError.message }, { status: 500 });
  }

  const { data: pages } = await supabase
    .from('book_pages')
    .select('*')
    .eq('book_id', bookId)
    .order('page_number');

  return NextResponse.json({ ...book, pages: pages || [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('books')
    .update(body)
    .eq('id', bookId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}