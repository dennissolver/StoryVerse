'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUserStore } from '@/stores/user';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, profile, signOut } = useUserStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/storyverse-logo-icon.jpg" alt="StoryVerse" width={40} height={40} className="rounded-lg" />
          <span className="hidden font-bold text-xl sm:inline-block">StoryVerse</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/how-it-works" className="text-sm font-medium hover:text-primary">How It Works</Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-primary">Pricing</Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary">About</Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Avatar>
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback>{profile?.full_name?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
          
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t p-4">
          <nav className="flex flex-col gap-4">
            <Link href="/how-it-works" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="/pricing" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>About</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
