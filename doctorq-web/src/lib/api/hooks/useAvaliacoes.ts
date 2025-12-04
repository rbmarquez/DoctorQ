/**
 * Hooks SWR para Avaliações
 */

import type { Key } from 'swr';
import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';

// ============================================================================
// TIPOS
// ============================================================================

export interface Avaliacao {
  id_avaliacao: string;
  id_paciente: string;
  id_profissional?: string;
  id_clinica?: string;
  id_agendamento?: string;
  id_procedimento?: string;
  nr_nota: number;
  ds_comentario: string;
  nr_atendimento?: number;
  nr_instalacoes?: number;
  nr_pontualidade?: number;
  nr_resultado?: number;
  st_recomenda?: boolean;
  ds_resposta?: string;
  dt_resposta?: string;
  st_aprovada: boolean;
  st_visivel: boolean;
  st_verificada: boolean;
  ds_fotos?: string[];
  nr_likes: number;
  nr_nao_util: number;
  ds_badge?: string;
  dt_criacao: string;
  dt_atualizacao: string;
  // Dados relacionados
  nm_profissional?: string;
  nm_procedimento?: string;
  nm_clinica?: string;
  nm_user?: string;
  nm_paciente?: string;
  st_verificado?: boolean;
  st_verificada?: boolean;
}

export interface AvaliacaoListMeta {
  totalItems?: number;
  itemsPerPage?: number;
  totalPages?: number;
  currentPage?: number;
}

export interface AvaliacaoListResponse {
  items?: Avaliacao[];
  meta?: AvaliacaoListMeta;
  // Campos legados suportados para compatibilidade
  avaliacoes?: Avaliacao[];
  total?: number;
  page?: number;
  size?: number;
  total_pages?: number;
}

export interface AvaliacoesFiltros {
  id_paciente?: string;
  id_profissional?: string;
  id_procedimento?: string;
  id_clinica?: string;
  st_verificada?: boolean;
  st_aprovada?: boolean;
  nr_nota?: number;
  busca?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
}

export interface CriarAvaliacaoData {
  id_paciente: string;
  id_profissional?: string;
  id_procedimento?: string;
  id_clinica?: string;
  id_agendamento?: string;
  nr_nota: number;
  ds_comentario: string;
  nr_atendimento?: number;
  nr_instalacoes?: number;
  nr_pontualidade?: number;
  nr_resultado?: number;
  st_recomenda?: boolean;
  ds_fotos?: string[];
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar avaliações com filtros
 */
export function useAvaliacoes(filtros?: AvaliacoesFiltros) {
  const { data, error, isLoading, mutate: swrMutate } = useSWR<AvaliacaoListResponse>(
    filtros ? ['/avaliacoes', filtros] : null,
    () => apiClient.get('/avaliacoes', { params: filtros }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  const avaliacoes = data?.items ?? data?.avaliacoes ?? [];
  const meta: AvaliacaoListMeta = {
    totalItems: data?.meta?.totalItems ?? data?.total ?? avaliacoes.length,
    itemsPerPage: data?.meta?.itemsPerPage ?? data?.size ?? filtros?.size ?? 20,
    totalPages: data?.meta?.totalPages ?? data?.total_pages ?? 0,
    currentPage: data?.meta?.currentPage ?? data?.page ?? filtros?.page ?? 1,
  };

  return {
    avaliacoes,
    total: meta.totalItems ?? 0,
    page: meta.currentPage ?? 1,
    size: meta.itemsPerPage ?? 20,
    totalPages: meta.totalPages ?? 0,
    meta,
    isLoading,
    isError: Boolean(error),
    error,
    mutate: swrMutate,
  };
}

/**
 * Hook para obter uma avaliação específica
 */
export function useAvaliacao(id: string | null) {
  const { data, error, isLoading } = useSWR<Avaliacao>(
    id ? `/avaliacoes/${id}` : null,
    () => (id ? apiClient.get(`/avaliacoes/${id}`) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  );

  return {
    avaliacao: data,
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Criar nova avaliação
 */
export async function criarAvaliacao(data: CriarAvaliacaoData): Promise<Avaliacao> {
  const result = await apiClient.post<Avaliacao>('/avaliacoes', data);

  // Revalidate cache
  await mutate(isAvaliacoesKey);

  return result;
}

/**
 * Dar like em uma avaliação
 */
export async function darLikeAvaliacao(
  id_avaliacao: string,
  id_user: string
): Promise<void> {
  await apiClient.post(`/avaliacoes/${id_avaliacao}/like`, { id_user });

  // Revalidate
  await mutate(`/avaliacoes/${id_avaliacao}`);
  await mutate(isAvaliacoesKey);
}

// ============================================================================
// REVALIDATION
// ============================================================================

/**
 * Revalidar lista de avaliações
 */
export function revalidarAvaliacoes() {
  return mutate(isAvaliacoesKey);
}

/**
 * Revalidar avaliação específica
 */
export function revalidarAvaliacao(id: string) {
  return mutate(`/avaliacoes/${id}`);
}

function isAvaliacoesKey(key: Key) {
  if (typeof key === 'string') {
    return key.startsWith('/avaliacoes');
  }

  if (Array.isArray(key)) {
    const [endpoint] = key;
    return typeof endpoint === 'string' && endpoint.startsWith('/avaliacoes');
  }

  return false;
}
