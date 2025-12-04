/**
 * Hook para gerenciar transações financeiras e faturas
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';

export interface Transacao {
  id_transacao: string;
  id_empresa: string;
  id_fatura?: string;
  id_user?: string;
  nm_user?: string;
  ds_tipo: 'receita' | 'despesa';
  ds_categoria: string;
  vl_valor: number;
  ds_descricao?: string;
  dt_transacao: string;
  ds_forma_pagamento?: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto';
  ds_status: 'pendente' | 'pago' | 'cancelado' | 'estornado';
  dt_vencimento?: string;
  dt_pagamento?: string;
  ds_observacoes?: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface Fatura {
  id_fatura: string;
  id_empresa: string;
  id_user?: string;
  nm_user?: string;
  id_agendamento?: string;
  nr_numero_fatura: string;
  vl_total: number;
  vl_desconto: number;
  vl_final: number;
  ds_status: 'pendente' | 'pago' | 'parcialmente_pago' | 'cancelado' | 'vencido';
  dt_emissao: string;
  dt_vencimento: string;
  dt_pagamento?: string;
  ds_forma_pagamento?: string;
  ds_observacoes?: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface TransacoesFiltros {
  id_empresa?: string;
  id_user?: string;
  ds_tipo?: 'receita' | 'despesa';
  ds_categoria?: string;
  ds_status?: 'pendente' | 'pago' | 'cancelado' | 'estornado';
  dt_inicio?: string;
  dt_fim?: string;
  page?: number;
  size?: number;
}

export interface FaturasFiltros {
  id_empresa?: string;
  id_user?: string;
  ds_status?: 'pendente' | 'pago' | 'parcialmente_pago' | 'cancelado' | 'vencido';
  dt_inicio?: string;
  dt_fim?: string;
  page?: number;
  size?: number;
}

export interface CreateTransacaoDto {
  id_empresa: string;
  id_fatura?: string;
  id_user?: string;
  ds_tipo: 'receita' | 'despesa';
  ds_categoria: string;
  vl_valor: number;
  ds_descricao?: string;
  dt_transacao: string;
  ds_forma_pagamento?: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto';
  ds_status?: 'pendente' | 'pago' | 'cancelado' | 'estornado';
  dt_vencimento?: string;
  dt_pagamento?: string;
  ds_observacoes?: string;
}

export type UpdateTransacaoDto = Partial<CreateTransacaoDto>;

export interface CreateFaturaDto {
  id_empresa: string;
  id_user?: string;
  id_agendamento?: string;
  vl_total: number;
  vl_desconto?: number;
  dt_emissao: string;
  dt_vencimento: string;
  ds_observacoes?: string;
}

export interface UpdateFaturaDto extends Partial<CreateFaturaDto> {
  ds_status?: 'pendente' | 'pago' | 'parcialmente_pago' | 'cancelado' | 'vencido';
  dt_pagamento?: string;
  ds_forma_pagamento?: string;
}

// Hooks para Transações
export function useTransacoes(filtros: TransacoesFiltros = {}) {
  return useQuery<Transacao, TransacoesFiltros>({
    endpoint: '/transacoes/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function useTransacao(id_transacao: string) {
  return useQuerySingle<Transacao>({
    endpoint: `/transacoes/${id_transacao}/`,
    enabled: !!id_transacao,
  });
}

export function useCreateTransacao() {
  return useMutation<Transacao, CreateTransacaoDto>({
    method: 'POST',
    endpoint: '/transacoes/',
  });
}

export function useUpdateTransacao(id_transacao: string) {
  return useMutation<Transacao, UpdateTransacaoDto>({
    method: 'PUT',
    endpoint: `/transacoes/${id_transacao}/`,
  });
}

export function useDeleteTransacao(id_transacao: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/transacoes/${id_transacao}/`,
  });
}

// Hooks para Faturas
export function useFaturas(filtros: FaturasFiltros = {}) {
  return useQuery<Fatura, FaturasFiltros>({
    endpoint: '/faturas/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function useFatura(id_fatura: string) {
  return useQuerySingle<Fatura>({
    endpoint: `/faturas/${id_fatura}/`,
    enabled: !!id_fatura,
  });
}

export function useCreateFatura() {
  return useMutation<Fatura, CreateFaturaDto>({
    method: 'POST',
    endpoint: '/faturas/',
  });
}

export function useUpdateFatura(id_fatura: string) {
  return useMutation<Fatura, UpdateFaturaDto>({
    method: 'PUT',
    endpoint: `/faturas/${id_fatura}/`,
  });
}

export function useDeleteFatura(id_fatura: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/faturas/${id_fatura}/`,
  });
}

// Estatísticas financeiras
export interface FinanceiroStats {
  vl_total_receitas: number;
  vl_total_despesas: number;
  vl_saldo: number;
  nr_faturas_pendentes: number;
  vl_faturas_pendentes: number;
  nr_faturas_vencidas: number;
  vl_faturas_vencidas: number;
}

export function useFinanceiroStats(id_empresa: string, dt_inicio?: string, dt_fim?: string) {
  return useQuerySingle<FinanceiroStats>({
    endpoint: `/financeiro/estatisticas/`,
    enabled: !!id_empresa,
  });
}

// Actions helpers
export function useMarcarFaturaPaga(id_fatura: string) {
  return useMutation<Fatura, { dt_pagamento: string; ds_forma_pagamento: string }>({
    method: 'PUT',
    endpoint: `/faturas/${id_fatura}/marcar-paga/`,
  });
}

export function useCancelarFatura(id_fatura: string) {
  return useMutation<Fatura, { ds_motivo?: string }>({
    method: 'PUT',
    endpoint: `/faturas/${id_fatura}/cancelar/`,
  });
}
