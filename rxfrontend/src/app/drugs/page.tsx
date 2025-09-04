'use client';

import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading';
import DrugsPageContent from './drugs-page-content';

export default function DrugsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DrugsPageContent />
    </Suspense>
  );
}