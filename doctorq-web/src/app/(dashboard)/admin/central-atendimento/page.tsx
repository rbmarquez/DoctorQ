'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CentralAtendimentoLayout } from './_components/CentralAtendimentoLayout';

export const dynamic = 'force-dynamic';

export default function CentralAtendimentoPage() {
  return (
    <div className="h-[calc(100vh-64px)] bg-gray-100">
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <CentralAtendimentoLayout />
      </Suspense>
    </div>
  );
}
