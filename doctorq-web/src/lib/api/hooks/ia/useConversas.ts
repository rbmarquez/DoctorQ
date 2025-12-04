/**
 * Hook para gerenciamento de Conversas com Agentes
 * Usa o AI Service dedicado (estetiQ-service-ai)
 */

import { useQuery, useQuerySingle, useMutation } from '../ai-factory';
import type { BaseFilterParams } from '../../types';

export interface Conversa {
  id_conversa: string;
  id_agente: string;
  id_user: string;
  nm_titulo?: string;
  ds_contexto?: string;
  dt_criacao: string;
  dt_atualizacao: string;
  agente?: {
    nm_agente: string;
  };
}

export interface Message {
  id_message: string;
  id_conversa: string;
  nm_role: 'user' | 'assistant' | 'system';
  ds_content: string;
  nr_tokens?: number;
  dt_criacao: string;
}

export interface ConversasFiltros extends BaseFilterParams {
  id_agente?: string;
  id_user?: string;
}

export interface CriarConversaData {
  id_agente: string;
  nm_titulo?: string;
  ds_contexto?: string;
}

export interface EnviarMensagemData {
  message: string;
  stream?: boolean;
}

/**
 * Hook para listar conversas
 *
 * @example
 * ```tsx
 * const { data: conversas, meta } = useConversas({
 *   id_agente: agenteId,
 * });
 * ```
 */
export function useConversas(filtros: ConversasFiltros = {}) {
  return useQuery<Conversa, ConversasFiltros>({
    endpoint: '/conversas/',
    params: {
      page: 1,
      size: 20,
      ...filtros,
    },
  });
}

/**
 * Hook para obter uma conversa específica
 */
export function useConversa(id: string | undefined) {
  return useQuerySingle<Conversa>({
    endpoint: id ? `/conversas/${id}` : '',
    enabled: !!id,
  });
}

/**
 * Hook para obter mensagens de uma conversa
 */
export function useMensagens(conversaId: string | undefined) {
  return useQuery<Message>({
    endpoint: conversaId ? `/conversas/${conversaId}/messages` : '',
    params: {},
    enabled: !!conversaId,
  });
}

/**
 * Hook para criar conversa
 */
export function useCreateConversa() {
  return useMutation<Conversa, CriarConversaData>({
    method: 'POST',
    endpoint: '/conversas/',
  });
}

/**
 * Hook para deletar conversa
 */
export function useDeleteConversa(id: string) {
  return useMutation<{ message: string }>({
    method: 'DELETE',
    endpoint: `/conversas/${id}`,
  });
}
