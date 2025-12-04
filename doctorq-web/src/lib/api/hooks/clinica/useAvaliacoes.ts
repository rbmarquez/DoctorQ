/**
 * Hook para gerenciar avaliações e respostas
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';

export interface Avaliacao {
  id_avaliacao: string;
  id_user: string;
  nm_user: string;
  ds_foto_user?: string;
  id_profissional?: string;
  nm_profissional?: string;
  id_clinica?: string;
  nm_clinica?: string;
  id_produto?: string;
  nm_produto?: string;
  id_procedimento?: string;
  nm_procedimento?: string;
  nr_nota: number; // 1-5
  ds_titulo?: string;
  ds_comentario?: string;
  fl_recomenda: boolean;
  fl_verificada: boolean; // Verificada por compra/agendamento
  dt_avaliacao: string;
  nr_votos_util: number;
  fl_publicada: boolean;
  dt_criacao: string;
  dt_atualizacao: string;
  resposta?: RespostaAvaliacao;
}

export interface RespostaAvaliacao {
  id_resposta: string;
  id_avaliacao: string;
  id_user_resposta: string;
  nm_user_resposta: string;
  ds_resposta: string;
  dt_resposta: string;
}

export interface AvaliacoesFiltros {
  id_user?: string;
  id_profissional?: string;
  id_clinica?: string;
  id_produto?: string;
  id_procedimento?: string;
  nr_nota_min?: number;
  fl_verificada?: boolean;
  fl_publicada?: boolean;
  page?: number;
  size?: number;
}

export interface CreateAvaliacaoDto {
  id_user: string;
  id_profissional?: string;
  id_clinica?: string;
  id_produto?: string;
  id_procedimento?: string;
  nr_nota: number;
  ds_titulo?: string;
  ds_comentario?: string;
  fl_recomenda: boolean;
}

export interface UpdateAvaliacaoDto extends Partial<CreateAvaliacaoDto> {
  fl_publicada?: boolean;
}

export interface CreateRespostaDto {
  id_avaliacao: string;
  id_user_resposta: string;
  ds_resposta: string;
}

// Hooks para Avaliações
export function useAvaliacoes(filtros: AvaliacoesFiltros = {}) {
  return useQuery<Avaliacao, AvaliacoesFiltros>({
    endpoint: '/avaliacoes/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function useAvaliacao(id_avaliacao: string) {
  return useQuerySingle<Avaliacao>({
    endpoint: `/avaliacoes/${id_avaliacao}/`,
    enabled: !!id_avaliacao,
  });
}

export function useCreateAvaliacao() {
  return useMutation<Avaliacao, CreateAvaliacaoDto>({
    method: 'POST',
    endpoint: '/avaliacoes/',
  });
}

export function useUpdateAvaliacao(id_avaliacao: string) {
  return useMutation<Avaliacao, UpdateAvaliacaoDto>({
    method: 'PUT',
    endpoint: `/avaliacoes/${id_avaliacao}/`,
  });
}

export function useDeleteAvaliacao(id_avaliacao: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/avaliacoes/${id_avaliacao}/`,
  });
}

// Hooks para Respostas
export function useCreateResposta() {
  return useMutation<RespostaAvaliacao, CreateRespostaDto>({
    method: 'POST',
    endpoint: '/respostas-avaliacoes/',
  });
}

export function useDeleteResposta(id_resposta: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/respostas-avaliacoes/${id_resposta}/`,
  });
}

// Action helpers
export function useMarcarAvaliacaoUtil(id_avaliacao: string) {
  return useMutation<Avaliacao, void>({
    method: 'PUT',
    endpoint: `/avaliacoes/${id_avaliacao}/marcar-util/`,
  });
}

export function usePublicarAvaliacao(id_avaliacao: string) {
  return useMutation<Avaliacao, void>({
    method: 'PUT',
    endpoint: `/avaliacoes/${id_avaliacao}/publicar/`,
  });
}

export function useOcultarAvaliacao(id_avaliacao: string) {
  return useMutation<Avaliacao, void>({
    method: 'PUT',
    endpoint: `/avaliacoes/${id_avaliacao}/ocultar/`,
  });
}

// Estatísticas de avaliações
export interface AvaliacoesStats {
  nr_total_avaliacoes: number;
  nr_media_nota: number;
  nr_avaliacoes_5_estrelas: number;
  nr_avaliacoes_4_estrelas: number;
  nr_avaliacoes_3_estrelas: number;
  nr_avaliacoes_2_estrelas: number;
  nr_avaliacoes_1_estrela: number;
  pc_recomendacao: number; // Porcentagem de recomendação
}

export function useAvaliacoesStats(
  tipo: 'profissional' | 'clinica' | 'produto' | 'procedimento',
  id_referencia: string
) {
  return useQuerySingle<AvaliacoesStats>({
    endpoint: `/avaliacoes/estatisticas/${tipo}/${id_referencia}/`,
    enabled: !!id_referencia,
  });
}
