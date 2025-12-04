/**
 * Componente de listagem de usuários com DataTable
 *
 * Demonstra o uso de:
 * - useUsuarios hook
 * - DataTable genérico
 * - Pagination
 * - Filtros por papel e empresa
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUsuarios, useDeleteUsuario } from '@/lib/api/hooks';
import { DataTable, type ColumnDef, type RowAction } from '@/components/shared/data-table/DataTable';
import { UsuarioFormDialog } from './UsuarioFormDialog';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Usuario } from '@/lib/api/hooks/gestao/useUsuarios';
import { toast } from 'sonner';

/**
 * Componente de listagem de usuários
 */
export function UsuariosTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [papelFiltro, setPapelFiltro] = useState<string>('all');

  // Estado do dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | undefined>();

  // Hook de listagem
  const { data, meta, isLoading, error, mutate } = useUsuarios({
    page,
    size: pageSize,
    busca: buscaDebounced,
    nm_papel: papelFiltro !== 'all' ? papelFiltro : undefined,
  });

  // Hook de deleção
  const { trigger: deletarUsuario } = useDeleteUsuario('');

  // Busca
  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1);
  };

  // Definição das colunas
  const columns: ColumnDef<Usuario>[] = [
    {
      accessorKey: 'ds_foto_url',
      header: '',
      cell: (row) => {
        const iniciais = row.nm_completo
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.ds_foto_url} alt={row.nm_completo} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-semibold">
              {iniciais}
            </AvatarFallback>
          </Avatar>
        );
      },
      className: 'w-[60px]',
    },
    {
      accessorKey: 'nm_completo',
      header: 'Nome',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.nm_completo}</div>
          <div className="text-sm text-muted-foreground">{row.nm_email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'nm_perfil',
      header: 'Perfil',
      cell: (row) => {
        const perfilColors: Record<string, string> = {
          'Administrador': 'bg-red-100 text-red-700',
          'admin': 'bg-red-100 text-red-700',
          'Gestor de Clínica': 'bg-blue-100 text-blue-700',
          'gestor_clinica': 'bg-blue-100 text-blue-700',
          'Profissional': 'bg-purple-100 text-purple-700',
          'profissional': 'bg-purple-100 text-purple-700',
          'Recepcionista': 'bg-green-100 text-green-700',
          'recepcionista': 'bg-green-100 text-green-700',
          'Paciente': 'bg-gray-100 text-gray-700',
          'paciente': 'bg-gray-100 text-gray-700',
          'Financeiro': 'bg-yellow-100 text-yellow-700',
          'financeiro': 'bg-yellow-100 text-yellow-700',
        };

        // Usa nm_perfil (do join com tb_perfis) ou nm_papel como fallback
        const perfilNome = row.nm_perfil || row.nm_papel || 'Não definido';
        const color = perfilColors[perfilNome] || 'bg-gray-100 text-gray-700';

        return <Badge className={color}>{perfilNome}</Badge>;
      },
    },
    {
      accessorKey: 'nr_total_logins',
      header: 'Logins',
      cell: (row) => (
        <div className="text-center">
          <span className="font-medium">{row.nr_total_logins || 0}</span>
        </div>
      ),
      className: 'text-center',
    },
    {
      accessorKey: 'dt_ultimo_login',
      header: 'Último Login',
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {row.dt_ultimo_login
            ? new Date(row.dt_ultimo_login).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Nunca'}
        </div>
      ),
    },
    {
      accessorKey: 'dt_criacao',
      header: 'Criado em',
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.dt_criacao).toLocaleDateString('pt-BR')}
        </div>
      ),
    },
  ];

  // Handlers
  const handleNovoUsuario = () => {
    setUsuarioEditando(undefined);
    setDialogOpen(true);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    mutate();
    setDialogOpen(false);
  };

  // Ações por linha
  const actions: RowAction<Usuario>[] = [
    {
      label: 'Visualizar',
      icon: Eye,
      onClick: (row) => router.push(`/admin/usuarios/${row.id_user}`),
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: (row) => handleEditarUsuario(row),
    },
    {
      label: 'Deletar',
      icon: Trash2,
      variant: 'destructive',
      onClick: async (row) => {
        if (!confirm(`Deseja realmente deletar o usuário "${row.nm_completo}"?`)) {
          return;
        }

        try {
          await deletarUsuario();
          toast.success('Usuário deletado com sucesso');
          mutate();
        } catch (error) {
          toast.error('Erro ao deletar usuário');
          console.error(error);
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>Gerencie os usuários cadastrados no sistema</CardDescription>
            </div>
            <Button onClick={handleNovoUsuario}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={papelFiltro} onValueChange={setPapelFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os papéis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gestor_clinica">Gestor</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
                <SelectItem value="recepcionista">Recepcionista</SelectItem>
                <SelectItem value="paciente">Paciente</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="secondary">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <DataTable
            data={data}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            emptyMessage={
              buscaDebounced || papelFiltro !== 'all'
                ? 'Nenhum usuário encontrado com os filtros aplicados'
                : 'Nenhum usuário cadastrado. Clique em "Novo Usuário" para começar.'
            }
          />
        </CardContent>
      </Card>

      {/* Paginação */}
      {meta.totalPages > 1 && (
        <Pagination
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}

      {/* Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-600">Erro ao carregar usuários: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Formulário */}
      <UsuarioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuario={usuarioEditando}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
