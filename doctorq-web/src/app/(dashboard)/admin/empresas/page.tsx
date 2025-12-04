/**
 * Página de listagem de empresas (Server Component)
 *
 * Implementa o padrão:
 * - Server Component na página (async)
 * - Client Component para interatividade (EmpresasTable)
 * - Usa novos hooks padronizados
 * - DataTable genérico reutilizável
 */

import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { EmpresasTable } from './_components/EmpresasTable';

export const metadata = {
  title: 'Empresas | DoctorQ Admin',
  description: 'Gerencie as empresas cadastradas no sistema',
};

/**
 * Loading skeleton para a tabela
 */
function EmpresasLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

/**
 * Página de Empresas (Server Component)
 */
export default function EmpresasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Empresas"
          description="Gerencie empresas e organizações do sistema"
        />

        <Suspense fallback={<EmpresasLoading />}>
          <EmpresasTable />
        </Suspense>
      </div>
    </div>
  );
}
