import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Book } from '@/types/database';

interface BooksState {
  books: Book[];
  currentBook: Book | null;
  isLoading: boolean;
  fetchBooks: (familyId: string) => Promise<void>;
  fetchBook: (bookId: string) => Promise<void>;
  createBook: (book: Partial<Book>) => Promise<Book>;
}

export const useBooksStore = create<BooksState>((set, get) => ({
  books: [],
  currentBook: null,
  isLoading: false,
  fetchBooks: async (familyId) => {
    set({ isLoading: true });
    const supabase = createClient();
    const { data } = await supabase.from('books').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
    set({ books: data || [], isLoading: false });
  },
  fetchBook: async (bookId) => {
    const supabase = createClient();
    const { data } = await supabase.from('books').select('*').eq('id', bookId).single();
    set({ currentBook: data });
  },
  createBook: async (bookData) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('books').insert(bookData as any).select().single();
    if (error) throw error;
    set({ books: [data, ...get().books] });
    return data;
  },
}));
