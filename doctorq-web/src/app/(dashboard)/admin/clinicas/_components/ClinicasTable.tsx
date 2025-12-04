'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClinicas, useDeleteClinica } from '@/lib/api/hooks';
import { DataTable, type ColumnDef, type RowAction } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Plus, Search, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Clinica } from '@/lib/api/hooks/gestao/useClinicas';
import { toast } from 'sonner';
import { ClinicaFormDialog } from './ClinicaFormDialog';

export function ClinicasTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  // Estado do dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clinicaEditando, setClinicaEditando] = useState<Clinica | undefined>();

  const { data, meta, isLoading, error, mutate } = useClinicas({ page, size: pageSize, busca: buscaDebounced });
  const { trigger: deletar } = useDeleteClinica('');

  // Handlers
  const handleNovaClinica = () => {
    setClinicaEditando(undefined);
    setDialogOpen(true);
  };

  const handleEditarClinica = (clinica: Clinica) => {
    setClinicaEditando(clinica);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    mutate();
    setDialogOpen(false);
  };


  const columns: ColumnDef<Clinica>[] = [
    {
      accessorKey: 'nm_clinica',
      header: 'Clínica',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-medium">{row.nm_clinica}</div>
            {row.ds_endereco && <div className="text-sm text-muted-foreground line-clamp-1">{row.ds_endereco}</div>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'nr_telefone',
      header: 'Telefone',
      cell: (row) => row.nr_telefone || '-',
    },
    {
      accessorKey: 'nm_email',
      header: 'Email',
      cell: (row) => row.nm_email || '-',
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
    {
      accessorKey: 'dt_criacao',
      header: 'Criado em',
      cell: (row) => new Date(row.dt_criacao).toLocaleDateString('pt-BR'),
    },
  ];

  const actions: RowAction<Clinica>[] = [
    { label: 'Visualizar', icon: Eye, onClick: (row) => router.push(`/admin/clinicas/${row.id_clinica}`) },
    { label: 'Editar', icon: Edit, onClick: (row) => handleEditarClinica(row) },
    {
      label: 'Deletar',
      icon: Trash2,
      variant: 'destructive',
      onClick: async (row) => {
        if (!confirm(`Deletar "${row.nm_clinica}"?`)) return;
        try {
          await deletar();
          toast.success('Clínica deletada');
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
              <CardTitle>Clínicas</CardTitle>
              <CardDescription>Gerencie unidades e locais de atendimento</CardDescription>
            </div>
            <Button onClick={handleNovaClinica}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Clínica
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
          <DataTable data={data} columns={columns} actions={actions} isLoading={isLoading} emptyMessage="Nenhuma clínica" />
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
      <ClinicaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clinica={clinicaEditando}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
