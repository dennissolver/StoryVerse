'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/user';
import { createClient } from '@/lib/supabase/client';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const { user, profile, isLoading, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser();
    
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push('/login');
    }
  }, [isLoading, user, requireAuth, router]);

  return { user, profile, isLoading, isAuthenticated: !!user };
}
