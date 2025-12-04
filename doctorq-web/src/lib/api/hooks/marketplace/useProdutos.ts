/**
 * Hook para gerenciamento de Produtos
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';
import type { BaseFilterParams } from '../../types';

export interface Produto {
  id_produto: string;
  id_fornecedor: string;
  id_categoria?: string;
  nm_produto: string;
  ds_produto?: string;
  vl_preco: number;
  vl_preco_promocional?: number;
  nr_estoque: number;
  ds_imagem_url?: string;
  st_ativo: boolean;
  dt_criacao: string;
  dt_atualizacao: string;
  fornecedor?: {
    nm_fantasia: string;
  };
  categoria?: {
    nm_categoria: string;
  };
}

export interface ProdutosFiltros extends BaseFilterParams {
  id_fornecedor?: string;
  id_categoria?: string;
  vl_preco_min?: number;
  vl_preco_max?: number;
  st_ativo?: boolean;
  em_promocao?: boolean;
}

export interface CriarProdutoData {
  id_fornecedor: string;
  id_categoria?: string;
  nm_produto: string;
  ds_produto?: string;
  vl_preco: number;
  vl_preco_promocional?: number;
  nr_estoque: number;
  ds_imagem_url?: string;
}

export interface AtualizarProdutoData {
  nm_produto?: string;
  ds_produto?: string;
  vl_preco?: number;
  vl_preco_promocional?: number;
  nr_estoque?: number;
  ds_imagem_url?: string;
  st_ativo?: boolean;
}

/**
 * Hook para listar produtos
 *
 * @example
 * ```tsx
 * const { data: produtos, meta } = useProdutos({
 *   id_categoria: categoriaId,
 *   em_promocao: true,
 * });
 * ```
 */
export function useProdutos(filtros: ProdutosFiltros = {}) {
  return useQuery<Produto, ProdutosFiltros>({
    endpoint: '/produtos/',
    params: {
      page: 1,
      size: 12,
      ...filtros,
    },
  });
}

/**
 * Hook para obter um produto específico
 */
export function useProduto(id: string | undefined) {
  return useQuerySingle<Produto>({
    endpoint: id ? `/produtos/${id}` : '',
    enabled: !!id,
  });
}

/**
 * Hook para criar produto
 */
export function useCreateProduto() {
  return useMutation<Produto, CriarProdutoData>({
    method: 'POST',
    endpoint: '/produtos/',
  });
}

/**
 * Hook para atualizar produto
 */
export function useUpdateProduto(id: string) {
  return useMutation<Produto, AtualizarProdutoData>({
    method: 'PUT',
    endpoint: `/produtos/${id}`,
  });
}

/**
 * Hook para deletar produto
 */
export function useDeleteProduto(id: string) {
  return useMutation<{ message: string }>({
    method: 'DELETE',
    endpoint: `/produtos/${id}`,
  });
}
