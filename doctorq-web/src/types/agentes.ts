// ========================================
// ENUMS ALINHADOS COM BACKEND
// ========================================

export enum TipoMemoria {
  CONVERSATION_BUFFER = "conversation_buffer",
  CONVERSATION_SUMMARY = "conversation_summary",
  CONVERSATION_BUFFER_WINDOW = "conversation_buffer_window",
  CONVERSATION_TOKEN_BUFFER = "conversation_token_buffer"
}

export enum TipoObservabilidade {
  LANGFUSE = "langfuse"
}

// ========================================
// INTERFACES ALINHADAS COM agent_schemas.py
// ========================================

export interface ModelConfig {
  provider?: string; // azure, openai, anthropic, etc
  id_credencial?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  timeout?: number; // timeout em segundos
  stream?: boolean;
}

export interface ObservabilityConfig {
  ativo: boolean;
  credencialId?: string;
  tipo?: TipoObservabilidade;
}

export interface MemoryConfig {
  ativo: boolean;
  tipo?: TipoMemoria;
  credencialId?: string;
  configuracao?: Record<string, any>;
}

export interface ToolConfig {
  id: string;
  nome: string;
  ativo: boolean;
  configuracao?: Record<string, any>;
}

export interface Knowledge {
  credentialId: string;
}
export interface KnowledgeConfig {
  ativo: boolean;
  knowledges: Knowledge[];
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
  ds_config: AgenteConfig;
  st_principal: boolean;
  dt_criacao: string;
  dt_atualizacao?: string;
  tools: Array<{
    id_tool: string;
    nm_tool: string;
  }>;
}



export interface AgenteListResponse {
  items: Agente[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface AgenteFilters {
  search?: string;
  order_by?: string;
  order_desc?: boolean;
  page?: number;
  size?: number;
}

// Interface para validação de campos de texto grandes
export interface TextFieldValidation {
  field: string;
  minLength?: number;
  maxLength?: number;
  required: boolean;
  label: string;
  placeholder?: string;
  description?: string;
}


// Interfaces para criação e atualização
export interface AgenteCreate {
  nm_agente: string;
  ds_prompt: string;
  ds_config: AgenteConfig;
  st_principal?: boolean;
}

export interface AgenteUpdate {
  nm_agente?: string;
  ds_prompt?: string;
  ds_config: AgenteConfig;
  st_principal?: boolean;
}

// Tipos para filtros específicos de agentes
export type AgenteStatusFilter = 'all' | 'customized' | 'deployed' | 'standard';
export type AgenteOrderBy = 'dt_criacao' | 'dt_atualizacao' | 'nm_agente';

// ========================================
// FACTORY E UTILITÁRIOS (alinhados com backend)
// ========================================

export class AgenteConfigFactory {
  /**
   * Criar configuração padrão para novos agentes
   */
  static createDefaultConfig(): AgenteConfig {
    return {
      tools: [],
      model: {
        id_credencial: "",
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 4000,
        timeout: 300, // 5 minutos
        stream: true
      },
      observability: {
        ativo: false
      },
      memory: {
        ativo: false
      },
      knowledge: {
        ativo: false,
        knowledges: []
      }
    };
  }

  /**
   * Criar configuração otimizada para chat
   */
  static createChatConfig(credencialId: string): AgenteConfig {
    return {
      tools: [],
      model: {

        id_credencial: credencialId,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 2000,
        stream: true
      },
      observability: {
        ativo: false
      },
      memory: {
        ativo: true,
        tipo: TipoMemoria.CONVERSATION_BUFFER_WINDOW,
        credencialId: undefined,
        configuracao: { k: 5 }
      },
      knowledge: {
        ativo: false,
        knowledges: []
      }
    };
  }

  /**
   * Criar configuração otimizada para análise
   */
  static createAnalysisConfig(credencialId: string): AgenteConfig {
    return {
      tools: [],
      model: {
        id_credencial: credencialId,
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 8000,
        stream: false
      },
      observability: {
        ativo: true
      },
      memory: {
        ativo: false
      },
      knowledge: {
        ativo: false,
        knowledges: []
      }
    };
  }

  /**
   * Obter configuração padrão para tipo de memória específico
   */
  static getDefaultMemoryConfig(tipo: TipoMemoria): Record<string, any> {
    const configs: Record<TipoMemoria, Record<string, any>> = {
      [TipoMemoria.CONVERSATION_BUFFER]: {},
      [TipoMemoria.CONVERSATION_SUMMARY]: {
        max_token_limit: 2000
      },
      [TipoMemoria.CONVERSATION_BUFFER_WINDOW]: {
        k: 5
      },
      [TipoMemoria.CONVERSATION_TOKEN_BUFFER]: {
        max_token_limit: 2000
      }
    };
    return configs[tipo] || {};
  }

  /**
   * Validar se configuração está completa
   */
  static isConfigValid(config: AgenteConfig): boolean {
    return !!(
      config.model?.id_credencial &&
      typeof config.model.temperature === 'number' &&
      typeof config.model.max_tokens === 'number' &&
      config.memory &&
      config.observability !== undefined
    );
  }

  /**
   * Obter lista de tipos de memória disponíveis
   */
  static getMemoryTypes(): { value: TipoMemoria; label: string; description: string }[] {
    return [
      {
        value: TipoMemoria.CONVERSATION_BUFFER,
        label: "Buffer Simples",
        description: "Mantém todas as mensagens da conversa"
      },
      {
        value: TipoMemoria.CONVERSATION_SUMMARY,
        label: "Resumo",
        description: "Mantém um resumo das mensagens antigas"
      },
      {
        value: TipoMemoria.CONVERSATION_BUFFER_WINDOW,
        label: "Janela Deslizante",
        description: "Mantém apenas as últimas K mensagens"
      },
      {
        value: TipoMemoria.CONVERSATION_TOKEN_BUFFER,
        label: "Buffer por Tokens",
        description: "Mantém mensagens até limite de tokens"
      }
    ];
  }

  /**
   * Obter lista de tipos de observabilidade disponíveis
   */
  static getObservabilityTypes(): { value: TipoObservabilidade; label: string; description: string }[] {
    return [
      {
        value: TipoObservabilidade.LANGFUSE,
        label: "Langfuse",
        description: "Observabilidade via Langfuse"
      }
    ];
  }
}

// ========================================
// UTILITÁRIOS PARA AGENTES
// ========================================

export class AgenteUtils {
  /**
   * Verificar se agente tem ferramentas configuradas
   */
  static hasTools(agente: Agente): boolean {
    return agente.ds_config?.tools?.length > 0 || false;
  }

  /**
   * Verificar se observabilidade está ativa
   */
  static isObservabilityEnabled(agente: Agente): boolean {
    return agente.ds_config?.observability?.ativo || false;
  }

  /**
   * Verificar se memória está ativa
   */
  static isMemoryEnabled(agente: Agente): boolean {
    return agente.ds_config?.memory?.ativo || false;
  }

  /**
   * Obter nome da credencial do modelo
   */
  static getModelCredentialId(agente: Agente): string | undefined {
    return agente.ds_config?.model?.id_credencial;
  }

  /**
   * Obter resumo de configuração para exibição
   */
  static getConfigSummary(agente: Agente): string {
    const config = agente.ds_config;
    if (!config) return "Sem configuração";

    const parts: string[] = [];

    // Modelo
    const temp = config.model?.temperature || 0.7;
    const tokens = config.model?.max_tokens || 4000;
    parts.push(`T:${temp} • Max:${tokens}`);

    // Tools
    if (config.tools?.length > 0) {
      parts.push(`${config.tools.length} ferramenta(s)`);
    }

    // Memory
    if (config.memory?.ativo) {
      parts.push("Memória ativa");
    }

    // Observability
    if (config.observability?.ativo) {
      parts.push("Observabilidade ativa");
    }

    return parts.join(" • ") || "Configuração básica";
  }

  /**
   * Criar agente com configuração padrão
   */
  static createWithDefaults(nm_agente: string, ds_prompt: string): Omit<Agente, 'id_agente' | 'dt_criacao' | 'dt_atualizacao'> {
    return {
      nm_agente,
      ds_prompt,
      ds_config: AgenteConfigFactory.createDefaultConfig(),
      st_principal: false,
      tools: []
    };
  }
}
