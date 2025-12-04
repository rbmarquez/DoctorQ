/**
 * Componente de listagem de perfis (roles) com DataTable
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePerfis, useDeletePerfil } from '@/lib/api/hooks';
import { DataTable, type ColumnDef, type RowAction } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Plus, Search, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerfilFormDialog } from './PerfilFormDialog';
import type { Perfil } from '@/lib/api/hooks/gestao/usePerfis';
import { toast } from 'sonner';

/**
 * Componente de listagem de perfis
 */
export function PerfisTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // Perfis geralmente são poucos

  // Estado do dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [perfilEditando, setPerfilEditando] = useState<Perfil | undefined>();
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  const { data, meta, isLoading, error, mutate } = usePerfis({
    page,
    size: pageSize,
    busca: buscaDebounced,
  });

  const { trigger: deletarPerfil } = useDeletePerfil('');

  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1);
  };

  const handleNovoPerfil = () => {
    setPerfilEditando(undefined);
    setDialogOpen(true);
  };

  const handleEditarPerfil = (perfil: Perfil) => {
    setPerfilEditando(perfil);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setPerfilEditando(undefined);
    mutate();
    toast.success(perfilEditando ? 'Perfil atualizado com sucesso' : 'Perfil criado com sucesso');
  };

  const columns: ColumnDef<Perfil>[] = [
    {
      accessorKey: 'nm_perfil',
      header: 'Nome do Perfil',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-medium">{row.nm_perfil}</div>
            {row.ds_perfil && <div className="text-sm text-muted-foreground">{row.ds_perfil}</div>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissões',
      cell: (row) => {
        const permissionsCount = row.permissions?.length || 0;

        if (permissionsCount === 0) {
          return <Badge variant="outline" className="bg-gray-50">Nenhuma permissão</Badge>;
        }

        return (
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700">
              {permissionsCount} {permissionsCount === 1 ? 'permissão' : 'permissões'}
            </Badge>
            {row.permissions && row.permissions.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {row.permissions.slice(0, 3).map((perm, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {perm}
                  </Badge>
                ))}
                {row.permissions.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{row.permissions.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
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
    {
      accessorKey: 'dt_atualizacao',
      header: 'Atualizado em',
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.dt_atualizacao).toLocaleDateString('pt-BR')}
        </div>
      ),
    },
  ];

  const actions: RowAction<Perfil>[] = [
    {
      label: 'Visualizar',
      icon: Eye,
      onClick: (row) => router.push(`/admin/perfis/${row.id_perfil}`),
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: (row) => handleEditarPerfil(row),
    },
    {
      label: 'Deletar',
      icon: Trash2,
      variant: 'destructive',
      onClick: async (row) => {
        if (!confirm(`Deseja realmente deletar o perfil "${row.nm_perfil}"?`)) {
          return;
        }

        try {
          await deletarPerfil();
          toast.success('Perfil deletado com sucesso');
          mutate();
        } catch (error) {
          toast.error('Erro ao deletar perfil');
          console.error(error);
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Perfis e Permissões</CardTitle>
              <CardDescription>
                Configure papéis e suas permissões no sistema
              </CardDescription>
            </div>
            <Button onClick={handleNovoPerfil}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar perfil..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <DataTable
            data={data}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            emptyMessage={
              buscaDebounced
                ? `Nenhum perfil encontrado para "${buscaDebounced}"`
                : 'Nenhum perfil cadastrado. Clique em "Novo Perfil" para começar.'
            }
          />
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <Pagination
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50]}
        />
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-600">Erro ao carregar perfis: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Formulário */}
      <PerfilFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        perfil={perfilEditando}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
