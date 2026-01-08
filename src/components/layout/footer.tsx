import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works" className="hover:text-foreground">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/gift" className="hover:text-foreground">Gift a Story</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground">Login</Link></li>
              <li><Link href="/signup" className="hover:text-foreground">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Twitter</a></li>
              <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StoryVerse. All rights reserved.</p>
          <p className="mt-1">The platform that grows up with your child. Kindergarten to graduation.</p>
        </div>
      </div>
    </footer>
  );
}