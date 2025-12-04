/**
 * Hooks SWR para Analytics e Dashboard
 */

import useSWR from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface DashboardStats {
  total_usuarios: number;
  total_profissionais: number;
  total_pacientes: number;
  total_clinicas: number;
  total_fornecedores: number;
  total_produtos: number;
  total_procedimentos: number;
  total_agendamentos_hoje: number;
  total_transacoes_hoje: number;
  total_avaliacoes_pendentes: number;
  faturamento_hoje: number;
  faturamento_mes: number;
  crescimento_percentual: number;
}

export interface AnalyticsEvent {
  id_evento: string;
  tp_evento: string;
  id_usuario?: string;
  id_entidade?: string;
  tp_entidade?: string;
  ds_dados?: Record<string, any>;
  ds_ip?: string;
  ds_user_agent?: string;
  dt_criacao: string;
}

export interface AnalyticsSnapshot {
  id_snapshot: string;
  dt_referencia: string;
  tp_metrica: string;
  vl_metrica: number;
  ds_dimensoes?: Record<string, any>;
  dt_criacao: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obter estatísticas do dashboard
 */
export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    endpoints.analytics.dashboard,
    () => apiClient.get(endpoints.analytics.dashboard),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Atualizar a cada 1 minuto
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obter eventos de analytics
 */
export function useAnalyticsEvents(filtros?: {
  tp_evento?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  size?: number;
}) {
  const { data, error, isLoading } = useSWR(
    [endpoints.analytics.events, filtros],
    () => apiClient.get(endpoints.analytics.events, { params: filtros }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    events: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter snapshots de métricas
 */
export function useAnalyticsSnapshots(filtros?: {
  tp_metrica?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  size?: number;
}) {
  const { data, error, isLoading } = useSWR(
    [endpoints.analytics.snapshots, filtros],
    () => apiClient.get(endpoints.analytics.snapshots, { params: filtros }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    snapshots: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter métricas agregadas por período
 */
export function useMetricasAgregadas(
  tp_metrica: string,
  data_inicio: string,
  data_fim: string,
  agrupamento: 'dia' | 'semana' | 'mes' = 'dia'
) {
  const { data, error, isLoading } = useSWR(
    [endpoints.analytics.metricas, tp_metrica, data_inicio, data_fim, agrupamento],
    () => apiClient.get(endpoints.analytics.metricas, {
      params: {
        tp_metrica,
        data_inicio,
        data_fim,
        agrupamento,
      }
    }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    metricas: data || [],
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Registrar evento de analytics
 */
export async function registrarEvento(evento: {
  tp_evento: string;
  id_entidade?: string;
  tp_entidade?: string;
  ds_dados?: Record<string, any>;
}): Promise<AnalyticsEvent> {
  return await apiClient.post<AnalyticsEvent>(endpoints.analytics.events, evento);
}

/**
 * Criar snapshot de métrica
 */
export async function criarSnapshot(snapshot: {
  dt_referencia: string;
  tp_metrica: string;
  vl_metrica: number;
  ds_dimensoes?: Record<string, any>;
}): Promise<AnalyticsSnapshot> {
  return await apiClient.post<AnalyticsSnapshot>(endpoints.analytics.snapshots, snapshot);
}
