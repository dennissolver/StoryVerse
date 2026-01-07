import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { PricingSection } from '@/components/landing/pricing-section';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
