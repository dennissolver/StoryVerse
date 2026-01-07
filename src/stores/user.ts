import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/database';

interface UserState {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  fetchUser: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      set({ user: { id: user.id, email: user.email! }, profile, isLoading: false });
    } else {
      set({ user: null, profile: null, isLoading: false });
    }
  },
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
