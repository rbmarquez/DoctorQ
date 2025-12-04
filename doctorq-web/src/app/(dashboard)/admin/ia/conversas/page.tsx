/**
 * Conversas Page - Hybrid Server/Client Component
 *
 * @page Admin > IA > Conversas
 */

import { getConversas, getAgentes } from '@/lib/api/server';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { ConversasList } from './_components/ConversasList';

export const metadata = {
  title: 'Conversas | DoctorQ Admin',
  description: 'Histórico de conversas com agentes de IA',
};

interface ConversasPageProps {
  searchParams: {
    page?: string;
    id_agente?: string;
  };
}

export default async function ConversasPage({ searchParams }: ConversasPageProps) {
  const page = parseInt(searchParams.page || '1');
  const id_agente = searchParams.id_agente;

  const [conversasData, agentesData] = await Promise.all([
    getConversas({ page, size: 20, id_agente }),
    getAgentes({ page: 1, size: 100 }), // Todos agentes para filtro
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Conversas"
          description="Histórico e gerenciamento de conversas com agentes de IA"
        />

        <ConversasList
          initialConversas={conversasData.items}
          initialMeta={conversasData.meta}
          agentes={agentesData.items}
        />
      </div>
    </div>
  );
}
