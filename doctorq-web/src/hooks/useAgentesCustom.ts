// src/hooks/useAgentesCustom.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  type Agente,
  type AgenteCreate,
  type AgenteUpdate,
  type AgenteListResponse,
  AgenteConfigFactory
} from "@/types/agentes";

interface UseAgentesState {
  agentes: Agente[];
  loading: boolean;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  refreshKey: number;
}

export function useAgentesCustom() {
  const [state, setState] = useState<UseAgentesState>({
    agentes: [],
    loading: false,
    totalPages: 0,
    totalItems: 0,
    currentPage: 1,
    pageSize: 10,
    refreshKey: 0,
  });

  const invalidateCache = useCallback(() => {
    setState(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, []);

  const fetchAgentes = useCallback(async (
    page = 1,
    search = "",
    orderBy = "dt_criacao",
    orderDesc = true,
    size = 10
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        order_by: orderBy,
        order_desc: orderDesc.toString(),
      });

      if (search) params.append('search', search);
      const response = await fetch(`/api/agentes?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        console.error("Detalhes do erro:", { status: response.status, errorData });
        throw new Error(errorMsg);
      }

      const data: AgenteListResponse = await response.json();

      // Converter ds_config para config em cada agente da lista
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

      setState(prev => ({
        ...prev,
        agentes: agentesComConfig,
        totalPages: data.meta?.totalPages || 0,
        totalItems: data.meta?.totalItems || 0,
        currentPage: data.meta?.currentPage || 1,
        pageSize: data.meta?.itemsPerPage || 10,
        loading: false,
      }));

      return data;
    } catch (error) {
      console.error("Erro ao carregar agentes:", error);
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro");
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);


  const createAgente = useCallback(async (agente: AgenteCreate) => {
    try {
      // Converter config para ds_config para o backend
      const agentePayload = {
        nm_agente: agente.nm_agente,
        ds_prompt: agente.ds_prompt,
        ds_config: agente.ds_config,
        st_principal: agente.st_principal || false,
      };
      const response = await fetch("/api/agentes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao criar agente");
      }

      const newAgente = await response.json();
      toast.success("Agente criado com sucesso");
      invalidateCache();
      return newAgente;
    } catch (error) {
      console.error("Erro ao criar agente:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar agente";
      toast.error(errorMessage);
      throw error;
    }
  }, [invalidateCache]);

  const updateAgente = useCallback(async (id: string, agente: AgenteUpdate) => {
    try {
      // Converter config para ds_config para o backend

      const agentePayload: any = {};

      if (agente.nm_agente !== undefined) agentePayload.nm_agente = agente.nm_agente;
      if (agente.ds_prompt !== undefined) agentePayload.ds_prompt = agente.ds_prompt;
      if (agente.ds_config !== undefined) {
        agentePayload.ds_config = agente.ds_config;
      }
      // Sempre incluir st_principal se estiver definido (mesmo que seja false)
      if ('st_principal' in agente) {
        agentePayload.st_principal = agente.st_principal;
      }

      const response = await fetch(`/api/agentes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao atualizar agente");
      }

      const updatedAgente = await response.json();
      toast.success("Agente atualizado com sucesso");
      invalidateCache();
      return updatedAgente;
    } catch (error) {
      console.error("Erro ao atualizar agente:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar agente";
      toast.error(errorMessage);
      throw error;
    }
  }, [invalidateCache]);

  const deleteAgente = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/agentes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao excluir agente");
      }

      toast.success("Agente excluído com sucesso");
      invalidateCache();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir agente";
      toast.error(errorMessage);
      throw error;
    }
  }, [invalidateCache]);

  const getAgente = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/agentes/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao buscar agente");
      }

      const agente = await response.json();

      // Converter ds_config se necessário
      if (agente.ds_config) {
        try {
          agente.ds_config = typeof agente.ds_config === 'string'
            ? JSON.parse(agente.ds_config)
            : agente.ds_config;
        } catch (e) {
          console.warn('Erro ao parsear ds_config:', agente.ds_config);
          agente.ds_config = AgenteConfigFactory.createDefaultConfig();
        }
      } else {
        agente.ds_config = AgenteConfigFactory.createDefaultConfig();
      }


      return agente;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar agente";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const addToolToAgent = useCallback(async (agentId: string, toolId: string) => {
    try {
      const response = await fetch(`/api/agentes/${agentId}/add-tool`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tool_id: toolId, agent_id: agentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao adicionar ferramenta ao agente");
      }

      const result = await response.json();
      toast.success("Ferramenta adicionada ao agente com sucesso");
      invalidateCache();
      return result;
    } catch (error) {
      console.error("Erro ao adicionar ferramenta ao agente:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar ferramenta";
      toast.error(errorMessage);
      throw error;
    }
  }, [invalidateCache]);

  const removeToolFromAgent = useCallback(async (agentId: string, toolId: string) => {
    try {
      const response = await fetch(`/api/agentes/${agentId}/remove-tool`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tool_id: toolId, agent_id: agentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao remover ferramenta do agente");
      }

      const result = await response.json();
      toast.success("Ferramenta removida do agente com sucesso");
      invalidateCache();
      return result;
    } catch (error) {
      console.error("Erro ao remover ferramenta do agente:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover ferramenta";
      toast.error(errorMessage);
      throw error;
    }
  }, [invalidateCache]);


  return {
    ...state,
    fetchAgentes,
    createAgente,
    updateAgente,
    deleteAgente,
    getAgente,
    fetchAgenteById: getAgente,
    addToolToAgent,
    removeToolFromAgent,
    invalidateCache,
  };
}
