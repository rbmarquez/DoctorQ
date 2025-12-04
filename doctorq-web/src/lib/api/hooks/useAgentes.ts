/**
 * Hook SWR para gerenciamento de Agentes de IA
 * Agentes são assistentes inteligentes configuráveis com LLMs, ferramentas, memória e conhecimento
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

// Agent Config Types
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

export interface AgentesResponse {
  items: Agente[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface AgentesFiltros {
  search?: string;
  principal?: boolean;
  id_empresa?: string;
  page?: number;
  size?: number;
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
 */
export function useAgentes(filtros: AgentesFiltros = {}) {
  const { search, principal, id_empresa, page = 1, size = 10 } = filtros;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (principal !== undefined) params.append('principal', String(principal));
  if (id_empresa) params.append('id_empresa', id_empresa);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const key = `/agentes/?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<AgentesResponse>(
    key,
    async () => {
      try {
        return await apiClient.get<AgentesResponse>(key);
      } catch (err) {
        console.error("Falha ao carregar agentes:", err);
        return {
          items: [],
          meta: {
            totalItems: 0,
            itemsPerPage: size,
            totalPages: 0,
            currentPage: page,
          },
        };
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
    }
  );

  return {
    agentes: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para obter um agente específico por ID
 */
export function useAgente(agenteId: string | null) {
  const shouldFetch = Boolean(agenteId);

  const { data, error, isLoading, mutate } = useSWR<Agente>(
    shouldFetch ? `/agentes/${agenteId}` : null,
    async () => {
      try {
        return await apiClient.get<Agente>(`/agentes/${agenteId}`);
      } catch (err) {
        console.error("Falha ao carregar agente:", err);
        return undefined as unknown as Agente;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
    }
  );

  return {
    agente: data,
    isLoading,
    error,
    mutate,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

/**
 * Cria um novo agente
 */
export async function criarAgente(data: CriarAgenteData): Promise<Agente> {
  return await apiClient.post<Agente>('/agentes/', data);
}

/**
 * Atualiza um agente existente
 */
export async function atualizarAgente(
  agenteId: string,
  data: AtualizarAgenteData
): Promise<Agente> {
  return await apiClient.put<Agente>(`/agentes/${agenteId}`, data);
}

/**
 * Deleta um agente
 */
export async function deletarAgente(agenteId: string): Promise<{ message: string }> {
  return await apiClient.delete<{ message: string }>(`/agentes/${agenteId}`);
}

/**
 * Adiciona uma ferramenta a um agente
 */
export async function adicionarToolAgente(
  agenteId: string,
  toolId: string
): Promise<{ message: string }> {
  return await apiClient.post<{ message: string }>(
    `/agentes/${agenteId}/add-tool`,
    { tool_id: toolId }
  );
}

/**
 * Remove uma ferramenta de um agente
 */
export async function removerToolAgente(
  agenteId: string,
  toolId: string
): Promise<{ message: string }> {
  return await apiClient.delete<{ message: string }>(
    `/agentes/${agenteId}/remove-tool`,
    { body: JSON.stringify({ tool_id: toolId }) }
  );
}

/**
 * Adiciona um document store a um agente
 */
export async function adicionarDocumentStoreAgente(
  agenteId: string,
  documentStoreId: string,
  config?: { topK?: number; enableEmbeddings?: boolean; embeddingCredentialId?: string }
): Promise<{ message: string }> {
  return await apiClient.post<{ message: string }>(
    `/agentes/${agenteId}/document-stores`,
    {
      document_store_id: documentStoreId,
      ...config,
    }
  );
}

/**
 * Remove um document store de um agente
 */
export async function removerDocumentStoreAgente(
  agenteId: string,
  documentStoreId: string
): Promise<{ message: string }> {
  return await apiClient.delete<{ message: string }>(
    `/agentes/${agenteId}/document-stores/${documentStoreId}`
  );
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

export async function revalidarAgentes(): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.startsWith('/agentes/?'));
}

export async function revalidarAgente(agenteId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate(`/agentes/${agenteId}`);
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
 * Verifica se streaming está habilitado
 */
export function isStreamingEnabled(agente: Agente): boolean {
  if (!agente.ds_config || typeof agente.ds_config !== 'object') {
    return true; // Default
  }
  const config = agente.ds_config as AgenteConfig;
  return config.model?.stream ?? true;
}

/**
 * Verifica se memória está habilitada
 */
export function isMemoryEnabled(agente: Agente): boolean {
  if (!agente.ds_config || typeof agente.ds_config !== 'object') {
    return false;
  }
  const config = agente.ds_config as AgenteConfig;
  return config.memory?.ativo ?? false;
}

/**
 * Verifica se observabilidade está habilitada
 */
export function isObservabilityEnabled(agente: Agente): boolean {
  if (!agente.ds_config || typeof agente.ds_config !== 'object') {
    return false;
  }
  const config = agente.ds_config as AgenteConfig;
  return config.observability?.ativo ?? false;
}

/**
 * Verifica se knowledge base está habilitada
 */
export function isKnowledgeEnabled(agente: Agente): boolean {
  if (!agente.ds_config || typeof agente.ds_config !== 'object') {
    return false;
  }
  const config = agente.ds_config as AgenteConfig;
  return config.knowledge?.ativo ?? false;
}

/**
 * Obtém o nome/ID da credencial do modelo
 */
export function getModelCredentialId(agente: Agente): string | null {
  if (!agente.ds_config || typeof agente.ds_config !== 'object') {
    return null;
  }
  const config = agente.ds_config as AgenteConfig;
  return config.model?.id_credencial ?? null;
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

/**
 * Obtém badge de status do agente
 */
export function getBadgeStatus(agente: Agente): {
  label: string;
  color: string;
} {
  if (agente.st_principal) {
    return { label: 'Principal', color: 'blue' };
  }
  return { label: 'Secundário', color: 'gray' };
}
