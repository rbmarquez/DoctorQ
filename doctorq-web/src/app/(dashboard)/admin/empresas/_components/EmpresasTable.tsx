/**
 * Componente de listagem de empresas com DataTable genérico
 *
 * Demonstra o uso de:
 * - useEmpresas hook
 * - DataTable genérico
 * - Pagination
 * - Filtros e ações
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmpresas, useDeleteEmpresa } from '@/lib/api/hooks';
import { DataTable, type ColumnDef, type RowAction } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { EmpresaFormDialog } from './EmpresaFormDialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Empresa } from '@/lib/api/hooks/gestao/useEmpresas';
import { toast } from 'sonner';

/**
 * Componente de listagem de empresas
 */
export function EmpresasTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  // Estado do dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | undefined>();

  // Hook de listagem
  const { data, meta, isLoading, error, mutate } = useEmpresas({
    page,
    size: pageSize,
    busca: buscaDebounced,
  });

  // Hook de deleção
  const { trigger: deletarEmpresa, isMutating: isDeleting } = useDeleteEmpresa('');

  // Debounce de busca (simplificado)
  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1); // Resetar para primeira página
  };

  // Definição das colunas
  const columns: ColumnDef<Empresa>[] = [
    {
      accessorKey: 'nm_razao_social',
      header: 'Razão Social',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">{row.nm_razao_social}</div>
      ),
    },
    {
      accessorKey: 'nm_fantasia',
      header: 'Nome Fantasia',
      cell: (row) => (
        <div className="text-muted-foreground">{row.nm_fantasia || '-'}</div>
      ),
    },
    {
      accessorKey: 'nr_cnpj',
      header: 'CNPJ',
      cell: (row) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
          {row.nr_cnpj || '-'}
        </code>
      ),
    },
    {
      accessorKey: 'nm_plano',
      header: 'Plano',
      cell: (row) => {
        const planoColors: Record<string, string> = {
          free: 'bg-gray-100 text-gray-700',
          basic: 'bg-blue-100 text-blue-700',
          professional: 'bg-purple-100 text-purple-700',
          enterprise: 'bg-amber-100 text-amber-700',
        };

        const color = planoColors[row.nm_plano || 'free'] || planoColors.free;

        return (
          <Badge className={color}>
            {row.nm_plano || 'free'}
          </Badge>
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
  ];

  // Handlers
  const handleNovaEmpresa = () => {
    setEmpresaEditando(undefined);
    setDialogOpen(true);
  };

  const handleEditarEmpresa = (empresa: Empresa) => {
    setEmpresaEditando(empresa);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    mutate(); // Revalidar lista
    setDialogOpen(false);
  };

  // Ações por linha
  const actions: RowAction<Empresa>[] = [
    {
      label: 'Visualizar',
      icon: Eye,
      onClick: (row) => router.push(`/admin/empresas/${row.id_empresa}`),
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: (row) => handleEditarEmpresa(row),
    },
    {
      label: 'Deletar',
      icon: Trash2,
      variant: 'destructive',
      onClick: async (row) => {
        if (!confirm(`Deseja realmente deletar a empresa "${row.nm_razao_social}"?`)) {
          return;
        }

        try {
          await deletarEmpresa();
          toast.success('Empresa deletada com sucesso');
          mutate(); // Revalidar lista
        } catch (error) {
          toast.error('Erro ao deletar empresa');
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
              <CardTitle>Empresas</CardTitle>
              <CardDescription>Gerencie as empresas cadastradas no sistema</CardDescription>
            </div>
            <Button onClick={handleNovaEmpresa}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por razão social, CNPJ..."
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

      {/* Tabela */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <DataTable
            data={data}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            emptyMessage={
              buscaDebounced
                ? `Nenhuma empresa encontrada para "${buscaDebounced}"`
                : 'Nenhuma empresa cadastrada. Clique em "Nova Empresa" para começar.'
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
            <p className="text-sm text-red-600">
              Erro ao carregar empresas: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Formulário */}
      <EmpresaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        empresa={empresaEditando}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
