import useSWR from "swr";
import { apiClient } from "../client";
import type {
  Curriculo,
  CurriculosResponse,
  CurriculosFiltros,
  CriarCurriculoData,
  AtualizarCurriculoData,
} from "@/types/carreiras";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

/**
 * Hook para buscar currículos (para recrutadores)
 */
export function useCurriculos(filtros: CurriculosFiltros = {}) {
  const params = new URLSearchParams();

  if (filtros.nm_cargo_desejado) params.append("nm_cargo_desejado", filtros.nm_cargo_desejado);
  if (filtros.nm_cidade) params.append("nm_cidade", filtros.nm_cidade);
  if (filtros.nm_estado) params.append("nm_estado", filtros.nm_estado);
  if (filtros.nm_nivel_experiencia) params.append("nm_nivel_experiencia", filtros.nm_nivel_experiencia);
  if (filtros.nr_anos_experiencia_min) params.append("nr_anos_experiencia_min", filtros.nr_anos_experiencia_min.toString());
  if (filtros.habilidades && filtros.habilidades.length > 0) {
    params.append("habilidades", filtros.habilidades.join(","));
  }
  if (filtros.tipos_contrato_aceitos && filtros.tipos_contrato_aceitos.length > 0) {
    params.append("tipos_contrato_aceitos", filtros.tipos_contrato_aceitos.join(","));
  }
  if (filtros.regimes_trabalho_aceitos && filtros.regimes_trabalho_aceitos.length > 0) {
    params.append("regimes_trabalho_aceitos", filtros.regimes_trabalho_aceitos.join(","));
  }
  if (filtros.page) params.append("page", filtros.page.toString());
  if (filtros.size) params.append("size", filtros.size.toString());

  const queryString = params.toString();
  const url = `/curriculos/${queryString ? `?${queryString}` : ""}`;

  const { data, error, mutate } = useSWR<CurriculosResponse>(url, fetcher);

  return {
    curriculos: data?.curriculos || [],
    meta: data?.meta,
    isLoading: !error && !data,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar um currículo específico
 */
export function useCurriculo(id: string | null) {
  const url = id ? `/curriculos/${id}/` : null;
  const { data, error, mutate } = useSWR<Curriculo>(url, fetcher);

  return {
    curriculo: data,
    isLoading: !error && !data && id !== null,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar o currículo do usuário logado
 */
export function useMeuCurriculo() {
  const url = "/curriculos/meu/";
  const { data, error, mutate } = useSWR<Curriculo>(url, fetcher);

  return {
    curriculo: data,
    isLoading: !error && !data,
    isError: error,
    error,
    mutate,
    temCurriculo: !!data,
  };
}

/**
 * Função para criar currículo
 */
export async function criarCurriculo(data: CriarCurriculoData): Promise<Curriculo> {
  const response = await apiClient.post("/curriculos/", data);
  return response.data;
}

/**
 * Função para atualizar currículo
 */
export async function atualizarCurriculo(
  id: string,
  data: AtualizarCurriculoData
): Promise<Curriculo> {
  const response = await apiClient.put(`/curriculos/${id}/`, data);
  return response.data;
}

/**
 * Função para deletar currículo
 */
export async function deletarCurriculo(id: string): Promise<void> {
  await apiClient.delete(`/curriculos/${id}/`);
}

/**
 * Função para alterar visibilidade do currículo
 */
export async function alterarVisibilidadeCurriculo(
  id: string,
  visivel: boolean
): Promise<Curriculo> {
  const response = await apiClient.patch(`/curriculos/${id}/visibilidade/`, {
    fg_visivel_recrutadores: visivel,
  });
  return response.data;
}

/**
 * Função para fazer upload de foto
 */
export async function uploadFotoCurriculo(
  id: string,
  file: File
): Promise<{ ds_foto_url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(`/curriculos/${id}/foto/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}
