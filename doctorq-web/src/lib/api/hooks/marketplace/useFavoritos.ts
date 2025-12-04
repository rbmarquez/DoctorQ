/**
 * Hook para gerenciar favoritos (produtos e procedimentos)
 */

import { useQuery, useMutation } from '../factory';

export interface Favorito {
  id_favorito: string;
  id_user: string;
  ds_tipo: 'produto' | 'procedimento' | 'profissional' | 'clinica';
  id_referencia: string;
  nm_item: string;
  ds_descricao?: string;
  ds_foto_url?: string;
  vl_preco?: number;
  dt_criacao: string;
}

export interface FavoritosFiltros {
  id_user?: string;
  ds_tipo?: 'produto' | 'procedimento' | 'profissional' | 'clinica';
  page?: number;
  size?: number;
}

export interface CreateFavoritoDto {
  id_user: string;
  ds_tipo: 'produto' | 'procedimento' | 'profissional' | 'clinica';
  id_referencia: string;
}

// Hooks para Favoritos
export function useFavoritos(filtros: FavoritosFiltros = {}) {
  return useQuery<Favorito, FavoritosFiltros>({
    endpoint: '/favoritos/',
    params: { page: 1, size: 50, ...filtros },
  });
}

export function useCreateFavorito() {
  return useMutation<Favorito, CreateFavoritoDto>({
    method: 'POST',
    endpoint: '/favoritos/',
  });
}

export function useDeleteFavorito() {
  return useMutation<void, { id_favorito: string }>({
    method: 'DELETE',
    endpoint: (payload) => `/favoritos/${payload?.id_favorito}/`,
  });
}

// Helper para verificar se item está favoritado
export function useIsFavorito(id_user: string, ds_tipo: string, id_referencia: string) {
  const { data } = useFavoritos({ id_user, ds_tipo: ds_tipo as any });
  return data?.some((fav) => fav.id_referencia === id_referencia) || false;
}

// Toggle favorito (adicionar ou remover)
export function useToggleFavorito() {
  const { trigger: criar } = useCreateFavorito();
  const { trigger: deletar } = useDeleteFavorito();

  return async (favorito: Favorito | undefined, createDto: CreateFavoritoDto) => {
    if (favorito) {
      // Se já existe, remover
      await deletar({ id_favorito: favorito.id_favorito });
    } else {
      // Se não existe, adicionar
      await criar(createDto);
    }
  };
}
