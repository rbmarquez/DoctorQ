/**
 * Componente de listagem de agentes de IA com DataTable
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAgentes, useDeleteAgente } from '@/lib/api/hooks';
import { DataTable, type ColumnDef, type RowAction } from '@/components/shared/data-table/DataTable';
import { Pagination } from '@/components/shared/data-table/Pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Plus, Search, Bot, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AgenteFormDialog } from './AgenteFormDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Agente } from '@/lib/api/hooks/ia/useAgentes';
import { toast } from 'sonner';

/**
 * Componente de listagem de agentes
 */
export function AgentesTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Estado do dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [agenteEditando, setAgenteEditando] = useState<Agente | undefined>();
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('all');

  const { data, meta, isLoading, error, mutate } = useAgentes({
    page,
    size: pageSize,
    busca: buscaDebounced,
    tipo_agente: tipoFiltro !== 'all' ? tipoFiltro : undefined,
  });

  const { trigger: deletarAgente } = useDeleteAgente('');

  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1);
  };

  const handleNovoAgente = () => {
    setAgenteEditando(undefined);
    setDialogOpen(true);
  };

  const handleEditarAgente = (agente: Agente) => {
    setAgenteEditando(agente);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setAgenteEditando(undefined);
    mutate();
    toast.success(agenteEditando ? 'Agente atualizado com sucesso' : 'Agente criado com sucesso');
  };

  const columns: ColumnDef<Agente>[] = [
    {
      accessorKey: 'nm_agente',
      header: 'Nome do Agente',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-medium">{row.nm_agente}</div>
            {row.ds_agente && (
              <div className="text-sm text-muted-foreground line-clamp-1">{row.ds_agente}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tipo_agente',
      header: 'Tipo',
      cell: (row) => {
        const tipoColors: Record<string, string> = {
          chatbot: 'bg-blue-100 text-blue-700',
          assistant: 'bg-purple-100 text-purple-700',
          analyzer: 'bg-green-100 text-green-700',
          workflow: 'bg-orange-100 text-orange-700',
          creative: 'bg-blue-100 text-blue-700',
        };

        const tipoLabels: Record<string, string> = {
          chatbot: 'Chatbot',
          assistant: 'Assistente',
          analyzer: 'Analisador',
          workflow: 'Workflow',
          creative: 'Criativo',
        };

        const color = tipoColors[row.tipo_agente] || tipoColors.chatbot;
        const label = tipoLabels[row.tipo_agente] || row.tipo_agente;

        return <Badge className={color}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'modelo_llm',
      header: 'Modelo',
      cell: (row) => {
        const modeloShort = row.modelo_llm?.split('/').pop() || row.modelo_llm || 'N/A';
        return (
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{modeloShort}</code>
        );
      },
    },
    {
      accessorKey: 'fl_ativo',
      header: 'Status',
      cell: (row) => {
        if (row.fl_ativo) {
          return (
            <Badge className="bg-green-100 text-green-700">
              <span className="mr-1">●</span> Ativo
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="bg-gray-100">
            <span className="mr-1">○</span> Inativo
          </Badge>
        );
      },
    },
    {
      accessorKey: 'nr_conversas',
      header: 'Conversas',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.nr_conversas || 0}</span>
        </div>
      ),
      className: 'text-center',
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

  const actions: RowAction<Agente>[] = [
    {
      label: 'Testar',
      icon: MessageSquare,
      onClick: (row) => router.push(`/admin/agentes/${row.id_agente}/chat`),
    },
    {
      label: 'Visualizar',
      icon: Eye,
      onClick: (row) => router.push(`/admin/agentes/${row.id_agente}`),
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: (row) => handleEditarAgente(row),
    },
    {
      label: 'Deletar',
      icon: Trash2,
      variant: 'destructive',
      onClick: async (row) => {
        if (!confirm(`Deseja realmente deletar o agente "${row.nm_agente}"?`)) {
          return;
        }

        try {
          await deletarAgente();
          toast.success('Agente deletado com sucesso');
          mutate();
        } catch (error) {
          toast.error('Erro ao deletar agente');
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
              <CardTitle>Agentes de IA</CardTitle>
              <CardDescription>Configure e gerencie assistentes inteligentes</CardDescription>
            </div>
            <Button onClick={handleNovoAgente}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar agente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="chatbot">Chatbot</SelectItem>
                <SelectItem value="assistant">Assistente</SelectItem>
                <SelectItem value="analyzer">Analisador</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="creative">Criativo</SelectItem>
              </SelectContent>
            </Select>
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
              buscaDebounced || tipoFiltro !== 'all'
                ? 'Nenhum agente encontrado com os filtros aplicados'
                : 'Nenhum agente cadastrado. Clique em "Novo Agente" para começar.'
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
            <p className="text-sm text-red-600">Erro ao carregar agentes: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Formulário */}
      <AgenteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agente={agenteEditando}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
