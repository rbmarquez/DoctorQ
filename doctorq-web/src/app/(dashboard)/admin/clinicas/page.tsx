import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { ClinicasTable } from './_components/ClinicasTable';

export const metadata = { title: 'Clínicas | DoctorQ Admin' };

export default function ClinicasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Clínicas" description="Gerencie unidades e locais de atendimento" />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ClinicasTable />
        </Suspense>
      </div>
    </div>
  );
}
