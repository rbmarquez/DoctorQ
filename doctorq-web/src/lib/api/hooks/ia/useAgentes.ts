/**
 * Hook para gerenciamento de Agentes de IA
 * Usa o AI Service dedicado (estetiQ-service-ai)
 */

import { useQuery, useQuerySingle, useMutation } from '../ai-factory';
import type { BaseFilterParams } from '../../types';

// ====================================================================
// TYPES
// ====================================================================

export interface ModelConfig {
  id_credencial: string | null;
  temperature: number;
  top_p: number;
  max_tokens: number;
  stream: boolean;
  timeout: number;
}

export interface ToolConfig {
  id: string;
  nome: string;
  ativo: boolean;
  configuracao?: Record<string, any>;
}

export interface MemoryConfig {
  ativo: boolean;
  tipo?: 'conversation_buffer' | 'conversation_summary' | 'conversation_buffer_window' | 'conversation_token_buffer';
  credencialId?: string | null;
  configuracao?: Record<string, any>;
}

export interface ObservabilityConfig {
  ativo: boolean;
  credencialId?: string | null;
  tipo?: 'langfuse';
}

export interface Knowledge {
  credentialId: string;
}

export interface DocumentStore {
  documentStoreId: string;
  topK: number;
  enableEmbeddings: boolean;
  embeddingCredentialId?: string | null;
}

export interface KnowledgeConfig {
  ativo: boolean;
  knowledges: Knowledge[];
  documentStores: DocumentStore[];
}

export interface AgenteConfig {
  tools: ToolConfig[];
  model: ModelConfig;
  observability?: ObservabilityConfig;
  memory: MemoryConfig;
  knowledge: KnowledgeConfig;
}

export interface Agente {
  id_agente: string;
  nm_agente: string;
  ds_prompt: string;
  ds_config: AgenteConfig | Record<string, any> | null;
  st_principal: boolean;
  id_empresa?: string | null;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface AgentesFiltros extends BaseFilterParams {
  search?: string;
  principal?: boolean;
  id_empresa?: string;
}

export interface CriarAgenteData {
  nm_agente: string;
  ds_prompt: string;
  ds_config?: AgenteConfig | Record<string, any>;
  st_principal?: boolean;
}

export interface AtualizarAgenteData {
  nm_agente?: string;
  ds_prompt?: string;
  ds_config?: AgenteConfig | Record<string, any>;
  st_principal?: boolean;
}

// ====================================================================
// HOOKS
// ====================================================================

/**
 * Hook para listar agentes de IA
 *
 * @example
 * ```tsx
 * const { data: agentes, meta, isLoading } = useAgentes({
 *   page: 1,
 *   size: 10,
 *   search: 'termo',
 * });
 * ```
 */
export function useAgentes(filtros: AgentesFiltros = {}) {
  return useQuery<Agente, AgentesFiltros>({
    endpoint: '/agentes/',
    params: {
      page: 1,
      size: 10,
      ...filtros,
    },
  });
}

/**
 * Hook para obter um agente específico por ID
 *
 * @example
 * ```tsx
 * const { data: agente, isLoading } = useAgente(agenteId);
 * ```
 */
export function useAgente(id: string | undefined) {
  return useQuerySingle<Agente>({
    endpoint: id ? `/agentes/${id}` : '',
    enabled: !!id,
  });
}

/**
 * Hook para criar agente
 */
export function useCreateAgente() {
  return useMutation<Agente, CriarAgenteData>({
    method: 'POST',
    endpoint: '/agentes/',
  });
}

/**
 * Hook para atualizar agente
 */
export function useUpdateAgente(id: string) {
  return useMutation<Agente, AtualizarAgenteData>({
    method: 'PUT',
    endpoint: `/agentes/${id}`,
  });
}

/**
 * Hook para deletar agente
 */
export function useDeleteAgente(id: string) {
  return useMutation<{ message: string }>({
    method: 'DELETE',
    endpoint: `/agentes/${id}`,
  });
}

// ====================================================================
// HELPERS
// ====================================================================

/**
 * Verifica se um agente é principal
 */
export function isAgentePrincipal(agente: Agente): boolean {
  return agente.st_principal === true;
}

/**
 * Verifica se um agente tem ferramentas configuradas
 */
export function hasTools(agente: Agente): boolean {
  if (!agente.ds_config || typeof agente.ds_config !== 'object') {
    return false;
  }
  const config = agente.ds_config as AgenteConfig;
  return config.tools && config.tools.length > 0;
}

/**
 * Cria uma configuração padrão para novo agente
 */
export function criarConfigPadrao(): AgenteConfig {
  return {
    tools: [],
    model: {
      id_credencial: null,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 4000,
      stream: true,
      timeout: 300,
    },
    observability: {
      ativo: false,
    },
    memory: {
      ativo: false,
    },
    knowledge: {
      ativo: false,
      knowledges: [],
      documentStores: [],
    },
  };
}

/**
 * Formata a temperatura para exibição
 */
export function formatarTemperatura(temp: number): string {
  if (temp === 0) return 'Determinístico';
  if (temp < 0.3) return 'Muito Baixo';
  if (temp < 0.5) return 'Baixo';
  if (temp < 0.7) return 'Médio';
  if (temp < 0.9) return 'Alto';
  return 'Muito Alto (Criativo)';
}
