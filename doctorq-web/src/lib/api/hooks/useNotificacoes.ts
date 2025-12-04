/**
 * Hooks SWR para Notificações
 *
 * NOTA: Backend precisa implementar endpoints de notificações
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';

// ============================================================================
// TIPOS
// ============================================================================

export interface Notificacao {
  id_notificacao: string;
  id_user: string;
  ds_tipo: string;
  ds_categoria?: string;
  nm_titulo: string;
  ds_conteudo: string;
  ds_dados_adicionais?: Record<string, any>;
  ds_prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  st_lida: boolean;
  dt_lida?: string;
  ds_acao?: string;
  ds_url?: string;
  ds_url_deep_link?: string;
  dt_criacao: string;
}

export interface NotificacaoListResponse {
  notificacoes: Notificacao[];
  total: number;
  nao_lidas: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface NotificacoesFiltros {
  id_user?: string;
  st_lida?: boolean;
  ds_tipo?: string;
  ds_categoria?: string;
  page?: number;
  size?: number;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar notificações do usuário
 */
export function useNotificacoes(filtros?: NotificacoesFiltros) {
  const { data, error, isLoading } = useSWR<NotificacaoListResponse>(
    filtros ? ['/notificacoes', filtros] : '/notificacoes',
    () => apiClient.get('/notificacoes', { params: filtros }),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30 segundos
      refreshInterval: 60000, // Refresh a cada 1 minuto
    }
  );

  return {
    notificacoes: data?.notificacoes || [],
    total: data?.total || 0,
    naoLidas: data?.nao_lidas || 0,
    page: data?.page || 1,
    size: data?.size || 20,
    totalPages: data?.total_pages || 0,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para contar notificações não lidas
 */
export function useNotificacoesNaoLidas(id_user?: string) {
  const { data, error, isLoading } = useSWR<{ total: number }>(
    id_user ? `/notificacoes/nao-lidas/count?id_user=${id_user}` : null,
    () => (id_user ? apiClient.get(`/notificacoes/nao-lidas/count?id_user=${id_user}`) : null),
    {
      revalidateOnFocus: true,
      dedupingInterval: 15000, // 15 segundos
      refreshInterval: 30000, // Refresh a cada 30 segundos
    }
  );

  return {
    total: data?.total || 0,
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Marcar notificação como lida
 */
export async function marcarComoLida(id_notificacao: string): Promise<void> {
  await apiClient.patch(`/notificacoes/${id_notificacao}/lida`);

  // Revalidate
  await mutate((key) => typeof key === 'string' && key.startsWith('/notificacoes'));
}

/**
 * Marcar todas as notificações como lidas
 */
export async function marcarTodasComoLidas(id_user: string): Promise<void> {
  await apiClient.post('/notificacoes/marcar-todas-lidas', { id_user });

  // Revalidate
  await mutate((key) => typeof key === 'string' && key.startsWith('/notificacoes'));
}

/**
 * Deletar notificação
 */
export async function deletarNotificacao(id_notificacao: string): Promise<void> {
  await apiClient.delete(`/notificacoes/${id_notificacao}`);

  // Revalidate
  await mutate((key) => typeof key === 'string' && key.startsWith('/notificacoes'));
}

// ============================================================================
// REVALIDATION
// ============================================================================

/**
 * Revalidar notificações
 */
export function revalidarNotificacoes() {
  return mutate((key) => typeof key === 'string' && key.startsWith('/notificacoes'));
}
