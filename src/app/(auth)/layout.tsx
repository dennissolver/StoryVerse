import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 items-center justify-center p-12">
        <div className="text-center text-white">
          <Link href="/">
            <Image src="/storyverse-logo-option1.jpg" alt="StoryVerse" width={200} height={200} className="mx-auto mb-8 rounded-full" />
          </Link>
          <h1 className="text-3xl font-bold mb-4">StoryVerse</h1>
          <p className="text-lg text-slate-300">The platform that grows up with your child.<br />Kindergarten to graduation.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex justify-center mb-8">
            <Image src="/storyverse-logo-icon.jpg" alt="StoryVerse" width={60} height={60} className="rounded-lg" />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
