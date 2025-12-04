'use client';

import { useState } from 'react';
import { useProntuarios } from '@/lib/api/hooks';
import { DataTable, type ColumnDef } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function ProntuariosTable({ id_profissional }: { id_profissional: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, meta, isLoading } = useProntuarios({ id_profissional, page, size: pageSize });

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'nm_paciente', header: 'Paciente', sortable: true },
    {
      accessorKey: 'nr_total_evolucoes',
      header: 'Evoluções',
      cell: (row) => <Badge variant="secondary">{row.nr_total_evolucoes}</Badge>,
    },
    {
      accessorKey: 'dt_criacao',
      header: 'Criado em',
      cell: (row) => new Date(row.dt_criacao).toLocaleDateString('pt-BR'),
    },
    {
      accessorKey: 'dt_atualizacao',
      header: 'Última Atualização',
      cell: (row) => new Date(row.dt_atualizacao).toLocaleDateString('pt-BR'),
    },
  ];

  const actions = [
    {
      label: 'Ver Prontuário',
      icon: Eye,
      onClick: (row: any) => toast.info('Funcionalidade em desenvolvimento'),
    },
    {
      label: 'Nova Evolução',
      icon: FileText,
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
