import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { PacientesTable } from './_components/PacientesTable';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Pacientes | DoctorQ',
  description: 'Gerencie seus pacientes',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Pegar id_empresa da sessão (ou usar um UUID válido como fallback para desenvolvimento)
  const id_empresa = session.user.id_empresa || '00000000-0000-0000-0000-000000000000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Pacientes" description="Gerencie seus pacientes" />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <PacientesTable id_empresa={id_empresa} />
        </Suspense>
      </div>
    </div>
  );
}
