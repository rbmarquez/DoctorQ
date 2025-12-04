// src/hooks/useToolsCustom.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  Tool,
  ToolCreate,
  ToolUpdate,
  ToolListResponse,
  ToolType
} from "@/types/tools";

interface UseToolsState {
  tools: Tool[];
  loading: boolean;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  pageSize: number;
}

export function useToolsCustom() {
  const [state, setState] = useState<UseToolsState>({
    tools: [],
    loading: false,
    totalPages: 0,
    totalItems: 0,
    currentPage: 1,
    pageSize: 10,
  });

  const fetchTools = useCallback(async (
    page = 1,
    search = "",
    tp_tool?: ToolType,
    st_ativo?: boolean,
    size = 10
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (search) params.append('search', search);
      if (tp_tool) params.append('tp_tool', tp_tool);
      if (st_ativo !== undefined) params.append('st_ativo', st_ativo.toString());

      const response = await fetch(`/api/tools?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao carregar tools");
      }

      const data: ToolListResponse = await response.json();

      setState(prev => ({
        ...prev,
        tools: data.items || [],
        totalPages: data.meta.totalPages || 0,
        totalItems: data.meta.totalItems || 0,
        currentPage: data.meta.currentPage || 1,
        pageSize: data.meta.itemsPerPage || 10,
        loading: false,
      }));

      return data;
    } catch (error) {
      console.error("Erro ao carregar tools:", error);
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro");
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const createTool = useCallback(async (tool: ToolCreate) => {
    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tool),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao criar tool");
      }

      const newTool = await response.json();
      toast.success("Tool criada com sucesso");
      return newTool;
    } catch (error) {
      console.error("Erro ao criar tool:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar tool";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const updateTool = useCallback(async (id: string, tool: ToolUpdate) => {
    try {
      const response = await fetch(`/api/tools/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tool),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao atualizar tool");
      }

      const updatedTool = await response.json();
      toast.success("Tool atualizada com sucesso");
      return updatedTool;
    } catch (error) {
      console.error("Erro ao atualizar tool:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar tool";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const deleteTool = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/tools/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao excluir tool");
      }

      toast.success("Tool excluída com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao excluir tool:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir tool";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const getTool = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/tools/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao buscar tool");
      }

      const tool = await response.json();
      return tool;
    } catch (error) {
      console.error("Erro ao buscar tool:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar tool";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const executeTool = useCallback(async (request: any) => {
    try {
      const response = await fetch("/api/tools/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao executar tool");
      }

      const result = await response.json();
      toast.success("Tool executada com sucesso");
      return result;
    } catch (error) {
      console.error("Erro ao executar tool:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao executar tool";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  return {
    ...state,
    fetchTools,
    createTool,
    updateTool,
    deleteTool,
    getTool,
    executeTool,
  };
}
