'use client';

import { useState } from 'react';
import { useAvaliacoes, useCreateResposta } from '@/lib/api/hooks';
import { DataTable, type ColumnDef } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function AvaliacoesTable({ id_profissional }: { id_profissional: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, meta, isLoading, mutate } = useAvaliacoes({ id_profissional, page, size: pageSize });

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'nm_user', header: 'Paciente', sortable: true },
    {
      accessorKey: 'nr_nota',
      header: 'Nota',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{row.nr_nota}</span>
        </div>
      ),
    },
    { accessorKey: 'ds_titulo', header: 'Título', cell: (row) => row.ds_titulo || '-' },
    {
      accessorKey: 'fl_recomenda',
      header: 'Recomenda',
      cell: (row) => (
        <Badge variant={row.fl_recomenda ? 'default' : 'secondary'}>
          {row.fl_recomenda ? 'Sim' : 'Não'}
        </Badge>
      ),
    },
    {
      accessorKey: 'fl_verificada',
      header: 'Verificada',
      cell: (row) => row.fl_verificada && <Badge variant="outline">Verificada</Badge>,
    },
    {
      accessorKey: 'dt_avaliacao',
      header: 'Data',
      cell: (row) => new Date(row.dt_avaliacao).toLocaleDateString('pt-BR'),
    },
  ];

  const actions = [
    {
      label: 'Responder',
      icon: MessageSquare,
      onClick: (row: any) => toast.info('Funcionalidade em desenvolvimento'),
    },
  ];

  return (
    <>
      <DataTable data={data} columns={columns} actions={actions} isLoading={isLoading} />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />}
    </>
  );
}
