'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Users, BookOpen, Mic, CreditCard, Settings, LogOut } from 'lucide-react';
import { useUserStore } from '@/stores/user';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/children', icon: Users, label: 'Children' },
  { href: '/books', icon: BookOpen, label: 'Books' },
  { href: '/voice', icon: Mic, label: 'Voice' },
  { href: '/subscription', icon: CreditCard, label: 'Subscription' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useUserStore();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">📚</span> StoryVerse
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
