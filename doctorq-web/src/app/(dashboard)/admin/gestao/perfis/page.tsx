import { getPerfis } from '@/lib/api/server';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { PerfisList } from './_components/PerfisList';

export const metadata = { title: 'Perfis | DoctorQ Admin', description: 'Gerenciamento de perfis e permissões' };

export default async function PerfisPage({ searchParams }: { searchParams: { page?: string } }) {
  const { items, meta } = await getPerfis({ page: parseInt(searchParams.page || '1'), size: 20 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Perfis de Usuário" description="Configure roles e permissões do sistema" action={{ label: 'Novo Perfil', href: '/admin/gestao/perfis/novo' }} />
        <PerfisList initialPerfis={items} initialMeta={meta} />
      </div>
    </div>
  );
}
