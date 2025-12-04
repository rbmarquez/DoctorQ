/**
 * Empresas Page - Hybrid Server/Client Component
 *
 * A página inicial é Server Component para data fetching,
 * mas delega interatividade (search, CRUD) para Client Components.
 *
 * @page Admin > Gestão > Empresas
 */

import { getEmpresas } from '@/lib/api/server';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { EmpresasList } from './_components/EmpresasList';

export const metadata = {
  title: 'Empresas | DoctorQ Admin',
  description: 'Gerenciamento de empresas cadastradas no sistema',
};

interface EmpresasPageProps {
  searchParams: {
    page?: string;
    busca?: string;
  };
}

/**
 * Server Component - Faz fetch inicial dos dados
 */
export default async function EmpresasPage({ searchParams }: EmpresasPageProps) {
  const page = parseInt(searchParams.page || '1');
  const busca = searchParams.busca || '';

  // ✅ Fetch no servidor
  const { items: empresas, meta } = await getEmpresas({
    page,
    size: 20,
    busca,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Empresas"
          description="Gerencie empresas e clínicas cadastradas no sistema"
          action={{
            label: 'Nova Empresa',
            href: '/admin/gestao/empresas/nova',
          }}
        />

        {/* Client Component para interatividade */}
        <EmpresasList initialEmpresas={empresas} initialMeta={meta} />
      </div>
    </div>
  );
}
