/**
 * Cliente HTTP específico para o DoctorQ AI Service
 */

import type { ApiError, RequestConfig } from './types';

/**
 * URL base do AI Service
 */
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8081/ai';

/**
 * API Key para autenticação no AI Service
 */
const AI_API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';

/**
 * Token de autenticação dinâmico (pode ser atualizado via setAIAuthToken)
 */
let dynamicAIAuthToken: string | null = null;

/**
 * Define o token de autenticação dinâmico para uso nos requests do AI Service
 */
export function setAIAuthToken(token: string | null) {
  dynamicAIAuthToken = token;
}

/**
 * Obtém o token de autenticação atual (dinâmico ou API key)
 */
function getAIAuthToken(): string {
  return dynamicAIAuthToken || AI_API_KEY;
}

/**
 * Classe de erro customizada para erros de API
 */
export class AIClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

/**
 * Helper para construir query string
 */
export function buildAIQueryString(params: Record<string, any>): string {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${key}=${encodeURIComponent(String(v))}`).join('&');
      }
      return `${key}=${encodeURIComponent(String(value))}`;
    })
    .join('&');

  return filtered ? `?${filtered}` : '';
}

/**
 * Cliente HTTP específico para o AI Service
 */
export const aiClient = {
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
    const queryString = config?.params ? buildAIQueryString(config.params) : '';
    const url = `${AI_SERVICE_URL}${endpoint}${queryString}`;

    const authToken = getAIAuthToken();
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

        throw new AIClientError(
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
      if (error instanceof AIClientError) {
        throw error;
      }

      // Erro de rede ou timeout
      throw new AIClientError(
        error instanceof Error ? error.message : 'Erro de conexão com AI Service',
        undefined,
        'NETWORK_ERROR'
      );
    }
  },

  /**
   * Requisição para streaming (SSE - Server-Sent Events)
   * Usado para chat com agentes
   */
  async stream(
    endpoint: string,
    data: any,
    onMessage: (message: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    const url = `${AI_SERVICE_URL}${endpoint}`;
    const authToken = getAIAuthToken();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          message: response.statusText || 'Erro desconhecido',
        }));

        throw new AIClientError(
          error.message,
          response.status,
          error.code,
          error.details
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new AIClientError('Stream reader não disponível');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete?.();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data && data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                onMessage(parsed.content || parsed.message || data);
              } catch {
                onMessage(data);
              }
            }
          }
        }
      }
    } catch (error) {
      const aiError = error instanceof AIClientError
        ? error
        : new AIClientError(
            error instanceof Error ? error.message : 'Erro de streaming',
            undefined,
            'STREAM_ERROR'
          );

      onError?.(aiError);
    }
  },
};

/**
 * Helper para verificar se o AI Service está disponível
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_SERVICE_URL.replace('/ai', '')}/ai/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
