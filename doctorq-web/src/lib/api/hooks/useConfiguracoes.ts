/**
 * Hook SWR para gerenciamento de Configurações do Usuário
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

export interface Configuracao {
  id_configuracao: string;
  id_user: string;
  ds_categoria: string; // 'notificacoes', 'privacidade', 'aparencia', 'seguranca'
  ds_chave: string;
  ds_valor: any;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ConfiguracoesResponse {
  items: Configuracao[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ConfiguracoesMap {
  [categoria: string]: {
    [chave: string]: any;
  };
}

export interface AtualizarConfiguracaoData {
  ds_categoria: string;
  ds_chave: string;
  ds_valor: any;
}

// ====================================================================
// HOOKS
// ====================================================================

export function useConfiguracoes(userId: string | null, categoria?: string) {
  const shouldFetch = Boolean(userId);

  const params = new URLSearchParams();
  if (userId) params.append('id_user', userId);
  if (categoria) params.append('categoria', categoria);

  const key = shouldFetch ? `/configuracoes?${params.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR<ConfiguracoesResponse>(
    key,
    async () => {
      const response = await apiClient.get<ConfiguracoesResponse>(key!);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    configuracoes: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook que retorna configurações como um mapa organizado por categoria
 */
export function useConfiguracoesMap(userId: string | null): {
  configMap: ConfiguracoesMap;
  isLoading: boolean;
  error: any;
} {
  const { configuracoes, isLoading, error } = useConfiguracoes(userId);

  const configMap: ConfiguracoesMap = {};

  configuracoes.forEach((config) => {
    if (!configMap[config.ds_categoria]) {
      configMap[config.ds_categoria] = {};
    }
    configMap[config.ds_categoria][config.ds_chave] = config.ds_valor;
  });

  return { configMap, isLoading, error };
}

// ====================================================================
// MUTATIONS
// ====================================================================

export async function atualizarConfiguracao(
  userId: string,
  data: AtualizarConfiguracaoData
): Promise<Configuracao> {
  const response = await apiClient.put<Configuracao>(`/configuracoes/${userId}`, data);
  return response;
}

export async function atualizarConfiguracoesLote(
  userId: string,
  configuracoes: AtualizarConfiguracaoData[]
): Promise<Configuracao[]> {
  const response = await apiClient.put<Configuracao[]>(
    `/configuracoes/${userId}/batch`,
    { configuracoes }
  );
  return response;
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

export async function revalidarConfiguracoes(userId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.includes(`/configuracoes`) && key.includes(userId));
}

// ====================================================================
// HELPERS
// ====================================================================

export function getConfigValue(
  configMap: ConfiguracoesMap,
  categoria: string,
  chave: string,
  defaultValue: any = null
): any {
  return configMap[categoria]?.[chave] ?? defaultValue;
}

export function hasConfig(configMap: ConfiguracoesMap, categoria: string, chave: string): boolean {
  return Boolean(configMap[categoria]?.[chave] !== undefined);
}
