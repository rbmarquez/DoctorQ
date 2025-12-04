/**
 * Hook para gerenciamento de Agendamentos
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';
import type { BaseFilterParams } from '../../types';

export interface Agendamento {
  id_agendamento: string;
  id_paciente: string;
  id_profissional: string;
  id_procedimento?: string;
  id_clinica?: string;
  dt_agendamento: string;
  hr_agendamento: string;
  nm_status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  ds_observacoes?: string;
  dt_criacao: string;
  dt_atualizacao: string;
  paciente?: {
    nm_completo: string;
  };
  profissional?: {
    nm_completo: string;
  };
  procedimento?: {
    nm_procedimento: string;
  };
  clinica?: {
    nm_fantasia: string;
  };
}

export interface AgendamentosFiltros extends BaseFilterParams {
  id_paciente?: string;
  id_profissional?: string;
  id_clinica?: string;
  nm_status?: string;
  dt_inicio?: string;
  dt_fim?: string;
}

export interface CriarAgendamentoData {
  id_paciente: string;
  id_profissional: string;
  id_procedimento?: string;
  id_clinica?: string;
  dt_agendamento: string;
  hr_agendamento: string;
  ds_observacoes?: string;
}

export interface AtualizarAgendamentoData {
  id_profissional?: string;
  id_procedimento?: string;
  dt_agendamento?: string;
  hr_agendamento?: string;
  nm_status?: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  ds_observacoes?: string;
}

/**
 * Hook para listar agendamentos
 *
 * @example
 * ```tsx
 * const { data: agendamentos, meta } = useAgendamentos({
 *   id_profissional: profissionalId,
 *   nm_status: 'confirmado',
 * });
 * ```
 */
export function useAgendamentos(filtros: AgendamentosFiltros = {}) {
  return useQuery<Agendamento, AgendamentosFiltros>({
    endpoint: '/agendamentos/',
    params: {
      page: 1,
      size: 20,
      ...filtros,
    },
  });
}

/**
 * Hook para obter um agendamento específico
 */
export function useAgendamento(id: string | undefined) {
  return useQuerySingle<Agendamento>({
    endpoint: id ? `/agendamentos/${id}` : '',
    enabled: !!id,
  });
}

/**
 * Hook para criar agendamento
 */
export function useCreateAgendamento() {
  return useMutation<Agendamento, CriarAgendamentoData>({
    method: 'POST',
    endpoint: '/agendamentos/',
  });
}

/**
 * Hook para atualizar agendamento
 */
export function useUpdateAgendamento(id: string) {
  return useMutation<Agendamento, AtualizarAgendamentoData>({
    method: 'PUT',
    endpoint: `/agendamentos/${id}`,
  });
}

/**
 * Hook para cancelar agendamento
 */
export function useCancelAgendamento(id: string) {
  return useMutation<Agendamento>({
    method: 'PUT',
    endpoint: `/agendamentos/${id}`,
  });
}

/**
 * Hook para confirmar agendamento
 */
export function useConfirmAgendamento(id: string) {
  return useMutation<Agendamento>({
    method: 'PUT',
    endpoint: `/agendamentos/${id}`,
  });
}
