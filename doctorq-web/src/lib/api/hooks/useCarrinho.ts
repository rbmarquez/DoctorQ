/**
 * Hooks SWR para Carrinho
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface CarrinhoItem {
  id_item: string;
  id_produto?: string;
  id_procedimento?: string;
  nm_item: string;
  qt_quantidade: number;
  vl_preco_unitario: number;
  vl_subtotal: number;
  ds_imagem_url?: string;
  produto_estoque?: number;
  fornecedor_nome?: string;
}

export interface CarrinhoTotal {
  vl_subtotal: number;
  vl_desconto: number;
  vl_frete: number;
  vl_total: number;
  qt_itens: number;
  qt_produtos: number;
  qt_procedimentos: number;
}

export interface CarrinhoResponse {
  itens: CarrinhoItem[];
  totais: CarrinhoTotal;
}

export interface AdicionarItemData {
  id_produto?: string;
  id_procedimento?: string;
  qt_quantidade: number;
  id_variacao?: string;
  id_profissional_desejado?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obter carrinho completo do usuário
 */
export function useCarrinho(idUser: string | null) {
  const { data, error, isLoading, mutate: mutateCarrinho } = useSWR<CarrinhoResponse>(
    idUser ? [endpoints.carrinho.get, { id_user: idUser }] : null,
    () =>
      idUser
        ? apiClient.get(endpoints.carrinho.get, { params: { id_user: idUser } })
        : null,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000, // 5 segundos
    }
  );

  return {
    carrinho: data,
    itens: data?.itens || [],
    totais: data?.totais,
    isLoading,
    isError: error,
    error,
    mutate: mutateCarrinho,
  };
}

/**
 * Hook para obter apenas totais do carrinho (mais leve)
 */
export function useCarrinhoTotal(idUser: string | null) {
  const { data, error, isLoading } = useSWR<CarrinhoTotal>(
    idUser ? [endpoints.carrinho.getTotal, { id_user: idUser }] : null,
    () =>
      idUser
        ? apiClient.get(endpoints.carrinho.getTotal, { params: { id_user: idUser } })
        : null,
    {
      revalidateOnFocus: true,
      refreshInterval: 10000, // Atualizar a cada 10 segundos
    }
  );

  return {
    totais: data,
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Adicionar item ao carrinho
 */
export async function adicionarAoCarrinho(idUser: string, data: AdicionarItemData) {
  const item = await apiClient.post<CarrinhoItem>(endpoints.carrinho.addItem, {
    id_user: idUser,
    ...data,
  });

  // Revalidar carrinho
  mutate([endpoints.carrinho.get, { id_user: idUser }]);
  mutate([endpoints.carrinho.getTotal, { id_user: idUser }]);

  return item;
}

/**
 * Atualizar quantidade de item no carrinho
 */
export async function atualizarItemCarrinho(
  idUser: string,
  idItem: string,
  quantidade: number
) {
  const item = await apiClient.put<CarrinhoItem>(
    endpoints.carrinho.updateItem(idItem),
    {
      qt_quantidade: quantidade,
    }
  );

  // Revalidar carrinho
  mutate([endpoints.carrinho.get, { id_user: idUser }]);
  mutate([endpoints.carrinho.getTotal, { id_user: idUser }]);

  return item;
}

/**
 * Remover item do carrinho
 */
export async function removerDoCarrinho(idUser: string, idItem: string) {
  await apiClient.delete(endpoints.carrinho.removeItem(idItem));

  // Revalidar carrinho
  mutate([endpoints.carrinho.get, { id_user: idUser }]);
  mutate([endpoints.carrinho.getTotal, { id_user: idUser }]);
}

/**
 * Limpar carrinho completamente
 */
export async function limparCarrinho(idUser: string) {
  await apiClient.delete(endpoints.carrinho.clear, {
    params: { id_user: idUser },
  });

  // Revalidar carrinho
  mutate([endpoints.carrinho.get, { id_user: idUser }]);
  mutate([endpoints.carrinho.getTotal, { id_user: idUser }]);
}

/**
 * Helper para revalidar carrinho manualmente
 */
export function revalidarCarrinho(idUser: string) {
  mutate([endpoints.carrinho.get, { id_user: idUser }]);
  mutate([endpoints.carrinho.getTotal, { id_user: idUser }]);
}
