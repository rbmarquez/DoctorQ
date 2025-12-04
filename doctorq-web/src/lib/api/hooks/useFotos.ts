/**
 * Hooks SWR para Fotos/Galeria
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface Foto {
  id_foto: string;
  id_user: string;
  ds_url: string;
  ds_thumbnail_url?: string;
  nr_largura?: number;
  nr_altura?: number;
  nr_tamanho_bytes?: number;
  ds_titulo?: string;
  ds_descricao?: string;
  ds_tags?: string[];
  ds_tipo_foto?: 'antes' | 'depois' | 'durante' | 'comparacao';
  id_agendamento?: string;
  id_procedimento?: string;
  id_produto?: string;
  id_album?: string;
  ds_metadados?: Record<string, any>;
  dt_tirada?: string;
  dt_criacao: string;
}

export interface FotosResponse {
  items: Foto[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface FotosFiltros {
  id_user?: string;
  ds_tipo_foto?: string;
  id_agendamento?: string;
  id_procedimento?: string;
  id_produto?: string;
  id_album?: string;
  dt_inicio?: string;
  dt_fim?: string;
  page?: number;
  size?: number;
}

export interface UploadFotoData {
  id_user: string;
  ds_url: string;
  ds_thumbnail_url?: string;
  nr_largura?: number;
  nr_altura?: number;
  nr_tamanho_bytes?: number;
  ds_titulo?: string;
  ds_descricao?: string;
  ds_tags?: string[];
  ds_tipo_foto?: 'antes' | 'depois' | 'durante' | 'comparacao';
  id_agendamento?: string;
  id_procedimento?: string;
  id_produto?: string;
  id_album?: string;
  ds_metadados?: Record<string, any>;
  dt_tirada?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar fotos com filtros
 */
export function useFotos(filtros: FotosFiltros = {}) {
  const { page = 1, size = 20, ...params } = filtros;

  const { data, error, isLoading } = useSWR<FotosResponse>(
    [endpoints.fotos.list, page, size, JSON.stringify(params)],
    () =>
      apiClient.get(endpoints.fotos.list, {
        params: { page, size, ...params },
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    fotos: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter detalhes de uma foto específica
 */
export function useFoto(fotoId: string | null) {
  const { data, error, isLoading } = useSWR<Foto>(
    fotoId ? endpoints.fotos.get(fotoId) : null,
    () => (fotoId ? apiClient.get(endpoints.fotos.get(fotoId)) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    foto: data,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Upload de foto (metadata) - DEPRECATED: Use uploadFotoFile para upload real
 */
export async function uploadFoto(data: UploadFotoData): Promise<Foto> {
  const response = await apiClient.post<Foto>(endpoints.fotos.upload, data);

  // Revalidar lista de fotos
  mutate((key) => Array.isArray(key) && key[0] === endpoints.fotos.list);

  return response;
}

/**
 * Upload de foto (arquivo real) com processamento automático
 */
export async function uploadFotoFile(
  file: File,
  userId: string,
  options?: {
    albumId?: string;
    titulo?: string;
    legenda?: string;
    tipoFoto?: 'antes' | 'depois' | 'durante' | 'comparacao';
    agendamentoId?: string;
    procedimentoId?: string;
  }
): Promise<Foto> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('id_user', userId);

  if (options?.albumId) formData.append('id_album', options.albumId);
  if (options?.titulo) formData.append('ds_titulo', options.titulo);
  if (options?.legenda) formData.append('ds_legenda', options.legenda);
  if (options?.tipoFoto) formData.append('ds_tipo_foto', options.tipoFoto);
  if (options?.agendamentoId) formData.append('id_agendamento', options.agendamentoId);
  if (options?.procedimentoId) formData.append('id_procedimento', options.procedimentoId);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const API_KEY = process.env.API_KEY || '';

  const response = await fetch(`${API_URL}/fotos/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Erro ao fazer upload da foto');
  }

  const result = await response.json();

  // Revalidar lista de fotos
  mutate((key) => Array.isArray(key) && key[0] === endpoints.fotos.list);

  return result;
}

/**
 * Deletar foto
 */
export async function deletarFoto(
  fotoId: string,
  userId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    endpoints.fotos.delete(fotoId),
    { params: { id_user: userId } }
  );

  // Revalidar lista de fotos
  mutate((key) => Array.isArray(key) && key[0] === endpoints.fotos.list);

  return response;
}

/**
 * Atualizar foto
 */
export async function atualizarFoto(
  fotoId: string,
  data: Partial<UploadFotoData>
): Promise<Foto> {
  const response = await apiClient.put<Foto>(endpoints.fotos.update(fotoId), data);

  // Revalidar foto específica e lista
  mutate(endpoints.fotos.get(fotoId));
  mutate((key) => Array.isArray(key) && key[0] === endpoints.fotos.list);

  return response;
}

/**
 * Revalidar fotos
 */
export function revalidarFotos() {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.fotos.list);
}

/**
 * Revalidar foto específica
 */
export function revalidarFoto(fotoId: string) {
  mutate(endpoints.fotos.get(fotoId));
}
