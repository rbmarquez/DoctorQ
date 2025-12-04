import { PageHeader } from '@/components/shared/layout/PageHeader';
import { ToolsListComplete } from './_components/ToolsListComplete';

export const metadata = {
  title: 'Tools | DoctorQ Admin',
  description: 'Gerencie ferramentas de automação do sistema',
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Tools & Integrações"
          description="Gerencie ferramentas disponíveis para agentes de IA"
        />

        <ToolsListComplete />
      </div>
    </div>
  );
}
