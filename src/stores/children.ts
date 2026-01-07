import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Child } from '@/types/database';

interface ChildrenState {
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  fetchChildren: (familyId: string) => Promise<void>;
  selectChild: (child: Child | null) => void;
  addChild: (child: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => Promise<Child>;
}

export const useChildrenStore = create<ChildrenState>((set, get) => ({
  children: [],
  selectedChild: null,
  isLoading: false,
  fetchChildren: async (familyId) => {
    set({ isLoading: true });
    const supabase = createClient();
    const { data } = await supabase.from('children').select('*').eq('family_id', familyId).order('created_at');
    set({ children: data || [], isLoading: false });
  },
  selectChild: (child) => set({ selectedChild: child }),
  addChild: async (childData) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('children').insert(childData).select().single();
    if (error) throw error;
    set({ children: [...get().children, data] });
    return data;
  },
}));
