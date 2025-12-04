/**
 * Hooks SWR para Conversas (Chat)
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface Conversa {
  id_conversa: string;
  id_user_1: string;
  id_user_2: string;
  ds_tipo?: string;
  id_agendamento?: string;
  id_procedimento?: string;
  st_arquivada: boolean;
  st_ativa: boolean;
  dt_ultima_mensagem?: string;
  dt_criacao: string;
  // Dados dos participantes
  nm_user_1?: string;
  ds_foto_user_1?: string;
  nm_user_2?: string;
  ds_foto_user_2?: string;
  // Contadores
  total_mensagens: number;
  mensagens_nao_lidas: number;
}

export interface ConversasResponse {
  items: Conversa[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ConversasFiltros {
  id_user: string;
  st_arquivada?: boolean;
  page?: number;
  size?: number;
}

export interface CriarConversaData {
  id_user_1: string;
  id_user_2: string;
  ds_tipo?: string;
  id_agendamento?: string;
  id_procedimento?: string;
}

export interface ConversasStats {
  total: number;
  ativas: number;
  arquivadas: number;
  com_mensagens_nao_lidas: number;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar conversas do usuário
 */
export function useConversas(filtros: ConversasFiltros) {
  const { page = 1, size = 20, ...params } = filtros;

  const { data, error, isLoading } = useSWR<ConversasResponse>(
    filtros.id_user
      ? [endpoints.conversas.list, filtros.id_user, page, size, JSON.stringify(params)]
      : null,
    () =>
      apiClient.get(endpoints.conversas.list, {
        params: { ...filtros, page, size },
      }),
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Atualiza a cada 30 segundos
      dedupingInterval: 5000,
    }
  );

  return {
    conversas: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter uma conversa específica
 */
export function useConversa(conversaId: string | null) {
  const { data, error, isLoading } = useSWR<Conversa>(
    conversaId ? endpoints.conversas.get(conversaId) : null,
    () => (conversaId ? apiClient.get(endpoints.conversas.get(conversaId)) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    conversa: data,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para estatísticas de conversas
 */
export function useConversasStats(userId: string | null) {
  const { data, error, isLoading } = useSWR<ConversasStats>(
    userId ? `/conversas/stats/${userId}` : null,
    () => (userId ? apiClient.get(`/conversas/stats/${userId}`) : null),
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Atualiza a cada 1 minuto
      dedupingInterval: 10000,
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
 * Criar nova conversa
 */
export async function criarConversa(data: CriarConversaData): Promise<Conversa> {
  const response = await apiClient.post<Conversa>(endpoints.conversas.create, data);

  // Revalidar lista de conversas
  mutate(
    (key) =>
      Array.isArray(key) &&
      key[0] === endpoints.conversas.list &&
      (key[1] === data.id_user_1 || key[1] === data.id_user_2)
  );

  return response;
}

/**
 * Arquivar/Desarquivar conversa
 */
export async function arquivarConversa(
  conversaId: string,
  arquivar: boolean = true
): Promise<{ message: string }> {
  const response = await apiClient.put<{ message: string }>(
    endpoints.conversas.arquivar(conversaId),
    null,
    { params: { arquivar } }
  );

  // Revalidar conversa específica e lista
  mutate(endpoints.conversas.get(conversaId));
  mutate((key) => Array.isArray(key) && key[0] === endpoints.conversas.list);

  return response;
}

/**
 * Deletar conversa
 */
export async function deletarConversa(conversaId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    endpoints.conversas.delete(conversaId)
  );

  // Revalidar lista
  mutate((key) => Array.isArray(key) && key[0] === endpoints.conversas.list);

  return response;
}

// ============================================================================
// REVALIDATION
// ============================================================================

/**
 * Revalidar lista de conversas
 */
export function revalidarConversas(userId?: string) {
  if (userId) {
    mutate(
      (key) => Array.isArray(key) && key[0] === endpoints.conversas.list && key[1] === userId
    );
  } else {
    mutate((key) => Array.isArray(key) && key[0] === endpoints.conversas.list);
  }
}

/**
 * Revalidar conversa específica
 */
export function revalidarConversa(conversaId: string) {
  mutate(endpoints.conversas.get(conversaId));
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obter nome do outro participante da conversa
 */
export function getOutroParticipante(conversa: Conversa, currentUserId: string): {
  id: string;
  nome: string;
  foto?: string;
} {
  if (conversa.id_user_1 === currentUserId) {
    return {
      id: conversa.id_user_2,
      nome: conversa.nm_user_2 || 'Usuário',
      foto: conversa.ds_foto_user_2,
    };
  } else {
    return {
      id: conversa.id_user_1,
      nome: conversa.nm_user_1 || 'Usuário',
      foto: conversa.ds_foto_user_1,
    };
  }
}

/**
 * Verificar se conversa tem mensagens não lidas
 */
export function temMensagensNaoLidas(conversa: Conversa): boolean {
  return conversa.mensagens_nao_lidas > 0;
}
