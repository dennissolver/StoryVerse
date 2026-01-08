// File: src/app/(public)/gift/success/page.tsx

import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import SuccessClient from './success-client';

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
      <SuccessClient />
    </Suspense>
  );
}