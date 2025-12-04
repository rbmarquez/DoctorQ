/**
 * Usuários Page - Hybrid Server/Client Component
 *
 * Server Component para data fetching inicial,
 * Client Component para filtros e interatividade.
 *
 * @page Admin > Gestão > Usuários
 */

import { getUsuarios, getPerfis } from '@/lib/api/server';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { UsuariosList } from './_components/UsuariosList';

export const metadata = {
  title: 'Usuários | DoctorQ Admin',
  description: 'Gerenciamento de usuários do sistema',
};

interface UsuariosPageProps {
  searchParams: {
    page?: string;
    busca?: string;
    papel?: string;
    status?: 'ativo' | 'inativo';
  };
}

/**
 * Server Component - Faz fetch inicial dos dados
 */
export default async function UsuariosPage({ searchParams }: UsuariosPageProps) {
  const page = parseInt(searchParams.page || '1');
  const busca = searchParams.busca || '';
  const papel = searchParams.papel;
  const status = searchParams.status;

  // Fetch paralelo de usuários e perfis
  const [usuariosData, perfisData] = await Promise.all([
    getUsuarios({
      page,
      size: 20,
      busca,
      papel,
      status,
    }),
    getPerfis({ page: 1, size: 50 }), // Todos os perfis para filtro
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Usuários"
          description="Gerencie usuários e permissões do sistema"
          action={{
            label: 'Novo Usuário',
            href: '/admin/gestao/usuarios/novo',
          }}
        />

        {/* Client Component para interatividade */}
        <UsuariosList
          initialUsuarios={usuariosData.items}
          initialMeta={usuariosData.meta}
          perfis={perfisData.items}
        />
      </div>
    </div>
  );
}
