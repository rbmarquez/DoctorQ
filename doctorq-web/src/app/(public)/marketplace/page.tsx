"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Search, ShoppingBag, Star, TrendingUp, Filter, Package, Zap, Award, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProdutosInfinite, type Produto } from "@/lib/api";

const categorias = [
  { nome: "Todos", icon: ShoppingBag, color: "from-blue-500 to-cyan-600" },
  { nome: "Dermocosméticos", icon: Star, color: "from-blue-500 to-rose-500" },
  { nome: "Equipamentos", icon: Zap, color: "from-purple-500 to-blue-500" },
  { nome: "Cosméticos Profissionais", icon: Award, color: "from-fuchsia-500 to-blue-500" },
  { nome: "Suplementos", icon: Package, color: "from-violet-500 to-purple-500" },
];

const marcas = [
  "Todas",
  "La Roche-Posay",
  "Vichy",
  "Bioderma",
  "Avène",
  "SkinCeuticals",
  "Isdin",
  "Neutrogena",
  "CeraVe",
];

const PAGE_SIZE = 24;

const MarketplaceProductCard = dynamic(
  () => import("@/components/marketplace/MarketplaceProductCard"),
  {
    loading: () => <ProductCardSkeleton />,
  },
);

export default function MarketplacePage() {
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const [marcaFiltro, setMarcaFiltro] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderBy, setOrderBy] = useState("relevancia");

  const filtros = useMemo(
    () => ({
      size: PAGE_SIZE,
      search: searchQuery || undefined,
      marca: marcaFiltro !== "Todas" ? marcaFiltro : undefined,
      ordenar_por:
        orderBy === "preco-menor"
          ? "preco_asc"
          : orderBy === "preco-maior"
          ? "preco_desc"
          : orderBy === "avaliacao"
          ? "avaliacao"
          : orderBy === "mais-vendidos"
          ? "mais_vendidos"
          : "relevancia",
    }),
    [marcaFiltro, orderBy, searchQuery],
  );

  const {
    produtos,
    meta,
    error,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    setSize,
    size,
  } = useProdutosInfinite(filtros, PAGE_SIZE);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((prod) => {
      const matchCategoria =
        categoriaFiltro === "Todos" ||
        prod.ds_categoria?.toLowerCase().includes(categoriaFiltro.toLowerCase());
      return matchCategoria;
    });
  }, [categoriaFiltro, produtos]);

  const filtrosKey = useMemo(() => JSON.stringify(filtros), [filtros]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSize(1);
  }, [filtrosKey, setSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoadingInitial) {
          setSize((prev) => prev + 1);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingInitial, isLoadingMore, setSize]);

  const isInitialLoading = isLoadingInitial && size === 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-cyan-600 to-rose-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
              <ShoppingBag className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Marketplace de Produtos</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Produtos e Equipamentos Profissionais
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Dermocosméticos, equipamentos e suplementos das melhores marcas
            </p>

            {/* Barra de Busca */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar produtos, marcas ou categorias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white/95 backdrop-blur-sm border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-4 py-4 no-scrollbar">
            {categorias.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.nome}
                  onClick={() => setCategoriaFiltro(cat.nome)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    categoriaFiltro === cat.nome
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{cat.nome}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros (Desktop) */}
          <aside className="lg:w-64 space-y-6">
            {/* Filtro de Marcas */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2 text-blue-600" />
                Marcas
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {marcas.map((marca) => (
                  <button
                    key={marca}
                    onClick={() => setMarcaFiltro(marca)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      marcaFiltro === marca
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {marca}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordenação */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Ordenar por
              </h3>
              <select
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="relevancia">Relevância</option>
                <option value="mais-vendidos">Mais Vendidos</option>
                <option value="preco-menor">Menor Preço</option>
                <option value="preco-maior">Maior Preço</option>
                <option value="avaliacao">Melhor Avaliação</option>
              </select>
            </div>

            {/* Banner de Frete Grátis */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <Package className="h-8 w-8 mb-3" />
              <h3 className="text-lg font-bold mb-2">Frete Grátis</h3>
              <p className="text-sm text-green-50">
                Em compras acima de R$ 200,00 para todo o Brasil
              </p>
            </div>
          </aside>

          {/* Grid de Produtos */}
          <div className="flex-1">
            {/* Estado de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="text-lg font-bold text-red-900">Erro ao carregar produtos</h3>
                    <p className="text-red-700 text-sm mt-1">
                      Não foi possível conectar ao servidor. Tente novamente mais tarde.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Header dos Resultados */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {isInitialLoading ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span>Carregando...</span>
                  </span>
                ) : (
                  `${produtosFiltrados.length} produtos encontrados`
                )}
              </h2>
              {meta && (
                <span className="text-sm text-gray-500">
                  Página {meta.currentPage} de {meta.totalPages}
                </span>
              )}
            </div>

            {/* Estado de Loading */}
            {isInitialLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Grid */}
            {!isInitialLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {produtosFiltrados.map((prod: Produto) => (
                  <MarketplaceProductCard key={prod.id_produto} product={prod} />
                ))}
              </div>
            )}

            <div ref={sentinelRef} aria-hidden="true" className="h-1 w-full" />

            {isLoadingMore && !isInitialLoading && (
              <div className="flex justify-center py-8">
                <span className="inline-flex items-center space-x-2 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Carregando mais produtos...</span>
                </span>
              </div>
            )}

            {hasMore && !isLoadingMore && !isInitialLoading && (
              <div className="flex justify-center py-8">
                <Button
                  variant="outline"
                  onClick={() => setSize((prev) => prev + 1)}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  Carregar mais produtos
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isInitialLoading && !error && produtosFiltrados.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <Search className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Tente ajustar seus filtros ou busca
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setCategoriaFiltro("Todos");
                    setMarcaFiltro("Todas");
                  }}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner Informativo */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Frete Grátis</h3>
              <p className="text-blue-100">Acima de R$ 200 para todo Brasil</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Produtos Certificados</h3>
              <p className="text-blue-100">Todas as marcas são originais e verificadas</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Entrega Rápida</h3>
              <p className="text-blue-100">Receba em até 7 dias úteis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden h-96 animate-pulse">
      <div className="h-64 bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}
