'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface GiftCodeDetails {
  valid: boolean;
  tier?: string;
  tierName?: string;
  durationMonths?: number;
  recipientName?: string;
  giftMessage?: string;
  occasion?: string;
  expiresAt?: string;
  error?: string;
  status?: string;
}

interface RedemptionResult {
  success: boolean;
  message?: string;
  tier?: string;
  tierName?: string;
  durationMonths?: number;
  validUntil?: string;
  error?: string;
  requiresAuth?: boolean;
}

const OCCASION_EMOJIS: Record<string, string> = {
  birthday: '🎂',
  christmas: '🎄',
  holiday: '🎁',
  just_because: '💝',
  baby_shower: '👶',
  graduation: '🎓',
};

export default function RedeemGiftPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codeFromUrl = searchParams.get('code');
  
  const [code, setCode] = useState(codeFromUrl || '');
  const [giftDetails, setGiftDetails] = useState<GiftCodeDetails | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Auto-check code from URL
  useEffect(() => {
    if (codeFromUrl) {
      checkGiftCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const checkGiftCode = async (giftCode: string) => {
    if (!giftCode.trim()) return;
    
    setChecking(true);
    setGiftDetails(null);
    
    try {
      const response = await fetch(`/api/gift/redeem?code=${encodeURIComponent(giftCode.trim())}`);
      const data = await response.json();
      setGiftDetails(data);
    } catch (error) {
      setGiftDetails({ valid: false, error: 'Failed to check gift code' });
    } finally {
      setChecking(false);
    }
  };

  const redeemGiftCode = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/gift/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      
      const data = await response.json();
      
      if (data.requiresAuth) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/gift/redeem?code=${encodeURIComponent(code)}&message=Please sign in to redeem your gift`);
        return;
      }
      
      setRedemptionResult(data);
    } catch (error) {
      setRedemptionResult({ success: false, error: 'Failed to redeem gift code' });
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (redemptionResult?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <span className="text-8xl">🎉</span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-3"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold mb-4">{redemptionResult.message}</h1>
            
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan</span>
                    <span className="font-semibold">{redemptionResult.tierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold">{redemptionResult.durationMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active until</span>
                    <span className="font-semibold">
                      {new Date(redemptionResult.validUntil!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
                Start Creating Stories
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 py-16 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.span
            initial={{ rotate: -10 }}
            animate={{ rotate: 10 }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
            className="text-6xl inline-block mb-4"
          >
            🎁
          </motion.span>
          <h1 className="text-3xl font-bold mb-2">Redeem Your Gift</h1>
          <p className="text-gray-600">
            Enter your gift code to unlock a year of magical stories
          </p>
        </div>

        {/* Code Input */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <label className="block text-sm font-medium mb-2">Gift Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="STORY-XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 border rounded-lg font-mono text-center text-lg tracking-wider focus:ring-2 focus:ring-purple-600 focus:outline-none"
                maxLength={19}
              />
              <Button 
                variant="outline"
                onClick={() => checkGiftCode(code)}
                disabled={checking || !code.trim()}
              >
                {checking ? '...' : 'Check'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gift Details (if valid) */}
        {giftDetails?.valid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white text-center">
                <span className="text-3xl mr-2">
                  {OCCASION_EMOJIS[giftDetails.occasion || 'just_because']}
                </span>
                <span className="text-xl font-semibold">
                  {giftDetails.tierName} Plan
                </span>
              </div>
              <CardContent className="p-6">
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
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Duration: {giftDetails.durationMonths} months</span>
                  <span>Expires: {new Date(giftDetails.expiresAt!).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
              onClick={redeemGiftCode}
              disabled={loading}
            >
              {loading ? (
                'Redeeming...'
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Redeem Gift
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Invalid Code Message */}
        {giftDetails && !giftDetails.valid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">
                    {giftDetails.status === 'redeemed' 
                      ? 'Already Redeemed' 
                      : giftDetails.status === 'expired'
                      ? 'Code Expired'
                      : 'Invalid Code'}
                  </h3>
                  <p className="text-red-700 text-sm">
                    {giftDetails.error}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Redemption Error */}
        {redemptionResult && !redemptionResult.success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-200 bg-red-50 mt-4">
              <CardContent className="p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">
                    Redemption Failed
                  </h3>
                  <p className="text-red-700 text-sm">
                    {redemptionResult.error}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p className="mb-2">Don't have an account yet?</p>
          <Link href={`/signup?redirect=/gift/redeem${code ? `?code=${code}` : ''}`}>
            <Button variant="link" className="text-purple-600">
              Create a free account to redeem your gift
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
