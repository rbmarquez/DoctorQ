/**
 * Hook para gerenciamento de Carrinho de Compras
 */

import { useQuery, useMutation } from '../factory';

export interface ItemCarrinho {
  id_item: string;
  id_produto: string;
  nr_quantidade: number;
  vl_unitario: number;
  vl_total: number;
  produto?: {
    nm_produto: string;
    ds_imagem_url?: string;
  };
}

export interface Carrinho {
  id_carrinho: string;
  id_user: string;
  itens: ItemCarrinho[];
  vl_total: number;
  nr_total_itens: number;
}

export interface AdicionarItemData {
  id_produto: string;
  nr_quantidade: number;
}

export interface AtualizarItemData {
  nr_quantidade: number;
}

/**
 * Hook para obter carrinho do usuário
 *
 * @example
 * ```tsx
 * const { data: carrinho, isLoading } = useCarrinho();
 * ```
 */
export function useCarrinho() {
  return useQuery<Carrinho>({
    endpoint: '/carrinho/',
    params: {},
  });
}

/**
 * Hook para adicionar item ao carrinho
 */
export function useAddItemCarrinho() {
  return useMutation<Carrinho, AdicionarItemData>({
    method: 'POST',
    endpoint: '/carrinho/itens',
  });
}

/**
 * Hook para atualizar quantidade de item
 */
export function useUpdateItemCarrinho(itemId: string) {
  return useMutation<Carrinho, AtualizarItemData>({
    method: 'PUT',
    endpoint: `/carrinho/itens/${itemId}`,
  });
}

/**
 * Hook para remover item do carrinho
 */
export function useRemoveItemCarrinho(itemId: string) {
  return useMutation<Carrinho>({
    method: 'DELETE',
    endpoint: `/carrinho/itens/${itemId}`,
  });
}

/**
 * Hook para limpar carrinho
 */
export function useClearCarrinho() {
  return useMutation<{ message: string }>({
    method: 'DELETE',
    endpoint: '/carrinho/',
  });
}
