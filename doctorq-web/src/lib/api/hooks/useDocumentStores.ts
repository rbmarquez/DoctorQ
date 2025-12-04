/**
 * Hook SWR para gerenciamento de Document Stores (Knowledge Base)
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

export interface DocumentStore {
  id_document_store: string;
  nm_document_store: string;
  ds_document_store: string | null;
  ds_tipo: string; // 'vector', 'relational', 'graph'
  ds_config: Record<string, any> | null;
  st_ativo: 'S' | 'N';
  id_empresa: string | null;
  dt_criacao: string;
  dt_atualizacao: string;
  nr_total_documentos: number;
  nr_total_chunks: number;
}

export interface DocumentStoresResponse {
  items: DocumentStore[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface DocumentStoresFiltros {
  search?: string;
  tipo?: string;
  ativo?: 'S' | 'N';
  id_empresa?: string;
  page?: number;
  size?: number;
}

export interface CriarDocumentStoreData {
  nm_document_store: string;
  ds_document_store?: string;
  ds_tipo: string;
  ds_config?: Record<string, any>;
  st_ativo?: 'S' | 'N';
  id_empresa?: string | null;
}

export interface AtualizarDocumentStoreData {
  nm_document_store?: string;
  ds_document_store?: string;
  ds_config?: Record<string, any>;
  st_ativo?: 'S' | 'N';
}

export interface Documento {
  id_documento: string;
  id_document_store: string;
  nm_documento: string;
  ds_path: string;
  ds_mime_type: string | null;
  nr_tamanho: number;
  ds_metadata: Record<string, any> | null;
  st_processado: 'S' | 'N';
  nr_chunks: number;
  dt_upload: string;
  dt_processamento: string | null;
}

export interface DocumentosResponse {
  items: Documento[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface DocumentStoreStats {
  nr_total_documentos: number;
  nr_total_chunks: number;
  nr_tamanho_total: number;
  nr_documentos_processados: number;
  nr_documentos_pendentes: number;
  dt_ultimo_upload: string | null;
}

export interface QueryRequest {
  query: string;
  top_k?: number;
  filtros?: Record<string, any>;
}

export interface QueryResult {
  id_chunk: string;
  id_documento: string;
  nm_documento: string;
  ds_conteudo: string;
  nr_score: number;
  ds_metadata: Record<string, any>;
}

export interface QueryResponse {
  query: string;
  resultados: QueryResult[];
  nr_total_resultados: number;
  tempo_execucao: number;
}

// ====================================================================
// HOOKS
// ====================================================================

export function useDocumentStores(filtros: DocumentStoresFiltros = {}) {
  const { search, tipo, ativo, id_empresa, page = 1, size = 10 } = filtros;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (tipo) params.append('tipo', tipo);
  if (ativo) params.append('ativo', ativo);
  if (id_empresa) params.append('id_empresa', id_empresa);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const key = `/document-stores/?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<DocumentStoresResponse>(
    key,
    async () => {
      const response = await apiClient.get<DocumentStoresResponse>(key);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    documentStores: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useDocumentStore(documentStoreId: string | null) {
  const shouldFetch = Boolean(documentStoreId);

  const { data, error, isLoading, mutate } = useSWR<DocumentStore>(
    shouldFetch ? `/document-stores/${documentStoreId}` : null,
    async () => {
      const response = await apiClient.get<DocumentStore>(`/document-stores/${documentStoreId}`);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    documentStore: data,
    isLoading,
    error,
    mutate,
  };
}

export function useDocumentosStore(documentStoreId: string | null, page = 1, size = 10) {
  const shouldFetch = Boolean(documentStoreId);
  const key = shouldFetch
    ? `/document-stores/${documentStoreId}/files?page=${page}&size=${size}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<DocumentosResponse>(
    key,
    async () => {
      const response = await apiClient.get<DocumentosResponse>(key!);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    documentos: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useDocumentStoreStats(documentStoreId: string | null) {
  const shouldFetch = Boolean(documentStoreId);

  const { data, error, isLoading } = useSWR<DocumentStoreStats>(
    shouldFetch ? `/document-stores/${documentStoreId}/stats` : null,
    async () => {
      const response = await apiClient.get<DocumentStoreStats>(
        `/document-stores/${documentStoreId}/stats`
      );
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    stats: data,
    isLoading,
    error,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

export async function criarDocumentStore(
  data: CriarDocumentStoreData
): Promise<DocumentStore> {
  const response = await apiClient.post<DocumentStore>('/document-stores/', data);
  return response;
}

export async function atualizarDocumentStore(
  documentStoreId: string,
  data: AtualizarDocumentStoreData
): Promise<DocumentStore> {
  const response = await apiClient.put<DocumentStore>(
    `/document-stores/${documentStoreId}`,
    data
  );
  return response;
}

export async function deletarDocumentStore(documentStoreId: string): Promise<void> {
  await apiClient.delete(`/document-stores/${documentStoreId}`);
}

export async function uploadDocumento(
  documentStoreId: string,
  file: File,
  metadata?: Record<string, any>
): Promise<Documento> {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await apiClient.post<Documento>(
    `/document-stores/${documentStoreId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
}

export async function uploadDocumentosBulk(
  documentStoreId: string,
  files: File[]
): Promise<{ documentos: Documento[]; erros: any[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await apiClient.post<{ documentos: Documento[]; erros: any[] }>(
    `/document-stores/${documentStoreId}/upload-bulk`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
}

export async function deletarDocumento(
  documentStoreId: string,
  documentoId: string
): Promise<void> {
  await apiClient.delete(`/document-stores/${documentStoreId}/files/${documentoId}`);
}

export async function queryDocumentStore(
  documentStoreId: string,
  query: QueryRequest
): Promise<QueryResponse> {
  const response = await apiClient.post<QueryResponse>(
    `/document-stores/${documentStoreId}/query`,
    query
  );
  return response;
}

export async function toggleDocumentStoreStatus(
  documentStoreId: string,
  ativo: 'S' | 'N'
): Promise<DocumentStore> {
  return atualizarDocumentStore(documentStoreId, { st_ativo: ativo });
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

export async function revalidarDocumentStores(): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.startsWith('/document-stores/?'));
}

export async function revalidarDocumentStore(documentStoreId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate(`/document-stores/${documentStoreId}`);
}

export async function revalidarDocumentosStore(documentStoreId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) =>
    typeof key === 'string' && key.startsWith(`/document-stores/${documentStoreId}/files`)
  );
}

// ====================================================================
// HELPERS
// ====================================================================

export function isDocumentStoreAtivo(store: DocumentStore): boolean {
  return store.st_ativo === 'S';
}

export function getBadgeTipo(tipo: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    vector: { label: 'Vector', color: 'purple' },
    relational: { label: 'Relacional', color: 'blue' },
    graph: { label: 'Grafo', color: 'green' },
  };

  return badges[tipo] || { label: tipo, color: 'gray' };
}

export function formatarTamanho(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isDocumentoProcessado(documento: Documento): boolean {
  return documento.st_processado === 'S';
}

export function getBadgeProcessamento(documento: Documento): { label: string; color: string } {
  if (isDocumentoProcessado(documento)) {
    return { label: 'Processado', color: 'green' };
  }
  return { label: 'Pendente', color: 'yellow' };
}
