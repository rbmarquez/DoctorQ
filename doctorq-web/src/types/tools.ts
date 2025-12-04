// Tipos para o sistema de tools
// Adaptado do ViaFacil com funcionalidades MCP

export interface Tool {
  id_tool: string;
  nm_tool: string;
  ds_tool?: string;
  tp_tool: ToolType;
  ds_config: GenericToolConfig; // JSONB no backend
  fg_ativo: boolean; // Alinhado com padrão DoctorQ
  dt_criacao: string;
  dt_atualizacao?: string;
  id_empresa?: string; // Multi-tenant

  // Compatibilidade com código legado
  config_tool?: GenericToolConfig;
  st_ativo?: boolean;
}

export interface ToolCreate {
  nm_tool: string;
  ds_tool?: string;
  tp_tool: ToolType;
  config_tool: GenericToolConfig;
  st_ativo?: boolean;
}

export interface ToolUpdate {
  nm_tool?: string;
  ds_tool?: string;
  tp_tool?: ToolType;
  config_tool?: GenericToolConfig;
  st_ativo?: boolean;
}

export interface ToolResponse {
  id_tool: string;
  nm_tool: string;
  ds_tool?: string;
  tp_tool: ToolType;
  config_tool: GenericToolConfig;
  st_ativo: boolean;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ToolListResponse {
  items: ToolResponse[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// Enum para os tipos de tools suportados
export enum ToolType {
  API = "api",
  FUNCTION = "function",
  EXTERNAL = "external",
  RAG = "rag",
  RAG_QDRANT = "rag_qdrant",
  RAG_POSTGRES = "rag_postgres",
  CUSTOM_INTERNA = "custom_interna",
  MCP = "mcp", // Model Context Protocol
}

export interface ToolFilters {
  search?: string;
  tp_tool?: ToolType;
  st_ativo?: boolean;
  order_by?: string;
  order_desc?: boolean;
  page?: number;
  size?: number;
}

// Interface para parâmetros de API
export interface ApiParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  location: "body" | "query" | "header" | "path";
  required: boolean;
  description?: string;
  default?: any;
}

// Interface para endpoint de API
export interface ApiEndpoint {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  timeout?: number;
  parameters?: ApiParameter[];
  max_retries?: number;
}

// Interface para autenticação de API
export interface ApiAuth {
  type: "none" | "bearer" | "basic" | "api_key" | "custom" | "oauth2";
  token?: string;
  username?: string;
  password?: string;
  api_key?: string;
  header_name?: string;
  // Campos para autenticação customizada
  custom_header_name?: string;
  custom_header_value?: string;
  client_id?: string;
  client_secret?: string;
}

// Interface para configuração de tools do tipo API
export interface ApiToolConfig {
  auth: ApiAuth;
  endpoint: ApiEndpoint;
}

export interface FunctionToolConfig {
  name?: string;
  function_name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  code?: string;
}

export interface ExternalToolConfig {
  name?: string;
  description?: string;
  endpoint: string;
  integration_type: string;
  credentials_id?: string;
  settings?: Record<string, any>;
}

export interface RagToolConfig {
  name?: string;
  description?: string;
  vector_store: string;
  embedding_model: string;
  similarity_threshold?: number;
  max_results?: number;
  metadata_filters?: Record<string, any>;
}

export interface CustomInternaToolConfig {
  name?: string;
  description?: string;
  service_name: string;
  method_name: string;
  parameters?: Record<string, any>;
}

// Interface base para qualquer configuração de tool
export interface BaseToolConfig {
  name?: string;
  description?: string;
  [key: string]: any; // Permite propriedades adicionais
}

// Tipo união para as configurações baseadas no tipo da tool
export type ToolConfig = {
  api: ApiToolConfig;
  function: FunctionToolConfig;
  external: ExternalToolConfig;
  rag: RagToolConfig;
  custom_interna: CustomInternaToolConfig;
};

// Tipo para configuração genérica (usado no formulário)
export type GenericToolConfig = BaseToolConfig & Record<string, any>;

// Função helper para mapear tipos técnicos em nomes amigáveis
export const getToolTypeName = (type: ToolType): string => {
  const typeNames: Record<ToolType, string> = {
    [ToolType.API]: "API",
    [ToolType.FUNCTION]: "Função",
    [ToolType.EXTERNAL]: "Externa",
    [ToolType.RAG]: "RAG",
    [ToolType.RAG_QDRANT]: "RAG Qdrant",
    [ToolType.RAG_POSTGRES]: "RAG PostgreSQL",
    [ToolType.CUSTOM_INTERNA]: "Customizada Interna",
  };
  return typeNames[type] || type;
};

// Função helper para mapear status para string amigável
export const getToolStatusName = (status: boolean): string => {
  return status ? "Ativo" : "Inativo";
};

// ==================== CONFIGURAÇÕES MCP (Model Context Protocol) ====================

export interface McpToolConfig {
  command: string; // search, generate_text, summarize, database_query, uvx
  arguments: string[];
  capabilities: string[];
  env_variables?: Record<string, string>;
  base_url?: string;
  endpoints?: Record<string, string>;
  headers?: Record<string, string>;
}

// ==================== CONFIGURAÇÕES RAG DETALHADAS ====================

export interface RagQdrantConfig {
  collection_name: string;
  qdrant_credential_id: string; // UUID da credencial Qdrant
  embedding_credential_id: string; // UUID da credencial Azure OpenAI Embedding
  similarity_threshold?: number; // 0.0 a 1.0
  max_results?: number; // 1 a 100
}

export interface RagPostgresConfig {
  postgresql_credential_id: string; // UUID da credencial PostgreSQL
  namespace: string; // Schema ou namespace
  embedding_credential_id: string; // UUID da credencial Azure OpenAI Embedding
  similarity_threshold?: number; // 0.0 a 1.0
  max_results?: number; // 1 a 100
}

// ==================== HELPERS E UTILITÁRIOS ====================

/**
 * Verifica se uma configuração é do tipo MCP
 */
export function isMcpToolConfig(config: any): config is McpToolConfig {
  return (
    config &&
    typeof config === "object" &&
    "command" in config &&
    "arguments" in config
  );
}

/**
 * Verifica se uma configuração é do tipo RAG Qdrant
 */
export function isRagQdrantConfig(config: any): config is RagQdrantConfig {
  return (
    config &&
    typeof config === "object" &&
    "collection_name" in config &&
    "qdrant_credential_id" in config
  );
}

/**
 * Verifica se uma configuração é do tipo RAG Postgres
 */
export function isRagPostgresConfig(config: any): config is RagPostgresConfig {
  return (
    config &&
    typeof config === "object" &&
    "postgresql_credential_id" in config &&
    "namespace" in config
  );
}

/**
 * Retorna configuração padrão para cada tipo de tool
 */
export function getDefaultToolConfig(tipo: ToolType): GenericToolConfig {
  switch (tipo) {
    case ToolType.API:
      return {
        auth: {
          type: "none",
        },
        endpoint: {
          url: "",
          method: "GET",
          headers: {},
          timeout: 30,
          max_retries: 3,
        },
      } as ApiToolConfig;

    case ToolType.RAG_QDRANT:
      return {
        collection_name: "",
        qdrant_credential_id: "",
        embedding_credential_id: "",
        similarity_threshold: 0.7,
        max_results: 5,
      } as RagQdrantConfig;

    case ToolType.RAG_POSTGRES:
      return {
        postgresql_credential_id: "",
        namespace: "public",
        embedding_credential_id: "",
        similarity_threshold: 0.7,
        max_results: 5,
      } as RagPostgresConfig;

    case ToolType.FUNCTION:
      return {
        function_name: "",
        description: "",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      } as FunctionToolConfig;

    case ToolType.EXTERNAL:
      return {
        endpoint: "",
        integration_type: "rest_api",
        settings: {},
      } as ExternalToolConfig;

    case ToolType.MCP:
      return {
        command: "",
        arguments: [],
        capabilities: [],
        env_variables: {},
      } as McpToolConfig;

    case ToolType.CUSTOM_INTERNA:
      return {
        service_name: "",
        method_name: "",
        parameters: {},
      } as CustomInternaToolConfig;

    default:
      return {};
  }
}

// Labels amigáveis atualizados
export const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  [ToolType.API]: "API REST",
  [ToolType.FUNCTION]: "Função Customizada",
  [ToolType.EXTERNAL]: "Integração Externa",
  [ToolType.RAG]: "RAG Genérico",
  [ToolType.RAG_QDRANT]: "RAG Qdrant (Vector DB)",
  [ToolType.RAG_POSTGRES]: "RAG PostgreSQL (pgvector)",
  [ToolType.CUSTOM_INTERNA]: "Customizada Interna",
  [ToolType.MCP]: "Model Context Protocol (MCP)",
};

// ==================== INTERFACE PARA EXECUTE ====================

export interface ToolExecuteRequest {
  id_tool: string;
  parameters: Record<string, any>;
}

export interface ToolExecuteResponse {
  success: boolean;
  result?: any;
  error?: string;
  execution_time?: number; // em ms
}
