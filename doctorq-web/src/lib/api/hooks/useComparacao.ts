'use client';
/**
 * Hook para gerenciamento de Comparação de Produtos
 * Usa localStorage com opção de sync com backend
 */

import { useState, useEffect, useCallback } from 'react';
import { Produto } from './useProdutos';

// ====================================================================
// TYPES
// ====================================================================

export interface ItemComparacao {
  id_produto: string;
  produto: Produto;
  dt_adicionado: string;
}

const COMPARACAO_STORAGE_KEY = 'doctorq_comparacao';
const MAX_ITEMS_COMPARACAO = 4; // Máximo de produtos para comparar

// ====================================================================
// HOOKS
// ====================================================================

export function useComparacao() {
  const [itens, setItens] = useState<ItemComparacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar do localStorage na inicialização
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARACAO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItens(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar comparação:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar no localStorage sempre que itens mudarem
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(COMPARACAO_STORAGE_KEY, JSON.stringify(itens));
      } catch (error) {
        console.error('Erro ao salvar comparação:', error);
      }
    }
  }, [itens, isLoading]);

  const adicionarProduto = useCallback((produto: Produto) => {
    setItens((current) => {
      // Verificar se já está na comparação
      if (current.some((item) => item.id_produto === produto.id_produto)) {
        return current;
      }

      // Verificar limite máximo
      if (current.length >= MAX_ITEMS_COMPARACAO) {
        throw new Error(`Máximo de ${MAX_ITEMS_COMPARACAO} produtos para comparação`);
      }

      const novoItem: ItemComparacao = {
        id_produto: produto.id_produto,
        produto,
        dt_adicionado: new Date().toISOString(),
      };

      return [...current, novoItem];
    });
  }, []);

  const removerProduto = useCallback((produtoId: string) => {
    setItens((current) => current.filter((item) => item.id_produto !== produtoId));
  }, []);

  const limparComparacao = useCallback(() => {
    setItens([]);
  }, []);

  const estaNaComparacao = useCallback(
    (produtoId: string) => {
      return itens.some((item) => item.id_produto === produtoId);
    },
    [itens]
  );

  const podeAdicionar = itens.length < MAX_ITEMS_COMPARACAO;

  return {
    itens,
    isLoading,
    adicionarProduto,
    removerProduto,
    limparComparacao,
    estaNaComparacao,
    podeAdicionar,
    totalItens: itens.length,
    maxItens: MAX_ITEMS_COMPARACAO,
  };
}

// ====================================================================
// HELPERS
// ====================================================================

/**
 * Compara atributos comuns entre produtos
 */
export function compararAtributos(produtos: Produto[]): {
  atributo: string;
  valores: (string | number | null)[];
}[] {
  if (produtos.length === 0) return [];

  const atributos = [
    { key: 'nm_produto', label: 'Nome' },
    { key: 'vl_preco', label: 'Preço' },
    { key: 'nm_marca', label: 'Marca' },
    { key: 'ds_categoria', label: 'Categoria' },
    { key: 'nr_avaliacao_media', label: 'Avaliação' },
    { key: 'nr_avaliacoes', label: 'Nº Avaliações' },
    { key: 'st_disponivel', label: 'Disponibilidade' },
    { key: 'ds_descricao', label: 'Descrição' },
  ];

  return atributos.map((attr) => ({
    atributo: attr.label,
    valores: produtos.map((p) => (p as any)[attr.key] ?? null),
  }));
}

/**
 * Identifica qual produto tem o melhor valor em um atributo
 */
export function getMelhorValor(
  valores: (string | number | null)[],
  tipo: 'menor' | 'maior' = 'maior'
): number | null {
  const numericos = valores
    .map((v, index) => ({ valor: typeof v === 'number' ? v : null, index }))
    .filter((item) => item.valor !== null);

  if (numericos.length === 0) return null;

  if (tipo === 'maior') {
    return numericos.reduce((max, item) =>
      item.valor! > (max.valor ?? -Infinity) ? item : max
    ).index;
  } else {
    return numericos.reduce((min, item) =>
      item.valor! < (min.valor ?? Infinity) ? item : min
    ).index;
  }
}
