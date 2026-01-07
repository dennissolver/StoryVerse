'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useUserStore } from '@/stores/user';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, fetchUser } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
