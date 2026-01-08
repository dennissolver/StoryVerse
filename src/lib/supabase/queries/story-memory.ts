import { getSupabaseClient } from '../client'
import type { Tables, Updatable } from '@/types/database'
import type { Character, StoryEvent, StoryArc, ChildMemoryContext } from '@/types/memory'

type StoryMemory = Tables<'story_memory'>
type StoryMemoryUpdate = Updatable<'story_memory'>

export async function getStoryMemory(childId: string): Promise<StoryMemory | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('story_memory')
    .select('*')
    .eq('child_id', childId)
    .single()
  
  if (error) {
    console.error('Error fetching story memory:', error)
    return null
  }
  
  return data
}

export async function updateStoryMemory(
  childId: string,
  updates: StoryMemoryUpdate
): Promise<StoryMemory | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('story_memory')
    .update(updates)
    .eq('child_id', childId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating story memory:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function addCharacter(
  childId: string,
  character: Character
): Promise<void> {
  const supabase = getSupabaseClient()
  
  // Get current characters
  const { data: current } = await supabase
    .from('story_memory')
    .select('characters')
    .eq('child_id', childId)
    .single()
  
  const characters = (current?.characters as Character[]) || []
  characters.push(character)
  
  await supabase
    .from('story_memory')
    .update({ characters })
    .eq('child_id', childId)
}

export async function addStoryEvent(
  childId: string,
  event: StoryEvent
): Promise<void> {
  const supabase = getSupabaseClient()
  
  // Get current events
  const { data: current } = await supabase
    .from('story_memory')
    .select('story_events')
    .eq('child_id', childId)
    .single()
  
  const events = (current?.story_events as StoryEvent[]) || []
  events.push(event)
  
  // Keep only the most recent 100 events
  const recentEvents = events.slice(-100)
  
  await supabase
    .from('story_memory')
    .update({ story_events: recentEvents })
    .eq('child_id', childId)
}

export async function updateStoryArc(
  childId: string,
  arc: StoryArc
): Promise<void> {
  const supabase = getSupabaseClient()
  
  // Get current arcs
  const { data: current } = await supabase
    .from('story_memory')
    .select('ongoing_arcs')
    .eq('child_id', childId)
    .single()
  
  const arcs = (current?.ongoing_arcs as StoryArc[]) || []
  const existingIndex = arcs.findIndex(a => a.id === arc.id)
  
  if (existingIndex >= 0) {
    arcs[existingIndex] = arc
  } else {
    arcs.push(arc)
  }
  
  await supabase
    .from('story_memory')
    .update({ ongoing_arcs: arcs })
    .eq('child_id', childId)
}

export async function getChildMemoryContext(childId: string): Promise<ChildMemoryContext | null> {
  const memory = await getStoryMemory(childId)
  
  if (!memory) return null
  
  const characters = (memory.characters as Character[]) || []
  const events = (memory.story_events as StoryEvent[]) || []
  const arcs = (memory.ongoing_arcs as StoryArc[]) || []
  const locations = (memory.locations as { id: string; name: string; description: string; first_appeared_book_id: string; is_favorite: boolean }[]) || []
  const preferences = (memory.preferences as ChildMemoryContext['preferences']) || {
    favorite_themes: [],
    disliked_elements: [],
    preferred_story_length: 'medium',
    preferred_complexity: 'moderate',
  }
  
  return {
    characters: characters.filter(c => c.is_active),
    recentEvents: events.slice(-20),
    preferences,
    activeArcs: arcs.filter(a => a.status === 'active'),
    favoriteLocations: locations.filter(l => l.is_favorite),
  }
}
