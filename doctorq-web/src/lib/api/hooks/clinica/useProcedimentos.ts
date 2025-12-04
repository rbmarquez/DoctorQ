/**
 * Hook para gerenciamento de Procedimentos
 */

'use client';

import { useQuery, useQuerySingle, useMutation } from '../factory';
import type { BaseFilterParams } from '../../types';

export interface Procedimento {
  id_procedimento: string;
  nm_procedimento: string;
  ds_procedimento?: string;
  vl_preco: number;
  nr_duracao_minutos?: number;
  id_categoria?: string;
  nm_categoria?: string;
  fl_ativo: boolean;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ProcedimentosFiltros extends BaseFilterParams {
  id_categoria?: string;
  fl_ativo?: boolean;
  vl_preco_min?: number;
  vl_preco_max?: number;
}

export function useProcedimentos(filtros: ProcedimentosFiltros = {}) {
  return useQuery<Procedimento, ProcedimentosFiltros>({
    endpoint: '/procedimentos/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function useProcedimento(id: string | undefined) {
  return useQuerySingle<Procedimento>({
    endpoint: id ? `/procedimentos/${id}` : '',
    enabled: !!id,
  });
}

export function useCreateProcedimento() {
  return useMutation<Procedimento, Partial<Procedimento>>({
    method: 'POST',
    endpoint: '/procedimentos/',
  });
}

export function useUpdateProcedimento(id: string) {
  return useMutation<Procedimento, Partial<Procedimento>>({
    method: 'PUT',
    endpoint: `/procedimentos/${id}`,
  });
}

export function useDeleteProcedimento(id: string) {
  return useMutation<void>({
    method: 'DELETE',
    endpoint: `/procedimentos/${id}`,
  });
}
