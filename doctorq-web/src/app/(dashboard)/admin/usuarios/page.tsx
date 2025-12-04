/**
 * Página de listagem de usuários (Server Component)
 */

import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { UsuariosTable } from './_components/UsuariosTable';

export const metadata = {
  title: 'Usuários | DoctorQ Admin',
  description: 'Gerencie os usuários cadastrados no sistema',
};

function UsuariosLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Usuários" description="Gerencie usuários e suas permissões" />

        <Suspense fallback={<UsuariosLoading />}>
          <UsuariosTable />
        </Suspense>
      </div>
    </div>
  );
}
