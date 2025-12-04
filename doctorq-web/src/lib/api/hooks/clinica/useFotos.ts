/**
 * Hook para gerenciar fotos de pacientes (antes/depois)
 */

import { useQuery, useQuerySingle, useMutation } from '../factory';

export interface Foto {
  id_foto: string;
  id_paciente: string;
  id_album?: string;
  nm_titulo?: string;
  ds_descricao?: string;
  ds_url_foto: string;
  ds_tipo: 'antes' | 'depois' | 'durante' | 'resultado';
  dt_foto: string;
  fl_privada: boolean;
  nr_ordem?: number;
  id_procedimento?: string;
  nm_procedimento?: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface Album {
  id_album: string;
  id_paciente: string;
  nm_album: string;
  ds_descricao?: string;
  dt_criacao: string;
  nr_total_fotos: number;
}

export interface FotosFiltros {
  id_paciente?: string;
  id_album?: string;
  ds_tipo?: 'antes' | 'depois' | 'durante' | 'resultado';
  fl_privada?: boolean;
  page?: number;
  size?: number;
}

export interface CreateFotoDto {
  id_paciente: string;
  id_album?: string;
  nm_titulo?: string;
  ds_descricao?: string;
  ds_url_foto: string;
  ds_tipo: 'antes' | 'depois' | 'durante' | 'resultado';
  dt_foto: string;
  fl_privada?: boolean;
  nr_ordem?: number;
  id_procedimento?: string;
}

export type UpdateFotoDto = Partial<CreateFotoDto>;

export interface CreateAlbumDto {
  id_paciente: string;
  nm_album: string;
  ds_descricao?: string;
}

// Hooks para Fotos
export function useFotos(filtros: FotosFiltros = {}) {
  return useQuery<Foto, FotosFiltros>({
    endpoint: '/fotos/',
    params: { page: 1, size: 25, ...filtros },
  });
}

export function useFoto(id_foto: string) {
  return useQuerySingle<Foto>({
    endpoint: `/fotos/${id_foto}/`,
    enabled: !!id_foto,
  });
}

export function useCreateFoto() {
  return useMutation<Foto, CreateFotoDto>({
    method: 'POST',
    endpoint: '/fotos/',
  });
}

export function useUpdateFoto(id_foto: string) {
  return useMutation<Foto, UpdateFotoDto>({
    method: 'PUT',
    endpoint: `/fotos/${id_foto}/`,
  });
}

export function useDeleteFoto(id_foto: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/fotos/${id_foto}/`,
  });
}

// Hooks para Álbuns
export function useAlbuns(id_paciente?: string) {
  return useQuery<Album, { id_paciente?: string }>({
    endpoint: '/albuns/',
    params: { id_paciente, page: 1, size: 50 },
  });
}

export function useCreateAlbum() {
  return useMutation<Album, CreateAlbumDto>({
    method: 'POST',
    endpoint: '/albuns/',
  });
}

export function useDeleteAlbum(id_album: string) {
  return useMutation<void, void>({
    method: 'DELETE',
    endpoint: `/albuns/${id_album}/`,
  });
}
