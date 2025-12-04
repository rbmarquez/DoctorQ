/**
 * Hook para gerenciamento de Canais de Atendimento
 * WhatsApp, Instagram, Facebook, Email, Chat Web, etc.
 */

import useSWR from 'swr';
import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

// Types
export interface Canal {
  id_canal: string;
  id_empresa: string;
  tp_canal: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'email' | 'chat_web' | 'sms';
  nm_canal: string;
  ds_canal?: string;
  st_ativo: boolean;
  st_validado: boolean;
  json_configuracao?: Record<string, any>;
  json_credenciais?: Record<string, any>;
  dt_validacao?: string;
  dt_criacao: string;
  dt_atualizacao?: string;
}

export interface CanalCreate {
  tp_canal: Canal['tp_canal'];
  nm_canal: string;
  ds_canal?: string;
  json_configuracao?: Record<string, any>;
  json_credenciais?: Record<string, any>;
}

export interface CanalUpdate {
  nm_canal?: string;
  ds_canal?: string;
  st_ativo?: boolean;
  json_configuracao?: Record<string, any>;
  json_credenciais?: Record<string, any>;
}

export interface WhatsAppConfig {
  phone_number_id: string;
  business_account_id: string;
  access_token_configured: boolean;
  verify_token: string;
  webhook_url: string;
  api_version: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
}

// API Fetcher
const fetcher = async <T>(url: string): Promise<T> => {
  return await apiClient.get<T>(url);
};

// Hook principal
export function useCanais() {
  // Listar canais
  const {
    data: canaisData,
    error: canaisError,
    mutate: mutateCanais,
    isLoading: canaisLoading
  } = useSWR<{ items: Canal[]; total: number }>(
    '/central-atendimento/canais/',
    fetcher
  );

  // Buscar canal por ID
  const buscarCanal = useCallback(async (idCanal: string): Promise<Canal> => {
    return await apiClient.get<Canal>(`/central-atendimento/canais/${idCanal}`);
  }, []);

  // Criar canal
  const criarCanal = useCallback(async (dados: CanalCreate): Promise<Canal> => {
    const canal = await apiClient.post<Canal>('/central-atendimento/canais/', dados);
    await mutateCanais();
    return canal;
  }, [mutateCanais]);

  // Atualizar canal
  const atualizarCanal = useCallback(async (idCanal: string, dados: CanalUpdate): Promise<Canal> => {
    const canal = await apiClient.patch<Canal>(`/central-atendimento/canais/${idCanal}`, dados);
    await mutateCanais();
    return canal;
  }, [mutateCanais]);

  // Excluir canal
  const excluirCanal = useCallback(async (idCanal: string): Promise<void> => {
    await apiClient.delete(`/central-atendimento/canais/${idCanal}`);
    await mutateCanais();
  }, [mutateCanais]);

  // Validar canal
  const validarCanal = useCallback(async (idCanal: string): Promise<{ success: boolean; message: string }> => {
    const result = await apiClient.post<{ success: boolean; message: string }>(
      `/central-atendimento/canais/${idCanal}/validar`
    );
    await mutateCanais();
    return result;
  }, [mutateCanais]);

  // WhatsApp específico
  const getWhatsAppConfig = useCallback(async (): Promise<WhatsAppConfig> => {
    return await apiClient.get<WhatsAppConfig>('/central-atendimento/whatsapp/config');
  }, []);

  const getWhatsAppTemplates = useCallback(async (): Promise<WhatsAppTemplate[]> => {
    const response = await apiClient.get<{ templates: WhatsAppTemplate[] }>(
      '/central-atendimento/whatsapp/templates'
    );
    return response.templates || [];
  }, []);

  const testWhatsAppEnvio = useCallback(async (telefone: string, mensagem: string): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(
      '/central-atendimento/whatsapp/test-envio',
      { telefone, mensagem }
    );
  }, []);

  return {
    // Dados
    canais: canaisData?.items || [],
    totalCanais: canaisData?.total || 0,
    isLoading: canaisLoading,
    error: canaisError,

    // Mutations
    mutateCanais,
    buscarCanal,
    criarCanal,
    atualizarCanal,
    excluirCanal,
    validarCanal,

    // WhatsApp
    getWhatsAppConfig,
    getWhatsAppTemplates,
    testWhatsAppEnvio,
  };
}
