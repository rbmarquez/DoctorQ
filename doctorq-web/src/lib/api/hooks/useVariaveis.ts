/**
 * Hook SWR para gerenciamento de Variáveis do Sistema
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

export interface Variavel {
  id_variavel: string;
  nm_variavel: string;
  ds_variavel: string | null;
  vl_variavel: string;
  ds_tipo: string; // 'string', 'number', 'boolean', 'json', etc.
  st_ativo: 'S' | 'N';
  id_empresa: string | null;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface VariaveisResponse {
  items: Variavel[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface VariaveisFiltros {
  search?: string;
  tipo?: string;
  ativo?: 'S' | 'N';
  id_empresa?: string;
  page?: number;
  size?: number;
}

export interface CriarVariavelData {
  nm_variavel: string;
  ds_variavel?: string;
  vl_variavel: string;
  ds_tipo: string;
  st_ativo?: 'S' | 'N';
  id_empresa?: string | null;
}

export interface AtualizarVariavelData {
  nm_variavel?: string;
  ds_variavel?: string;
  vl_variavel?: string;
  ds_tipo?: string;
  st_ativo?: 'S' | 'N';
}

// ====================================================================
// HOOKS
// ====================================================================

export function useVariaveis(filtros: VariaveisFiltros = {}) {
  const { search, tipo, ativo, id_empresa, page = 1, size = 10 } = filtros;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (tipo) params.append('tipo', tipo);
  if (ativo) params.append('ativo', ativo);
  if (id_empresa) params.append('id_empresa', id_empresa);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const key = `/variaveis/?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<VariaveisResponse>(
    key,
    async () => {
      const response = await apiClient.get<VariaveisResponse>(key);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    variaveis: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useVariavel(variavelId: string | null) {
  const shouldFetch = Boolean(variavelId);

  const { data, error, isLoading, mutate } = useSWR<Variavel>(
    shouldFetch ? `/variaveis/${variavelId}` : null,
    async () => {
      const response = await apiClient.get<Variavel>(`/variaveis/${variavelId}`);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    variavel: data,
    isLoading,
    error,
    mutate,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

export async function criarVariavel(data: CriarVariavelData): Promise<Variavel> {
  const response = await apiClient.post<Variavel>('/variaveis/', data);
  return response;
}

export async function atualizarVariavel(
  variavelId: string,
  data: AtualizarVariavelData
): Promise<Variavel> {
  const response = await apiClient.put<Variavel>(`/variaveis/${variavelId}`, data);
  return response;
}

export async function deletarVariavel(variavelId: string): Promise<void> {
  await apiClient.delete(`/variaveis/${variavelId}`);
}

export async function toggleVariavelStatus(
  variavelId: string,
  ativo: 'S' | 'N'
): Promise<Variavel> {
  return atualizarVariavel(variavelId, { st_ativo: ativo });
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

export async function revalidarVariaveis(): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.startsWith('/variaveis/?'));
}

export async function revalidarVariavel(variavelId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate(`/variaveis/${variavelId}`);
}

// ====================================================================
// HELPERS
// ====================================================================

export function isVariavelAtiva(variavel: Variavel): boolean {
  return variavel.st_ativo === 'S';
}

export function getBadgeTipo(tipo: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    string: { label: 'String', color: 'blue' },
    number: { label: 'Número', color: 'green' },
    boolean: { label: 'Booleano', color: 'purple' },
    json: { label: 'JSON', color: 'orange' },
    date: { label: 'Data', color: 'pink' },
    url: { label: 'URL', color: 'indigo' },
  };

  return badges[tipo] || { label: tipo, color: 'gray' };
}

/**
 * Formata o valor da variável para exibição
 */
export function formatarValor(variavel: Variavel): string {
  if (!variavel.vl_variavel) return 'N/A';

  switch (variavel.ds_tipo) {
    case 'boolean':
      return variavel.vl_variavel === 'true' || variavel.vl_variavel === '1' ? 'Sim' : 'Não';
    case 'json':
      try {
        return JSON.stringify(JSON.parse(variavel.vl_variavel), null, 2);
      } catch {
        return variavel.vl_variavel;
      }
    case 'date':
      try {
        return new Date(variavel.vl_variavel).toLocaleDateString('pt-BR');
      } catch {
        return variavel.vl_variavel;
      }
    default:
      return variavel.vl_variavel;
  }
}

/**
 * Valida o valor baseado no tipo
 */
export function validarValor(valor: string, tipo: string): boolean {
  switch (tipo) {
    case 'number':
      return !isNaN(Number(valor));
    case 'boolean':
      return ['true', 'false', '1', '0'].includes(valor.toLowerCase());
    case 'json':
      try {
        JSON.parse(valor);
        return true;
      } catch {
        return false;
      }
    case 'url':
      try {
        new URL(valor);
        return true;
      } catch {
        return false;
      }
    default:
      return true; // string sempre válido
  }
}
