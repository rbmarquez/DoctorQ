/**
 * Hook SWR para gerenciamento de Anamneses
 * UC032 - Registrar Anamnese
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ========== Types ==========

export interface PerguntaAnamnese {
  id_pergunta: string;
  nm_pergunta: string;
  tp_resposta: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'number' | 'boolean';
  fg_obrigatoria: boolean;
  ds_opcoes?: string[];
  ds_ajuda?: string;
  vl_minimo?: number;
  vl_maximo?: number;
  nr_ordem: number;
}

export interface RespostaAnamnese {
  id_pergunta: string;
  vl_resposta: any;
}

export interface AlertaAnamnese {
  tp_alerta: 'critico' | 'atencao' | 'informativo';
  nm_alerta: string;
  ds_alerta: string;
  id_pergunta?: string;
}

export interface AnamneseTemplate {
  id_template: string;
  id_empresa?: string;
  nm_template: string;
  ds_template?: string;
  tp_template: string;
  ds_perguntas: PerguntaAnamnese[];
  ds_regras_validacao?: any;
  ds_regras_alertas?: any;
  fg_ativo: boolean;
  fg_publico: boolean;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface Anamnese {
  id_anamnese: string;
  id_empresa: string;
  id_paciente: string;
  id_profissional?: string;
  id_procedimento?: string;
  id_template: string;
  ds_respostas: RespostaAnamnese[];
  ds_observacoes?: string;
  fg_alertas_criticos: boolean;
  ds_alertas?: AlertaAnamnese[];
  nm_assinatura_paciente?: string;
  dt_assinatura_paciente?: string;
  nm_assinatura_profissional?: string;
  dt_assinatura_profissional?: string;
  fg_ativo: boolean;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface AnamneseCreateRequest {
  id_paciente: string;
  id_template: string;
  id_procedimento?: string;
  ds_respostas: RespostaAnamnese[];
  ds_observacoes?: string;
  nm_assinatura_paciente?: string;
}

export interface AnamneseUpdateRequest {
  ds_respostas?: RespostaAnamnese[];
  ds_observacoes?: string;
  nm_assinatura_profissional?: string;
}

export interface AnamneseAssinaturaRequest {
  nm_assinatura: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

// ========== Templates Hooks ==========

/**
 * Hook para listar templates de anamnese
 */
export function useAnamneseTemplates(params?: {
  tp_template?: string;
  apenas_ativos?: boolean;
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.tp_template) queryParams.set('tp_template', params.tp_template);
  if (params?.apenas_ativos !== undefined) queryParams.set('apenas_ativos', params.apenas_ativos.toString());
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.size) queryParams.set('size', params.size.toString());

  const queryString = queryParams.toString();
  const endpoint = `/anamneses/templates/${queryString ? `?${queryString}` : ''}`;

  return useSWR<PaginatedResponse<AnamneseTemplate>>(endpoint);
}

/**
 * Hook para buscar template específico
 */
export function useAnamneseTemplate(id_template?: string) {
  return useSWR<AnamneseTemplate>(
    id_template ? `/anamneses/templates/${id_template}/` : null
  );
}

// ========== Anamneses Hooks ==========

/**
 * Hook para listar anamneses
 */
export function useAnamneses(params?: {
  id_paciente?: string;
  id_profissional?: string;
  id_procedimento?: string;
  apenas_com_alertas?: boolean;
  apenas_ativos?: boolean;
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.id_paciente) queryParams.set('id_paciente', params.id_paciente);
  if (params?.id_profissional) queryParams.set('id_profissional', params.id_profissional);
  if (params?.id_procedimento) queryParams.set('id_procedimento', params.id_procedimento);
  if (params?.apenas_com_alertas !== undefined) queryParams.set('apenas_com_alertas', params.apenas_com_alertas.toString());
  if (params?.apenas_ativos !== undefined) queryParams.set('apenas_ativos', params.apenas_ativos.toString());
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.size) queryParams.set('size', params.size.toString());

  const queryString = queryParams.toString();
  const endpoint = `/anamneses/${queryString ? `?${queryString}` : ''}`;

  return useSWR<PaginatedResponse<Anamnese>>(endpoint);
}

/**
 * Hook para buscar anamnese específica
 */
export function useAnamnese(id_anamnese?: string) {
  return useSWR<Anamnese>(
    id_anamnese ? `/anamneses/${id_anamnese}/` : null
  );
}

// ========== Mutations ==========

/**
 * Cria novo template de anamnese
 */
export async function createAnamneseTemplate(
  data: Partial<AnamneseTemplate>
): Promise<AnamneseTemplate> {
  const response = await apiClient.post('/anamneses/templates/', data);
  return response.data;
}

/**
 * Atualiza template de anamnese
 */
export async function updateAnamneseTemplate(
  id_template: string,
  data: Partial<AnamneseTemplate>
): Promise<AnamneseTemplate> {
  const response = await apiClient.put(`/anamneses/templates/${id_template}/`, data);
  return response.data;
}

/**
 * Cria template padrão de anamnese geral
 */
export async function createTemplatePadrao(): Promise<AnamneseTemplate> {
  const response = await apiClient.post('/anamneses/templates/padrao/');
  return response.data;
}

/**
 * Cria nova anamnese
 */
export async function createAnamnese(
  data: AnamneseCreateRequest
): Promise<Anamnese> {
  const response = await apiClient.post('/anamneses/', data);
  return response.data;
}

/**
 * Atualiza anamnese
 */
export async function updateAnamnese(
  id_anamnese: string,
  data: AnamneseUpdateRequest
): Promise<Anamnese> {
  const response = await apiClient.put(`/anamneses/${id_anamnese}/`, data);
  return response.data;
}

/**
 * Paciente assina anamnese
 */
export async function assinarAnamnesePaciente(
  id_anamnese: string,
  data: AnamneseAssinaturaRequest
): Promise<{ id_anamnese: string; nm_assinatura: string; dt_assinatura: string; tp_assinatura: string }> {
  const response = await apiClient.post(`/anamneses/${id_anamnese}/assinar-paciente/`, data);
  return response.data;
}

/**
 * Profissional assina anamnese
 */
export async function assinarAnamneseProfissional(
  id_anamnese: string,
  data: AnamneseAssinaturaRequest
): Promise<{ id_anamnese: string; nm_assinatura: string; dt_assinatura: string; tp_assinatura: string }> {
  const response = await apiClient.post(`/anamneses/${id_anamnese}/assinar-profissional/`, data);
  return response.data;
}

/**
 * Desativa anamnese (soft delete)
 */
export async function desativarAnamnese(id_anamnese: string): Promise<void> {
  await apiClient.delete(`/anamneses/${id_anamnese}/`);
}
