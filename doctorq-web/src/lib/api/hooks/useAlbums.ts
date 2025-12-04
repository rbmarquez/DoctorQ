import useSWR, { mutate } from "swr";
import { apiClient, endpoints } from "../index";

// ============================================================================
// TYPES
// ============================================================================

export interface Album {
  id_album: string;
  id_user: string;
  nm_album: string;
  ds_descricao?: string;
  ds_capa_url?: string;
  ds_tipo?: string;
  id_agendamento?: string;
  id_procedimento?: string;
  st_privado: boolean;
  st_favorito: boolean;
  dt_criacao: string;
  dt_atualizacao?: string;
  // Contadores
  total_fotos: number;
  // Dados relacionados
  nm_user?: string;
  nm_procedimento?: string;
}

export interface AlbunsResponse {
  items: Album[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface AlbunsFiltros {
  id_user?: string;
  ds_tipo?: string;
  st_privado?: boolean;
  st_favorito?: boolean;
  busca?: string;
  page?: number;
  size?: number;
}

export interface CriarAlbumData {
  id_user: string;
  nm_album: string;
  ds_descricao?: string;
  ds_capa_url?: string;
  ds_tipo?: string;
  id_agendamento?: string;
  id_procedimento?: string;
  st_privado?: boolean;
  st_favorito?: boolean;
}

export interface AtualizarAlbumData {
  nm_album?: string;
  ds_descricao?: string;
  ds_capa_url?: string;
  ds_tipo?: string;
  st_privado?: boolean;
  st_favorito?: boolean;
}

export interface AlbumFoto {
  id_album_foto: string;
  id_album: string;
  id_foto: string;
  nr_ordem: number;
  dt_adicionado: string;
  // Dados da foto
  ds_url: string;
  ds_thumbnail_url?: string;
  ds_titulo?: string;
  ds_tipo_foto?: string;
}

export interface AlbumFotosResponse {
  items: AlbumFoto[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface AdicionarFotoAlbumData {
  id_foto: string;
}

// ============================================================================
// HOOKS - ÁLBUNS
// ============================================================================

export function useAlbums(filtros: AlbunsFiltros = {}) {
  const { page = 1, size = 20, ...params } = filtros;

  const { data, error, isLoading } = useSWR<AlbunsResponse>(
    [endpoints.albums.list, page, size, JSON.stringify(params)],
    () =>
      apiClient.get(endpoints.albums.list, {
        params: { page, size, ...params },
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    albums: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: !!error,
    error,
  };
}

export function useAlbum(albumId: string | null) {
  const { data, error, isLoading } = useSWR<Album>(
    albumId ? endpoints.albums.get(albumId) : null,
    () => (albumId ? apiClient.get(endpoints.albums.get(albumId)) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    album: data || null,
    isLoading,
    isError: !!error,
    error,
  };
}

// ============================================================================
// HOOKS - FOTOS DO ÁLBUM
// ============================================================================

export function useFotosAlbum(
  albumId: string | null,
  page: number = 1,
  size: number = 50
) {
  const { data, error, isLoading } = useSWR<AlbumFotosResponse>(
    albumId ? [endpoints.albums.fotos(albumId), page, size] : null,
    () =>
      albumId
        ? apiClient.get(endpoints.albums.fotos(albumId), {
            params: { page, size },
          })
        : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    fotos: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: !!error,
    error,
  };
}

// ============================================================================
// MUTATIONS - ÁLBUNS
// ============================================================================

export async function criarAlbum(data: CriarAlbumData): Promise<Album> {
  return apiClient.post(endpoints.albums.create, data);
}

export async function atualizarAlbum(
  albumId: string,
  data: AtualizarAlbumData
): Promise<Album> {
  return apiClient.put(endpoints.albums.update(albumId), data);
}

export async function deletarAlbum(albumId: string): Promise<void> {
  return apiClient.delete(endpoints.albums.delete(albumId));
}

// ============================================================================
// MUTATIONS - FOTOS DO ÁLBUM
// ============================================================================

export async function adicionarFotoAlbum(
  albumId: string,
  data: AdicionarFotoAlbumData
): Promise<{ id_album_foto: string; message: string }> {
  return apiClient.post(endpoints.albums.adicionarFoto(albumId), data);
}

export async function removerFotoAlbum(albumId: string, fotoId: string): Promise<void> {
  return apiClient.delete(endpoints.albums.removerFoto(albumId, fotoId));
}

// ============================================================================
// REVALIDATION
// ============================================================================

export function revalidarAlbums() {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.albums.list);
}

export function revalidarAlbum(albumId: string) {
  mutate(endpoints.albums.get(albumId));
  revalidarAlbums();
}

export function revalidarFotosAlbum(albumId: string) {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.albums.fotos(albumId));
  revalidarAlbum(albumId); // Também revalida o álbum (atualiza contador)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const TIPOS_ALBUM = {
  procedimento: "Procedimento",
  antes_depois: "Antes e Depois",
  evolucao: "Evolução",
  geral: "Geral",
} as const;

export type TipoAlbum = keyof typeof TIPOS_ALBUM;

export function getTipoAlbumLabel(tipo?: string): string {
  if (!tipo) return "Geral";
  return TIPOS_ALBUM[tipo as TipoAlbum] || tipo;
}

export function getTipoAlbumColor(tipo?: string): string {
  const colors: Record<string, string> = {
    procedimento: "bg-blue-100 text-blue-800",
    antes_depois: "bg-green-100 text-green-800",
    evolucao: "bg-purple-100 text-purple-800",
    geral: "bg-gray-100 text-gray-800",
  };
  return colors[tipo || "geral"] || colors.geral;
}

export function isAlbumVazio(album: Album): boolean {
  return album.total_fotos === 0;
}

export function canAddFoto(album: Album, maxFotos: number = 100): boolean {
  return album.total_fotos < maxFotos;
}

export function getCapaUrl(album: Album): string | undefined {
  return album.ds_capa_url;
}

export function formatarDataAlbum(dataISO: string): string {
  const data = new Date(dataISO);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return "Hoje";
  if (diffDias === 1) return "Ontem";
  if (diffDias < 7) return `${diffDias} dias atrás`;
  if (diffDias < 30) return `${Math.floor(diffDias / 7)} semanas atrás`;
  if (diffDias < 365) return `${Math.floor(diffDias / 30)} meses atrás`;
  return `${Math.floor(diffDias / 365)} anos atrás`;
}

export function ordenarFotosPorOrdem(fotos: AlbumFoto[]): AlbumFoto[] {
  return [...fotos].sort((a, b) => {
    if (a.nr_ordem !== b.nr_ordem) {
      return a.nr_ordem - b.nr_ordem;
    }
    // Se mesma ordem, ordenar por data
    return new Date(b.dt_adicionado).getTime() - new Date(a.dt_adicionado).getTime();
  });
}

export function getFotoCapa(fotos: AlbumFoto[]): AlbumFoto | undefined {
  // Retorna a primeira foto em ordem
  const ordenadas = ordenarFotosPorOrdem(fotos);
  return ordenadas[0];
}

export function countFotosPorTipo(fotos: AlbumFoto[]): Record<string, number> {
  const contagem: Record<string, number> = {
    antes: 0,
    depois: 0,
    durante: 0,
    comparacao: 0,
    outros: 0,
  };

  fotos.forEach((foto) => {
    const tipo = foto.ds_tipo_foto || "outros";
    if (tipo in contagem) {
      contagem[tipo]++;
    } else {
      contagem.outros++;
    }
  });

  return contagem;
}

export function filterFotosPorTipo(
  fotos: AlbumFoto[],
  tipo: string
): AlbumFoto[] {
  if (!tipo || tipo === "todos") return fotos;
  return fotos.filter((f) => f.ds_tipo_foto === tipo);
}

export function getAlbumIcon(tipo?: string): string {
  const icons: Record<string, string> = {
    procedimento: "💉",
    antes_depois: "🔄",
    evolucao: "📈",
    geral: "📁",
  };
  return icons[tipo || "geral"] || icons.geral;
}
