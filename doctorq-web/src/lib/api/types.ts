/**
 * Tipos compartilhados para API client
 */

/**
 * Resposta paginada padrão da API
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  size?: number;
}

/**
 * Parâmetros de ordenação
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parâmetros de filtro base
 */
export interface BaseFilterParams extends PaginationParams, SortParams {
  busca?: string;
}

/**
 * Erro da API
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Configuração de requisição
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  signal?: AbortSignal;
}
