/**
 * Hook para gerenciamento de Campanhas de Outbound
 */

import useSWR from 'swr';
import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

// Types - Alinhados com backend (CampanhaCreate, CampanhaResponse do Pydantic)
export type TipoCampanha = 'prospeccao' | 'reengajamento' | 'marketing' | 'lembrete' | 'followup' | 'pesquisa';
export type TipoCanal = 'whatsapp' | 'instagram' | 'facebook' | 'email' | 'sms' | 'webchat';
export type StatusCampanha = 'rascunho' | 'agendada' | 'em_execucao' | 'pausada' | 'concluida' | 'cancelada';

export interface Campanha {
  id_campanha: string;
  id_empresa: string;
  nm_campanha: string;
  ds_descricao?: string;
  tp_campanha: TipoCampanha;
  tp_canal: TipoCanal;
  st_campanha: StatusCampanha;
  id_canal?: string;
  nm_template?: string;
  ds_mensagem?: string;
  ds_variaveis?: Record<string, any>;
  ds_filtros?: Record<string, any>;
  dt_agendamento?: string;
  dt_inicio?: string;
  dt_fim?: string;
  nr_limite_diario?: number;
  nr_intervalo_segundos?: number;
  nr_total_destinatarios: number;
  nr_enviados: number;
  nr_entregues: number;
  nr_lidos: number;
  nr_respondidos: number;
  nr_convertidos: number;
  nr_erros: number;
  dt_criacao: string;
  dt_atualizacao?: string;
}

export interface CampanhaCreate {
  nm_campanha: string;
  ds_descricao?: string;
  tp_campanha: TipoCampanha;
  tp_canal: TipoCanal;
  ds_mensagem: string; // Obrigatório
  id_canal?: string;
  nm_template?: string;
  ds_variaveis?: Record<string, any>;
  ds_filtros?: Record<string, any>;
  dt_agendamento?: string;
  nr_limite_diario?: number;
  nr_intervalo_segundos?: number;
}

export interface CampanhaUpdate {
  nm_campanha?: string;
  ds_descricao?: string;
  st_campanha?: StatusCampanha;
  nm_template?: string;
  ds_mensagem?: string;
  ds_variaveis?: Record<string, any>;
  ds_filtros?: Record<string, any>;
  dt_agendamento?: string;
  nr_limite_diario?: number;
  nr_intervalo_segundos?: number;
}

export interface CampanhaMetricas {
  id_campanha: string;
  nm_campanha?: string;
  st_campanha?: StatusCampanha;
  nr_total_destinatarios: number;
  nr_enviados: number;
  nr_entregues: number;
  nr_lidos: number;
  nr_respondidos: number;
  nr_convertidos: number;
  nr_erros: number;
  pc_taxa_abertura: number; // percentual
  pc_taxa_resposta: number; // percentual
  pc_taxa_conversao: number; // percentual
}

export interface CampanhaDestinatario {
  id_destinatario: string;
  id_campanha: string;
  id_contato: string;
  st_enviado: boolean;
  st_entregue: boolean;
  st_lido: boolean;
  st_respondido: boolean;
  st_convertido: boolean;
  st_erro: boolean;
  ds_erro?: string;
  id_mensagem_externo?: string;
  ds_variaveis?: Record<string, any>;
  dt_envio?: string;
  dt_entrega?: string;
  dt_leitura?: string;
  dt_resposta?: string;
  dt_conversao?: string;
  dt_criacao: string;
}

// API Fetcher
const fetcher = async <T>(url: string): Promise<T> => {
  return await apiClient.get<T>(url);
};

// Hook principal
export function useCampanhas() {
  // Listar campanhas
  const {
    data: campanhasData,
    error: campanhasError,
    mutate: mutateCampanhas,
    isLoading: campanhasLoading
  } = useSWR<{ items: Campanha[]; total: number }>(
    '/central-atendimento/campanhas/',
    fetcher
  );

  // Buscar campanha por ID
  const buscarCampanha = useCallback(async (idCampanha: string): Promise<Campanha> => {
    return await apiClient.get<Campanha>(`/central-atendimento/campanhas/${idCampanha}`);
  }, []);

  // Criar campanha
  const criarCampanha = useCallback(async (dados: CampanhaCreate): Promise<Campanha> => {
    const campanha = await apiClient.post<Campanha>('/central-atendimento/campanhas/', dados);
    await mutateCampanhas();
    return campanha;
  }, [mutateCampanhas]);

  // Atualizar campanha
  const atualizarCampanha = useCallback(async (idCampanha: string, dados: CampanhaUpdate): Promise<Campanha> => {
    const campanha = await apiClient.patch<Campanha>(`/central-atendimento/campanhas/${idCampanha}`, dados);
    await mutateCampanhas();
    return campanha;
  }, [mutateCampanhas]);

  // Excluir campanha
  const excluirCampanha = useCallback(async (idCampanha: string): Promise<void> => {
    await apiClient.delete(`/central-atendimento/campanhas/${idCampanha}`);
    await mutateCampanhas();
  }, [mutateCampanhas]);

  // Obter métricas da campanha
  const obterMetricas = useCallback(async (idCampanha: string): Promise<CampanhaMetricas> => {
    return await apiClient.get<CampanhaMetricas>(`/central-atendimento/campanhas/${idCampanha}/metricas`);
  }, []);

  // Adicionar destinatários
  const adicionarDestinatarios = useCallback(async (
    idCampanha: string,
    contatos: string[] // IDs dos contatos
  ): Promise<{ adicionados: number; duplicados: number }> => {
    const result = await apiClient.post<{ adicionados: number; duplicados: number }>(
      `/central-atendimento/campanhas/${idCampanha}/destinatarios`,
      { ids_contatos: contatos }
    );
    await mutateCampanhas();
    return result;
  }, [mutateCampanhas]);

  // Iniciar campanha
  const iniciarCampanha = useCallback(async (idCampanha: string): Promise<Campanha> => {
    const campanha = await apiClient.post<Campanha>(
      `/central-atendimento/campanhas/${idCampanha}/iniciar`
    );
    await mutateCampanhas();
    return campanha;
  }, [mutateCampanhas]);

  // Pausar campanha
  const pausarCampanha = useCallback(async (idCampanha: string): Promise<Campanha> => {
    const campanha = await apiClient.post<Campanha>(
      `/central-atendimento/campanhas/${idCampanha}/pausar`
    );
    await mutateCampanhas();
    return campanha;
  }, [mutateCampanhas]);

  // Retomar campanha pausada
  const retomarCampanha = useCallback(async (idCampanha: string): Promise<Campanha> => {
    const campanha = await apiClient.post<Campanha>(
      `/central-atendimento/campanhas/${idCampanha}/retomar`
    );
    await mutateCampanhas();
    return campanha;
  }, [mutateCampanhas]);

  // Cancelar campanha
  const cancelarCampanha = useCallback(async (idCampanha: string): Promise<Campanha> => {
    const campanha = await apiClient.post<Campanha>(
      `/central-atendimento/campanhas/${idCampanha}/cancelar`
    );
    await mutateCampanhas();
    return campanha;
  }, [mutateCampanhas]);

  // Adicionar destinatários por filtro
  const adicionarDestinatariosPorFiltro = useCallback(async (
    idCampanha: string,
    filtros: Record<string, unknown>
  ): Promise<{ adicionados: number; duplicados: number }> => {
    const result = await apiClient.post<{ adicionados: number; duplicados: number }>(
      `/central-atendimento/campanhas/${idCampanha}/destinatarios/filtro`,
      filtros
    );
    await mutateCampanhas();
    return result;
  }, [mutateCampanhas]);

  // Listar destinatários da campanha
  const listarDestinatarios = useCallback(async (
    idCampanha: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: CampanhaDestinatario[]; total: number }> => {
    return await apiClient.get<{ items: CampanhaDestinatario[]; total: number }>(
      `/central-atendimento/campanhas/${idCampanha}/destinatarios?page=${page}&page_size=${pageSize}`
    );
  }, []);

  // Hook para métricas de uma campanha específica
  const useCampanhaMetricas = (idCampanha: string | null) => {
    const { data, error, mutate, isLoading } = useSWR<CampanhaMetricas>(
      idCampanha ? `/central-atendimento/campanhas/${idCampanha}/metricas` : null,
      fetcher,
      { refreshInterval: 60000 } // Atualiza a cada 1 min
    );
    return { metricas: data, error, mutate, isLoading };
  };

  return {
    // Dados
    campanhas: campanhasData?.items || [],
    totalCampanhas: campanhasData?.total || 0,
    isLoading: campanhasLoading,
    error: campanhasError,

    // Mutations
    mutateCampanhas,
    buscarCampanha,
    criarCampanha,
    atualizarCampanha,
    excluirCampanha,
    obterMetricas,
    adicionarDestinatarios,
    adicionarDestinatariosPorFiltro,
    listarDestinatarios,
    iniciarCampanha,
    pausarCampanha,
    retomarCampanha,
    cancelarCampanha,

    // Sub-hooks
    useCampanhaMetricas,
  };
}
