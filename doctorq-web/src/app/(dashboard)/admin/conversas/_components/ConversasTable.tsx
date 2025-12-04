/**
 * Tabela de conversas de IA
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConversas, useDeleteConversa } from '@/lib/api/hooks';
import { DataTable, type ColumnDef, type RowAction } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Search, MessageSquare, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Conversa } from '@/lib/api/hooks/ia/useConversas';
import { toast } from 'sonner';

export function ConversasTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  const { data, meta, isLoading, error, mutate } = useConversas({
    page,
    size: pageSize,
    busca: buscaDebounced,
  });

  const { trigger: deletarConversa } = useDeleteConversa('');

  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1);
  };

  const columns: ColumnDef<Conversa>[] = [
    {
      accessorKey: 'titulo',
      header: 'Conversa',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="max-w-md">
            <div className="font-medium truncate">{row.titulo || `Conversa #${row.id_conversa.slice(0, 8)}`}</div>
            {row.nm_agente && <div className="text-sm text-muted-foreground">Agente: {row.nm_agente}</div>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'nr_mensagens',
      header: 'Mensagens',
      cell: (row) => (
        <div className="text-center">
          <Badge className="bg-blue-100 text-blue-700">{row.nr_mensagens || 0}</Badge>
        </div>
      ),
      className: 'text-center',
    },
    {
      accessorKey: 'nm_usuario',
      header: 'Usuário',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{row.nm_usuario || 'Anônimo'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'dt_criacao',
      header: 'Iniciada em',
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.dt_criacao).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
    {
      accessorKey: 'dt_ultima_mensagem',
      header: 'Última atividade',
      cell: (row) => (
        <div className="text-sm text-muted-foreground">
          {row.dt_ultima_mensagem
            ? new Date(row.dt_ultima_mensagem).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-'}
        </div>
      ),
    },
  ];

  const actions: RowAction<Conversa>[] = [
    {
      label: 'Ver mensagens',
      icon: Eye,
      onClick: (row) => router.push(`/admin/conversas/${row.id_conversa}`),
    },
    {
      label: 'Deletar',
      icon: Trash2,
      variant: 'destructive',
      onClick: async (row) => {
        if (!confirm('Deseja realmente deletar esta conversa?')) return;
        try {
          await deletarConversa();
          toast.success('Conversa deletada');
          mutate();
        } catch (error) {
          toast.error('Erro ao deletar');
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Conversas</CardTitle>
              <CardDescription>Histórico de conversas com agentes de IA</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar conversa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
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
            emptyMessage="Nenhuma conversa encontrada"
          />
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[10, 25, 50, 100]} />
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-600">Erro: {error.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
