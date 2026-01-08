// File: src/app/(public)/gift/redeem/page.tsx

import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import RedeemClient from './redeem-client';

export default function RedeemPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
      <RedeemClient />
    </Suspense>
  );
}