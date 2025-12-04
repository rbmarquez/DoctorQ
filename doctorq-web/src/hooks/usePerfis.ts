/**
 * Hook SWR para gestão de perfis hierárquicos
 */
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";

// Types
export interface PerfilNode {
  id_perfil: string;
  nm_perfil: string;
  ds_perfil: string;
  nm_tipo_acesso: string;
  id_perfil_pai: string | null;
  nr_ordem: string;
  st_ativo: string;
  nr_usuarios: number;
  children: PerfilNode[];
}

export interface PerfilStats {
  stats_by_tipo: {
    [tipo: string]: {
      nm_tipo_acesso: string;
      total_perfis: number;
      perfis_raiz: number;
      sub_perfis: number;
      total_usuarios: number;
      perfis: Array<{
        id_perfil: string;
        nm_perfil: string;
        ds_perfil: string;
        is_raiz: boolean;
      }>;
    };
  };
  total_tipos: number;
  total_perfis_system: number;
}

export interface PermissoesComHeranca {
  id_perfil: string;
  nm_perfil: string;
  id_perfil_pai: string | null;
  permissoes: Record<string, any>;
  tem_heranca: boolean;
}

// Fetcher genérico para SWR usando apiClient
async function fetcher<T>(url: string): Promise<T> {
  return apiClient.get<T>(url);
}

// Hook para buscar árvore hierárquica de perfis
export function usePerfisTree(tipoAcesso?: string) {
  const url = tipoAcesso
    ? `/perfis/hierarquia/tree?tipo_acesso=${tipoAcesso}`
    : `/perfis/hierarquia/tree`;

  const { data, error, isLoading, mutate } = useSWR<{
    tree: PerfilNode[];
    total: number;
  }>(url, (u: string) => fetcher<{ tree: PerfilNode[]; total: number }>(u));

  return {
    tree: data?.tree || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook para buscar estatísticas de perfis
export function usePerfisStats() {
  const { data, error, isLoading, mutate } = useSWR<PerfilStats>(
    "/perfis/hierarquia/stats",
    (u: string) => fetcher<PerfilStats>(u)
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook para buscar permissões com herança
export function usePermissoesComHeranca(perfilId: string | null) {
  const url = perfilId ? `/perfis/${perfilId}/permissoes-completas` : null;

  const { data, error, isLoading, mutate } = useSWR<PermissoesComHeranca>(
    url,
    url ? (u: string) => fetcher<PermissoesComHeranca>(u) : null
  );

  return {
    permissoes: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Tipo para a resposta de perfis por tipo
interface PerfisByTipoResponse {
  tipo_acesso: string;
  perfis_raiz: any[];
  sub_perfis: any[];
  total: number;
}

// Hook para buscar perfis por tipo de acesso
export function usePerfisByTipo(tipo: string | null) {
  const url = tipo ? `/perfis/tipo-acesso/${tipo}` : null;

  const { data, error, isLoading, mutate } = useSWR<PerfisByTipoResponse>(
    url,
    url ? (u: string) => fetcher<PerfisByTipoResponse>(u) : null
  );

  return {
    perfis: data,
    isLoading,
    isError: error,
    mutate,
  };
}
