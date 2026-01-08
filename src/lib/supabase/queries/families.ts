import { getSupabaseClient } from '../client'
import type { Tables, Insertable, Updatable } from '@/types/database'

type Family = Tables<'families'>
type FamilyInsert = Insertable<'families'>
type FamilyUpdate = Updatable<'families'>

export async function getFamily(familyId: string): Promise<Family | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()
  
  if (error) {
    console.error('Error fetching family:', error)
    return null
  }
  
  return data
}

export async function createFamily(family: FamilyInsert): Promise<Family | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('families')
    .insert(family)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating family:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function updateFamily(
  familyId: string,
  updates: FamilyUpdate
): Promise<Family | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('families')
    .update(updates)
    .eq('id', familyId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating family:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function createFamilyWithOwner(
  familyName: string,
  userId: string
): Promise<string | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .rpc('create_family_with_owner', {
      p_family_name: familyName,
      p_user_id: userId,
    })
  
  if (error) {
    console.error('Error creating family with owner:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function getFamilyStats(familyId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .rpc('get_family_stats', { p_family_id: familyId })
  
  if (error) {
    console.error('Error fetching family stats:', error)
    return null
  }
  
  return data
}
