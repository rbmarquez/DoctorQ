'use client';

import { useState } from 'react';
import { useProcedimentos } from '@/lib/api/hooks';
import { DataTable, type ColumnDef } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProcedimentosTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, meta, isLoading } = useProcedimentos({ page, size: pageSize });

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'nm_procedimento', header: 'Procedimento', sortable: true },
    { accessorKey: 'nm_categoria', header: 'Categoria', cell: (row) => <Badge>{row.nm_categoria || 'Sem categoria'}</Badge> },
    { accessorKey: 'vl_preco', header: 'Preço', cell: (row) => `R$ ${row.vl_preco.toFixed(2)}` },
    { accessorKey: 'nr_duracao_minutos', header: 'Duração', cell: (row) => `${row.nr_duracao_minutos || '-'} min` },
    {
      accessorKey: 'fl_ativo',
      header: 'Status',
      cell: (row) => <Badge variant={row.fl_ativo ? 'default' : 'secondary'}>{row.fl_ativo ? 'Ativo' : 'Inativo'}</Badge>,
    },
  ];

  const actions = [
    {
      label: 'Editar',
      icon: Edit,
      onClick: (row: any) => toast.info('Funcionalidade em desenvolvimento'),
    },
    {
      label: 'Excluir',
      icon: Trash2,
      onClick: (row: any) => toast.info('Funcionalidade em desenvolvimento'),
      variant: 'destructive' as const,
    },
  ];

  return (
    <>
      <DataTable data={data} columns={columns} actions={actions} isLoading={isLoading} />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
