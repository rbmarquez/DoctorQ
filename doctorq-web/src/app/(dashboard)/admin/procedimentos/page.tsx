import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcedimentosTable } from './_components/ProcedimentosTable';

export const metadata = { title: 'Procedimentos | DoctorQ Admin' };

export default function ProcedimentosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Procedimentos" description="Catálogo de procedimentos estéticos" />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ProcedimentosTable />
        </Suspense>
      </div>
    </div>
  );
}
