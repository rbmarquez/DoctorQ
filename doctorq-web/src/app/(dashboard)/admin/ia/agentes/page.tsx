/**
 * Agentes IA Page - Hybrid Server/Client Component
 *
 * Server Component para data fetching inicial,
 * Client Component para filtros e interatividade.
 *
 * @page Admin > IA > Agentes
 */

import { getAgentes } from '@/lib/api/server';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { AgentesList } from './_components/AgentesList';

export const metadata = {
  title: 'Agentes de IA | DoctorQ Admin',
  description: 'Gerenciamento de agentes de inteligência artificial',
};

interface AgentesPageProps {
  searchParams: {
    page?: string;
    busca?: string;
    status?: 'ativo' | 'inativo';
  };
}

/**
 * Server Component - Faz fetch inicial dos dados
 */
export default async function AgentesPage({ searchParams }: AgentesPageProps) {
  const page = parseInt(searchParams.page || '1');
  const busca = searchParams.busca || '';
  const status = searchParams.status;

  // Fetch agentes
  const { items: agentes, meta } = await getAgentes({
    page,
    size: 20,
    busca,
    status,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Agentes de IA"
          description="Configure e gerencie agentes de inteligência artificial para atendimento e automações"
          action={{
            label: 'Novo Agente',
            href: '/admin/ia/agentes/novo',
          }}
        />

        {/* Client Component para interatividade */}
        <AgentesList initialAgentes={agentes} initialMeta={meta} />
      </div>
    </div>
  );
}
