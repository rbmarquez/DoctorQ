/**
 * Hooks SWR para Produtos
 */

import useSWR, { mutate } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// ============================================================================
// TIPOS
// ============================================================================

export interface Produto {
  id_produto: string;
  nm_produto: string;
  ds_descricao_curta?: string;
  ds_descricao?: string;
  ds_marca?: string;
  vl_preco: number;
  vl_preco_promocional?: number;
  ds_imagem_url?: string;
  ds_imagens_adicionais?: string[];
  nr_avaliacao_media: number;
  nr_total_avaliacoes: number;
  st_estoque: boolean;
  nr_quantidade_estoque: number;
  st_destaque: boolean;
  ds_selo?: string;
  ds_tags?: string[];
  certificacoes?: string[];
  fornecedor_nome?: string;
  ds_categoria?: string;
  // Campos extras para detalhes
  ds_ingredientes?: string;
  ds_modo_uso?: string;
  ds_slug?: string;
  ds_sku?: string;
}

export interface CategoriaProduto {
  id_categoria: string;
  nm_categoria: string;
  ds_descricao?: string;
  ds_icone?: string;
  st_ativo: boolean;
}

export interface ProdutoListResponse {
  items: Produto[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ProdutosFiltros {
  page?: number;
  size?: number;
  search?: string;
  id_categoria?: string;
  id_fornecedor?: string;
  marca?: string;
  tags?: string;
  vl_min?: number;
  vl_max?: number;
  em_estoque?: boolean;
  st_promocao?: boolean;
  st_vegano?: boolean;
  st_organico?: boolean;
  st_destaque?: boolean;
  st_ativo?: boolean;
  ordenar_por?: 'relevancia' | 'preco_asc' | 'preco_desc' | 'avaliacao' | 'mais_vendidos' | 'recente' | 'alfabetico';
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para listar produtos com filtros e paginação
 */
export function useProdutos(filtros?: ProdutosFiltros) {
  const { data, error, isLoading } = useSWR<ProdutoListResponse>(
    [endpoints.produtos.list, filtros],
    () => apiClient.get(endpoints.produtos.list, { params: filtros }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    produtos: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para paginação infinita de produtos
 */
export function useProdutosInfinite(filtros?: ProdutosFiltros, pageSize = 24) {
  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite<ProdutoListResponse>(
    (pageIndex, previousPageData) => {
      if (
        previousPageData &&
        previousPageData.meta &&
        previousPageData.meta.currentPage >= previousPageData.meta.totalPages
      ) {
        return null;
      }

      const page = pageIndex + 1;
      const params = {
        ...filtros,
        page,
        size: filtros?.size ?? pageSize,
      };

      return [endpoints.produtos.list, params] as const;
    },
    ([url, params]) => apiClient.get<ProdutoListResponse>(url, { params }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const produtos = data ? data.flatMap((page) => page.items) : [];
  const lastPageMeta = data?.[data.length - 1]?.meta;
  const firstPageMeta = data?.[0]?.meta;
  const meta = lastPageMeta ?? firstPageMeta;

  const isEmpty = !isLoading && !error && produtos.length === 0;
  const hasMore =
    !!meta && meta.currentPage < meta.totalPages && produtos.length < (meta.totalItems ?? Infinity);
  const isLoadingInitial = !data && !error;
  const isLoadingMore = isValidating && size > 1;

  return {
    produtos,
    meta,
    isLoadingInitial,
    isLoadingMore,
    isValidating,
    isEmpty,
    error,
    size,
    setSize,
    hasMore,
  };
}

/**
 * Hook para obter detalhes de um produto específico
 */
export function useProduto(id: string | null) {
  const { data, error, isLoading } = useSWR<Produto>(
    id ? [endpoints.produtos.get(id)] : null,
    () => (id ? apiClient.get(endpoints.produtos.get(id)) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    produto: data,
    isLoading,
    isError: error,
    error,
  };
}

/**
 * Hook para listar categorias de produtos
 */
export function useCategoriasProdutos() {
  const { data, error, isLoading } = useSWR<CategoriaProduto[]>(
    endpoints.produtos.categorias,
    () => apiClient.get(endpoints.produtos.categorias),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos (categorias mudam pouco)
    }
  );

  return {
    categorias: data || [],
    isLoading,
    isError: error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Criar novo produto
 */
export async function criarProduto(data: Partial<Produto>) {
  const produto = await apiClient.post<Produto>(endpoints.produtos.create, data);

  // Revalidar lista de produtos
  mutate((key) => Array.isArray(key) && key[0] === endpoints.produtos.list);

  return produto;
}

/**
 * Atualizar produto existente
 */
export async function atualizarProduto(id: string, data: Partial<Produto>) {
  const produto = await apiClient.put<Produto>(endpoints.produtos.update(id), data);

  // Revalidar produto específico e listas
  mutate(endpoints.produtos.get(id));
  mutate((key) => Array.isArray(key) && key[0] === endpoints.produtos.list);

  return produto;
}

/**
 * Deletar (desativar) produto
 */
export async function deletarProduto(id: string) {
  await apiClient.delete(endpoints.produtos.delete(id));

  // Revalidar listas
  mutate((key) => Array.isArray(key) && key[0] === endpoints.produtos.list);
}

/**
 * Helper para revalidar produtos
 */
export function revalidarProdutos(filtros?: ProdutosFiltros) {
  if (filtros) {
    mutate([endpoints.produtos.list, filtros]);
  } else {
    mutate((key) => Array.isArray(key) && key[0] === endpoints.produtos.list);
  }
}
