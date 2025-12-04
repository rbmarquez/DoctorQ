/**
 * Hooks SWR para Transações Financeiras
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface Transacao {
  id_transacao: string;
  id_empresa?: string;
  id_categoria?: string;
  id_agendamento?: string;
  id_pedido?: string;
  ds_tipo: 'entrada' | 'saida' | 'transferencia';
  vl_valor: number;
  vl_taxa: number;
  vl_liquido: number;
  ds_descricao: string;
  ds_observacoes?: string;
  ds_forma_pagamento?: 'credito' | 'debito' | 'dinheiro' | 'pix' | 'boleto';
  ds_status: 'pendente' | 'pago' | 'cancelado' | 'estornado';
  dt_vencimento?: string;
  dt_pagamento?: string;
  dt_competencia?: string;
  nr_parcela?: number;
  nr_total_parcelas?: number;
  dt_criacao: string;
}

export interface TransacoesResponse {
  items: Transacao[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface TransacoesFiltros {
  id_empresa?: string;
  ds_tipo?: 'entrada' | 'saida' | 'transferencia';
  ds_status?: 'pendente' | 'pago' | 'cancelado' | 'estornado';
  dt_inicio?: string;
  dt_fim?: string;
  page?: number;
  size?: number;
}

export interface CriarTransacaoData {
  id_empresa?: string;
  id_categoria?: string;
  id_agendamento?: string;
  id_pedido?: string;
  ds_tipo: 'entrada' | 'saida' | 'transferencia';
  vl_valor: number;
  vl_taxa?: number;
  ds_descricao: string;
  ds_observacoes?: string;
  ds_forma_pagamento?: 'credito' | 'debito' | 'dinheiro' | 'pix' | 'boleto';
  ds_status?: 'pendente' | 'pago' | 'cancelado' | 'estornado';
  dt_vencimento?: string;
  dt_competencia?: string;
  nr_parcela?: number;
  nr_total_parcelas?: number;
}

export interface EstatisticasFinanceiras {
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  total_pendentes: number;
  qtd_entradas: number;
  qtd_saidas: number;
}

export interface EstatisticasFiltros {
  id_empresa?: string;
  dt_inicio?: string;
  dt_fim?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar transações com filtros
 */
export function useTransacoes(filtros: TransacoesFiltros = {}) {
  const { page = 1, size = 20, ...params } = filtros;

  const { data, error, isLoading } = useSWR<TransacoesResponse>(
    [endpoints.transacoes.list, page, size, JSON.stringify(params)],
    () =>
      apiClient.get(endpoints.transacoes.list, {
        params: { page, size, ...params },
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    transacoes: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter estatísticas financeiras
 */
export function useEstatisticasFinanceiras(filtros: EstatisticasFiltros = {}) {
  const { data, error, isLoading } = useSWR<EstatisticasFinanceiras>(
    [endpoints.transacoes.stats, JSON.stringify(filtros)],
    () =>
      apiClient.get(endpoints.transacoes.stats, {
        params: filtros,
      }),
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Atualiza a cada 30 segundos
      dedupingInterval: 5000,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Criar nova transação
 */
export async function criarTransacao(data: CriarTransacaoData): Promise<Transacao> {
  const response = await apiClient.post<Transacao>(endpoints.transacoes.create, data);

  // Revalidar lista de transações e estatísticas
  mutate((key) => Array.isArray(key) && key[0] === endpoints.transacoes.list);
  mutate((key) => Array.isArray(key) && key[0] === endpoints.transacoes.stats);

  return response;
}

/**
 * Atualizar status de transação
 */
export async function atualizarStatusTransacao(
  transacaoId: string,
  novoStatus: 'pago' | 'cancelado' | 'estornado'
): Promise<{ message: string }> {
  const response = await apiClient.put<{ message: string }>(
    endpoints.transacoes.updateStatus(transacaoId),
    null,
    {
      params: { novo_status: novoStatus },
    }
  );

  // Revalidar lista de transações e estatísticas
  mutate((key) => Array.isArray(key) && key[0] === endpoints.transacoes.list);
  mutate((key) => Array.isArray(key) && key[0] === endpoints.transacoes.stats);

  return response;
}

/**
 * Revalidar transações
 */
export function revalidarTransacoes() {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.transacoes.list);
}

/**
 * Revalidar estatísticas financeiras
 */
export function revalidarEstatisticas() {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.transacoes.stats);
}
