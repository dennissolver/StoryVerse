import { getSupabaseClient } from '../client'
import type { Tables, Insertable, Updatable } from '@/types/database'

type Child = Tables<'children'>
type ChildInsert = Insertable<'children'>
type ChildUpdate = Updatable<'children'>

export async function getChildren(familyId: string): Promise<Child[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching children:', error)
    return []
  }
  
  return data || []
}

export async function getChild(childId: string): Promise<Child | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single()
  
  if (error) {
    console.error('Error fetching child:', error)
    return null
  }
  
  return data
}

export async function createChild(child: ChildInsert): Promise<Child | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('children')
    .insert(child)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating child:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function updateChild(
  childId: string,
  updates: ChildUpdate
): Promise<Child | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', childId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating child:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function deleteChild(childId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', childId)
  
  if (error) {
    console.error('Error deleting child:', error)
    throw new Error(error.message)
  }
}

export async function getChildWithBooks(childId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('children')
    .select(`
      *,
      books (
        id,
        title,
        cover_url,
        status,
        created_at
      )
    `)
    .eq('id', childId)
    .single()
  
  if (error) {
    console.error('Error fetching child with books:', error)
    return null
  }
  
  return data
}

// Helper to calculate age from date of birth
export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null
  
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}
