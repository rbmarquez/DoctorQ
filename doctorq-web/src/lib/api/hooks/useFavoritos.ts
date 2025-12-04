/**
 * Hooks SWR para Favoritos
 * Suporta múltiplos tipos: produtos, procedimentos, profissionais, clínicas, fornecedores
 */

import useSWR, { mutate } from 'swr';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export type TipoFavorito =
  | 'produto'
  | 'procedimento'
  | 'profissional'
  | 'clinica'
  | 'fornecedor';

export interface Favorito {
  id_favorito: string;
  id_user?: string;
  ds_tipo_item: TipoFavorito;
  id_produto?: string;
  id_procedimento?: string;
  id_profissional?: string;
  id_clinica?: string;
  id_fornecedor?: string;
  ds_categoria_favorito?: string;
  ds_observacoes?: string;
  nr_prioridade: number;
  st_notificar_promocao: boolean;
  st_notificar_disponibilidade: boolean;
  dt_criacao: string;
  dt_atualizacao?: string;
  // Dados relacionados (do item favoritado)
  nm_item?: string;
  ds_item?: string;
  vl_preco?: number;
  ds_foto?: string;
  // Legacy fields for backwards compatibility
  nm_produto?: string;
  ds_descricao?: string;
  ds_imagem_url?: string;
  nm_procedimento?: string;
  ds_categoria?: string;
  nr_duracao_minutos?: number;
  nm_profissional?: string;
  ds_especialidades?: string;
  nm_clinica?: string;
  ds_endereco?: string;
  ds_foto_principal?: string;
  nm_empresa?: string;
  ds_logo_url?: string;
}

export interface FavoritosResponse {
  items: Favorito[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface FavoritosFiltros {
  tipo?: TipoFavorito;
  categoria?: string;
  page?: number;
  size?: number;
}

export interface AdicionarFavoritoData {
  id_user: string;
  ds_tipo_item: TipoFavorito;
  id_produto?: string;
  id_procedimento?: string;
  id_profissional?: string;
  id_clinica?: string;
  id_fornecedor?: string;
  ds_categoria_favorito?: string;
  ds_observacoes?: string;
  nr_prioridade?: number;
  st_notificar_promocao?: boolean;
  st_notificar_disponibilidade?: boolean;
}

export interface VerificarFavoritoResponse {
  is_favorito: boolean;
  id_favorito: string | null;
}

export interface FavoritosStats {
  total_geral: number;
  por_tipo: Array<{
    tipo: TipoFavorito;
    total: number;
    com_notificacao_promocao: number;
  }>;
}

// Legacy type for backwards compatibility
export interface FavoritoProduto {
  id_favorito: string;
  id_produto: string;
  nm_produto: string;
  ds_marca: string;
  vl_preco: number;
  ds_imagem_url: string;
  nr_avaliacao_media: number;
  st_estoque: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obter favoritos do usuário com filtros
 */
export function useFavoritos(userId: string | null, filtros: FavoritosFiltros = {}) {
  const { page = 1, size = 50, tipo, categoria } = filtros;

  // Construir query params
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
  if (userId) params.append('id_user', userId);
  if (tipo) params.append('tipo', tipo);
  if (categoria) params.append('categoria', categoria);

  const key = userId ? `${endpoints.favoritos.list}?${params.toString()}` : null;

  const { data, error, isLoading } = useSWR<FavoritosResponse>(
    key,
    () => apiClient.get(key!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  return {
    favoritos: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para verificar se um item específico está favoritado
 */
export function useFavoritoStatus(
  userId: string | null,
  tipo: TipoFavorito | null,
  itemId: string | null
) {
  const key = userId && tipo && itemId
    ? `/favoritos/verificar/${tipo}/${itemId}?id_user=${userId}`
    : null;

  const { data, error, isLoading } = useSWR<VerificarFavoritoResponse>(
    key,
    () => apiClient.get(key!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    isFavorito: data?.is_favorito || false,
    favoritoId: data?.id_favorito,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para obter estatísticas de favoritos
 */
export function useFavoritosStats(userId: string | null) {
  const { data, error, isLoading } = useSWR<FavoritosStats>(
    userId ? `/favoritos/stats/${userId}` : null,
    () => (userId ? apiClient.get(`/favoritos/stats/${userId}`) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    stats: data,
    totalGeral: data?.total_geral || 0,
    porTipo: data?.por_tipo || [],
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Adicionar item aos favoritos
 */
export async function adicionarFavorito(
  data: AdicionarFavoritoData
): Promise<Favorito> {
  try {
    const result = await apiClient.post<Favorito>(endpoints.favoritos.add, data);

    // Revalidate cache
    const itemId = getItemId(data);
    await Promise.all([
      mutate((key: any) => typeof key === 'string' && key.startsWith('/favoritos')),
      mutate(`/favoritos/verificar/${data.ds_tipo_item}/${itemId}?id_user=${data.id_user}`),
      mutate(`/favoritos/stats/${data.id_user}`),
    ]);

    return result;
  } catch (error: any) {
    console.error('Erro ao adicionar favorito:', error);

    // Tratar erros específicos
    if (error.response?.status === 400) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.includes('já está nos seus favoritos')) {
        throw new Error('Este item já está nos seus favoritos');
      }
      throw new Error(detail || 'Dados inválidos');
    }

    throw new Error('Erro ao adicionar favorito. Tente novamente.');
  }
}

/**
 * Remover item dos favoritos
 */
export async function removerFavorito(
  favoritoId: string,
  userId: string
): Promise<{ message: string }> {
  try {
    const result = await apiClient.delete<{ message: string }>(
      `${endpoints.favoritos.remove(favoritoId)}?id_user=${userId}`
    );

    // Revalidate cache
    await Promise.all([
      mutate((key: any) => typeof key === 'string' && key.startsWith('/favoritos')),
    ]);

    return result;
  } catch (error: any) {
    console.error('Erro ao remover favorito:', error);

    if (error.response?.status === 404) {
      throw new Error('Favorito não encontrado ou você não tem permissão para removê-lo');
    }

    throw new Error('Erro ao remover favorito. Tente novamente.');
  }
}

/**
 * Verificar se um item está favoritado
 */
export async function verificarFavorito(
  userId: string,
  tipo: TipoFavorito,
  itemId: string
): Promise<VerificarFavoritoResponse> {
  return apiClient.get<VerificarFavoritoResponse>(
    `/favoritos/verificar/${tipo}/${itemId}?id_user=${userId}`
  );
}

/**
 * Toggle favorito (adicionar se não existe, remover se existe)
 */
export async function toggleFavorito(params: {
  userId: string;
  tipo: TipoFavorito;
  itemId: string;
  favoritoId?: string | null;
  categoria?: string;
  observacoes?: string;
}): Promise<{ adicionado: boolean; message: string; favorito?: Favorito }> {
  const { userId, tipo, itemId, favoritoId, categoria, observacoes } = params;

  try {
    // Se já é favorito, remover
    if (favoritoId) {
      await removerFavorito(favoritoId, userId);
      return {
        adicionado: false,
        message: 'Removido dos favoritos',
      };
    }

    // Se não é favorito, adicionar
    const request: AdicionarFavoritoData = {
      id_user: userId,
      ds_tipo_item: tipo,
      ds_categoria_favorito: categoria,
      ds_observacoes: observacoes,
      nr_prioridade: 0,
      st_notificar_promocao: true,
      st_notificar_disponibilidade: true,
    };

    // Setar o ID correto baseado no tipo
    switch (tipo) {
      case 'produto':
        request.id_produto = itemId;
        break;
      case 'procedimento':
        request.id_procedimento = itemId;
        break;
      case 'profissional':
        request.id_profissional = itemId;
        break;
      case 'clinica':
        request.id_clinica = itemId;
        break;
      case 'fornecedor':
        request.id_fornecedor = itemId;
        break;
    }

    const favorito = await adicionarFavorito(request);

    return {
      adicionado: true,
      message: 'Adicionado aos favoritos',
      favorito,
    };
  } catch (error: any) {
    throw error;
  }
}

// ============================================================================
// REVALIDATION
// ============================================================================

/**
 * Revalidar lista de favoritos
 */
export function revalidarFavoritos(userId?: string) {
  return mutate((key: any) =>
    typeof key === 'string' &&
    key.startsWith('/favoritos') &&
    (!userId || key.includes(`id_user=${userId}`))
  );
}

/**
 * Revalidar status de favorito de um item específico
 */
export function revalidarFavoritoStatus(userId: string, tipo: TipoFavorito, itemId: string) {
  return mutate(`/favoritos/verificar/${tipo}/${itemId}?id_user=${userId}`);
}

/**
 * Revalidar estatísticas de favoritos
 */
export function revalidarEstatisticasFavoritos(userId: string) {
  return mutate(`/favoritos/stats/${userId}`);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verificar se um produto está nos favoritos
 * Legacy function - mantida para compatibilidade
 */
export function isProdutoFavorito(
  favoritos: FavoritoProduto[] | Favorito[],
  id_produto: string
): boolean {
  return favoritos.some((fav) => fav.id_produto === id_produto);
}

/**
 * Obter favorito por id do produto
 * Legacy function - mantida para compatibilidade
 */
export function getFavoritoByProdutoId(
  favoritos: FavoritoProduto[] | Favorito[],
  id_produto: string
): FavoritoProduto | Favorito | undefined {
  return favoritos.find((fav) => fav.id_produto === id_produto);
}

/**
 * Obter tipo do favorito
 */
export function getTipoFavorito(favorito: Favorito): TipoFavorito | null {
  if (favorito.id_produto) return 'produto';
  if (favorito.id_procedimento) return 'procedimento';
  if (favorito.id_profissional) return 'profissional';
  if (favorito.id_clinica) return 'clinica';
  if (favorito.id_fornecedor) return 'fornecedor';
  return null;
}

/**
 * Obter nome do item favoritado
 */
export function getNomeFavorito(favorito: Favorito): string {
  return (
    favorito.nm_produto ||
    favorito.nm_procedimento ||
    favorito.nm_profissional ||
    favorito.nm_clinica ||
    favorito.nm_empresa ||
    'Item sem nome'
  );
}

/**
 * Obter imagem do item favoritado
 */
export function getImagemFavorito(favorito: Favorito): string | undefined {
  return (
    favorito.ds_imagem_url ||
    favorito.ds_foto ||
    favorito.ds_foto_principal ||
    favorito.ds_logo_url
  );
}

/**
 * Helper para extrair o ID do item baseado no tipo
 */
function getItemId(data: AdicionarFavoritoData): string {
  switch (data.ds_tipo_item) {
    case 'produto':
      return data.id_produto || '';
    case 'procedimento':
      return data.id_procedimento || '';
    case 'profissional':
      return data.id_profissional || '';
    case 'clinica':
      return data.id_clinica || '';
    case 'fornecedor':
      return data.id_fornecedor || '';
    default:
      return '';
  }
}
