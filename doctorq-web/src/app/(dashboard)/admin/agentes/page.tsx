/**
 * Página de listagem de agentes de IA (Server Component)
 */

import { PageHeader } from '@/components/shared/layout/PageHeader';
import { AgentesListComplete } from './_components/AgentesListComplete';

export const metadata = {
  title: 'Agentes de IA | DoctorQ Admin',
  description: 'Gerencie agentes de inteligência artificial',
};

export default function AgentesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Agentes de IA"
          description="Configure assistentes inteligentes para automação e atendimento"
        />

        <AgentesListComplete />
      </div>
    </div>
  );
}
