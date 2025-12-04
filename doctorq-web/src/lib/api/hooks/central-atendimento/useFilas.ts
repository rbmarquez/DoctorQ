/**
 * Hook para gerenciamento de Filas de Atendimento
 */

import useSWR from 'swr';
import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

// Types
export interface FilaAtendimento {
  id_fila: string;
  id_empresa: string;
  nm_fila: string;
  ds_fila?: string;
  st_ativa: boolean;
  nr_prioridade: number;
  nr_tempo_max_espera?: number; // em segundos
  nr_atendimentos_simultaneos: number;
  json_horario_funcionamento?: Record<string, any>;
  json_configuracao?: Record<string, any>;
  dt_criacao: string;
  dt_atualizacao?: string;
}

export interface FilaCreate {
  nm_fila: string;
  ds_fila?: string;
  nr_prioridade?: number;
  nr_tempo_max_espera?: number;
  nr_atendimentos_simultaneos?: number;
  json_horario_funcionamento?: Record<string, any>;
  json_configuracao?: Record<string, any>;
}

export interface FilaUpdate {
  nm_fila?: string;
  ds_fila?: string;
  st_ativa?: boolean;
  nr_prioridade?: number;
  nr_tempo_max_espera?: number;
  nr_atendimentos_simultaneos?: number;
  json_horario_funcionamento?: Record<string, any>;
  json_configuracao?: Record<string, any>;
}

export interface FilaMetricas {
  id_fila: string;
  nm_fila: string;
  nr_aguardando: number;
  nr_em_atendimento: number;
  nr_atendidos_hoje: number;
  nr_abandonados_hoje: number;
  tempo_medio_espera: number; // em segundos
  tempo_medio_atendimento: number; // em segundos
  taxa_abandono: number; // percentual
  satisfacao_media: number; // 1-5
}

export interface AtendimentoItem {
  id_atendimento: string;
  id_fila: string;
  id_conversa: string;
  id_contato: string;
  id_atendente?: string;
  st_atendimento: 'aguardando' | 'em_atendimento' | 'finalizado' | 'abandonado' | 'transferido';
  nr_posicao_fila?: number;
  dt_entrada_fila: string;
  dt_inicio_atendimento?: string;
  dt_fim_atendimento?: string;
  nr_nota_satisfacao?: number;
  ds_observacao?: string;
  contato?: {
    nm_contato: string;
    nr_telefone?: string;
  };
  atendente?: {
    nm_usuario: string;
  };
}

// API Fetcher
const fetcher = async <T>(url: string): Promise<T> => {
  return await apiClient.get<T>(url);
};

// Hook principal
export function useFilas() {
  // Listar filas
  const {
    data: filasData,
    error: filasError,
    mutate: mutateFilas,
    isLoading: filasLoading
  } = useSWR<{ items: FilaAtendimento[]; total: number }>(
    '/central-atendimento/filas/',
    fetcher
  );

  // Buscar fila por ID
  const buscarFila = useCallback(async (idFila: string): Promise<FilaAtendimento> => {
    return await apiClient.get<FilaAtendimento>(`/central-atendimento/filas/${idFila}`);
  }, []);

  // Criar fila
  const criarFila = useCallback(async (dados: FilaCreate): Promise<FilaAtendimento> => {
    const fila = await apiClient.post<FilaAtendimento>('/central-atendimento/filas/', dados);
    await mutateFilas();
    return fila;
  }, [mutateFilas]);

  // Atualizar fila
  const atualizarFila = useCallback(async (idFila: string, dados: FilaUpdate): Promise<FilaAtendimento> => {
    const fila = await apiClient.patch<FilaAtendimento>(`/central-atendimento/filas/${idFila}`, dados);
    await mutateFilas();
    return fila;
  }, [mutateFilas]);

  // Excluir fila
  const excluirFila = useCallback(async (idFila: string): Promise<void> => {
    await apiClient.delete(`/central-atendimento/filas/${idFila}`);
    await mutateFilas();
  }, [mutateFilas]);

  // Obter métricas da fila
  const obterMetricas = useCallback(async (idFila: string): Promise<FilaMetricas> => {
    return await apiClient.get<FilaMetricas>(`/central-atendimento/filas/${idFila}/metricas`);
  }, []);

  // Obter atendimentos da fila
  const obterAtendimentos = useCallback(async (idFila: string): Promise<AtendimentoItem[]> => {
    const response = await apiClient.get<{ items: AtendimentoItem[] }>(
      `/central-atendimento/filas/${idFila}/atendimentos`
    );
    return response.items || [];
  }, []);

  // Pegar próximo atendimento
  const proximoAtendimento = useCallback(async (idFila: string): Promise<AtendimentoItem> => {
    const atendimento = await apiClient.post<AtendimentoItem>(
      `/central-atendimento/filas/${idFila}/proximo-atendimento`
    );
    await mutateFilas();
    return atendimento;
  }, [mutateFilas]);

  // Hook para métricas de uma fila específica
  const useFilaMetricas = (idFila: string | null) => {
    const { data, error, mutate, isLoading } = useSWR<FilaMetricas>(
      idFila ? `/central-atendimento/filas/${idFila}/metricas` : null,
      fetcher,
      { refreshInterval: 30000 } // Atualiza a cada 30s
    );
    return { metricas: data, error, mutate, isLoading };
  };

  // Hook para atendimentos de uma fila específica
  const useFilaAtendimentos = (idFila: string | null) => {
    const { data, error, mutate, isLoading } = useSWR<{ items: AtendimentoItem[] }>(
      idFila ? `/central-atendimento/filas/${idFila}/atendimentos` : null,
      fetcher,
      { refreshInterval: 10000 } // Atualiza a cada 10s
    );
    return { atendimentos: data?.items || [], error, mutate, isLoading };
  };

  return {
    // Dados
    filas: filasData?.items || [],
    totalFilas: filasData?.total || 0,
    isLoading: filasLoading,
    error: filasError,

    // Mutations
    mutateFilas,
    buscarFila,
    criarFila,
    atualizarFila,
    excluirFila,
    obterMetricas,
    obterAtendimentos,
    proximoAtendimento,

    // Sub-hooks
    useFilaMetricas,
    useFilaAtendimentos,
  };
}
