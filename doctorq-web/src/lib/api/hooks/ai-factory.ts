/**
 * Factory para criação de hooks padronizados para o AI Service usando SWR
 */

import React from 'react';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { aiClient, buildAIQueryString } from '../ai-client';
import type { PaginatedResponse } from '../types';

/**
 * Opções para useQuery
 */
export interface UseQueryOptions<TParams = any> {
  /**
   * Endpoint da API (ex: '/agentes/')
   */
  endpoint: string;

  /**
   * Parâmetros de query (serão convertidos em query string)
   */
  params?: TParams;

  /**
   * Se false, a requisição não será executada
   */
  enabled?: boolean;

  /**
   * Configurações do SWR
   */
  config?: SWRConfiguration;
}

/**
 * Resultado padronizado de useQuery
 */
export interface UseQueryResult<T> {
  /**
   * Dados retornados (array vazio se não houver dados)
   */
  data: T[];

  /**
   * Metadados de paginação
   */
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };

  /**
   * Indica se está carregando
   */
  isLoading: boolean;

  /**
   * Indica se houve erro
   */
  isError: boolean;

  /**
   * Objeto de erro (se houver)
   */
  error: Error | null;

  /**
   * Função para revalidar os dados
   */
  mutate: SWRResponse<PaginatedResponse<T>>['mutate'];

  /**
   * Indica se está revalidando
   */
  isValidating: boolean;
}

/**
 * Hook factory para queries paginadas no AI Service
 */
export function useQuery<T, TParams = any>(
  options: UseQueryOptions<TParams>
): UseQueryResult<T> {
  const { endpoint, params, enabled = true, config } = options;

  // Construir chave do SWR
  const queryString = params ? buildAIQueryString(params as Record<string, any>) : '';
  const key = enabled ? `ai:${endpoint}${queryString}` : null;

  // Fetcher
  const fetcher = React.useCallback(
    async (url: string): Promise<PaginatedResponse<T>> => {
      const [_, endpoint, query] = url.match(/^ai:(.+?)(\?.*)?$/) || [];
      if (!endpoint) throw new Error('Invalid SWR key format');

      return aiClient.get<PaginatedResponse<T>>(endpoint, {
        params: params as Record<string, any>,
      });
    },
    [params]
  );

  // Hook SWR
  const swr = useSWR<PaginatedResponse<T>>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    ...config,
  });

  return {
    data: swr.data?.data || [],
    meta: swr.data?.meta || {
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 10,
    },
    isLoading: !swr.error && !swr.data,
    isError: !!swr.error,
    error: swr.error || null,
    mutate: swr.mutate,
    isValidating: swr.isValidating,
  };
}

/**
 * Opções para useQuerySingle
 */
export interface UseQuerySingleOptions {
  /**
   * Endpoint da API (ex: '/agentes/123')
   */
  endpoint: string;

  /**
   * Se false, a requisição não será executada
   */
  enabled?: boolean;

  /**
   * Configurações do SWR
   */
  config?: SWRConfiguration;
}

/**
 * Resultado de useQuerySingle
 */
export interface UseQuerySingleResult<T> {
  /**
   * Dados retornados (null se não encontrado)
   */
  data: T | null;

  /**
   * Indica se está carregando
   */
  isLoading: boolean;

  /**
   * Indica se houve erro
   */
  isError: boolean;

  /**
   * Objeto de erro (se houver)
   */
  error: Error | null;

  /**
   * Função para revalidar os dados
   */
  mutate: SWRResponse<T>['mutate'];

  /**
   * Indica se está revalidando
   */
  isValidating: boolean;
}

/**
 * Hook factory para query de item único
 */
export function useQuerySingle<T>(
  options: UseQuerySingleOptions
): UseQuerySingleResult<T> {
  const { endpoint, enabled = true, config } = options;

  // Construir chave do SWR
  const key = enabled && endpoint ? `ai:${endpoint}` : null;

  // Fetcher
  const fetcher = React.useCallback(async (url: string): Promise<T> => {
    const endpoint = url.replace(/^ai:/, '');
    return aiClient.get<T>(endpoint);
  }, []);

  // Hook SWR
  const swr = useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    ...config,
  });

  return {
    data: swr.data || null,
    isLoading: !swr.error && !swr.data && enabled,
    isError: !!swr.error,
    error: swr.error || null,
    mutate: swr.mutate,
    isValidating: swr.isValidating,
  };
}

/**
 * Opções para useMutation
 */
export interface UseMutationOptions {
  /**
   * Método HTTP (POST, PUT, DELETE)
   */
  method: 'POST' | 'PUT' | 'DELETE';

  /**
   * Endpoint da API
   */
  endpoint: string;

  /**
   * Callback executado após sucesso da mutação
   */
  onSuccess?: (data: any) => void;

  /**
   * Callback executado após erro da mutação
   */
  onError?: (error: Error) => void;
}

/**
 * Resultado de useMutation
 */
export interface UseMutationResult<TData = any, TVariables = any> {
  /**
   * Função para executar a mutação
   */
  mutate: (variables: TVariables) => Promise<TData>;

  /**
   * Indica se está executando
   */
  isLoading: boolean;

  /**
   * Indica se houve erro
   */
  isError: boolean;

  /**
   * Objeto de erro (se houver)
   */
  error: Error | null;

  /**
   * Dados retornados da última mutação
   */
  data: TData | null;

  /**
   * Reseta o estado da mutação
   */
  reset: () => void;
}

/**
 * Hook factory para mutações (POST, PUT, DELETE)
 */
export function useMutation<TData = any, TVariables = any>(
  options: UseMutationOptions
): UseMutationResult<TData, TVariables> {
  const { method, endpoint, onSuccess, onError } = options;

  const [state, setState] = React.useState<{
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    data: TData | null;
  }>({
    isLoading: false,
    isError: false,
    error: null,
    data: null,
  });

  const mutate = React.useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState({ isLoading: true, isError: false, error: null, data: null });

      try {
        let result: TData;

        switch (method) {
          case 'POST':
            result = await aiClient.post<TData>(endpoint, variables);
            break;
          case 'PUT':
            result = await aiClient.put<TData>(endpoint, variables);
            break;
          case 'DELETE':
            result = await aiClient.delete<TData>(endpoint);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        setState({ isLoading: false, isError: false, error: null, data: result });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        setState({ isLoading: false, isError: true, error: err, data: null });
        onError?.(err);
        throw err;
      }
    },
    [method, endpoint, onSuccess, onError]
  );

  const reset = React.useCallback(() => {
    setState({ isLoading: false, isError: false, error: null, data: null });
  }, []);

  return {
    mutate,
    ...state,
    reset,
  };
}
