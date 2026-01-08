import { getSupabaseClient } from '../client'
import type { Tables, Insertable, Updatable } from '@/types/database'

type Book = Tables<'books'>
type BookInsert = Insertable<'books'>
type BookUpdate = Updatable<'books'>
type BookPage = Tables<'book_pages'>

export async function getBooks(familyId: string): Promise<Book[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching books:', error)
    return []
  }
  
  return data || []
}

export async function getBook(bookId: string): Promise<Book | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()
  
  if (error) {
    console.error('Error fetching book:', error)
    return null
  }
  
  return data
}

export async function getBookWithPages(bookId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      book_pages (
        id,
        page_number,
        text_content,
        image_url,
        layout
      ),
      children (
        name,
        photo_url
      )
    `)
    .eq('id', bookId)
    .single()
  
  if (error) {
    console.error('Error fetching book with pages:', error)
    return null
  }
  
  // Sort pages by page number
  if (data?.book_pages) {
    data.book_pages.sort((a: BookPage, b: BookPage) => a.page_number - b.page_number)
  }
  
  return data
}

export async function createBook(book: BookInsert): Promise<Book | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('books')
    .insert(book)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating book:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function updateBook(
  bookId: string,
  updates: BookUpdate
): Promise<Book | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', bookId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating book:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function deleteBook(bookId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
  
  if (error) {
    console.error('Error deleting book:', error)
    throw new Error(error.message)
  }
}

export async function getBooksByChild(childId: string): Promise<Book[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching books by child:', error)
    return []
  }
  
  return data || []
}

export async function getRecentBooks(familyId: string, limit: number = 5): Promise<Book[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching recent books:', error)
    return []
  }
  
  return data || []
}

export async function canCreateBook(familyId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .rpc('can_create_book', { p_family_id: familyId })
  
  if (error) {
    console.error('Error checking book limit:', error)
    return false
  }
  
  return data ?? false
}
