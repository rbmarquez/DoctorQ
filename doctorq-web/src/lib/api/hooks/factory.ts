/**
 * Factory para criação de hooks padronizados usando SWR
 */

import React from 'react';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { apiClient, buildQueryString } from '../client';
import type { PaginatedResponse } from '../types';

/**
 * Opções para useQuery
 */
export interface UseQueryOptions<TParams = any> {
  /**
   * Endpoint da API (ex: '/empresas/')
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
 * Hook factory para queries paginadas
 *
 * @example
 * ```typescript
 * const { data, meta, isLoading, error } = useQuery<Empresa>({
 *   endpoint: '/empresas/',
 *   params: { page: 1, size: 10, busca: 'termo' },
 * });
 * ```
 */
export function useQuery<T, TParams = any>(
  options: UseQueryOptions<TParams>
): UseQueryResult<T> {
  const { endpoint, params, enabled = true, config } = options;

  // Construir chave do SWR
  const queryString = params ? buildQueryString(params as Record<string, any>) : '';
  const key = enabled ? `${endpoint}${queryString}` : null;

  // Fetcher
  const fetcher = (url: string) => apiClient.get<PaginatedResponse<T>>(url);

  // SWR
  const { data, error, isLoading, isValidating, mutate } = useSWR<PaginatedResponse<T>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      ...config,
    }
  );

  return {
    data: data?.items ?? [],
    meta: data?.meta ?? {
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 10,
    },
    isLoading,
    isError: !!error,
    error: error ?? null,
    mutate,
    isValidating,
  };
}

/**
 * Opções para useQuerySingle
 */
export interface UseQuerySingleOptions {
  /**
   * Endpoint da API (ex: '/empresas/123')
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
   * Dado retornado (undefined se não houver)
   */
  data: T | undefined;

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
 * Hook factory para queries de item único
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useQuerySingle<Empresa>({
 *   endpoint: `/empresas/${id}`,
 * });
 * ```
 */
export function useQuerySingle<T>(
  options: UseQuerySingleOptions
): UseQuerySingleResult<T> {
  const { endpoint, enabled = true, config } = options;

  const key = enabled ? endpoint : null;
  const fetcher = (url: string) => apiClient.get<T>(url);

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    ...config,
  });

  return {
    data,
    isLoading,
    isError: !!error,
    error: error ?? null,
    mutate,
    isValidating,
  };
}

/**
 * Opções de callback para mutate
 */
export interface MutateOptions<T = any> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

/**
 * Hook para mutations (POST, PUT, DELETE)
 * Compatível com padrão TanStack Query
 *
 * @example
 * ```typescript
 * const { mutate, isPending, error } = useMutation<Empresa>({
 *   method: 'POST',
 *   endpoint: '/empresas/',
 * });
 *
 * const handleCreate = () => {
 *   mutate(data, {
 *     onSuccess: (result) => console.log('Criado:', result),
 *     onError: (err) => console.error('Erro:', err),
 *   });
 * };
 * ```
 */
export function useMutation<T, TData = any>(options: {
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string | ((data?: TData) => string);
}) {
  const { method, endpoint } = options;

  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const mutate = async (data?: TData, callbacks?: MutateOptions<T>): Promise<T | undefined> => {
    setIsPending(true);
    setError(null);

    try {
      let result: T;

      const resolvedEndpoint =
        typeof endpoint === 'function' ? endpoint(data) : endpoint;

      if (method === 'POST') {
        result = await apiClient.post<T>(resolvedEndpoint, data);
      } else if (method === 'PUT') {
        result = await apiClient.put<T>(resolvedEndpoint, data);
      } else {
        result = await apiClient.delete<T>(resolvedEndpoint);
      }

      callbacks?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
      callbacks?.onSettled?.();
    }
  };

  return {
    mutate,
    isPending,
    error,
    // Alias para compatibilidade
    trigger: mutate,
    isMutating: isPending,
  };
}
