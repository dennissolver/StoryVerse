'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gift, Copy, Mail, Share2, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface GiftDetails {
  status: 'processing' | 'complete';
  giftCode?: string;
  tier?: string;
  tierName?: string;
  recipientName?: string;
  recipientEmail?: string;
  giftMessage?: string;
  expiresAt?: string;
  shareUrl?: string;
}

export default function GiftSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [giftDetails, setGiftDetails] = useState<GiftDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchGiftDetails = async () => {
      try {
        const response = await fetch(`/api/gift/purchase?session_id=${sessionId}`);
        const data = await response.json();
        setGiftDetails(data);
      } catch (error) {
        console.error('Failed to fetch gift details:', error);
      } finally {
        setLoading(false);
      }
    };

    // Poll for completion if still processing
    fetchGiftDetails();
    const interval = setInterval(async () => {
      if (giftDetails?.status === 'complete') {
        clearInterval(interval);
        return;
      }
      fetchGiftDetails();
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, giftDetails?.status]);

  const copyCode = () => {
    if (giftDetails?.giftCode) {
      navigator.clipboard.writeText(giftDetails.giftCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyShareUrl = () => {
    if (giftDetails?.shareUrl) {
      navigator.clipboard.writeText(giftDetails.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('You received a StoryVerse gift!');
    const body = encodeURIComponent(
      `${giftDetails?.recipientName ? `Dear ${giftDetails.recipientName},\n\n` : ''}` +
      `You've been gifted a year of personalized stories on StoryVerse!\n\n` +
      `${giftDetails?.giftMessage ? `"${giftDetails.giftMessage}"\n\n` : ''}` +
      `Your gift code: ${giftDetails?.giftCode}\n\n` +
      `Redeem your gift here: ${giftDetails?.shareUrl}\n\n` +
      `Enjoy your magical stories! 📚✨`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          🎁
        </motion.div>
      </div>
    );
  }

  if (!giftDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <span className="text-4xl mb-4 block">😕</span>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We couldn't find your gift details.</p>
            <Link href="/gift">
              <Button>Try Again</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <span className="text-8xl">🎁</span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2"
            >
              <Check className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-center mb-2">
            Your Gift is Ready! 🎉
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {giftDetails.recipientEmail 
              ? `We'll send this gift to ${giftDetails.recipientEmail}` 
              : 'Share the code below with your recipient'}
          </p>

          {/* Gift Card Preview */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">StoryVerse</span>
                <span className="text-3xl">📚</span>
              </div>
              <p className="text-purple-100 text-sm">12 Month Gift Subscription</p>
            </div>
            <CardContent className="p-6 bg-white">
              {giftDetails.recipientName && (
                <p className="text-lg mb-2">
                  For: <span className="font-semibold">{giftDetails.recipientName}</span>
                </p>
              )}
              {giftDetails.giftMessage && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4 italic text-gray-700">
                  "{giftDetails.giftMessage}"
                </div>
              )}
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">Gift Code</p>
                <p className="text-2xl font-mono font-bold tracking-wider text-purple-600">
                  {giftDetails.giftCode}
                </p>
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                {giftDetails.tierName} Plan • Valid until {new Date(giftDetails.expiresAt!).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Share Options */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Your Gift
              </h3>
              
              <div className="space-y-3">
                {/* Copy Code */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={copyCode}
                >
                  <span className="font-mono">{giftDetails.giftCode}</span>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>

                {/* Copy Share Link */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={copyShareUrl}
                >
                  <span className="truncate text-sm">{giftDetails.shareUrl}</span>
                  <Copy className="w-4 h-4 flex-shrink-0 ml-2" />
                </Button>

                {/* Email */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={shareViaEmail}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Share via Email
                </Button>

                {/* WhatsApp */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `🎁 You've been gifted StoryVerse!\n\n` +
                      `${giftDetails.giftMessage ? `"${giftDetails.giftMessage}"\n\n` : ''}` +
                      `Gift Code: ${giftDetails.giftCode}\n\n` +
                      `Redeem here: ${giftDetails.shareUrl}`
                    );
                    window.open(`https://wa.me/?text=${text}`);
                  }}
                >
                  <span className="mr-2">💬</span>
                  Share via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <div className="mt-8 text-center text-gray-600">
            <p className="mb-4">
              A confirmation email has been sent to your email address.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/gift">
                <Button variant="outline">
                  <Gift className="w-4 h-4 mr-2" />
                  Buy Another Gift
                </Button>
              </Link>
              <Link href="/">
                <Button>
                  Go to Homepage
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
