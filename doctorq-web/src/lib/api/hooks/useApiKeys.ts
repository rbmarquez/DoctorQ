/**
 * Hook SWR para gerenciamento de API Keys
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

export interface ApiKey {
  id_apikey: string;
  nm_apikey: string;
  ds_apikey: string | null;
  cd_key: string; // Exibido apenas na criação
  cd_key_prefix: string; // Primeiros caracteres para identificação
  st_ativo: 'S' | 'N';
  id_user: string;
  id_empresa: string | null;
  dt_expiracao: string | null;
  dt_ultimo_uso: string | null;
  nr_total_requisicoes: number;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ApiKeysResponse {
  items: ApiKey[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ApiKeysFiltros {
  search?: string;
  ativo?: 'S' | 'N';
  id_user?: string;
  id_empresa?: string;
  page?: number;
  size?: number;
}

export interface CriarApiKeyData {
  nm_apikey: string;
  ds_apikey?: string;
  dt_expiracao?: string | null;
  st_ativo?: 'S' | 'N';
}

export interface AtualizarApiKeyData {
  nm_apikey?: string;
  ds_apikey?: string;
  st_ativo?: 'S' | 'N';
  dt_expiracao?: string | null;
}

export interface CriarApiKeyResponse extends ApiKey {
  cd_key: string; // Key completa, exibida apenas uma vez
}

// ====================================================================
// HOOKS
// ====================================================================

export function useApiKeys(filtros: ApiKeysFiltros = {}) {
  const { search, ativo, id_user, id_empresa, page = 1, size = 10 } = filtros;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (ativo) params.append('ativo', ativo);
  if (id_user) params.append('id_user', id_user);
  if (id_empresa) params.append('id_empresa', id_empresa);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const key = `/apikeys/?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ApiKeysResponse>(
    key,
    async () => {
      const response = await apiClient.get<ApiKeysResponse>(key);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    apiKeys: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useApiKey(apiKeyId: string | null) {
  const shouldFetch = Boolean(apiKeyId);

  const { data, error, isLoading, mutate } = useSWR<ApiKey>(
    shouldFetch ? `/apikeys/${apiKeyId}` : null,
    async () => {
      const response = await apiClient.get<ApiKey>(`/apikeys/${apiKeyId}`);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    apiKey: data,
    isLoading,
    error,
    mutate,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

/**
 * Cria uma nova API key
 * IMPORTANTE: A key completa é retornada apenas uma vez na criação
 */
export async function criarApiKey(data: CriarApiKeyData): Promise<CriarApiKeyResponse> {
  const response = await apiClient.post<CriarApiKeyResponse>('/apikeys/', data);
  return response;
}

export async function atualizarApiKey(
  apiKeyId: string,
  data: AtualizarApiKeyData
): Promise<ApiKey> {
  const response = await apiClient.put<ApiKey>(`/apikeys/${apiKeyId}`, data);
  return response;
}

export async function deletarApiKey(apiKeyId: string): Promise<void> {
  await apiClient.delete(`/apikeys/${apiKeyId}`);
}

export async function toggleApiKeyStatus(
  apiKeyId: string,
  ativo: 'S' | 'N'
): Promise<ApiKey> {
  return atualizarApiKey(apiKeyId, { st_ativo: ativo });
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

export async function revalidarApiKeys(): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.startsWith('/apikeys/?'));
}

export async function revalidarApiKey(apiKeyId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate(`/apikeys/${apiKeyId}`);
}

// ====================================================================
// HELPERS
// ====================================================================

export function isApiKeyAtiva(apiKey: ApiKey): boolean {
  return apiKey.st_ativo === 'S';
}

export function isApiKeyExpirada(apiKey: ApiKey): boolean {
  if (!apiKey.dt_expiracao) return false;
  return new Date(apiKey.dt_expiracao) < new Date();
}

export function isApiKeyValida(apiKey: ApiKey): boolean {
  return isApiKeyAtiva(apiKey) && !isApiKeyExpirada(apiKey);
}

export function formatarDataExpiracao(dataExpiracao: string | null): string {
  if (!dataExpiracao) return 'Sem expiração';
  const data = new Date(dataExpiracao);
  return data.toLocaleDateString('pt-BR');
}

export function getBadgeStatus(apiKey: ApiKey): { label: string; color: string } {
  if (!isApiKeyAtiva(apiKey)) {
    return { label: 'Inativa', color: 'gray' };
  }
  if (isApiKeyExpirada(apiKey)) {
    return { label: 'Expirada', color: 'red' };
  }
  return { label: 'Ativa', color: 'green' };
}

/**
 * Mascara a key para exibição segura (mostra apenas o prefixo)
 */
export function mascararKey(key: string, prefix?: string): string {
  if (prefix) {
    return `${prefix}${'*'.repeat(32)}`;
  }
  // Se não tiver prefix, mostra os primeiros 8 e últimos 4 caracteres
  if (key.length <= 12) return key;
  return `${key.substring(0, 8)}${'*'.repeat(key.length - 12)}${key.substring(key.length - 4)}`;
}
