import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'StoryVerse - Books That Grow With Your Child',
  description: 'AI-powered personalized children\'s books from kindergarten to graduation. 18 years. One story.',
  keywords: ['children books', 'personalized books', 'AI stories', 'kids', 'education'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable + ' font-sans antialiased'}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}