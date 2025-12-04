/**
 * Hook SWR para gerenciamento de Tools (Ferramentas de Agentes)
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

export interface Tool {
  id_tool: string;
  nm_tool: string;
  ds_tool: string | null;
  ds_tipo: string; // 'api', 'function', 'search', etc.
  ds_config: Record<string, any> | null;
  st_ativo: 'S' | 'N';
  id_empresa: string | null;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ToolsResponse {
  items: Tool[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ToolsFiltros {
  search?: string;
  tipo?: string;
  ativo?: 'S' | 'N';
  id_empresa?: string;
  page?: number;
  size?: number;
}

export interface CriarToolData {
  nm_tool: string;
  ds_tool?: string;
  ds_tipo: string;
  ds_config?: Record<string, any>;
  st_ativo?: 'S' | 'N';
  id_empresa?: string | null;
}

export interface AtualizarToolData {
  nm_tool?: string;
  ds_tool?: string;
  ds_tipo?: string;
  ds_config?: Record<string, any>;
  st_ativo?: 'S' | 'N';
}

export interface ExecutarToolData {
  tool_id: string;
  parametros: Record<string, any>;
}

export interface ExecutarToolResponse {
  sucesso: boolean;
  resultado: any;
  mensagem?: string;
}

// ====================================================================
// HOOKS
// ====================================================================

export function useTools(filtros: ToolsFiltros = {}) {
  const { search, tipo, ativo, id_empresa, page = 1, size = 10 } = filtros;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (tipo) params.append('tipo', tipo);
  if (ativo) params.append('ativo', ativo);
  if (id_empresa) params.append('id_empresa', id_empresa);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const key = `/api/tools/?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ToolsResponse>(
    key,
    async () => {
      const response = await apiClient.get<ToolsResponse>(key);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  return {
    tools: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useTool(toolId: string | null) {
  const shouldFetch = Boolean(toolId);

  const { data, error, isLoading, mutate } = useSWR<Tool>(
    shouldFetch ? `/tools/${toolId}` : null,
    async () => {
      const response = await apiClient.get<Tool>(`/tools/${toolId}`);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    tool: data,
    isLoading,
    error,
    mutate,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

export async function criarTool(data: CriarToolData): Promise<Tool> {
  const response = await apiClient.post<Tool>('/tools/', data);
  return response;
}

export async function atualizarTool(toolId: string, data: AtualizarToolData): Promise<Tool> {
  const response = await apiClient.put<Tool>(`/tools/${toolId}`, data);
  return response;
}

export async function deletarTool(toolId: string): Promise<void> {
  await apiClient.delete(`/tools/${toolId}`);
}

export async function executarTool(data: ExecutarToolData): Promise<ExecutarToolResponse> {
  const response = await apiClient.post<ExecutarToolResponse>('/tools/execute', data);
  return response;
}

export async function toggleToolStatus(toolId: string, ativo: 'S' | 'N'): Promise<Tool> {
  return atualizarTool(toolId, { st_ativo: ativo });
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

export async function revalidarTools(): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.startsWith('/tools/?'));
}

export async function revalidarTool(toolId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate(`/tools/${toolId}`);
}

// ====================================================================
// HELPERS
// ====================================================================

export function isToolAtivo(tool: Tool): boolean {
  return tool.st_ativo === 'S';
}

export function getBadgeTipo(tipo: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    api: { label: 'API', color: 'blue' },
    function: { label: 'Função', color: 'green' },
    search: { label: 'Busca', color: 'purple' },
    database: { label: 'Database', color: 'orange' },
    webhook: { label: 'Webhook', color: 'pink' },
  };

  return badges[tipo] || { label: tipo, color: 'gray' };
}
