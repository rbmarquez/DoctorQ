// src/hooks/useCredenciais.ts
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type {
  Credencial,
  CredencialCreate,
  CredencialUpdate,
  CredencialListResponse,
  TiposCredenciaisResponse
} from "@/types/credenciais";

interface UseCredenciaisState {
  credenciais: Credencial[];
  loading: boolean;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  tiposCredenciais: string[];
  tiposLoading: boolean;
}

export function useCredenciais() {
  const [state, setState] = useState<UseCredenciaisState>({
    credenciais: [],
    loading: false,
    totalPages: 0,
    totalItems: 0,
    currentPage: 1,
    pageSize: 10,
    tiposCredenciais: [],
    tiposLoading: false,
  });

  const fetchCredenciais = useCallback(async (
    page = 1,
    search = "",
    typeFilter = "all",
    size = 10
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (search) params.append('search', search);
      if (typeFilter && typeFilter !== "all") params.append('type_filter', typeFilter);

      const response = await fetch(`/api/credenciais?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao carregar credenciais");
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        credenciais: data.credenciais || [],
        totalPages: data.total_pages || 0,
        totalItems: data.total || 0,
        currentPage: data.page || 1,
        pageSize: data.size || 10,
        loading: false,
      }));

      return data;
    } catch (error) {
      console.error("Erro ao carregar credenciais:", error);
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro");
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const createCredencial = useCallback(async (credencial: CredencialCreate) => {
    try {
      const response = await fetch("/api/credenciais", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credencial),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao criar credencial");
      }

      const newCredencial = await response.json();
      toast.success("Credencial criada com sucesso");
      return newCredencial;
    } catch (error) {
      console.error("Erro ao criar credencial:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar credencial";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const updateCredencial = useCallback(async (id: string, credencial: CredencialUpdate) => {
    try {
      const response = await fetch(`/api/credenciais/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credencial),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao atualizar credencial");
      }

      const updatedCredencial = await response.json();
      toast.success("Credencial atualizada com sucesso");
      return updatedCredencial;
    } catch (error) {
      console.error("Erro ao atualizar credencial:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar credencial";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const deleteCredencial = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/credenciais/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao excluir credencial");
      }

      toast.success("Credencial excluída com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao excluir credencial:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir credencial";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const getCredencial = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/credenciais/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao buscar credencial");
      }

      const credencial = await response.json();
      return credencial;
    } catch (error) {
      console.error("Erro ao buscar credencial:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar credencial";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Função para buscar tipos de credenciais
  const fetchTiposCredenciais = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, tiposLoading: true }));

      const response = await fetch("/api/credenciais/types");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao buscar tipos de credenciais");
      }

      const tipos: TiposCredenciaisResponse = await response.json();

      setState(prev => ({
        ...prev,
        tiposCredenciais: tipos.tipos_suportados || [],
        tiposLoading: false,
      }));

      return tipos;
    } catch (error) {
      console.error("Erro ao buscar tipos de credenciais:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar tipos de credenciais";
      toast.error(errorMessage);
      setState(prev => ({ ...prev, tiposLoading: false }));
      throw error;
    }
  }, []);

  // Carregar tipos de credenciais automaticamente
  useEffect(() => {
    fetchTiposCredenciais();
  }, [fetchTiposCredenciais]);

  return {
    ...state,
    fetchCredenciais,
    createCredencial,
    updateCredencial,
    deleteCredencial,
    getCredencial,
    getTiposCredenciais: fetchTiposCredenciais, // Renamed to avoid conflict
  };
}
