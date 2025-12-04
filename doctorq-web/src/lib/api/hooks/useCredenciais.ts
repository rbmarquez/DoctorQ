/**
 * Hook SWR para gerenciamento de Credenciais (criptografadas)
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

export interface Credencial {
  id_credencial: string;
  nm_credencial: string;
  ds_credencial: string | null;
  ds_tipo: string; // 'llm', 'database', 'api', 'redis', 'qdrant', etc.
  ds_provedor: string | null; // 'openai', 'azure', 'anthropic', 'postgres', etc.
  ds_valores: Record<string, any>; // Valores criptografados (nunca exibir senhas)
  st_ativo: 'S' | 'N';
  id_empresa: string | null;
  dt_criacao: string;
  dt_atualizacao: string;
  dt_ultimo_uso: string | null;
}

export interface CredenciaisResponse {
  items: Credencial[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface CredenciaisFiltros {
  search?: string;
  tipo?: string;
  provedor?: string;
  ativo?: 'S' | 'N';
  id_empresa?: string;
  page?: number;
  size?: number;
}

export interface CriarCredencialData {
  nm_credencial: string;
  ds_credencial?: string;
  ds_tipo: string;
  ds_provedor?: string;
  ds_valores: Record<string, any>;
  st_ativo?: 'S' | 'N';
  id_empresa?: string | null;
}

export interface AtualizarCredencialData {
  nm_credencial?: string;
  ds_credencial?: string;
  ds_valores?: Record<string, any>;
  st_ativo?: 'S' | 'N';
}

export interface TipoCredencial {
  tipo: string;
  label: string;
  provedores: string[];
  campos_requeridos: string[];
}

// ====================================================================
// HOOKS
// ====================================================================

export function useCredenciais(filtros: CredenciaisFiltros = {}) {
  const { search, tipo, provedor, ativo, id_empresa, page = 1, size = 10 } = filtros;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (tipo) params.append('tipo', tipo);
  if (provedor) params.append('provedor', provedor);
  if (ativo) params.append('ativo', ativo);
  if (id_empresa) params.append('id_empresa', id_empresa);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const key = `/api/credenciais/?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<CredenciaisResponse>(
    key,
    async () => {
      const response = await apiClient.get<CredenciaisResponse>(key);
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
    credenciais: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useCredencial(credencialId: string | null) {
  const shouldFetch = Boolean(credencialId);

  const { data, error, isLoading, mutate } = useSWR<Credencial>(
    shouldFetch ? `/credenciais/${credencialId}` : null,
    async () => {
      const response = await apiClient.get<Credencial>(`/credenciais/${credencialId}`);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    credencial: data,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para obter tipos de credenciais disponíveis
 */
export function useTiposCredenciais() {
  const { data, error, isLoading } = useSWR<TipoCredencial[]>(
    '/credenciais/types',
    async () => {
      const response = await apiClient.get<TipoCredencial[]>('/credenciais/types');
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  );

  return {
    tipos: data ?? [],
    isLoading,
    error,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

/**
 * IMPORTANTE: ds_valores deve conter campos sensíveis que serão criptografados no backend
 */
export async function criarCredencial(data: CriarCredencialData): Promise<Credencial> {
  const response = await apiClient.post<Credencial>('/credenciais/', data);
  return response;
}

export async function atualizarCredencial(
  credencialId: string,
  data: AtualizarCredencialData
): Promise<Credencial> {
  const response = await apiClient.put<Credencial>(`/credenciais/${credencialId}`, data);
  return response;
}

export async function deletarCredencial(credencialId: string): Promise<void> {
  await apiClient.delete(`/credenciais/${credencialId}`);
}

export async function toggleCredencialStatus(
  credencialId: string,
  ativo: 'S' | 'N'
): Promise<Credencial> {
  return atualizarCredencial(credencialId, { st_ativo: ativo });
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

export async function revalidarCredenciais(): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.startsWith('/credenciais/?'));
}

export async function revalidarCredencial(credencialId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate(`/credenciais/${credencialId}`);
}

// ====================================================================
// HELPERS
// ====================================================================

export function isCredencialAtiva(credencial: Credencial): boolean {
  return credencial.st_ativo === 'S';
}

export function getBadgeTipo(tipo: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    llm: { label: 'LLM', color: 'blue' },
    database: { label: 'Database', color: 'green' },
    api: { label: 'API', color: 'purple' },
    redis: { label: 'Redis', color: 'red' },
    qdrant: { label: 'Qdrant', color: 'orange' },
    embedding: { label: 'Embedding', color: 'pink' },
    oauth: { label: 'OAuth', color: 'indigo' },
  };

  return badges[tipo] || { label: tipo, color: 'gray' };
}

export function getBadgeProvedor(provedor: string | null): { label: string; color: string } {
  if (!provedor) return { label: 'N/A', color: 'gray' };

  const badges: Record<string, { label: string; color: string }> = {
    openai: { label: 'OpenAI', color: 'green' },
    azure: { label: 'Azure', color: 'blue' },
    anthropic: { label: 'Anthropic', color: 'orange' },
    google: { label: 'Google', color: 'red' },
    postgres: { label: 'PostgreSQL', color: 'blue' },
    mysql: { label: 'MySQL', color: 'orange' },
    mongodb: { label: 'MongoDB', color: 'green' },
    redis: { label: 'Redis', color: 'red' },
  };

  return badges[provedor] || { label: provedor, color: 'gray' };
}

/**
 * Mascara valores sensíveis para exibição
 */
export function mascarValue(value: string): string {
  if (!value || value.length <= 8) return '*'.repeat(8);
  return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
}

/**
 * Verifica se a credencial tem campo específico
 */
export function hasField(credencial: Credencial, field: string): boolean {
  return credencial.ds_valores && field in credencial.ds_valores;
}

/**
 * Formata data do último uso
 */
export function formatarUltimoUso(dataUltimoUso: string | null): string {
  if (!dataUltimoUso) return 'Nunca utilizada';

  const data = new Date(dataUltimoUso);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

  return data.toLocaleDateString('pt-BR');
}
