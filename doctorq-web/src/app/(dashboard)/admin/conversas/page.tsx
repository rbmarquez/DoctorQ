import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversasTable } from './_components/ConversasTable';

// Forçar renderização dinâmica para evitar erro de prerender
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Conversas | DoctorQ Admin',
  description: 'Histórico de conversas com agentes de IA',
};

export default function ConversasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Conversas" description="Histórico de interações com agentes de IA" />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ConversasTable />
        </Suspense>
      </div>
    </div>
  );
}
