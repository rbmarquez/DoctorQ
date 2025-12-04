/**
 * Hooks SWR para Pedidos
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface EnderecoEntrega {
  nm_destinatario: string;
  nr_telefone: string;
  ds_logradouro: string;
  nr_numero: string;
  ds_complemento?: string;
  ds_bairro: string;
  ds_cidade: string;
  ds_estado: string;
  nr_cep: string;
  ds_referencia?: string;
}

export interface ItemPedido {
  id_item?: string;
  id_produto?: string;
  id_procedimento?: string;
  nm_item: string;
  qt_quantidade: number;
  vl_unitario: number;
  vl_subtotal: number;
  ds_imagem_url?: string;
  ds_observacoes?: string;
}

export interface Pedido {
  id_pedido: string;
  id_user: string;
  nr_pedido: string;
  vl_subtotal: number;
  vl_desconto: number;
  vl_frete: number;
  vl_total: number;
  ds_status: string;
  ds_endereco_entrega: EnderecoEntrega;
  ds_forma_pagamento?: string;
  ds_rastreio?: string;
  ds_codigo_rastreio?: string;
  dt_pedido: string;
  dt_confirmacao?: string;
  dt_pagamento?: string;
  dt_envio?: string;
  dt_entrega?: string;
  dt_entrega_estimada?: string;
  dt_cancelamento?: string;
  ds_observacoes?: string;
  id_fornecedor?: string;
  ds_numero_nota_fiscal?: string;
  ds_chave_nfe?: string;
  ds_url_danfe?: string;
  dt_criacao: string;
  itens?: ItemPedido[];
  fornecedor_nome?: string;
}

export interface PedidoListItem {
  id_pedido: string;
  nr_pedido: string;
  dt_pedido: string;
  vl_total: number;
  ds_status: string;
  qt_itens: number;
  fornecedor_nome?: string;
}

export interface PedidoListResponse {
  items: PedidoListItem[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface PedidosFiltros {
  id_user?: string;
  ds_status?: string;
  dt_inicio?: string;
  dt_fim?: string;
  page?: number;
  size?: number;
}

export interface CriarPedidoData {
  id_user: string;
  ds_endereco_entrega: EnderecoEntrega;
  ds_forma_pagamento: 'pix' | 'credito' | 'debito' | 'boleto';
  ds_observacoes?: string;
  id_cupom?: string;
}

export interface RastreioEvento {
  dt_evento: string;
  ds_local: string;
  ds_descricao: string;
  ds_status: string;
}

export interface RastreioResponse {
  id_pedido: string;
  nr_pedido: string;
  ds_codigo_rastreio?: string;
  ds_transportadora?: string;
  dt_postagem?: string;
  dt_entrega_prevista?: string;
  ds_status_atual: string;
  eventos: RastreioEvento[];
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar pedidos do usuário
 */
export function usePedidos(filtros?: PedidosFiltros) {
  const { data, error, isLoading } = useSWR<PedidoListResponse>(
    [endpoints.pedidos.list, filtros],
    () => apiClient.get(endpoints.pedidos.list, { params: filtros }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  return {
    pedidos: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter detalhes de um pedido específico
 */
export function usePedido(id: string | null) {
  const { data, error, isLoading } = useSWR<Pedido>(
    id ? endpoints.pedidos.get(id) : null,
    () => (id ? apiClient.get(endpoints.pedidos.get(id)) : null),
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Atualizar a cada 1 minuto
    }
  );

  return {
    pedido: data,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter rastreamento do pedido
 */
export function useRastreio(id: string | null) {
  const { data, error, isLoading } = useSWR<RastreioResponse>(
    id ? endpoints.pedidos.rastreio(id) : null,
    () => (id ? apiClient.get(endpoints.pedidos.rastreio(id)) : null),
    {
      revalidateOnFocus: true,
      refreshInterval: 300000, // Atualizar a cada 5 minutos
    }
  );

  return {
    rastreio: data,
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Criar novo pedido a partir do carrinho
 */
export async function criarPedido(data: CriarPedidoData) {
  const pedido = await apiClient.post<Pedido>(endpoints.pedidos.create, data);

  // Revalidar lista de pedidos
  mutate((key) => Array.isArray(key) && key[0] === endpoints.pedidos.list);

  // Revalidar carrinho (foi limpo)
  mutate((key) => Array.isArray(key) && key[0] === endpoints.carrinho.get);

  return pedido;
}

/**
 * Atualizar status do pedido
 */
export async function atualizarStatusPedido(
  id: string,
  data: {
    ds_status?: string;
    ds_rastreio?: string;
    ds_codigo_rastreio?: string;
    dt_envio?: string;
    dt_entrega?: string;
    ds_numero_nota_fiscal?: string;
    ds_observacoes?: string;
  }
) {
  const pedido = await apiClient.put<Pedido>(endpoints.pedidos.updateStatus(id), data);

  // Revalidar pedido específico e listas
  mutate(endpoints.pedidos.get(id));
  mutate((key) => Array.isArray(key) && key[0] === endpoints.pedidos.list);

  return pedido;
}

/**
 * Helper para revalidar pedidos
 */
export function revalidarPedidos(filtros?: PedidosFiltros) {
  if (filtros) {
    mutate([endpoints.pedidos.list, filtros]);
  } else {
    mutate((key) => Array.isArray(key) && key[0] === endpoints.pedidos.list);
  }
}

/**
 * Helper para revalidar pedido específico
 */
export function revalidarPedido(id: string) {
  mutate(endpoints.pedidos.get(id));
}
