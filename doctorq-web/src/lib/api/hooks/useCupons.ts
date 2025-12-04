/**
 * Hook SWR para gerenciamento de cupons de desconto
 * Remove a necessidade de validação client-side (inseguro)
 */

import useSWR from 'swr';
import { apiClient } from '../client';
import { ENDPOINTS } from '../endpoints';

// ====================================================================
// TYPES
// ====================================================================

export interface Cupom {
  id_cupom: string;
  id_empresa: string | null;
  id_fornecedor: string | null;
  ds_codigo: string;
  nm_cupom: string;
  ds_descricao: string | null;
  ds_tipo_desconto: 'percentual' | 'fixo';
  nr_percentual_desconto: number | null;
  vl_desconto_fixo: number | null;
  vl_minimo_compra: number | null;
  vl_maximo_desconto: number | null;
  nr_usos_maximos: number | null;
  nr_usos_por_usuario: number;
  nr_usos_atuais: number;
  ds_produtos_validos: string[] | null;
  ds_categorias_validas: string[] | null;
  st_primeira_compra: boolean;
  dt_inicio: string;
  dt_fim: string;
  st_ativo: boolean;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ValidarCupomRequest {
  ds_codigo: string;
  id_user: string;
  vl_carrinho: number;
  ds_produtos_ids?: string[];
  ds_categorias_ids?: string[];
}

export interface ValidarCupomResponse {
  valido: boolean;
  desconto: number;
  mensagem: string;
  cupom: Cupom | null;
}

export interface ListarCuponsRequest {
  id_user: string;
  id_empresa?: string;
}

// ====================================================================
// HOOKS
// ====================================================================

/**
 * Hook para listar cupons disponíveis para um usuário
 *
 * @param userId - ID do usuário
 * @param empresaId - ID da empresa (opcional)
 * @returns Lista de cupons disponíveis com states de loading/erro
 *
 * @example
 * ```tsx
 * const { cupons, isLoading, error } = useCuponsDisponiveis(userId);
 *
 * {cupons?.map(cupom => (
 *   <div key={cupom.id_cupom}>{cupom.ds_codigo} - {cupom.nm_cupom}</div>
 * ))}
 * ```
 */
export function useCuponsDisponiveis(userId: string | null, empresaId?: string) {
  const shouldFetch = Boolean(userId);

  const { data, error, isLoading, mutate } = useSWR<Cupom[]>(
    shouldFetch ? `/cupons/disponiveis/${userId}` : null,
    async () => {
      const response = await apiClient.post<Cupom[]>(
        '/cupons/disponiveis',
        {
          id_user: userId,
          id_empresa: empresaId
        }
      );
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    cupons: data,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para obter informações de um cupom específico pelo código
 *
 * @param codigo - Código do cupom
 * @returns Informações do cupom
 *
 * @example
 * ```tsx
 * const { cupom, isLoading, error } = useCupom('BEMVINDO10');
 * ```
 */
export function useCupom(codigo: string | null) {
  const shouldFetch = Boolean(codigo);

  const { data, error, isLoading, mutate } = useSWR<Cupom>(
    shouldFetch ? `/cupons/${codigo}` : null,
    async () => {
      const response = await apiClient.get<Cupom>(`/cupons/${codigo}`);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos (cupons não mudam com frequência)
    }
  );

  return {
    cupom: data,
    isLoading,
    error,
    mutate,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

/**
 * Valida um cupom de desconto (server-side)
 *
 * Verificações realizadas no backend:
 * - Cupom existe e está ativo
 * - Dentro do período de validade
 * - Valor mínimo de compra atendido
 * - Limite de usos não atingido
 * - Usuário não excedeu limite de usos
 * - Restrições de produtos/categorias
 * - Primeira compra (se aplicável)
 *
 * @param request - Dados para validação
 * @returns Resultado da validação com desconto calculado
 *
 * @example
 * ```tsx
 * const handleValidarCupom = async () => {
 *   const resultado = await validarCupom({
 *     ds_codigo: 'BEMVINDO10',
 *     id_user: userId,
 *     vl_carrinho: 250.00,
 *     ds_produtos_ids: ['uuid-1', 'uuid-2']
 *   });
 *
 *   if (resultado.valido) {
 *     setDesconto(resultado.desconto);
 *     toast.success(resultado.mensagem);
 *   } else {
 *     toast.error(resultado.mensagem);
 *   }
 * };
 * ```
 */
export async function validarCupom(
  request: ValidarCupomRequest
): Promise<ValidarCupomResponse> {
  try {
    const response = await apiClient.post<ValidarCupomResponse>(
      '/cupons/validar',
      request
    );
    return response;
  } catch (error: any) {
    console.error('Erro ao validar cupom:', error);

    // Retorna resposta padrão em caso de erro
    return {
      valido: false,
      desconto: 0,
      mensagem: error.response?.data?.detail || 'Erro ao validar cupom. Tente novamente.',
      cupom: null
    };
  }
}

/**
 * Aplica um cupom ao carrinho e retorna o novo total
 *
 * Esta função é um wrapper que valida o cupom e calcula o valor final
 *
 * @param codigo - Código do cupom
 * @param userId - ID do usuário
 * @param valorCarrinho - Valor total do carrinho
 * @param produtosIds - IDs dos produtos no carrinho
 * @param categoriasIds - IDs das categorias dos produtos
 * @returns Objeto com valores calculados
 *
 * @example
 * ```tsx
 * const { valido, valorComDesconto, desconto, mensagem } = await aplicarCupom({
 *   codigo: 'BEMVINDO10',
 *   userId,
 *   valorCarrinho: 250.00,
 *   produtosIds: ['uuid-1']
 * });
 * ```
 */
export async function aplicarCupom(params: {
  codigo: string;
  userId: string;
  valorCarrinho: number;
  produtosIds?: string[];
  categoriasIds?: string[];
}): Promise<{
  valido: boolean;
  valorComDesconto: number;
  desconto: number;
  mensagem: string;
  cupom: Cupom | null;
}> {
  const resultado = await validarCupom({
    ds_codigo: params.codigo,
    id_user: params.userId,
    vl_carrinho: params.valorCarrinho,
    ds_produtos_ids: params.produtosIds,
    ds_categorias_ids: params.categoriasIds,
  });

  return {
    valido: resultado.valido,
    valorComDesconto: params.valorCarrinho - resultado.desconto,
    desconto: resultado.desconto,
    mensagem: resultado.mensagem,
    cupom: resultado.cupom,
  };
}

/**
 * Remove um cupom aplicado (apenas no estado do carrinho)
 *
 * @returns Objeto indicando remoção bem-sucedida
 */
export function removerCupom(): {
  sucesso: boolean;
  mensagem: string;
} {
  return {
    sucesso: true,
    mensagem: 'Cupom removido com sucesso',
  };
}
