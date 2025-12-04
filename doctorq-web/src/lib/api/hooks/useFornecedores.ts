/**
 * Hooks SWR para Fornecedores
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface Fornecedor {
  id_fornecedor: string;
  nm_fornecedor: string;
  ds_fornecedor?: string;
  ds_logo_url?: string;
  nm_email?: string;
  ds_telefone?: string;
  nr_cnpj?: string;
  ds_endereco?: string;
  ds_cidade?: string;
  ds_estado?: string;
  nr_cep?: string;
  qt_produtos?: number;
  qt_vendas?: number;
  vl_nota_media?: number;
  fl_ativo: boolean;
  dt_criacao?: string;
}

export interface FornecedorListResponse {
  items: Fornecedor[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface FornecedorStats {
  qt_produtos: number;
  qt_vendas: number;
  vl_total_vendas: number;
  vl_nota_media: number;
  qt_avaliacoes: number;
}

export interface FornecedoresFiltros {
  page?: number;
  size?: number;
  search?: string;
  fl_ativo?: boolean;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar fornecedores com filtros e paginação
 */
export function useFornecedores(filtros?: FornecedoresFiltros) {
  const { data, error, isLoading } = useSWR<FornecedorListResponse>(
    [endpoints.fornecedores.list, filtros],
    () => apiClient.get(endpoints.fornecedores.list, { params: filtros }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    fornecedores: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter detalhes de um fornecedor específico
 */
export function useFornecedor(id: string | null) {
  const { data, error, isLoading } = useSWR<Fornecedor>(
    id ? [endpoints.fornecedores.get(id)] : null,
    () => (id ? apiClient.get(endpoints.fornecedores.get(id)) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    fornecedor: data,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter estatísticas de um fornecedor
 */
export function useFornecedorStats(id: string | null) {
  const { data, error, isLoading } = useSWR<FornecedorStats>(
    id ? [endpoints.fornecedores.stats(id)] : null,
    () => (id ? apiClient.get(endpoints.fornecedores.stats(id)) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Criar novo fornecedor
 */
export async function criarFornecedor(data: Partial<Fornecedor>) {
  const fornecedor = await apiClient.post<Fornecedor>(endpoints.fornecedores.create, data);

  // Revalidar lista de fornecedores
  mutate((key) => Array.isArray(key) && key[0] === endpoints.fornecedores.list);

  return fornecedor;
}

/**
 * Atualizar fornecedor existente
 */
export async function atualizarFornecedor(id: string, data: Partial<Fornecedor>) {
  const fornecedor = await apiClient.put<Fornecedor>(endpoints.fornecedores.update(id), data);

  // Revalidar fornecedor específico e listas
  mutate(endpoints.fornecedores.get(id));
  mutate((key) => Array.isArray(key) && key[0] === endpoints.fornecedores.list);

  return fornecedor;
}

/**
 * Deletar (desativar) fornecedor
 */
export async function deletarFornecedor(id: string) {
  await apiClient.delete(endpoints.fornecedores.delete(id));

  // Revalidar listas
  mutate((key) => Array.isArray(key) && key[0] === endpoints.fornecedores.list);
}

/**
 * Helper para revalidar fornecedores
 */
export function revalidarFornecedores(filtros?: FornecedoresFiltros) {
  if (filtros) {
    mutate([endpoints.fornecedores.list, filtros]);
  } else {
    mutate((key) => Array.isArray(key) && key[0] === endpoints.fornecedores.list);
  }
}
