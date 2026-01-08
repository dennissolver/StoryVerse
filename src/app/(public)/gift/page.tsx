'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Heart, Sparkles, Calendar, Mail, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99.99,
    booksPerMonth: 3,
    description: 'Perfect for one special child',
    popular: false,
  },
  {
    id: 'family',
    name: 'Family',
    price: 199.99,
    booksPerMonth: 8,
    description: 'Ideal for siblings & cousins',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 349.99,
    booksPerMonth: 20,
    description: 'For story-loving families',
    popular: false,
  },
];

const OCCASIONS = [
  { id: 'birthday', label: '🎂 Birthday', emoji: '🎂' },
  { id: 'christmas', label: '🎄 Christmas', emoji: '🎄' },
  { id: 'holiday', label: '🎁 Holiday', emoji: '🎁' },
  { id: 'just_because', label: '💝 Just Because', emoji: '💝' },
  { id: 'baby_shower', label: '👶 New Baby', emoji: '👶' },
  { id: 'graduation', label: '🎓 Graduation', emoji: '🎓' },
];

export default function GiftPage() {
  const [selectedTier, setSelectedTier] = useState<string>('family');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [giftDetails, setGiftDetails] = useState({
    recipientName: '',
    recipientEmail: '',
    giftMessage: '',
    occasion: 'birthday',
    sendToRecipient: false,
    sendDate: '',
    purchaserName: '',
    purchaserEmail: '',
  });

  const selectedTierInfo = TIERS.find(t => t.id === selectedTier);

  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/gift/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          ...giftDetails,
        }),
      });

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating gift icons */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              initial={{ y: '100vh', x: Math.random() * 100 + '%' }}
              animate={{ 
                y: '-10vh',
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                delay: i * 2,
                ease: 'linear',
              }}
            >
              {['🎁', '📚', '✨', '🌟', '💝', '🎀'][i]}
            </motion.div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block mb-6"
          >
            <span className="text-6xl">🎁</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Give the Gift of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Personalized Stories</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A year of magical adventures featuring the children you love. 
            The perfect gift for birthdays, holidays, or just because.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step >= s 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 transition-colors ${
                  step > s ? 'bg-purple-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Plan */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-center mb-8">
              Choose a Gift Plan
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {TIERS.map((tier) => (
                <Card 
                  key={tier.id}
                  className={`relative cursor-pointer transition-all hover:scale-105 ${
                    selectedTier === tier.id 
                      ? 'ring-2 ring-purple-600 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      ${tier.price}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">for 12 months</p>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    <div className="text-sm text-gray-500">
                      {tier.booksPerMonth} books/month
                    </div>
                    {selectedTier === tier.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => setStep(2)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Continue
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Personalize */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-center mb-8">
              Personalize Your Gift
            </h2>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6 space-y-6">
                {/* Occasion */}
                <div>
                  <label className="block text-sm font-medium mb-3">What's the occasion?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OCCASIONS.map((occ) => (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={() => setGiftDetails(d => ({ ...d, occasion: occ.id }))}
                        className={`p-3 rounded-lg text-center transition-all ${
                          giftDetails.occasion === occ.id
                            ? 'bg-purple-100 ring-2 ring-purple-600'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{occ.emoji}</span>
                        <span className="text-xs">{occ.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Gift className="w-4 h-4 inline mr-2" />
                    Who is this gift for?
                  </label>
                  <input
                    type="text"
                    placeholder="Recipient's name (e.g., Emma & Liam)"
                    value={giftDetails.recipientName}
                    onChange={(e) => setGiftDetails(d => ({ ...d, recipientName: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                {/* Gift Message */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Add a personal message (optional)
                  </label>
                  <textarea
                    placeholder="Write a heartfelt message that will be included with the gift..."
                    rows={3}
                    value={giftDetails.giftMessage}
                    onChange={(e) => setGiftDetails(d => ({ ...d, giftMessage: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none resize-none"
                  />
                </div>

                {/* Send Options */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftDetails.sendToRecipient}
                      onChange={(e) => setGiftDetails(d => ({ ...d, sendToRecipient: e.target.checked }))}
                      className="mt-1 w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-medium">Send directly to recipient</span>
                      <p className="text-sm text-gray-600">
                        We'll email the gift code directly to them on your behalf
                      </p>
                    </div>
                  </label>

                  {giftDetails.sendToRecipient && (
                    <div className="mt-4 space-y-4 pl-8">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Recipient's email
                        </label>
                        <input
                          type="email"
                          placeholder="recipient@example.com"
                          value={giftDetails.recipientEmail}
                          onChange={(e) => setGiftDetails(d => ({ ...d, recipientEmail: e.target.value }))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          When should we send it?
                        </label>
                        <input
                          type="date"
                          value={giftDetails.sendDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setGiftDetails(d => ({ ...d, sendDate: e.target.value }))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to send immediately after purchase
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4 mt-8">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Continue
                <Heart className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Your Details & Checkout */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-center mb-8">
              Complete Your Purchase
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Your Details */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Your Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Your name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={giftDetails.purchaserName}
                      onChange={(e) => setGiftDetails(d => ({ ...d, purchaserName: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Your email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={giftDetails.purchaserEmail}
                      onChange={(e) => setGiftDetails(d => ({ ...d, purchaserEmail: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send the gift code here if not sending directly to recipient
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gift Subscription</span>
                      <span className="font-medium">{selectedTierInfo?.name} Plan</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">12 months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">For</span>
                      <span className="font-medium">{giftDetails.recipientName || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Occasion</span>
                      <span className="font-medium">
                        {OCCASIONS.find(o => o.id === giftDetails.occasion)?.label}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-purple-600">${selectedTierInfo?.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      One-time payment • No auto-renewal
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={isLoading || !giftDetails.purchaserEmail}
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <Gift className="w-5 h-5 mr-2" />
                        Purchase Gift - ${selectedTierInfo?.price}
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Secure checkout powered by Stripe
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>
          </motion.div>
        )}

        {/* Trust Signals */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Code never expires (1 year to redeem)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Instant email delivery
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Full refund if unredeemed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
