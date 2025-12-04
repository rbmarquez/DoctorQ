/**
 * Hook para gerenciar mensagens entre usuários (chat interno)
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';

export interface Mensagem {
  id_mensagem: string;
  id_remetente: string;
  nm_remetente: string;
  ds_foto_remetente?: string;
  id_destinatario: string;
  nm_destinatario: string;
  ds_foto_destinatario?: string;
  ds_assunto?: string;
  ds_conteudo: string;
  fl_lida: boolean;
  dt_leitura?: string;
  fl_arquivada: boolean;
  id_mensagem_pai?: string; // Para threads/respostas
  dt_criacao: string;
}

export interface Conversa {
  id_conversa: string;
  id_usuario_1: string;
  nm_usuario_1: string;
  ds_foto_usuario_1?: string;
  id_usuario_2: string;
  nm_usuario_2: string;
  ds_foto_usuario_2?: string;
  ds_ultima_mensagem: string;
  dt_ultima_mensagem: string;
  nr_mensagens_nao_lidas: number;
  dt_criacao: string;
}

export interface MensagensFiltros {
  id_usuario?: string;
  fl_lida?: boolean;
  fl_arquivada?: boolean;
  tipo?: 'recebidas' | 'enviadas' | 'todas';
  page?: number;
  size?: number;
}

export interface CreateMensagemDto {
  id_destinatario: string;
  ds_assunto?: string;
  ds_conteudo: string;
  id_mensagem_pai?: string;
}

export interface UpdateMensagemDto {
  fl_lida?: boolean;
  fl_arquivada?: boolean;
}

// Hooks para Mensagens
export function useMensagens(filtros: MensagensFiltros = {}) {
  return useQuery<Mensagem, MensagensFiltros>({
    endpoint: '/mensagens-usuarios/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function useMensagem(id_mensagem: string) {
  return useQuerySingle<Mensagem>({
    endpoint: `/mensagens-usuarios/${id_mensagem}/`,
    enabled: !!id_mensagem,
  });
}

export function useConversas(id_usuario?: string) {
  return useQuery<Conversa, { id_usuario?: string }>({
    endpoint: '/conversas-internas/',
    params: { id_usuario, page: 1, size: 50 },
  });
}

export function useCreateMensagem() {
  return useMutation<Mensagem, CreateMensagemDto>({
    method: 'POST',
    endpoint: '/mensagens-usuarios/',
  });
}

export function useUpdateMensagem(id_mensagem: string) {
  return useMutation<Mensagem, UpdateMensagemDto>({
    method: 'PUT',
    endpoint: `/mensagens-usuarios/${id_mensagem}/`,
  });
}

export function useDeleteMensagem(id_mensagem: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/mensagens-usuarios/${id_mensagem}/`,
  });
}

// Action helpers
export function useMarcarComoLida(id_mensagem: string) {
  return useMutation<Mensagem, void>({
    method: 'PUT',
    endpoint: `/mensagens-usuarios/${id_mensagem}/marcar-lida/`,
  });
}

export function useArquivarMensagem(id_mensagem: string) {
  return useMutation<Mensagem, void>({
    method: 'PUT',
    endpoint: `/mensagens-usuarios/${id_mensagem}/arquivar/`,
  });
}
