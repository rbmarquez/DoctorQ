/**
 * Hook para gerenciar pacientes
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';

export interface Paciente {
  id_paciente: string;
  id_empresa: string;
  id_user?: string;
  nm_completo: string;
  nm_email?: string;
  nr_telefone?: string;
  nr_cpf?: string;
  dt_nascimento?: string;
  nr_idade?: number;
  ds_genero?: 'M' | 'F' | 'Outro' | 'Prefiro não informar';
  ds_endereco?: string;
  ds_foto_url?: string;
  ds_observacoes?: string;
  fl_ativo: boolean;
  dt_primeiro_atendimento?: string;
  dt_ultimo_atendimento?: string;
  nr_total_agendamentos: number;
  vl_total_gasto: number;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface PacientesFiltros {
  id_empresa?: string;
  nm_completo?: string;
  nr_cpf?: string;
  nm_email?: string;
  fl_ativo?: boolean;
  page?: number;
  size?: number;
}

export interface CreatePacienteDto {
  id_empresa: string;
  id_user?: string;
  nm_completo: string;
  nm_email?: string;
  nr_telefone?: string;
  nr_cpf?: string;
  dt_nascimento?: string;
  ds_genero?: 'M' | 'F' | 'Outro' | 'Prefiro não informar';
  ds_endereco?: string;
  ds_foto_url?: string;
  ds_observacoes?: string;
  fl_ativo?: boolean;
}

export type UpdatePacienteDto = Partial<CreatePacienteDto>;

// Hooks para Pacientes
export function usePacientes(filtros: PacientesFiltros = {}) {
  return useQuery<Paciente, PacientesFiltros>({
    endpoint: '/pacientes/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function usePaciente(id_paciente: string) {
  return useQuerySingle<Paciente>({
    endpoint: `/pacientes/${id_paciente}/`,
    enabled: !!id_paciente,
  });
}

export function useCreatePaciente() {
  return useMutation<Paciente, CreatePacienteDto>({
    method: 'POST',
    endpoint: '/pacientes/',
  });
}

export function useUpdatePaciente(id_paciente: string) {
  return useMutation<Paciente, UpdatePacienteDto>({
    method: 'PUT',
    endpoint: `/pacientes/${id_paciente}/`,
  });
}

export function useDeletePaciente(id_paciente: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/pacientes/${id_paciente}/`,
  });
}

// Estatísticas do paciente
export interface PacienteStats {
  nr_total_agendamentos: number;
  nr_agendamentos_concluidos: number;
  nr_agendamentos_cancelados: number;
  vl_total_gasto: number;
  dt_primeiro_atendimento?: string;
  dt_ultimo_atendimento?: string;
  nr_procedimentos_favoritos: number;
}

export function usePacienteStats(id_paciente: string) {
  return useQuerySingle<PacienteStats>({
    endpoint: `/pacientes/${id_paciente}/estatisticas/`,
    enabled: !!id_paciente,
  });
}
