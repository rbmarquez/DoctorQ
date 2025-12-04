/**
 * Hooks SWR para Mensagens
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface Mensagem {
  id_mensagem: string;
  id_conversa: string;
  id_remetente: string;
  ds_tipo_mensagem: 'texto' | 'imagem' | 'arquivo' | 'audio' | 'video';
  ds_conteudo: string;
  ds_arquivos_url?: string[];
  ds_metadados?: Record<string, any>;
  st_editada: boolean;
  st_deletada: boolean;
  st_enviada: boolean;
  st_entregue: boolean;
  st_lida: boolean;
  dt_criacao: string;
  nm_remetente?: string;
}

export interface MensagensResponse {
  items: Mensagem[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface EnviarMensagemData {
  id_conversa: string;
  id_remetente: string;
  ds_conteudo: string;
  ds_tipo_mensagem?: 'texto' | 'imagem' | 'arquivo' | 'audio' | 'video';
  ds_arquivos_url?: string[];
  ds_metadados?: Record<string, any>;
  id_mensagem_pai?: string;
  id_agendamento?: string;
  id_produto?: string;
  id_procedimento?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar mensagens de uma conversa
 */
export function useMensagens(conversaId: string | null, page: number = 1, size: number = 50) {
  const { data, error, isLoading } = useSWR<MensagensResponse>(
    conversaId ? [endpoints.mensagens.conversa(conversaId), page, size] : null,
    () =>
      conversaId
        ? apiClient.get(endpoints.mensagens.conversa(conversaId), {
            params: { page, size },
          })
        : null,
    {
      revalidateOnFocus: true,
      refreshInterval: 5000, // Atualiza a cada 5 segundos
      dedupingInterval: 2000,
    }
  );

  return {
    mensagens: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Enviar nova mensagem
 */
export async function enviarMensagem(data: EnviarMensagemData): Promise<Mensagem> {
  const response = await apiClient.post<Mensagem>(endpoints.mensagens.send, data);

  // Revalidar lista de mensagens da conversa
  mutate((key) =>
    Array.isArray(key) && key[0].includes(`/conversas/${data.id_conversa}/mensagens`)
  );

  return response;
}

/**
 * Marcar mensagem como lida
 */
export async function marcarMensagemLida(mensagemId: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    endpoints.mensagens.marcarLida(mensagemId)
  );

  // Revalidar listas de mensagens
  mutate((key) => Array.isArray(key) && typeof key[0] === 'string' && key[0].includes('/mensagens/conversa/'));

  return response;
}

/**
 * Deletar mensagem
 */
export async function deletarMensagem(
  mensagemId: string,
  userId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    endpoints.mensagens.delete(mensagemId),
    { params: { id_user: userId } }
  );

  // Revalidar listas de mensagens
  mutate((key) => Array.isArray(key) && typeof key[0] === 'string' && key[0].includes('/mensagens/conversa/'));

  return response;
}

/**
 * Revalidar mensagens de uma conversa
 */
export function revalidarMensagens(conversaId?: string) {
  if (conversaId) {
    mutate((key) => Array.isArray(key) && key[0] === endpoints.mensagens.conversa(conversaId));
  } else {
    mutate((key) => Array.isArray(key) && typeof key[0] === 'string' && key[0].includes('/mensagens/conversa/'));
  }
}
