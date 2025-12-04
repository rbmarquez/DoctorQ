/**
 * Hook para gerenciar prontuários médicos e evoluções
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';

export interface Prontuario {
  id_prontuario: string;
  id_paciente: string;
  nm_paciente: string;
  id_profissional: string;
  nm_profissional: string;
  ds_anamnese?: string;
  ds_historico_medico?: string;
  ds_alergias?: string;
  ds_medicamentos?: string;
  ds_objetivo_tratamento?: string;
  dt_criacao: string;
  dt_atualizacao: string;
  nr_total_evolucoes: number;
}

export interface Evolucao {
  id_evolucao: string;
  id_prontuario: string;
  id_profissional: string;
  nm_profissional: string;
  id_agendamento?: string;
  dt_evolucao: string;
  ds_evolucao: string;
  ds_procedimentos_realizados?: string;
  ds_observacoes?: string;
  ds_prescricao?: string;
  ds_proximos_passos?: string;
  ds_fotos_url?: string[]; // URLs de fotos anexadas
  dt_criacao: string;
}

export interface Anamnese {
  id_anamnese: string;
  id_paciente: string;
  id_profissional: string;
  ds_queixa_principal?: string;
  ds_historico_doenca_atual?: string;
  ds_historico_patologico?: string;
  ds_historico_familiar?: string;
  ds_habitos_vida?: string;
  ds_alergias?: string;
  ds_medicamentos_uso?: string;
  ds_exame_fisico?: string;
  ds_diagnostico?: string;
  ds_plano_tratamento?: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ProntuariosFiltros {
  id_paciente?: string;
  id_profissional?: string;
  page?: number;
  size?: number;
}

export interface CreateProntuarioDto {
  id_paciente: string;
  id_profissional: string;
  ds_anamnese?: string;
  ds_historico_medico?: string;
  ds_alergias?: string;
  ds_medicamentos?: string;
  ds_objetivo_tratamento?: string;
}

export type UpdateProntuarioDto = Partial<CreateProntuarioDto>;

export interface CreateEvolucaoDto {
  id_prontuario: string;
  id_profissional: string;
  id_agendamento?: string;
  dt_evolucao: string;
  ds_evolucao: string;
  ds_procedimentos_realizados?: string;
  ds_observacoes?: string;
  ds_prescricao?: string;
  ds_proximos_passos?: string;
  ds_fotos_url?: string[];
}

export interface CreateAnamneseDto {
  id_paciente: string;
  id_profissional: string;
  ds_queixa_principal?: string;
  ds_historico_doenca_atual?: string;
  ds_historico_patologico?: string;
  ds_historico_familiar?: string;
  ds_habitos_vida?: string;
  ds_alergias?: string;
  ds_medicamentos_uso?: string;
  ds_exame_fisico?: string;
  ds_diagnostico?: string;
  ds_plano_tratamento?: string;
}

// Hooks para Prontuários
export function useProntuarios(filtros: ProntuariosFiltros = {}) {
  return useQuery<Prontuario, ProntuariosFiltros>({
    endpoint: '/prontuarios/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function useProntuario(id_prontuario: string) {
  return useQuerySingle<Prontuario>({
    endpoint: `/prontuarios/${id_prontuario}/`,
    enabled: !!id_prontuario,
  });
}

export function useCreateProntuario() {
  return useMutation<Prontuario, CreateProntuarioDto>({
    method: 'POST',
    endpoint: '/prontuarios/',
  });
}

export function useUpdateProntuario(id_prontuario: string) {
  return useMutation<Prontuario, UpdateProntuarioDto>({
    method: 'PUT',
    endpoint: `/prontuarios/${id_prontuario}/`,
  });
}

export function useDeleteProntuario(id_prontuario: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/prontuarios/${id_prontuario}/`,
  });
}

// Hooks para Evoluções
export function useEvolucoes(id_prontuario: string) {
  return useQuery<Evolucao, { id_prontuario: string }>({
    endpoint: '/evolucoes/',
    params: { id_prontuario, page: 1, size: 50 },
  });
}

export function useCreateEvolucao() {
  return useMutation<Evolucao, CreateEvolucaoDto>({
    method: 'POST',
    endpoint: '/evolucoes/',
  });
}

export function useDeleteEvolucao(id_evolucao: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/evolucoes/${id_evolucao}/`,
  });
}

// Hooks para Anamneses
export function useAnamneses(id_paciente: string) {
  return useQuery<Anamnese, { id_paciente: string }>({
    endpoint: '/anamneses/',
    params: { id_paciente, page: 1, size: 10 },
  });
}

export function useAnamnese(id_anamnese: string) {
  return useQuerySingle<Anamnese>({
    endpoint: `/anamneses/${id_anamnese}/`,
    enabled: !!id_anamnese,
  });
}

export function useCreateAnamnese() {
  return useMutation<Anamnese, CreateAnamneseDto>({
    method: 'POST',
    endpoint: '/anamneses/',
  });
}

export function useUpdateAnamnese(id_anamnese: string) {
  return useMutation<Anamnese, Partial<CreateAnamneseDto>>({
    method: 'PUT',
    endpoint: `/anamneses/${id_anamnese}/`,
  });
}
