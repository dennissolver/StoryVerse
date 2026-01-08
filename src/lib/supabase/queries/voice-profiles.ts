import { getSupabaseClient } from '../client'
import type { Tables, Insertable, Updatable } from '@/types/database'

type VoiceProfile = Tables<'voice_profiles'>
type VoiceProfileInsert = Insertable<'voice_profiles'>
type VoiceProfileUpdate = Updatable<'voice_profiles'>

export async function getVoiceProfiles(familyId: string): Promise<VoiceProfile[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching voice profiles:', error)
    return []
  }
  
  return data || []
}

export async function getVoiceProfile(profileId: string): Promise<VoiceProfile | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('id', profileId)
    .single()
  
  if (error) {
    console.error('Error fetching voice profile:', error)
    return null
  }
  
  return data
}

export async function getReadyVoiceProfiles(familyId: string): Promise<VoiceProfile[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'ready')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching ready voice profiles:', error)
    return []
  }
  
  return data || []
}

export async function createVoiceProfile(profile: VoiceProfileInsert): Promise<VoiceProfile | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('voice_profiles')
    .insert(profile)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating voice profile:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function updateVoiceProfile(
  profileId: string,
  updates: VoiceProfileUpdate
): Promise<VoiceProfile | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('voice_profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating voice profile:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function deleteVoiceProfile(profileId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('voice_profiles')
    .delete()
    .eq('id', profileId)
  
  if (error) {
    console.error('Error deleting voice profile:', error)
    throw new Error(error.message)
  }
}

export async function setDefaultVoiceProfile(
  familyId: string,
  profileId: string
): Promise<void> {
  const supabase = getSupabaseClient()
  
  // First, unset all defaults for this family
  await supabase
    .from('voice_profiles')
    .update({ is_default: false })
    .eq('family_id', familyId)
  
  // Then set the new default
  const { error } = await supabase
    .from('voice_profiles')
    .update({ is_default: true })
    .eq('id', profileId)
  
  if (error) {
    console.error('Error setting default voice profile:', error)
    throw new Error(error.message)
  }
}

export async function canCreateVoiceClone(familyId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .rpc('can_create_voice_clone', { p_family_id: familyId })
  
  if (error) {
    console.error('Error checking voice clone limit:', error)
    return false
  }
  
  return data ?? false
}
