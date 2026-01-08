'use client';

import { ReactNode } from 'react';

// Future providers will go here (auth, theme, etc.)
// For now, just a passthrough

export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}