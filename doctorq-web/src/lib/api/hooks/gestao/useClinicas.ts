/**
 * Hook para gerenciamento de Clínicas
 */

'use client';

import { useQuery, useQuerySingle, useMutation } from '../factory';
import type { BaseFilterParams } from '../../types';

export interface Clinica {
  id_clinica: string;
  id_empresa: string;
  nm_clinica: string;
  ds_endereco?: string;
  nr_telefone?: string;
  nm_email?: string;
  fl_ativo: boolean;
  dt_criacao: string;
}

export function useClinicas(filtros: BaseFilterParams = {}) {
  return useQuery<Clinica, BaseFilterParams>({
    endpoint: '/clinicas/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function useClinica(id: string | undefined) {
  return useQuerySingle<Clinica>({
    endpoint: id ? `/clinicas/${id}` : '',
    enabled: !!id,
  });
}

export function useCreateClinica() {
  return useMutation<Clinica, Partial<Clinica>>({
    method: 'POST',
    endpoint: '/clinicas/',
  });
}

export function useUpdateClinica(id: string) {
  return useMutation<Clinica, Partial<Clinica>>({
    method: 'PUT',
    endpoint: `/clinicas/${id}`,
  });
}

export function useDeleteClinica(id: string) {
  return useMutation<void>({
    method: 'DELETE',
    endpoint: `/clinicas/${id}`,
  });
}
