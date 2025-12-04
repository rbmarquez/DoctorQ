/**
 * Hook SWR para gerenciamento de pacientes
 */
import useSWR, { mutate } from "swr";
import type {
  Paciente,
  PacienteCreate,
  PacienteUpdate,
  PacienteListResponse,
  PacienteFilters,
} from "@/types/paciente";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook para listar pacientes com filtros
 */
export function usePacientes(filters?: PacienteFilters) {
  const params = new URLSearchParams();

  if (filters?.id_clinica) params.append("id_clinica", filters.id_clinica);
  if (filters?.busca) params.append("busca", filters.busca);
  if (filters?.apenas_ativos !== undefined) {
    params.append("apenas_ativos", String(filters.apenas_ativos));
  }
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.size) params.append("size", String(filters.size));

  const queryString = params.toString();
  const url = `/api/pacientes${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading } = useSWR<PacienteListResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    pacientes: data?.items || [],
    total: data?.total || 0,
    page: data?.page || 1,
    size: data?.size || 50,
    isLoading,
    error,
    mutate: () => mutate(url),
  };
}

/**
 * Hook para buscar um paciente específico por ID
 */
export function usePaciente(id?: string) {
  const { data, error, isLoading } = useSWR<Paciente>(
    id ? `/api/pacientes/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    paciente: data,
    isLoading,
    error,
    mutate: () => mutate(`/api/pacientes/${id}`),
  };
}

/**
 * Cria um novo paciente
 */
export async function criarPaciente(
  data: PacienteCreate
): Promise<{ success: boolean; data?: Paciente; error?: string }> {
  try {
    const response = await fetch("/api/pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "Erro ao criar paciente" };
    }

    const result = await response.json();

    // Revalidar a lista de pacientes
    mutate((key) => typeof key === "string" && key.startsWith("/api/pacientes"));

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Atualiza um paciente existente
 */
export async function atualizarPaciente(
  id: string,
  data: PacienteUpdate
): Promise<{ success: boolean; data?: Paciente; error?: string }> {
  try {
    const response = await fetch(`/api/pacientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Erro ao atualizar paciente",
      };
    }

    const result = await response.json();

    // Revalidar cache
    mutate(`/api/pacientes/${id}`);
    mutate((key) => typeof key === "string" && key.startsWith("/api/pacientes"));

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Desativa um paciente (soft delete)
 */
export async function desativarPaciente(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/pacientes/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Erro ao desativar paciente",
      };
    }

    // Revalidar cache
    mutate(`/api/pacientes/${id}`);
    mutate((key) => typeof key === "string" && key.startsWith("/api/pacientes"));

    return { success: true };
  } catch (error) {
    console.error("Erro ao desativar paciente:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Busca paciente por CPF
 */
export async function buscarPacientePorCPF(
  cpf: string
): Promise<{ success: boolean; data?: Paciente; error?: string }> {
  try {
    const response = await fetch(`/api/pacientes/cpf/${cpf}`);

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Paciente não encontrado" };
      }
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Erro ao buscar paciente",
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao buscar paciente por CPF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
