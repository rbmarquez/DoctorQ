/**
 * Hooks SWR para Procedimentos
 */

import useSWR from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================
export interface Procedimento {
  id_procedimento: string;
  nm_procedimento: string;
  ds_procedimento: string;
  vl_preco_base: number;
  vl_preco_minimo: number;
  vl_preco_maximo: number;
  nr_duracao_minutos: number;
  ds_categoria: string;
  ds_subcategoria: string;
  ds_foto_principal: string;
  qt_fotos: number;
  nr_media_avaliacoes: number;
  qt_total_avaliacoes: number;
  qt_clinicas_oferecem: number;
  fg_disponivel_online: boolean;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ProcedimentoDetalhado extends Procedimento {
  ds_preparacao?: string;
  ds_recuperacao?: string;
  ds_resultados_esperados?: string;
  ds_contraindicacoes?: string;
  ds_efeitos_colaterais?: string;
  fotos?: Array<{
    id_foto: string;
    ds_url: string;
    ds_descricao?: string;
    fg_principal: boolean;
    nr_ordem: number;
  }>;
  avaliacoes?: Array<{
    id_avaliacao: string;
    id_user: string;
    nm_user: string;
    nr_nota: number;
    ds_comentario: string;
    dt_criacao: string;
  }>;
}

export interface Categoria {
  ds_categoria: string;
  qt_procedimentos: number;
  subcategorias?: Array<{
    ds_subcategoria: string;
    qt_procedimentos: number;
  }>;
}

export interface ProcedimentosFilters {
  search?: string;
  categoria?: string;
  subcategoria?: string;
  preco_min?: number;
  preco_max?: number;
  duracao_max?: number;
  clinica_id?: string;
  disponivel_online?: boolean;
  ordenacao?: "relevancia" | "preco_asc" | "preco_desc" | "duracao" | "nome";
  page?: number;
  size?: number;
}

/**
 * Hook para listar procedimentos com filtros
 */
export interface ProcedimentosResponse {
  items: Procedimento[];
  meta?: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export function useProcedimentos(filters?: ProcedimentosFilters) {
  const { data, error, isLoading } = useSWR<ProcedimentosResponse>(
    [endpoints.procedimentos.list, filters],
    async () => {
      const response = await apiClient.get(endpoints.procedimentos.list, { params: filters });

      if (response && Array.isArray((response as any).items)) {
        return response as ProcedimentosResponse;
      }

      if (Array.isArray(response)) {
        return {
          items: response,
          meta: {
            totalItems: response.length,
            itemsPerPage: filters?.size ?? response.length,
            totalPages: filters?.size ? Math.ceil(response.length / (filters.size || 1)) : 1,
            currentPage: filters?.page ?? 1,
          },
        };
      }

      return { items: [] };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    procedimentos: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter detalhes de um procedimento específico
 */
export function useProcedimento(procedimentoId: string | null) {
  const { data, error, isLoading } = useSWR<ProcedimentoDetalhado>(
    procedimentoId ? endpoints.procedimentos.get(procedimentoId) : null,
    () => (procedimentoId ? apiClient.get(endpoints.procedimentos.get(procedimentoId)) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  );

  return {
    procedimento: data,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter categorias de procedimentos
 */
export function useCategorias() {
  const { data, error, isLoading } = useSWR<Categoria[]>(
    endpoints.procedimentos.categorias,
    () => apiClient.get(endpoints.procedimentos.categorias),
    {
      revalidateOnFocus: false,
      dedupingInterval: 600000, // 10 minutos
    }
  );

  return {
    categorias: data || [],
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para comparar procedimentos similares
 */
export function useProcedimentosComparacao(nomeProcedimento: string | null) {
  const { data, error, isLoading } = useSWR<Procedimento[]>(
    nomeProcedimento ? endpoints.procedimentos.comparar(nomeProcedimento) : null,
    () => (nomeProcedimento ? apiClient.get(endpoints.procedimentos.comparar(nomeProcedimento)) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  );

  return {
    procedimentosSimilares: data || [],
    isLoading,
    isError: error,
    error,
  };
}
