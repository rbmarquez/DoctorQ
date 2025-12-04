/**
 * Hook SWR para Partner Lead Questions
 */

import useSWR from 'swr';
import { apiClient, buildQueryString, fetcher } from '../client';
import endpoints from '../endpoints';
import type {
  PartnerLeadQuestion,
  PartnerLeadQuestionCreate,
  PartnerLeadQuestionUpdate,
  PartnerLeadQuestionFilters,
  PartnerType,
} from '@/types/partner';
import type { PaginatedResponse } from '../types';

/**
 * Hook para listar lead questions com paginação e filtros
 */
export function usePartnerLeadQuestions(filters?: PartnerLeadQuestionFilters) {
  const queryString = filters ? buildQueryString(filters) : '';
  const url = `${endpoints.partner.leadQuestions.list}${queryString}`;

  const { data, error, isLoading, mutate } = useSWR<
    PaginatedResponse<PartnerLeadQuestion>
  >(url, fetcher);

  return {
    questions: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook para obter uma question específica por ID
 */
export function usePartnerLeadQuestion(questionId: string | null) {
  const url = questionId ? endpoints.partner.leadQuestions.get(questionId) : null;

  const { data, error, isLoading, mutate } = useSWR<PartnerLeadQuestion>(url, fetcher);

  return {
    question: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook para obter perguntas públicas de um tipo de parceiro
 * (Endpoint sem autenticação para usar em formulários públicos)
 */
export function usePublicPartnerLeadQuestions(tpPartner: PartnerType | null) {
  const url = tpPartner ? endpoints.partner.leadQuestions.public(tpPartner) : null;

  const { data, error, isLoading, mutate } = useSWR<PartnerLeadQuestion[]>(url, fetcher, {
    // Não revalidar automaticamente para evitar chamadas desnecessárias
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    questions: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Funções de mutação para lead questions
 */
export const partnerLeadQuestionsActions = {
  /**
   * Criar nova pergunta
   */
  async create(questionData: PartnerLeadQuestionCreate): Promise<PartnerLeadQuestion> {
    return apiClient.post<PartnerLeadQuestion>(
      endpoints.partner.leadQuestions.create,
      questionData
    );
  },

  /**
   * Atualizar pergunta
   */
  async update(
    questionId: string,
    questionData: PartnerLeadQuestionUpdate
  ): Promise<PartnerLeadQuestion> {
    return apiClient.put<PartnerLeadQuestion>(
      endpoints.partner.leadQuestions.update(questionId),
      questionData
    );
  },

  /**
   * Deletar pergunta
   */
  async delete(questionId: string): Promise<void> {
    return apiClient.delete(endpoints.partner.leadQuestions.delete(questionId));
  },

  /**
   * Toggle status ativo/inativo
   */
  async toggleActive(questionId: string): Promise<PartnerLeadQuestion> {
    return apiClient.patch<PartnerLeadQuestion>(
      endpoints.partner.leadQuestions.toggleActive(questionId)
    );
  },

  /**
   * Reordenar perguntas
   */
  async reorder(questions: Array<{ id_question: string; nr_order: number }>): Promise<void> {
    return apiClient.post('/partner/lead-questions/reorder/', { questions });
  },
};
