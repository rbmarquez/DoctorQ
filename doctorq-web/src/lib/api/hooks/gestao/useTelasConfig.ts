/**
 * Hook para gerenciamento de Configuração de Telas
 *
 * Gerencia a visibilidade de telas/módulos por tipo de usuário.
 */

import * as React from 'react';
import { useQuery, useMutation } from '../factory';
import type { BaseFilterParams } from '../../types';

export enum TipoUsuarioTela {
  ADMIN = 'admin',
  PUBLICO = 'publico',
  PACIENTE = 'paciente',
  CLINICA = 'clinica',
  PROFISSIONAL = 'profissional',
  FORNECEDOR = 'fornecedor',
}

export interface TelaConfig {
  id_tela_config: string;
  id_empresa: string;
  cd_tela: string;
  tp_tipo: TipoUsuarioTela;
  fg_visivel: boolean;
  dt_criacao: string;
  dt_atualizacao?: string;
}

export interface TelasConfigFiltros extends BaseFilterParams {
  tp_tipo?: TipoUsuarioTela;
  cd_tela?: string;
}

export interface CriarTelaConfigData {
  cd_tela: string;
  tp_tipo: TipoUsuarioTela;
  fg_visivel: boolean;
}

export interface AtualizarTelaConfigData {
  fg_visivel: boolean;
}

export interface BulkUpdateItem {
  cd_tela: string;
  fg_visivel: boolean;
}

export interface BulkUpdateData {
  tp_tipo: TipoUsuarioTela;
  telas: BulkUpdateItem[];
}

/**
 * Hook para listar configurações de telas
 */
export function useTelasConfig(filtros: TelasConfigFiltros = {}) {
  return useQuery<TelaConfig, TelasConfigFiltros>({
    endpoint: '/telas-config/',
    params: filtros,
  });
}

/**
 * Hook para listar configurações de uma tela específica
 */
export function useTelaConfigPorCodigo(cd_tela: string, tp_tipo?: TipoUsuarioTela) {
  return useQuery<TelaConfig, TelasConfigFiltros>({
    endpoint: `/telas-config/tela/${cd_tela}/`,
    params: tp_tipo ? { tp_tipo } : {},
  });
}

/**
 * Hook para criar ou atualizar configuração de tela
 * Usa a rota API do Next.js para converter body → query params
 */
export function useCreateOrUpdateTelaConfig() {
  const [isMutating, setIsMutating] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const trigger = async (data: CriarTelaConfigData): Promise<TelaConfig | undefined> => {
    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch('/api/telas-config/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || errorData.message || 'Falha ao salvar configuração');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  return { trigger, isMutating, error };
}

/**
 * Hook para atualização em lote
 */
export function useBulkUpdateTelasConfig() {
  return useMutation<TelaConfig[], BulkUpdateData>({
    method: 'POST',
    endpoint: '/telas-config/bulk/',
  });
}

/**
 * Hook para deletar configuração de tela
 */
export function useDeleteTelaConfig(cd_tela: string, tp_tipo?: TipoUsuarioTela) {
  const endpoint = tp_tipo
    ? `/telas-config/tela/${cd_tela}/?tp_tipo=${tp_tipo}`
    : `/telas-config/tela/${cd_tela}/`;

  return useMutation<{ message: string }>({
    method: 'DELETE',
    endpoint,
  });
}

/**
 * Hook para resetar todas as configurações de um tipo
 */
export function useResetTipoTelasConfig(tp_tipo: TipoUsuarioTela) {
  return useMutation<{ message: string }>({
    method: 'DELETE',
    endpoint: `/telas-config/reset/${tp_tipo}/`,
  });
}
