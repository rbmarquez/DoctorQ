/**
 * Hook para gerenciamento de Perfis (Roles)
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';
import type { BaseFilterParams } from '../../types';

export interface Perfil {
  id_perfil: string;
  id_empresa: string | null;
  nm_perfil: string;
  ds_perfil?: string | null;
  nm_tipo: 'system' | 'custom';
  permissions?: string[];
  ds_grupos_acesso: string[];
  ds_rotas_permitidas?: string[];
  ds_permissoes_detalhadas: Record<string, Record<string, Record<string, boolean>>>;
  ds_permissoes?: Record<string, any>;
  fg_template?: boolean;
  st_ativo: 'S' | 'N';
  dt_criacao: string;
  dt_atualizacao: string;
  nr_usuarios_com_perfil?: number;
  nm_empresa?: string | null;
}

export interface PerfisFiltros extends BaseFilterParams {
  search?: string;
  ativo?: 'S' | 'N';
  id_empresa?: string;
}

export interface CriarPerfilData {
  nm_perfil: string;
  ds_perfil?: string;
  id_empresa?: string | null;
  nm_tipo?: 'system' | 'custom';
  permissions?: string[];
  ds_grupos_acesso?: string[];
  ds_rotas_permitidas?: string[];
  ds_permissoes_detalhadas?: Record<string, Record<string, Record<string, boolean>>>;
  ds_permissoes?: Record<string, any>;
  st_ativo?: 'S' | 'N';
}

export interface AtualizarPerfilData {
  nm_perfil?: string;
  ds_perfil?: string;
  permissions?: string[];
  ds_grupos_acesso?: string[];
  ds_rotas_permitidas?: string[];
  ds_permissoes_detalhadas?: Record<string, Record<string, Record<string, boolean>>>;
  ds_permissoes?: Record<string, any>;
  st_ativo?: 'S' | 'N';
}

// Alias para retrocompatibilidade
export type CreatePerfilDto = CriarPerfilData;
export type UpdatePerfilDto = AtualizarPerfilData;

/**
 * Hook para listar perfis
 *
 * @example
 * ```tsx
 * const { data: perfis, meta } = usePerfis();
 * ```
 */
export function usePerfis(filtros: PerfisFiltros = {}) {
  return useQuery<Perfil, PerfisFiltros>({
    endpoint: '/perfis/',
    params: {
      page: 1,
      size: 50,
      ...filtros,
    },
  });
}

/**
 * Hook para obter um perfil específico
 */
export function usePerfil(id: string | undefined) {
  return useQuerySingle<Perfil>({
    endpoint: id ? `/perfis/${id}/` : '',
    enabled: !!id,
  });
}

/**
 * Hook para criar perfil
 */
export function useCreatePerfil() {
  return useMutation<Perfil, CriarPerfilData>({
    method: 'POST',
    endpoint: '/perfis/',
  });
}

/**
 * Hook para atualizar perfil
 */
export function useUpdatePerfil(id: string) {
  return useMutation<Perfil, AtualizarPerfilData>({
    method: 'PUT',
    endpoint: `/perfis/${id}/`,
  });
}

/**
 * Hook para deletar perfil
 */
export function useDeletePerfil(id: string) {
  return useMutation<{ message: string }>({
    method: 'DELETE',
    endpoint: `/perfis/${id}/`,
  });
}
