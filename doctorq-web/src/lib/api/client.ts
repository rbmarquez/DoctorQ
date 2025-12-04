/**
 * Cliente HTTP centralizado para comunicação com API
 */

import type { ApiError, RequestConfig } from './types';
import { getSession } from 'next-auth/react';

/**
 * URL base da API
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * API Key para autenticação (fallback quando não há sessão)
 */
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

/**
 * Token de autenticação dinâmico (pode ser atualizado via setAuthToken)
 */
let dynamicAuthToken: string | null = null;

/**
 * Define o token de autenticação dinâmico para uso nos requests
 * Usado pelos hooks SWR para passar o JWT da sessão do NextAuth
 */
export function setAuthToken(token: string | null) {
  dynamicAuthToken = token;
}

/**
 * Obtém o token de autenticação atual (dinâmico, sessão NextAuth, ou API key)
 */
async function getAuthToken(): Promise<string> {
  // 1. Primeiro, tenta usar o token dinâmico (setado pelo AuthTokenSync)
  if (dynamicAuthToken) {
    console.log('[apiClient] Usando token dinâmico:', {
      tokenPreview: dynamicAuthToken.substring(0, 30) + '...',
      tokenLength: dynamicAuthToken.length,
      startsWithEyJ: dynamicAuthToken.startsWith('eyJ')
    });
    return dynamicAuthToken;
  }

  // 2. Se não houver token dinâmico, busca a sessão NextAuth atual
  try {
    const session = await getSession();
    console.log('[apiClient] Sessão NextAuth:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAccessToken: !!session?.user?.accessToken,
      email: session?.user?.email,
      tokenPreview: session?.user?.accessToken?.substring(0, 30) + '...'
    });

    if (session?.user?.accessToken) {
      console.log('[apiClient] Usando token da sessão NextAuth');
      return session.user.accessToken;
    }
  } catch (error) {
    console.warn('[apiClient] Erro ao obter sessão NextAuth:', error);
  }

  // 3. Fallback para API key
  console.log('[apiClient] Usando API key como fallback');
  return API_KEY;
}

/**
 * Classe de erro customizada para erros de API
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Cliente HTTP com métodos para GET, POST, PUT, DELETE
 */
export const apiClient = {
  /**
   * Requisição GET
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  },

  /**
   * Requisição POST
   */
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  },

  /**
   * Requisição PUT
   */
  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  },

  /**
   * Requisição PATCH
   */
  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, config);
  },

  /**
   * Requisição DELETE
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  },

  /**
   * Requisição genérica
   */
  async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    // Construir query string a partir de config.params
    const queryString = config?.params ? buildQueryString(config.params) : '';

    // Se o endpoint começa com /api/, usa caminho relativo (Next.js routes)
    // Caso contrário, usa API_BASE_URL (backend direto)
    const url = endpoint.startsWith('/api/')
      ? `${endpoint}${queryString}`
      : `${API_BASE_URL}${endpoint}${queryString}`;

    const authToken = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...config?.headers,
    };

    const options: RequestInit = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) }),
      ...(config?.signal && { signal: config.signal }),
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          message: response.statusText || 'Erro desconhecido',
        }));

        throw new ApiClientError(
          error.message,
          response.status,
          error.code,
          error.details
        );
      }

      // Se resposta vazia (204 No Content)
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Erro de rede ou timeout
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Erro de conexão',
        undefined,
        'NETWORK_ERROR'
      );
    }
  },
};

/**
 * Helper para construir query string
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Alias para ApiClientError (compatibilidade com código existente)
 */
export const APIError = ApiClientError;

/**
 * Tipo para opções de requisição (compatibilidade)
 */
export type RequestOptions = RequestConfig;

/**
 * Fetcher para uso com SWR
 * @param url URL completa ou endpoint relativo
 * @returns Dados da resposta
 */
export async function fetcher<T = any>(url: string): Promise<T> {
  // Se URL já é completa (começa com http), usa diretamente
  if (url.startsWith('http')) {
    const authToken = await getAuthToken();
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: response.statusText || 'Erro desconhecido',
      }));

      throw new ApiClientError(
        error.message,
        response.status,
        error.code,
        error.details
      );
    }

    return await response.json();
  }

  // Caso contrário, trata como endpoint relativo
  return apiClient.get<T>(url);
}

/**
 * Upload de arquivo
 * @param endpoint Endpoint para upload
 * @param file Arquivo a ser enviado
 * @param additionalData Dados adicionais do formulário
 * @returns Resposta do upload
 */
export async function uploadFile<T = any>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  // Se o endpoint começa com /api/, usa caminho relativo (Next.js routes)
  const url = endpoint.startsWith('/api/')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const authToken = await getAuthToken();
  const headers: Record<string, string> = {
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: response.statusText || 'Erro ao fazer upload',
      }));

      throw new ApiClientError(
        error.message,
        response.status,
        error.code,
        error.details
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError(
      error instanceof Error ? error.message : 'Erro ao fazer upload',
      undefined,
      'UPLOAD_ERROR'
    );
  }
}

/**
 * Verifica se é erro de autenticação (401)
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiClientError && error.statusCode === 401;
}

/**
 * Verifica se é erro de permissão (403)
 */
export function isPermissionError(error: unknown): boolean {
  return error instanceof ApiClientError && error.statusCode === 403;
}

/**
 * Verifica se é erro de validação (400 ou 422)
 */
export function isValidationError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.statusCode === 400 || error.statusCode === 422)
  );
}

/**
 * Extrai mensagem de erro de forma segura
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro desconhecido';
}
