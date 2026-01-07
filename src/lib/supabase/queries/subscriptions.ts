import { getSupabaseClient } from '../client'
import type { Tables, Updatable } from '@/types/database'
import type { UsageStats } from '@/types/subscription'

type Subscription = Tables<'subscriptions'>
type SubscriptionUpdate = Updatable<'subscriptions'>

export async function getSubscription(familyId: string): Promise<Subscription | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('family_id', familyId)
    .single()
  
  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }
  
  return data
}

export async function updateSubscription(
  familyId: string,
  updates: SubscriptionUpdate
): Promise<Subscription | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('family_id', familyId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating subscription:', error)
    throw new Error(error.message)
  }
  
  return data
}

export async function getUsageStats(familyId: string): Promise<UsageStats | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      books_this_month,
      books_limit_monthly,
      voice_clones_used,
      voice_clones_limit,
      storage_used_mb,
      storage_limit_mb
    `)
    .eq('family_id', familyId)
    .single()
  
  if (error) {
    console.error('Error fetching usage stats:', error)
    return null
  }
  
  return {
    books_this_month: data.books_this_month,
    books_limit: data.books_limit_monthly,
    voice_clones_used: data.voice_clones_used,
    voice_clones_limit: data.voice_clones_limit,
    storage_used_mb: data.storage_used_mb,
    storage_limit_mb: data.storage_limit_mb,
  }
}

export async function getSubscriptionByStripeCustomerId(
  customerId: string
): Promise<Subscription | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single()
  
  if (error) {
    console.error('Error fetching subscription by Stripe customer ID:', error)
    return null
  }
  
  return data
}

export async function incrementBookCount(familyId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { data: current } = await supabase
    .from('subscriptions')
    .select('books_this_month')
    .eq('family_id', familyId)
    .single()
  
  if (current) {
    await supabase
      .from('subscriptions')
      .update({ books_this_month: current.books_this_month + 1 })
      .eq('family_id', familyId)
  }
}
