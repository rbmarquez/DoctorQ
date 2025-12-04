/**
 * Hooks SWR para Agendamentos
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface Agendamento {
  id_agendamento: string;
  id_paciente: string;
  id_profissional: string;
  id_clinica: string;
  id_procedimento?: string;
  dt_agendamento: string;
  nr_duracao_minutos: number;
  ds_status: string;
  ds_motivo?: string;
  ds_observacoes?: string;
  st_confirmado: boolean;
  dt_confirmacao?: string;
  vl_valor?: number;
  st_pago: boolean;
  st_avaliado: boolean;
  dt_criacao: string;

  // Dados relacionados
  nm_paciente?: string;
  nm_profissional?: string;
  nm_clinica?: string;
  nm_procedimento?: string;
}

export interface AgendamentoListItem {
  id_agendamento: string;
  id_profissional: string; // ID do profissional (necessário para cores)
  id_paciente?: string; // ID do paciente
  dt_agendamento: string;
  nr_duracao_minutos: number;
  ds_status: string;
  st_confirmado: boolean;
  nm_paciente?: string;
  nm_profissional?: string;
  nm_procedimento?: string;
  vl_procedimento?: number;
  ds_observacoes?: string;
  ds_local?: string;
  ds_endereco?: string;
  ds_especialidade?: string;
}

export interface AgendamentoListResponse {
  items: AgendamentoListItem[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface AgendamentosFiltros {
  id_paciente?: string;
  id_profissional?: string;
  id_clinica?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  apenas_confirmados?: boolean;
  page?: number;
  size?: number;
}

export interface CriarAgendamentoData {
  id_paciente: string;
  id_profissional: string;
  id_clinica: string;
  id_procedimento?: string;
  dt_agendamento: string;
  nr_duracao_minutos: number;
  ds_motivo?: string;
  ds_observacoes?: string;
  vl_valor?: number;
  ds_forma_pagamento?: string;
}

export interface HorarioDisponivel {
  dt_horario: string;
  disponivel: boolean;
  motivo?: string;
}

export interface ProfissionalDisponivel {
  id_profissional: string;
  nm_profissional: string;
  ds_especialidades?: string[];
  nr_avaliacao_media?: number;
  nr_total_avaliacoes?: number;
  ds_foto_perfil?: string;
  id_clinica: string;
  nm_clinica: string;
  ds_endereco_clinica?: string;
  total_horarios_disponiveis: number;
  primeiro_horario_disponivel?: string;
  ultimo_horario_disponivel?: string;
}

export interface ProfissionaisDisponiveisParams {
  id_procedimento: string;
  data_inicio: string;
  data_fim?: string;
  data_horario?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar agendamentos com filtros
 */
export function useAgendamentos(filtros?: AgendamentosFiltros) {
  // Debug: Log dos parâmetros recebidos
  console.log("🔧 useAgendamentos - Filtros recebidos:", {
    filtros,
    chave: [endpoints.agendamentos.list, filtros],
  });

  const { data, error, isLoading } = useSWR<AgendamentoListResponse>(
    [endpoints.agendamentos.list, filtros],
    () => {
      console.log("🌐 useAgendamentos - Fazendo requisição API com params:", filtros);
      return apiClient.get(endpoints.agendamentos.list, { params: filtros });
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  // Debug: Log dos dados retornados
  console.log("📦 useAgendamentos - Dados retornados:", {
    totalItems: data?.items?.length || 0,
    isLoading,
    hasError: !!error,
    primeiroItem: data?.items?.[0],
  });

  return {
    agendamentos: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter detalhes de um agendamento específico
 */
export function useAgendamento(id: string | null) {
  const { data, error, isLoading } = useSWR<Agendamento>(
    id ? endpoints.agendamentos.get(id) : null,
    () => (id ? apiClient.get(endpoints.agendamentos.get(id)) : null),
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Atualizar a cada 1 minuto
    }
  );

  return {
    agendamento: data,
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Criar novo agendamento
 */
export async function criarAgendamento(data: CriarAgendamentoData): Promise<Agendamento> {
  const agendamento = await apiClient.post<Agendamento>(endpoints.agendamentos.create, data);

  // Revalidar lista de agendamentos
  mutate((key) => Array.isArray(key) && key[0] === endpoints.agendamentos.list);

  return agendamento;
}

/**
 * Confirmar um agendamento
 */
export async function confirmarAgendamento(
  id: string,
  confirmado_por: string
): Promise<{ message: string }> {
  const result = await apiClient.post<{ message: string }>(
    endpoints.agendamentos.confirmar(id),
    null,
    { params: { confirmado_por } }
  );

  // Revalidar agendamento específico e lista
  mutate(endpoints.agendamentos.get(id));
  mutate((key) => Array.isArray(key) && key[0] === endpoints.agendamentos.list);

  return result;
}

/**
 * Cancelar um agendamento
 */
export async function cancelarAgendamento(
  id: string,
  motivo: string,
  cancelado_por: string
): Promise<{ message: string }> {
  const result = await apiClient.delete<{ message: string }>(
    endpoints.agendamentos.delete(id),
    { params: { motivo, cancelado_por } }
  );

  // Revalidar agendamento específico e lista
  mutate(endpoints.agendamentos.get(id));
  mutate((key) => Array.isArray(key) && key[0] === endpoints.agendamentos.list);

  return result;
}

/**
 * Atualizar um agendamento
 */
export async function atualizarAgendamento(
  id: string,
  data: Partial<CriarAgendamentoData>
): Promise<Agendamento> {
  const agendamento = await apiClient.put<Agendamento>(
    endpoints.agendamentos.update(id),
    data
  );

  // Revalidar agendamento específico e lista
  mutate(endpoints.agendamentos.get(id));
  mutate((key) => Array.isArray(key) && key[0] === endpoints.agendamentos.list);

  return agendamento;
}

/**
 * Hook para obter horários disponíveis de um profissional em uma data
 *
 * @param idProfissional - ID do profissional
 * @param data - Data no formato YYYY-MM-DD
 * @param duracaoMinutos - Duração do procedimento em minutos (padrão 60)
 * @returns Lista de horários disponíveis
 *
 * @example
 * ```tsx
 * const { horarios, isLoading, error } = useHorariosDisponiveis(
 *   profissionalId,
 *   '2025-10-30',
 *   60
 * );
 * ```
 */
export function useHorariosDisponiveis(
  idProfissional: string | null,
  data: string | null,
  duracaoMinutos: number = 60
) {
  const shouldFetch = Boolean(idProfissional && data);

  const { data: horarios, error, isLoading, mutate: mutateHorarios } = useSWR<HorarioDisponivel[]>(
    shouldFetch ? [endpoints.agendamentos.disponibilidade, idProfissional, data, duracaoMinutos] : null,
    () => apiClient.get(endpoints.agendamentos.disponibilidade, {
      params: {
        id_profissional: idProfissional,
        data: data,
        duracao_minutos: duracaoMinutos,
      }
    }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    horarios: horarios || [],
    horariosDisponiveis: horarios?.filter(h => h.disponivel) || [],
    horariosOcupados: horarios?.filter(h => !h.disponivel) || [],
    isLoading,
    error,
    mutate: mutateHorarios,
  };
}

/**
 * Hook para listar profissionais disponíveis para um procedimento em um período
 */
export function useProfissionaisDisponiveis(params: ProfissionaisDisponiveisParams | null) {
  const procedimentoId = params?.id_procedimento ?? null;
  const dataInicio = params?.data_inicio ?? null;
  const dataFim = params?.data_fim;
  const dataHorario = params?.data_horario ?? null;
  const shouldFetch = Boolean(procedimentoId && dataInicio && dataHorario);

  const { data, error, isLoading, mutate, isValidating } = useSWR<ProfissionalDisponivel[]>(
    shouldFetch
      ? [endpoints.agendamentos.profissionaisDisponiveis, procedimentoId, dataInicio, dataFim ?? null, dataHorario]
      : null,
    () =>
      apiClient.get(endpoints.agendamentos.profissionaisDisponiveis, {
        params: {
          id_procedimento: procedimentoId!,
          data_inicio: dataInicio!,
          ...(dataFim ? { data_fim: dataFim } : {}),
          data_horario: dataHorario!,
        },
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    profissionais: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

/**
 * Revalidar todos os agendamentos
 */
export function revalidarAgendamentos() {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.agendamentos.list);
}

/**
 * Revalidar agendamento específico
 */
export function revalidarAgendamento(id: string) {
  mutate(endpoints.agendamentos.get(id));
}

// ============================================================================
// HOOKS MULTI-CLÍNICA (PROFISSIONAIS)
// ============================================================================

/**
 * Interface para filtros de agendamentos do profissional
 */
export interface AgendamentosProfissionalFiltros {
  dt_inicio?: string; // YYYY-MM-DD
  dt_fim?: string; // YYYY-MM-DD
  id_clinica?: string; // Filtrar por clínica específica (opcional)
  ds_status?: string; // confirmado, pendente, cancelado, concluido
}

/**
 * Hook para buscar agendamentos de um profissional em TODAS as suas clínicas
 *
 * **Suporte Multi-Clínica**: Retorna agendamentos de todas as clínicas onde o profissional trabalha.
 * Pode ser filtrado por clínica específica via parâmetro `id_clinica`.
 *
 * @param id_profissional - UUID do profissional
 * @param filtros - Filtros opcionais (data, clínica, status)
 * @returns SWR response com lista de agendamentos
 *
 * @example
 * ```tsx
 * // Todos os agendamentos
 * const { agendamentos } = useAgendamentosProfissional(profissionalId);
 *
 * // Apenas de uma clínica específica
 * const { agendamentos } = useAgendamentosProfissional(profissionalId, {
 *   id_clinica: clinicaId
 * });
 *
 * // Com filtro de data
 * const { agendamentos } = useAgendamentosProfissional(profissionalId, {
 *   dt_inicio: '2025-11-01',
 *   dt_fim: '2025-11-30'
 * });
 * ```
 */
export function useAgendamentosProfissional(
  id_profissional: string | null,
  filtros: AgendamentosProfissionalFiltros = {}
) {
  const { dt_inicio, dt_fim, id_clinica, ds_status } = filtros;

  // Construir chave SWR com todos os parâmetros para cache correto
  const key = id_profissional
    ? [`/agendamentos/profissional/${id_profissional}/`, dt_inicio, dt_fim, id_clinica, ds_status]
    : null;

  const { data, error, isLoading, isValidating, mutate: mutateAgendamentos } = useSWR<Agendamento[]>(
    key,
    async () => {
      const params: Record<string, string> = {};
      if (dt_inicio) params.dt_inicio = dt_inicio;
      if (dt_fim) params.dt_fim = dt_fim;
      if (id_clinica) params.id_clinica = id_clinica;
      if (ds_status) params.ds_status = ds_status;

      return apiClient.get(`/agendamentos/profissional/${id_profissional}/`, { params });
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 segundos - dados mudam com frequência
    }
  );

  return {
    agendamentos: data || [],
    isLoading,
    isValidating,
    isError: !!error,
    error,
    mutate: mutateAgendamentos,
  };
}

/**
 * Hook para buscar estatísticas de agendamentos do profissional
 *
 * @param id_profissional - UUID do profissional
 * @param periodo - Período para estatísticas ('dia', 'semana', 'mes')
 * @returns Estatísticas agregadas
 */
export function useEstatisticasAgendamentosProfissional(
  id_profissional: string | null,
  periodo: 'dia' | 'semana' | 'mes' = 'dia'
) {
  const hoje = new Date();
  const dt_inicio = new Date(hoje);
  const dt_fim = new Date(hoje);

  // Calcular datas baseado no período
  if (periodo === 'dia') {
    // Apenas hoje
  } else if (periodo === 'semana') {
    dt_inicio.setDate(hoje.getDate() - hoje.getDay()); // Início da semana
    dt_fim.setDate(dt_inicio.getDate() + 6); // Fim da semana
  } else if (periodo === 'mes') {
    dt_inicio.setDate(1); // Primeiro dia do mês
    dt_fim.setMonth(dt_fim.getMonth() + 1, 0); // Último dia do mês
  }

  const { agendamentos, isLoading } = useAgendamentosProfissional(id_profissional, {
    dt_inicio: dt_inicio.toISOString().split('T')[0],
    dt_fim: dt_fim.toISOString().split('T')[0],
  });

  // Calcular estatísticas
  const total = agendamentos.length;
  const confirmados = agendamentos.filter((a) => a.st_confirmado || a.ds_status === 'confirmado').length;
  const pendentes = agendamentos.filter((a) => a.ds_status === 'pendente').length;
  const concluidos = agendamentos.filter((a) => a.ds_status === 'concluido').length;
  const cancelados = agendamentos.filter((a) => a.ds_status === 'cancelado').length;
  const faturamentoTotal = agendamentos
    .filter((a) => a.ds_status === 'concluido' && a.vl_valor)
    .reduce((acc, a) => acc + (a.vl_valor || 0), 0);

  return {
    total,
    confirmados,
    pendentes,
    concluidos,
    cancelados,
    faturamentoTotal,
    taxaConclusao: total > 0 ? Math.round((concluidos / total) * 100) : 0,
    isLoading,
  };
}

/**
 * Revalidar agendamentos do profissional
 */
export function revalidarAgendamentosProfissional(id_profissional: string) {
  mutate((key) => Array.isArray(key) && key[0] === `/agendamentos/profissional/${id_profissional}/`);
}
