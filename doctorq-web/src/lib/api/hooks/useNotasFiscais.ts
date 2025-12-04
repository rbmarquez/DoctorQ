/**
 * Hook SWR para gerenciamento de Notas Fiscais
 * UC063 - Emitir Nota Fiscal
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ========== Types ==========

export interface NotaFiscal {
  id_nota_fiscal: string;
  id_empresa: string;
  id_pedido?: string;
  id_fatura?: string;
  tp_nota: 'nfse' | 'nfe';
  nr_nota?: string;
  ds_serie?: string;
  nr_rps: string;
  st_nota: 'pendente' | 'emitida' | 'cancelada' | 'erro';
  ds_status_mensagem?: string;
  vl_servicos: number;
  vl_deducoes?: number;
  vl_pis?: number;
  vl_cofins?: number;
  vl_inss?: number;
  vl_ir?: number;
  vl_csll?: number;
  vl_iss?: number;
  vl_desconto_condicionado?: number;
  vl_desconto_incondicionado?: number;
  vl_outras_retencoes?: number;
  vl_total_tributos?: number;
  vl_liquido: number;
  pc_aliquota_iss?: number;
  ds_tomador_cnpj_cpf: string;
  ds_tomador_razao_social: string;
  ds_tomador_email?: string;
  ds_tomador_endereco?: any;
  ds_prestador_cnpj: string;
  ds_prestador_razao_social: string;
  ds_prestador_inscricao_municipal?: string;
  ds_prestador_endereco?: any;
  ds_discriminacao: string;
  ds_codigo_servico?: string;
  ds_item_lista_servico?: string;
  ds_codigo_tributacao_municipio?: string;
  ds_provedor_nfe?: string;
  ds_ref_externa?: string;
  ds_chave_acesso?: string;
  ds_codigo_verificacao?: string;
  ds_url_nfe?: string;
  ds_url_pdf?: string;
  ds_xml_rps?: string;
  ds_xml_nfe?: string;
  ds_dados_completos?: any;
  fg_cancelada: boolean;
  dt_cancelamento?: string;
  ds_motivo_cancelamento?: string;
  dt_emissao?: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface NotaFiscalCreateRequest {
  id_pedido?: string;
  id_fatura?: string;
  vl_servicos: number;
  ds_tomador_cnpj_cpf: string;
  ds_tomador_razao_social: string;
  ds_tomador_email?: string;
  ds_discriminacao: string;
  ds_codigo_servico?: string;
  ds_provedor_nfe?: 'focus_nfe' | 'enotas' | 'nfse_nacional';
  pc_aliquota_iss?: number;
}

export interface NotaFiscalCancelarRequest {
  motivo: string;
}

export interface NotaFiscalReenvioRequest {
  email: string;
}

export interface NotaFiscalEstatisticas {
  total_notas: number;
  total_emitidas: number;
  total_canceladas: number;
  total_pendentes: number;
  total_erro: number;
  vl_total_faturado: number;
  vl_total_iss: number;
  vl_total_tributos: number;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

// ========== Hooks ==========

/**
 * Hook para listar notas fiscais
 */
export function useNotasFiscais(params?: {
  status_nota?: 'pendente' | 'emitida' | 'cancelada' | 'erro';
  dt_inicio?: string;
  dt_fim?: string;
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status_nota) queryParams.set('status_nota', params.status_nota);
  if (params?.dt_inicio) queryParams.set('dt_inicio', params.dt_inicio);
  if (params?.dt_fim) queryParams.set('dt_fim', params.dt_fim);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.size) queryParams.set('size', params.size.toString());

  const queryString = queryParams.toString();
  const endpoint = `/notas-fiscais/${queryString ? `?${queryString}` : ''}`;

  return useSWR<PaginatedResponse<NotaFiscal>>(endpoint);
}

/**
 * Hook para buscar nota fiscal específica
 */
export function useNotaFiscal(id_nota_fiscal?: string) {
  return useSWR<NotaFiscal>(
    id_nota_fiscal ? `/notas-fiscais/${id_nota_fiscal}/` : null
  );
}

/**
 * Hook para obter estatísticas de notas fiscais
 */
export function useNotasFiscaisEstatisticas(params?: {
  dt_inicio?: string;
  dt_fim?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.dt_inicio) queryParams.set('dt_inicio', params.dt_inicio);
  if (params?.dt_fim) queryParams.set('dt_fim', params.dt_fim);

  const queryString = queryParams.toString();
  const endpoint = `/notas-fiscais/estatisticas/${queryString ? `?${queryString}` : ''}`;

  return useSWR<NotaFiscalEstatisticas>(endpoint);
}

// ========== Mutations ==========

/**
 * Emite nova nota fiscal
 */
export async function emitirNotaFiscal(
  data: NotaFiscalCreateRequest
): Promise<NotaFiscal> {
  const response = await apiClient.post('/notas-fiscais/', data);
  return response.data;
}

/**
 * Cancela nota fiscal emitida
 */
export async function cancelarNotaFiscal(
  id_nota_fiscal: string,
  data: NotaFiscalCancelarRequest
): Promise<NotaFiscal> {
  const response = await apiClient.post(`/notas-fiscais/${id_nota_fiscal}/cancelar/`, data);
  return response.data;
}

/**
 * Reenvia nota fiscal por email
 */
export async function reenviarNotaFiscal(
  id_nota_fiscal: string,
  data: NotaFiscalReenvioRequest
): Promise<{ message: string; email: string; id_nota_fiscal: string }> {
  const response = await apiClient.post(`/notas-fiscais/${id_nota_fiscal}/reenviar/`, data);
  return response.data;
}

/**
 * Tenta reemitir nota fiscal com erro
 */
export async function reemitirNotaFiscal(
  id_nota_fiscal: string,
  provedor: 'focus_nfe' | 'enotas' | 'nfse_nacional' = 'focus_nfe'
): Promise<NotaFiscal> {
  const response = await apiClient.post(`/notas-fiscais/${id_nota_fiscal}/reemitir/?provedor=${provedor}`);
  return response.data;
}
