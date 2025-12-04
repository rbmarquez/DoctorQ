import useSWR from "swr";
import { apiClient } from "../client";
import type {
  Vaga,
  VagasResponse,
  VagasFiltros,
  CriarVagaData,
  AtualizarVagaData,
} from "@/types/carreiras";

const fetcher = (url: string) => apiClient.get(url).then((res) => res);

/**
 * Hook para buscar vagas com filtros
 */
export function useVagas(filtros: VagasFiltros = {}) {
  const params = new URLSearchParams();

  if (filtros.nm_cargo) params.append("nm_cargo", filtros.nm_cargo);
  if (filtros.nm_area) params.append("nm_area", filtros.nm_area);
  if (filtros.nm_cidade) params.append("nm_cidade", filtros.nm_cidade);
  if (filtros.nm_estado) params.append("nm_estado", filtros.nm_estado);
  if (filtros.nm_nivel) params.append("nm_nivel", filtros.nm_nivel);
  if (filtros.nm_tipo_contrato) params.append("nm_tipo_contrato", filtros.nm_tipo_contrato);
  if (filtros.nm_regime_trabalho) params.append("nm_regime_trabalho", filtros.nm_regime_trabalho);
  if (filtros.vl_salario_min) params.append("vl_salario_min", filtros.vl_salario_min.toString());
  if (filtros.fg_aceita_remoto !== undefined) params.append("fg_aceita_remoto", String(filtros.fg_aceita_remoto));
  if (filtros.ds_status) params.append("ds_status", filtros.ds_status);
  if (filtros.habilidades && filtros.habilidades.length > 0) {
    params.append("habilidades", filtros.habilidades.join(","));
  }
  if (filtros.page) params.append("page", filtros.page.toString());
  if (filtros.size) params.append("size", filtros.size.toString());

  const queryString = params.toString();
  const url = `/vagas/${queryString ? `?${queryString}` : ""}`;

  // API retorna formato diferente, precisamos mapear
  const { data, error, mutate } = useSWR<any>(url, fetcher);

  // DEBUG: Log para verificar resposta da API
  console.log('[useVagas] URL:', url);
  console.log('[useVagas] Data:', data);
  console.log('[useVagas] Error:', error);

  // Mapear resposta da API para formato esperado
  const vagasResponse: VagasResponse | undefined = data ? {
    vagas: (data.vagas || []).map((vaga: any) => ({
      ...vaga,
      // Converter valores de salário de string para number
      vl_salario_min: vaga.vl_salario_min ? parseFloat(vaga.vl_salario_min) : undefined,
      vl_salario_max: vaga.vl_salario_max ? parseFloat(vaga.vl_salario_max) : undefined,
    })),
    meta: {
      totalItems: data.total || 0,
      itemsPerPage: data.size || 12,
      totalPages: data.total_pages || 0,
      currentPage: data.page || 1,
    }
  } : undefined;

  console.log('[useVagas] Vagas mapeadas:', vagasResponse?.vagas?.length || 0);

  return {
    vagas: vagasResponse?.vagas || [],
    meta: vagasResponse?.meta,
    isLoading: !error && !data,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar uma vaga específica
 */
export function useVaga(id: string | null) {
  const url = id ? `/vagas/${id}/` : null;
  const { data, error, mutate } = useSWR<Vaga>(url, fetcher);

  return {
    vaga: data,
    isLoading: !error && !data && id !== null,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar vagas da empresa logada
 */
export function useMinhasVagas(filtros: VagasFiltros = {}) {
  const params = new URLSearchParams();

  if (filtros.ds_status) params.append("ds_status", filtros.ds_status);
  if (filtros.page) params.append("page", filtros.page.toString());
  if (filtros.size) params.append("size", filtros.size.toString());

  const queryString = params.toString();
  const url = `/vagas/minhas/${queryString ? `?${queryString}` : ""}`;

  // API retorna formato diferente, precisamos mapear
  const { data, error, mutate } = useSWR<any>(url, fetcher);

  // Mapear resposta da API para formato esperado
  const vagasResponse: VagasResponse | undefined = data ? {
    vagas: data.vagas || [],
    meta: {
      totalItems: data.total || 0,
      itemsPerPage: data.size || 12,
      totalPages: data.total_pages || 0,
      currentPage: data.page || 1,
    }
  } : undefined;

  return {
    vagas: vagasResponse?.vagas || [],
    meta: vagasResponse?.meta,
    isLoading: !error && !data,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Função para criar vaga
 */
export async function criarVaga(data: CriarVagaData): Promise<Vaga> {
  const response = await apiClient.post("/vagas/", data);
  return response.data;
}

/**
 * Função para atualizar vaga
 */
export async function atualizarVaga(
  id: string,
  data: AtualizarVagaData
): Promise<Vaga> {
  const response = await apiClient.put(`/vagas/${id}/`, data);
  return response.data;
}

/**
 * Função para deletar vaga
 */
export async function deletarVaga(id: string): Promise<void> {
  await apiClient.delete(`/vagas/${id}/`);
}

/**
 * Função para alterar status da vaga
 */
export async function alterarStatusVaga(
  id: string,
  status: "aberta" | "pausada" | "fechada" | "cancelada"
): Promise<Vaga> {
  const response = await apiClient.patch(`/vagas/${id}/status/`, { ds_status: status });
  return response.data;
}

/**
 * Hook para buscar vagas similares (mesma área e cidade)
 */
export function useVagasSimilares(idVaga: string | null, limit: number = 5) {
  const { vaga } = useVaga(idVaga);

  const params = new URLSearchParams();
  if (vaga?.nm_area) params.append("nm_area", vaga.nm_area);
  if (vaga?.nm_cidade) params.append("nm_cidade", vaga.nm_cidade);
  params.append("size", limit.toString());

  const queryString = params.toString();
  const url = vaga ? `/vagas/${queryString ? `?${queryString}` : ""}` : null;

  // API retorna formato diferente, precisamos mapear
  const { data, error, mutate } = useSWR<any>(url, fetcher);

  // Mapear resposta da API para formato esperado
  const vagasResponse: VagasResponse | undefined = data ? {
    vagas: data.vagas || [],
    meta: {
      totalItems: data.total || 0,
      itemsPerPage: data.size || 12,
      totalPages: data.total_pages || 0,
      currentPage: data.page || 1,
    }
  } : undefined;

  // Filtrar a vaga atual das similares
  const vagasFiltradas = vagasResponse?.vagas?.filter((v) => v.id_vaga !== idVaga) || [];

  return {
    vagas: vagasFiltradas,
    isLoading: !error && !data && idVaga !== null,
    isError: error,
    error,
    mutate,
  };
}
