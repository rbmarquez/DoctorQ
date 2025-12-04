import useSWR, { mutate } from "swr";
import { apiClient } from "../client";
import { endpoints } from "../endpoints";

export interface AnamneseMedicamento {
  nome: string;
  dose?: string;
  frequencia?: string;
}

export interface AnamneseHabitos {
  tabagismo?: "nao" | "ocasional" | "diario";
  etilismo?: "nao" | "ocasional" | "frequente";
  atividades_fisicas?: string;
  sono?: string;
  alimentacao?: string;
}

export interface AnamneseSinaisVitais {
  peso?: number | null;
  altura?: number | null;
  pressao_arterial?: string;
  frequencia_cardiaca?: number | null;
}

export interface AnamneseFicha {
  id_anamnese: string;
  id_user: string;
  dt_atualizacao: string;
  motivo_consulta?: string;
  queixa_principal?: string;
  historico_doenca_atual?: string;
  antecedentes_pessoais?: string[];
  antecedentes_familiares?: string[];
  alergias?: string[];
  medicamentos?: AnamneseMedicamento[];
  habitos?: AnamneseHabitos;
  sinais_vitais?: AnamneseSinaisVitais;
  observacoes?: string;
  st_atualizado?: boolean;
}

export interface AnamneseHistoricoItem {
  id_registro: string;
  id_anamnese: string;
  dt_registro: string;
  profissional?: string;
  resumo?: string;
  alteracoes?: string[];
}

/**
 * Recupera a ficha de anamnese do paciente
 */
export function useAnamnese(userId?: string | null) {
  const shouldFetch = Boolean(userId);

  const { data, error, isLoading } = useSWR<AnamneseFicha>(
    shouldFetch ? endpoints.anamnese.get(userId as string) : null,
    () => apiClient.get(endpoints.anamnese.get(userId as string)),
    {
      revalidateOnFocus: false,
    },
  );

  return {
    anamnese: data ?? null,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Histórico de alterações da anamnese
 */
export function useHistoricoAnamnese(userId?: string | null) {
  const shouldFetch = Boolean(userId);

  const { data, error, isLoading } = useSWR<AnamneseHistoricoItem[]>(
    shouldFetch ? endpoints.anamnese.historico(userId as string) : null,
    () => apiClient.get(endpoints.anamnese.historico(userId as string)),
    {
      revalidateOnFocus: false,
    },
  );

  return {
    historico: data ?? [],
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Atualiza os dados de anamnese do paciente
 */
export async function salvarAnamnese(userId: string, payload: Partial<AnamneseFicha>) {
  const sanitizeList = (list?: string[]) => (list || []).map((item) => item.trim()).filter(Boolean);

  const body = {
    ...payload,
    alergias: sanitizeList(payload.alergias),
    antecedentes_pessoais: sanitizeList(payload.antecedentes_pessoais),
    antecedentes_familiares: sanitizeList(payload.antecedentes_familiares),
    medicamentos: payload.medicamentos?.map((med) => ({
      ...med,
      nome: med.nome.trim(),
      dose: med.dose?.trim(),
      frequencia: med.frequencia?.trim(),
    })),
  };

  const response = await apiClient.put<AnamneseFicha>(
    endpoints.anamnese.update(userId),
    body,
  );

  await Promise.all([
    mutate(endpoints.anamnese.get(userId)),
    mutate(endpoints.anamnese.historico(userId)),
  ]);

  return response;
}
