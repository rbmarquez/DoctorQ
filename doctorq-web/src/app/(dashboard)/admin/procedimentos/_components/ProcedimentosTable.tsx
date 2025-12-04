'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProcedimentos, useDeleteProcedimento } from '@/lib/api/hooks';
import { DataTable, type ColumnDef, type RowAction } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Procedimento } from '@/lib/api/hooks/clinica/useProcedimentos';
import { toast } from 'sonner';
import { ProcedimentoFormDialog } from './ProcedimentoFormDialog';

export function ProcedimentosTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Estado do dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [procedimentoEditando, setProcedimentoEditando] = useState<Procedimento | undefined>();
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  const { data, meta, isLoading, error, mutate } = useProcedimentos({ page, size: pageSize, busca: buscaDebounced });
  const { trigger: deletar } = useDeleteProcedimento('');

  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1);
  };

  const handleNovoProcedimento = () => {
    setProcedimentoEditando(undefined);
    setDialogOpen(true);
  };

  const handleEditarProcedimento = (procedimento: Procedimento) => {
    setProcedimentoEditando(procedimento);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setProcedimentoEditando(undefined);
    mutate();
    toast.success(procedimentoEditando ? 'Procedimento atualizado com sucesso' : 'Procedimento criado com sucesso');
  };

  const columns: ColumnDef<Procedimento>[] = [
    {
      accessorKey: 'nm_procedimento',
      header: 'Procedimento',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.nm_procedimento}</div>
          {row.ds_procedimento && <div className="text-sm text-muted-foreground line-clamp-1">{row.ds_procedimento}</div>}
        </div>
      ),
    },
    {
      accessorKey: 'nm_categoria',
      header: 'Categoria',
      cell: (row) => row.nm_categoria ? <Badge variant="outline">{row.nm_categoria}</Badge> : <span className="text-muted-foreground">-</span>,
    },
    {
      accessorKey: 'vl_preco',
      header: 'Preço',
      cell: (row) => <span className="font-semibold">R$ {row.vl_preco.toFixed(2)}</span>,
    },
    {
      accessorKey: 'nr_duracao_minutos',
      header: 'Duração',
      cell: (row) => row.nr_duracao_minutos ? `${row.nr_duracao_minutos} min` : '-',
    },
    {
      accessorKey: 'fl_ativo',
      header: 'Status',
      cell: (row) => (
        <Badge className={row.fl_ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
          {row.fl_ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions: RowAction<Procedimento>[] = [
    { label: 'Visualizar', icon: Eye, onClick: (row) => router.push(`/admin/procedimentos/${row.id_procedimento}`) },
    { label: 'Editar', icon: Edit, onClick: (row) => handleEditarProcedimento(row) },
    {
      label: 'Deletar',
      icon: Trash2,
      variant: 'destructive',
      onClick: async (row) => {
        if (!confirm(`Deletar "${row.nm_procedimento}"?`)) return;
        try {
          await deletar();
          toast.success('Procedimento deletado');
          mutate();
        } catch { toast.error('Erro ao deletar'); }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Procedimentos</CardTitle>
              <CardDescription>Catálogo de procedimentos estéticos</CardDescription>
            </div>
            <Button onClick={handleNovoProcedimento}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Procedimento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setBuscaDebounced(busca)} />
            <Button onClick={() => setBuscaDebounced(busca)} variant="secondary">
              <Search className="mr-2 h-4 w-4" />Buscar
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <DataTable data={data} columns={columns} actions={actions} isLoading={isLoading} emptyMessage="Nenhum procedimento" />
        </CardContent>
      </Card>
      {meta.totalPages > 1 && <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-600">Erro: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Formulário */}
      <ProcedimentoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        procedimento={procedimentoEditando}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
