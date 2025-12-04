import useSWR from "swr";
import { apiClient } from "../client";
import type {
  Candidatura,
  CandidaturasResponse,
  CandidaturasFiltros,
  CriarCandidaturaData,
  AtualizarCandidaturaData,
} from "@/types/carreiras";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

/**
 * Hook para buscar candidaturas (para recrutadores)
 */
export function useCandidaturas(filtros: CandidaturasFiltros = {}) {
  const params = new URLSearchParams();

  if (filtros.id_vaga) params.append("id_vaga", filtros.id_vaga);
  if (filtros.ds_status) params.append("ds_status", filtros.ds_status);
  if (filtros.nr_match_score_min) params.append("nr_match_score_min", filtros.nr_match_score_min.toString());
  if (filtros.page) params.append("page", filtros.page.toString());
  if (filtros.size) params.append("size", filtros.size.toString());

  const queryString = params.toString();
  const url = `/candidaturas/${queryString ? `?${queryString}` : ""}`;

  const { data, error, mutate } = useSWR<CandidaturasResponse>(url, fetcher);

  return {
    candidaturas: data?.candidaturas || [],
    meta: data?.meta,
    isLoading: !error && !data,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar candidaturas de uma vaga específica
 */
export function useCandidaturasVaga(idVaga: string | null) {
  const url = idVaga ? `/candidaturas/vaga/${idVaga}/` : null;
  const { data, error, mutate } = useSWR<CandidaturasResponse>(url, fetcher);

  return {
    candidaturas: data?.candidaturas || [],
    meta: data?.meta,
    isLoading: !error && !data && idVaga !== null,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar minhas candidaturas (candidato)
 */
export function useMinhasCandidaturas(filtros: { ds_status?: string; page?: number; size?: number } = {}) {
  const params = new URLSearchParams();

  if (filtros.ds_status) params.append("ds_status", filtros.ds_status);
  if (filtros.page) params.append("page", filtros.page.toString());
  if (filtros.size) params.append("size", filtros.size.toString());

  const queryString = params.toString();
  const url = `/candidaturas/minhas/${queryString ? `?${queryString}` : ""}`;

  const { data, error, mutate } = useSWR<CandidaturasResponse>(url, fetcher);

  return {
    candidaturas: data?.candidaturas || [],
    meta: data?.meta,
    isLoading: !error && !data,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Hook para buscar uma candidatura específica
 */
export function useCandidatura(id: string | null) {
  const url = id ? `/candidaturas/${id}/` : null;
  const { data, error, mutate } = useSWR<Candidatura>(url, fetcher);

  return {
    candidatura: data,
    isLoading: !error && !data && id !== null,
    isError: error,
    error,
    mutate,
  };
}

/**
 * Função para criar candidatura
 */
export async function criarCandidatura(data: CriarCandidaturaData): Promise<Candidatura> {
  const response = await apiClient.post("/candidaturas/", data);
  return response.data;
}

/**
 * Função para atualizar status da candidatura (recrutador)
 */
export async function atualizarCandidatura(
  id: string,
  data: AtualizarCandidaturaData
): Promise<Candidatura> {
  const response = await apiClient.patch(`/candidaturas/${id}/`, data);
  return response.data;
}

/**
 * Função para candidato desistir da vaga
 */
export async function desistirCandidatura(id: string): Promise<Candidatura> {
  const response = await apiClient.patch(`/candidaturas/${id}/desistir/`);
  return response.data;
}

/**
 * Função para verificar se já se candidatou a uma vaga
 */
export async function verificarCandidatura(idVaga: string): Promise<{ ja_candidatou: boolean; id_candidatura?: string }> {
  const response = await apiClient.get(`/candidaturas/verificar/${idVaga}/`);
  return response.data;
}

/**
 * Hook para buscar analytics da empresa
 */
export function useAnalyticsEmpresa() {
  const url = "/candidaturas/analytics/empresa/";
  const { data, error, mutate } = useSWR<any>(url, fetcher);

  return {
    analytics: data,
    isLoading: !error && !data,
    isError: error,
    error,
    mutate,
  };
}
