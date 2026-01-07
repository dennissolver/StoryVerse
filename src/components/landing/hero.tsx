'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Mic } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 bg-[url('/stars.svg')] opacity-50" />
      
      <div className="container relative py-24 md:py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Books That <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Grow</span> With Your Child
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0">
              AI-powered personalized stories from kindergarten to graduation.
              18 years. One story. They start as the hero. They end as the author.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Story
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                  Try Demo
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-yellow-400" />
                <span>Ages 0-18</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-pink-400" />
                <span>Parent Voice Narration</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span>AI-Generated Stories</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto w-80 h-80 md:w-96 md:h-96">
              <Image
                src="/storyverse-logo-option1.jpg"
                alt="StoryVerse"
                fill
                className="object-contain rounded-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent rounded-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
