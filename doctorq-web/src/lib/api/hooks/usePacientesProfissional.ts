"use client";

import useSWR from "swr";
import { fetcher } from "../client";
import { mutate } from "swr";

export interface PacienteProfissional {
  id_paciente: string;
  id_user: string;
  nm_completo: string;
  nm_email: string;
  nr_telefone: string;
  dt_nascimento: string;
  ds_foto_url?: string;
  ds_cidade?: string;
  ds_estado?: string;
  nr_total_consultas: number;
  dt_ultima_consulta: string;
  vl_total_gasto: number;
  ds_status: "ativo" | "inativo";
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface PacientesProfissionalFiltros {
  id_profissional?: string;
  busca?: string;
  status?: "ativo" | "inativo" | "todos";
  page?: number;
  size?: number;
}

export interface PacientesProfissionalResponse {
  pacientes: PacienteProfissional[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * Hook para buscar pacientes do profissional logado
 */
export function usePacientesProfissional(
  filtros?: PacientesProfissionalFiltros
) {
  const params = new URLSearchParams();

  if (filtros?.busca) params.append("busca", filtros.busca);
  if (filtros?.status && filtros.status !== "todos") params.append("status", filtros.status);
  if (filtros?.page) params.append("page", filtros.page.toString());
  if (filtros?.size) params.append("size", filtros.size.toString());

  const queryString = params.toString();
  const url = `/pacientes/profissional/me${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate: mutateFn } = useSWR<PacientesProfissionalResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  return {
    pacientes: data?.pacientes || [],
    total: data?.total || 0,
    page: data?.page || 1,
    size: data?.size || 10,
    pages: data?.pages || 0,
    isLoading,
    isError: !!error,
    error,
    mutate: mutateFn,
  };
}

/**
 * Buscar um paciente específico
 */
export function usePaciente(id_paciente: string | null) {
  const url = id_paciente ? `/pacientes/${id_paciente}` : null;

  const { data, error, isLoading, mutate: mutateFn } = useSWR<PacienteProfissional>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    paciente: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate: mutateFn,
  };
}

/**
 * Revalidar lista de pacientes
 */
export function revalidarPacientes() {
  return mutate((key) =>
    typeof key === "string" && key.startsWith("/pacientes/profissional/me")
  );
}
