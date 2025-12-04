/**
 * AgentesList Component - Client Component
 *
 * Gerencia filtros, busca e exibição de agentes de IA.
 */

'use client';

import { useState } from 'react';
import {
  Bot,
  Search,
  MessageSquare,
  Settings,
  Zap,
  Brain,
  Eye,
  Edit,
  Trash,
  Copy,
  Power,
  MoreVertical,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/shared/navigation/Pagination';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import { SearchInput } from '@/components/shared/forms/SearchInput';
import type { Agente } from '@/lib/api/server';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AgentesListProps {
  initialAgentes: Agente[];
  initialMeta: {
    total: number;
    page: number;
    size: number;
    pages: number;
  };
}

export function AgentesList({ initialAgentes, initialMeta }: AgentesListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrar localmente
  const filtered = initialAgentes.filter((agente) => {
    const matchSearch =
      !search ||
      agente.nm_agente?.toLowerCase().includes(search.toLowerCase()) ||
      agente.ds_prompt?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ativo' && agente.fl_ativo) ||
      (statusFilter === 'inativo' && !agente.fl_ativo);

    return matchSearch && matchStatus;
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    if (search) params.set('busca', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    router.push(`/admin/ia/agentes?${params.toString()}`);
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set('busca', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    router.push(`/admin/ia/agentes?${params.toString()}`);
  };

  const getModelName = (config: any): string => {
    try {
      const configObj = typeof config === 'string' ? JSON.parse(config) : config;
      return configObj?.model?.model_name || 'GPT-4';
    } catch {
      return 'GPT-4';
    }
  };

  const getToolsCount = (config: any): number => {
    try {
      const configObj = typeof config === 'string' ? JSON.parse(config) : config;
      return configObj?.tools?.length || 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar agentes por nome ou descrição..."
                onSearch={handleApplyFilters}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply Filters Button */}
          {(search || statusFilter !== 'all') && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleApplyFilters}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Exibindo <span className="font-semibold">{filtered.length}</span> de{' '}
          <span className="font-semibold">{initialMeta.total}</span> agentes
        </p>
      </div>

      {/* Agentes Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Nenhum agente encontrado"
          description={
            search || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro agente de IA'
          }
          action={
            !search && statusFilter === 'all'
              ? {
                  label: 'Novo Agente',
                  href: '/admin/ia/agentes/novo',
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((agente) => {
            const modelName = getModelName(agente.ds_config);
            const toolsCount = getToolsCount(agente.ds_config);

            return (
              <Card
                key={agente.id_agente}
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden"
              >
                {/* Header with gradient */}
                <div className="h-2 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500" />

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-gray-900 truncate">
                          {agente.nm_agente}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={agente.fl_ativo ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {agente.fl_ativo ? (
                              <>
                                <Power className="w-3 h-3 mr-1" />
                                Ativo
                              </>
                            ) : (
                              'Inativo'
                            )}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {modelName}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/ia/agentes/${agente.id_agente}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/chat?agente=${agente.id_agente}`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Testar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Prompt Preview */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-700">System Prompt:</p>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {agente.ds_prompt || 'Sem prompt configurado'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                      <Brain className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs font-semibold text-blue-900">{toolsCount}</p>
                      <p className="text-xs text-blue-600">Tools</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                      <MessageSquare className="w-4 h-4 mx-auto mb-1 text-green-600" />
                      <p className="text-xs font-semibold text-green-900">0</p>
                      <p className="text-xs text-green-600">Conversas</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                      <Zap className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                      <p className="text-xs font-semibold text-purple-900">0</p>
                      <p className="text-xs text-purple-600">Msgs</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/admin/ia/agentes/${agente.id_agente}`}>
                        <Settings className="w-3 h-3 mr-1" />
                        Configurar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      asChild
                    >
                      <Link href={`/admin/chat?agente=${agente.id_agente}`}>
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Testar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {initialMeta.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={initialMeta.page}
            totalPages={initialMeta.pages}
            totalItems={initialMeta.total}
            pageSize={initialMeta.size}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
