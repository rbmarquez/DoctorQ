/**
 * Hook para gerenciamento de Usuários
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';
import type { BaseFilterParams } from '../../types';

export interface Usuario {
  id_user: string;
  nm_email: string;
  nm_completo: string;
  nm_papel: string;
  id_perfil?: string;
  nm_perfil?: string;  // Nome do perfil (join com tb_perfis)
  id_empresa?: string;
  nr_total_logins: number;
  dt_ultimo_login?: string;
  ds_foto_url?: string;
  nr_telefone?: string;
  nr_cpf?: string;
  dt_nascimento?: string;
  st_ativo?: "S" | "N";
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface UsuariosFiltros extends BaseFilterParams {
  nm_papel?: string;
  id_empresa?: string;
  ativo?: boolean;
}

export interface CriarUsuarioData {
  nm_email: string;
  nm_completo: string;
  nm_papel?: string;
  id_perfil?: string;  // UUID do perfil (preferido)
  senha: string;  // Backend espera "senha" não "nm_senha"
  id_empresa?: string;
  nr_telefone?: string;
  nr_cpf?: string;
  dt_nascimento?: string;
}

export interface AtualizarUsuarioData {
  nm_email?: string;
  nm_completo?: string;
  nm_papel?: string;
  id_perfil?: string;  // UUID do perfil (preferido)
  nm_senha?: string;
  ds_foto_url?: string;
  nr_telefone?: string;
  nr_cpf?: string;
  dt_nascimento?: string;
  st_ativo?: "S" | "N";
}

/**
 * Hook para listar usuários
 *
 * @example
 * ```tsx
 * const { data: usuarios, meta } = useUsuarios({
 *   page: 1,
 *   size: 10,
 *   nm_papel: 'admin',
 * });
 * ```
 */
export function useUsuarios(filtros: UsuariosFiltros = {}) {
  return useQuery<Usuario, UsuariosFiltros>({
    endpoint: '/users/',
    params: {
      page: 1,
      size: 10,
      ...filtros,
    },
  });
}

/**
 * Hook para obter um usuário específico
 */
export function useUsuario(id: string | undefined) {
  return useQuerySingle<Usuario>({
    endpoint: id ? `/users/${id}` : '',
    enabled: !!id,
  });
}

/**
 * Hook para criar usuário
 */
export function useCreateUsuario() {
  return useMutation<Usuario, CriarUsuarioData>({
    method: 'POST',
    endpoint: '/users/register',
  });
}

/**
 * Hook para atualizar usuário
 */
export function useUpdateUsuario(id: string) {
  return useMutation<Usuario, AtualizarUsuarioData>({
    method: 'PUT',
    endpoint: `/users/${id}`,
  });
}

/**
 * Hook para deletar usuário
 */
export function useDeleteUsuario(id: string) {
  return useMutation<{ message: string }>({
    method: 'DELETE',
    endpoint: `/users/${id}`,
  });
}
