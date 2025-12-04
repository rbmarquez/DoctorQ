import { Agente, AgenteListResponse, AgenteConfigFactory } from "@/types/agentes";

interface CacheEntry {
  data: Agente[];
  timestamp: number;
  promise?: Promise<Agente[]>;
}

class AgentesCache {
  private static instance: AgentesCache;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 segundos

  public static getInstance(): AgentesCache {
    if (!AgentesCache.instance) {
      AgentesCache.instance = new AgentesCache();
    }
    return AgentesCache.instance;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_DURATION;
  }

  private async fetchAgentsFromAPI(): Promise<Agente[]> {
    const params = new URLSearchParams({
      page: "1",
      size: "100",
      order_by: "dt_criacao",
      order_desc: "true"
    });

    const response = await fetch(`/api/agentes?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Erro ao carregar agentes");
    }

    const data: AgenteListResponse = await response.json();

    const agentesComConfig = (data.items || []).map(agente => {
      if (agente.ds_config) {
        try {
          agente.ds_config = typeof agente.ds_config === 'string'
            ? JSON.parse(agente.ds_config)
            : agente.ds_config;
        } catch (e) {
          console.warn('Erro ao parsear ds_config para agente:', agente.id_agente, agente.ds_config);
          agente.ds_config = AgenteConfigFactory.createDefaultConfig();
        }
      }
      return agente;
    });

    return agentesComConfig;
  }

  public async getAgentes(): Promise<Agente[]> {
    const cacheKey = 'deployed_agents';
    const cached = this.cache.get(cacheKey);

    // Se existe cache válido, retorna
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    // Se já há uma requisição em andamento, aguarda ela
    if (cached?.promise) {
      return await cached.promise;
    }

    // Cria nova requisição
    const promise = this.fetchAgentsFromAPI();

    // Armazena a promise no cache temporariamente
    this.cache.set(cacheKey, {
      data: cached?.data || [],
      timestamp: cached?.timestamp || 0,
      promise
    });

    try {
      const data = await promise;

      // Atualiza o cache com os dados
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      // Remove a promise em caso de erro
      if (cached) {
        this.cache.set(cacheKey, {
          data: cached.data,
          timestamp: cached.timestamp
        });
      } else {
        this.cache.delete(cacheKey);
      }
      throw error;
    }
  }

  public invalidate(): void {
    this.cache.clear();
  }

  public invalidateKey(key: string): void {
    this.cache.delete(key);
  }
}

export const agentesCache = AgentesCache.getInstance();
