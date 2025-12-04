import useSWR, { mutate } from "swr";
import { apiClient, endpoints } from "../index";

// ============================================================================
// TYPES
// ============================================================================

export interface Profissional {
  id_profissional: string;
  id_user: string;
  id_empresa?: string;
  nm_profissional: string;
  ds_especialidades?: string[];
  ds_bio?: string;
  ds_foto_perfil?: string;
  ds_formacao?: string;
  nr_registro_profissional?: string;
  nr_anos_experiencia?: number;
  vl_avaliacao_media?: number;
  nr_total_avaliacoes?: number;
  st_ativo: boolean;
  st_aceita_novos_pacientes: boolean;
  ds_idiomas?: string[];
  ds_redes_sociais?: Record<string, string>;
  dt_criacao: string;
  // Dados relacionados
  nm_empresa?: string;
  nm_user?: string;
  ds_email?: string;
}

export interface ProfissionaisResponse {
  items: Profissional[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ProfissionaisFiltros {
  id_empresa?: string;
  ds_especialidade?: string;
  st_ativo?: boolean;
  st_aceita_novos_pacientes?: boolean;
  busca?: string;
  page?: number;
  size?: number;
}

export interface CriarProfissionalData {
  id_user: string;
  id_empresa?: string;
  nm_profissional: string;
  ds_especialidades?: string;
  ds_bio?: string;
  ds_foto_perfil?: string;
  ds_formacao?: string;
  nr_registro_profissional?: string;
  nr_anos_experiencia?: number;
  st_aceita_novos_pacientes?: boolean;
  ds_idiomas?: string[];
  ds_redes_sociais?: Record<string, string>;
}

export interface AtualizarProfissionalData {
  nm_profissional?: string;
  ds_especialidades?: string;
  ds_bio?: string;
  ds_foto_perfil?: string;
  ds_formacao?: string;
  nr_registro_profissional?: string;
  nr_anos_experiencia?: number;
  st_ativo?: boolean;
  st_aceita_novos_pacientes?: boolean;
  ds_idiomas?: string[];
  ds_redes_sociais?: Record<string, string>;
}

export interface EstatisticasProfissional {
  total_agendamentos: number;
  agendamentos_concluidos: number;
  agendamentos_pendentes: number;
  taxa_conclusao: number;
  avaliacoes_positivas: number;
  avaliacoes_neutras: number;
  avaliacoes_negativas: number;
  avaliacao_media: number;
  total_pacientes: number;
  receita_total: number;
}

export interface StatsFiltros {
  dt_inicio?: string;
  dt_fim?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useProfissionais(filtros: ProfissionaisFiltros = {}) {
  const { page = 1, size = 20, ...params } = filtros;

  const { data, error, isLoading } = useSWR<ProfissionaisResponse>(
    [endpoints.profissionais.list, page, size, JSON.stringify(params)],
    async () => {
      try {
        return await apiClient.get<ProfissionaisResponse>(
          endpoints.profissionais.list,
          {
            params: { page, size, ...params },
          }
        );
      } catch (err) {
        console.error("Falha ao carregar profissionais:", err);
        return {
          items: [],
          meta: {
            totalItems: 0,
            itemsPerPage: size,
            totalPages: 0,
            currentPage: page,
          },
        };
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      shouldRetryOnError: false,
    }
  );

  return {
    profissionais: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: !!error,
    error,
  };
}

export function useProfissional(profissionalId: string | null) {
  const { data, error, isLoading } = useSWR<Profissional>(
    profissionalId ? endpoints.profissionais.get(profissionalId) : null,
    async () => {
      if (!profissionalId) return null;
      try {
        return await apiClient.get<Profissional>(
          endpoints.profissionais.get(profissionalId)
        );
      } catch (err) {
        console.error("Falha ao carregar profissional:", err);
        return null;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      shouldRetryOnError: false,
    }
  );

  return {
    profissional: data || null,
    isLoading,
    isError: !!error,
    error,
  };
}

export function useEstatisticasProfissional(
  profissionalId: string | null,
  filtros: StatsFiltros = {}
) {
  const { data, error, isLoading } = useSWR<EstatisticasProfissional>(
    profissionalId
      ? [endpoints.profissionais.stats(profissionalId), JSON.stringify(filtros)]
      : null,
    async () => {
      if (!profissionalId) return null;
      try {
        return await apiClient.get<EstatisticasProfissional>(
          endpoints.profissionais.stats(profissionalId),
          {
            params: filtros,
          }
        );
      } catch (err) {
        console.error("Falha ao carregar estatísticas do profissional:", err);
        return null;
      }
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Atualiza a cada 1 minuto
      dedupingInterval: 5000,
      shouldRetryOnError: false,
    }
  );

  return {
    stats: data || null,
    isLoading,
    isError: !!error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

export async function criarProfissional(data: CriarProfissionalData): Promise<Profissional> {
  return apiClient.post(endpoints.profissionais.create, data);
}

export async function atualizarProfissional(
  profissionalId: string,
  data: AtualizarProfissionalData
): Promise<Profissional> {
  return apiClient.put(endpoints.profissionais.update(profissionalId), data);
}

export async function deletarProfissional(profissionalId: string): Promise<void> {
  return apiClient.delete(endpoints.profissionais.delete(profissionalId));
}

// ============================================================================
// REVALIDATION
// ============================================================================

export function revalidarProfissionais() {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.profissionais.list);
}

export function revalidarProfissional(profissionalId: string) {
  mutate(endpoints.profissionais.get(profissionalId));
  revalidarProfissionais();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatarEspecialidades(especialidades?: string | string[]): string[] {
  if (!especialidades) return [];
  if (Array.isArray(especialidades)) return especialidades;
  return especialidades.split(",").map((e) => e.trim());
}

export function getAvaliacaoColor(avaliacao?: number): string {
  if (!avaliacao) return "text-gray-400";
  if (avaliacao >= 4.5) return "text-green-600";
  if (avaliacao >= 3.5) return "text-yellow-600";
  return "text-red-600";
}

export function isProfissionalDisponivel(profissional: Profissional): boolean {
  return profissional.st_ativo && profissional.st_aceita_novos_pacientes;
}

export function getExperienciaLabel(anos?: number): string {
  if (!anos) return "Sem informação";
  if (anos === 1) return "1 ano de experiência";
  if (anos < 5) return `${anos} anos de experiência`;
  if (anos < 10) return `${anos} anos de experiência`;
  return `${anos}+ anos de experiência`;
}
