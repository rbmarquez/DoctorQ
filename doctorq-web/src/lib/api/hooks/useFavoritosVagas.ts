import useSWR, { mutate } from "swr";
import { apiClient } from "../client";

const fetcher = (url: string) => apiClient.get(url).then((res) => res);

/**
 * Interface para Favorito de Vaga
 */
export interface FavoritoVaga {
  id_favorito: string;
  id_user: string;
  id_vaga: string;
  dt_criacao: string;
}

/**
 * Hook para listar todos os favoritos de vagas do usuário autenticado
 */
export function useFavoritosVagas() {
  const { data, error, mutate: mutateFavoritos } = useSWR<FavoritoVaga[]>(
    "/favoritos/",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  return {
    favoritos: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate: mutateFavoritos,
  };
}

/**
 * Hook para verificar se uma vaga específica está nos favoritos
 */
export function useIsFavoritoVaga(id_vaga: string | null) {
  const url = id_vaga ? `/favoritos/verificar/${id_vaga}/` : null;
  const { data, error, mutate: mutateStatus } = useSWR<{ is_favorito: boolean }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    isFavorito: data?.is_favorito ?? false,
    isLoading: !error && !data && id_vaga !== null,
    isError: error,
    mutate: mutateStatus,
  };
}

/**
 * Adiciona uma vaga aos favoritos
 */
export async function adicionarFavoritoVaga(id_vaga: string): Promise<FavoritoVaga> {
  try {
    const result = await apiClient.post<FavoritoVaga>("/favoritos/", { id_vaga });

    // Revalidate cache
    await Promise.all([
      mutate((key: any) => typeof key === "string" && key.startsWith("/favoritos")),
      mutate(`/favoritos/verificar/${id_vaga}/`),
    ]);

    return result;
  } catch (error: any) {
    console.error("Erro ao adicionar vaga aos favoritos:", error);

    // Tratar erros específicos
    if (error.response?.status === 400) {
      const detail = error.response?.data?.detail;
      if (typeof detail === "string" && detail.includes("já está nos favoritos")) {
        throw new Error("Esta vaga já está nos favoritos");
      }
      throw new Error(detail || "Dados inválidos");
    }

    throw new Error("Erro ao adicionar vaga aos favoritos. Tente novamente.");
  }
}

/**
 * Remove uma vaga dos favoritos
 */
export async function removerFavoritoVaga(id_vaga: string): Promise<void> {
  try {
    await apiClient.delete(`/favoritos/${id_vaga}/`);

    // Revalidate cache
    await Promise.all([
      mutate((key: any) => typeof key === "string" && key.startsWith("/favoritos")),
      mutate(`/favoritos/verificar/${id_vaga}/`),
    ]);
  } catch (error: any) {
    console.error("Erro ao remover vaga dos favoritos:", error);

    if (error.response?.status === 404) {
      throw new Error("Favorito não encontrado");
    }

    throw new Error("Erro ao remover vaga dos favoritos. Tente novamente.");
  }
}

/**
 * Toggle favorito de vaga (adicionar se não existe, remover se existe)
 */
export async function toggleFavoritoVaga(id_vaga: string, isFavorito: boolean): Promise<{
  adicionado: boolean;
  message: string;
  favorito?: FavoritoVaga;
}> {
  try {
    // Se já é favorito, remover
    if (isFavorito) {
      await removerFavoritoVaga(id_vaga);
      return {
        adicionado: false,
        message: "Vaga removida dos favoritos",
      };
    }

    // Se não é favorito, adicionar
    const favorito = await adicionarFavoritoVaga(id_vaga);
    return {
      adicionado: true,
      message: "Vaga adicionada aos favoritos",
      favorito,
    };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Revalidar lista de favoritos de vagas
 */
export function revalidarFavoritosVagas() {
  return mutate((key: any) => typeof key === "string" && key.startsWith("/favoritos"));
}

/**
 * Revalidar status de favorito de uma vaga específica
 */
export function revalidarFavoritoVagaStatus(id_vaga: string) {
  return mutate(`/favoritos/verificar/${id_vaga}/`);
}
