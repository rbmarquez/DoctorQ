/**
 * Hook para gerenciar empresas
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';
import type { BaseFilterParams } from '../../types';

/**
 * Tipo Empresa (importar do types quando migrado)
 */
export interface Empresa {
  id_empresa: string;
  nm_razao_social: string;
  nm_fantasia?: string;
  nr_cnpj: string;
  nm_plano?: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

/**
 * Filtros para listagem de empresas
 */
export interface EmpresasFiltros extends BaseFilterParams {
  status?: string;
  plano?: string;
}

/**
 * Hook para listar empresas com paginação
 *
 * @example
 * ```typescript
 * const { data: empresas, meta, isLoading, error } = useEmpresas({
 *   page: 1,
 *   size: 10,
 *   busca: 'termo',
 * });
 * ```
 */
export function useEmpresas(filtros: EmpresasFiltros = {}) {
  return useQuery<Empresa, EmpresasFiltros>({
    endpoint: '/empresas/',
    params: {
      page: 1,
      size: 10,
      ...filtros,
    },
  });
}

/**
 * Hook para buscar uma empresa por ID
 *
 * @example
 * ```typescript
 * const { data: empresa, isLoading } = useEmpresa(empresaId);
 * ```
 */
export function useEmpresa(id: string | undefined) {
  return useQuerySingle<Empresa>({
    endpoint: id ? `/empresas/${id}` : '',
    enabled: !!id,
  });
}

/**
 * DTO para criar empresa
 */
export interface CreateEmpresaDto {
  nm_razao_social: string;
  nm_fantasia?: string;
  nr_cnpj: string;
  nm_plano?: string;
}

/**
 * Hook para criar empresa
 *
 * @example
 * ```typescript
 * const { trigger: criarEmpresa, isMutating } = useCreateEmpresa();
 *
 * const handleSubmit = async (data: CreateEmpresaDto) => {
 *   try {
 *     const empresa = await criarEmpresa(data);
 *     console.log('Empresa criada:', empresa);
 *   } catch (error) {
 *     console.error('Erro ao criar:', error);
 *   }
 * };
 * ```
 */
export function useCreateEmpresa() {
  return useMutation<Empresa, CreateEmpresaDto>({
    method: 'POST',
    endpoint: '/empresas/',
  });
}

/**
 * Hook para atualizar empresa
 *
 * @example
 * ```typescript
 * const { trigger: atualizarEmpresa } = useUpdateEmpresa(empresaId);
 *
 * await atualizarEmpresa({ nm_razao_social: 'Novo Nome' });
 * ```
 */
export function useUpdateEmpresa(id: string) {
  return useMutation<Empresa, Partial<CreateEmpresaDto>>({
    method: 'PUT',
    endpoint: `/empresas/${id}`,
  });
}

/**
 * Hook para deletar empresa
 *
 * @example
 * ```typescript
 * const { trigger: deletarEmpresa } = useDeleteEmpresa(empresaId);
 *
 * await deletarEmpresa();
 * ```
 */
export function useDeleteEmpresa(id: string) {
  return useMutation<void>({
    method: 'DELETE',
    endpoint: `/empresas/${id}`,
  });
}
