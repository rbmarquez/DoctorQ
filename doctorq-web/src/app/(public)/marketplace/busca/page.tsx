"use client";

import { useState, useMemo } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import {
  Search,
  SlidersHorizontal,
  X,
  Heart,
  ShoppingCart,
  Star,
  Grid3x3,
  List,
  ChevronDown,
  Filter,
  Package,
  TrendingUp,
  Sparkles,
  Leaf,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { useProdutos, ProdutosFiltros } from "@/lib/api/hooks/useProdutos";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function BuscaPage() {
  const [visualizacao, setVisualizacao] = useState<"grid" | "list">("grid");
  const [mostrarFiltros, setMostrarFiltros] = useState(true);

  // Filtros
  const [busca, setBusca] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<ProdutosFiltros["ordenar_por"]>("relevancia");
  const [precoMin, setPrecoMin] = useState<number | undefined>();
  const [precoMax, setPrecoMax] = useState<number | undefined>();
  const [emEstoque, setEmEstoque] = useState<boolean | undefined>();
  const [stPromocao, setStPromocao] = useState<boolean | undefined>();
  const [stVegano, setStVegano] = useState<boolean | undefined>();
  const [stOrganico, setStOrganico] = useState<boolean | undefined>();
  const [stDestaque, setStDestaque] = useState<boolean | undefined>();
  const [marca, setMarca] = useState<string | undefined>();
  const [tags, setTags] = useState<string | undefined>();

  const [page, setPage] = useState(1);
  const size = 24;

  // Build filters object
  const filtros: ProdutosFiltros = useMemo(() => {
    const filters: ProdutosFiltros = {
      page,
      size,
      ordenar_por: ordenarPor,
    };

    if (busca) filters.search = busca;
    if (precoMin !== undefined) filters.vl_min = precoMin;
    if (precoMax !== undefined) filters.vl_max = precoMax;
    if (emEstoque !== undefined) filters.em_estoque = emEstoque;
    if (stPromocao !== undefined) filters.st_promocao = stPromocao;
    if (stVegano !== undefined) filters.st_vegano = stVegano;
    if (stOrganico !== undefined) filters.st_organico = stOrganico;
    if (stDestaque !== undefined) filters.st_destaque = stDestaque;
    if (marca) filters.marca = marca;
    if (tags) filters.tags = tags;

    return filters;
  }, [busca, ordenarPor, precoMin, precoMax, emEstoque, stPromocao, stVegano, stOrganico, stDestaque, marca, tags, page, size]);

  const { produtos, meta, isLoading, isError, error } = useProdutos(filtros);

  const limparFiltros = () => {
    setBusca("");
    setOrdenarPor("relevancia");
    setPrecoMin(undefined);
    setPrecoMax(undefined);
    setEmEstoque(undefined);
    setStPromocao(undefined);
    setStVegano(undefined);
    setStOrganico(undefined);
    setStDestaque(undefined);
    setMarca(undefined);
    setTags(undefined);
    setPage(1);
  };

  const filtrosAtivos = useMemo(() => {
    let count = 0;
    if (precoMin !== undefined) count++;
    if (precoMax !== undefined) count++;
    if (emEstoque) count++;
    if (stPromocao) count++;
    if (stVegano) count++;
    if (stOrganico) count++;
    if (stDestaque) count++;
    if (marca) count++;
    if (tags) count++;
    return count;
  }, [precoMin, precoMax, emEstoque, stPromocao, stVegano, stOrganico, stDestaque, marca, tags]);

  if (isLoading) return <LoadingState message="Buscando produtos..." />;
  if (isError) return <ErrorState error={error} />;

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
              <Search className="h-10 w-10" />
              Buscar Produtos
            </h1>
            <p className="text-white/90">
              Encontre os melhores produtos para sua clínica
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar produtos, marcas, categorias..."
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10 text-lg"
                  />
                </div>
                <Select value={ordenarPor} onValueChange={(v) => setOrdenarPor(v as ProdutosFiltros["ordenar_por"])}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevancia">Relevância</SelectItem>
                    <SelectItem value="preco_asc">Menor Preço</SelectItem>
                    <SelectItem value="preco_desc">Maior Preço</SelectItem>
                    <SelectItem value="avaliacao">Melhor Avaliação</SelectItem>
                    <SelectItem value="mais_vendidos">Mais Vendidos</SelectItem>
                    <SelectItem value="recente">Mais Recentes</SelectItem>
                    <SelectItem value="alfabetico">A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="border-purple-300"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtros {filtrosAtivos > 0 && `(${filtrosAtivos})`}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant={visualizacao === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setVisualizacao("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={visualizacao === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setVisualizacao("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-6">
            {/* Sidebar Filters */}
            {mostrarFiltros && (
              <div className="w-80 flex-shrink-0">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Filtros</h3>
                      {filtrosAtivos > 0 && (
                        <Button variant="ghost" size="sm" onClick={limparFiltros}>
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>

                    {/* Preço */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">Faixa de Preço</h4>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Mín"
                          value={precoMin || ""}
                          onChange={(e) => setPrecoMin(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                        <Input
                          type="number"
                          placeholder="Máx"
                          value={precoMax || ""}
                          onChange={(e) => setPrecoMax(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </div>
                    </div>

                    {/* Marca */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">Marca</h4>
                      <Input
                        type="text"
                        placeholder="Digite a marca"
                        value={marca || ""}
                        onChange={(e) => setMarca(e.target.value || undefined)}
                      />
                    </div>

                    {/* Características */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">Características</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="em-estoque"
                            checked={emEstoque || false}
                            onCheckedChange={(checked) => setEmEstoque(checked as boolean || undefined)}
                          />
                          <Label htmlFor="em-estoque" className="text-sm">
                            Em Estoque
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="promocao"
                            checked={stPromocao || false}
                            onCheckedChange={(checked) => setStPromocao(checked as boolean || undefined)}
                          />
                          <Label htmlFor="promocao" className="text-sm flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-red-500" />
                            Em Promoção
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="destaque"
                            checked={stDestaque || false}
                            onCheckedChange={(checked) => setStDestaque(checked as boolean || undefined)}
                          />
                          <Label htmlFor="destaque" className="text-sm flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-500" />
                            Em Destaque
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="vegano"
                            checked={stVegano || false}
                            onCheckedChange={(checked) => setStVegano(checked as boolean || undefined)}
                          />
                          <Label htmlFor="vegano" className="text-sm flex items-center gap-1">
                            <Leaf className="h-3 w-3 text-green-500" />
                            Vegano
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="organico"
                            checked={stOrganico || false}
                            onCheckedChange={(checked) => setStOrganico(checked as boolean || undefined)}
                          />
                          <Label htmlFor="organico" className="text-sm flex items-center gap-1">
                            <Award className="h-3 w-3 text-blue-500" />
                            Orgânico
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Products Grid/List */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {meta ? `Mostrando ${produtos.length} de ${meta.totalItems} resultados` : "Carregando..."}
                </p>
              </div>

              {/* Empty State */}
              {produtos.length === 0 && (
                <EmptyState
                  icon={<Package className="h-16 w-16 text-gray-300" />}
                  title="Nenhum produto encontrado"
                  description="Tente ajustar os filtros ou buscar por outros termos"
                  action={
                    filtrosAtivos > 0 && (
                      <Button onClick={limparFiltros}>
                        Limpar Filtros
                      </Button>
                    )
                  }
                />
              )}

              {/* Grid View */}
              {visualizacao === "grid" && produtos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {produtos.map((produto) => (
                    <Card key={produto.id_produto} className="group hover:shadow-xl transition-all">
                      <CardContent className="p-0">
                        <Link href={`/marketplace/${produto.id_produto}`}>
                          <div className="relative aspect-square overflow-hidden rounded-t-lg">
                            {produto.ds_imagem_url ? (
                              <Image
                                src={produto.ds_imagem_url}
                                alt={produto.nm_produto}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <Package className="h-24 w-24 text-gray-300" />
                              </div>
                            )}
                            {!produto.st_estoque && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive">Esgotado</Badge>
                              </div>
                            )}
                            {produto.st_destaque && (
                              <Badge className="absolute top-2 left-2 bg-purple-500">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Destaque
                              </Badge>
                            )}
                            {produto.vl_preco_promocional && (
                              <Badge className="absolute top-2 right-2 bg-red-500">
                                {Math.round((1 - produto.vl_preco_promocional / produto.vl_preco) * 100)}% OFF
                              </Badge>
                            )}
                          </div>
                        </Link>
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/marketplace/${produto.id_produto}`}>
                              <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-purple-600">
                                {produto.nm_produto}
                              </h3>
                            </Link>
                          </div>
                          {produto.ds_marca && (
                            <p className="text-xs text-gray-500">{produto.ds_marca}</p>
                          )}
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < produto.nr_avaliacao_media
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-600">
                              ({produto.nr_total_avaliacoes})
                            </span>
                          </div>
                          <div className="pt-2">
                            {produto.vl_preco_promocional ? (
                              <div>
                                <p className="text-sm text-gray-500 line-through">
                                  {formatCurrency(produto.vl_preco)}
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {formatCurrency(produto.vl_preco_promocional)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(produto.vl_preco)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Link href={`/marketplace/${produto.id_produto}`} className="flex-1">
                              <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                                Ver Detalhes
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* List View */}
              {visualizacao === "list" && produtos.length > 0 && (
                <div className="space-y-4">
                  {produtos.map((produto) => (
                    <Card key={produto.id_produto} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Link href={`/marketplace/${produto.id_produto}`} className="relative w-48 h-48 flex-shrink-0">
                            {produto.ds_imagem_url ? (
                              <Image
                                src={produto.ds_imagem_url}
                                alt={produto.nm_produto}
                                fill
                                className="object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center rounded-lg">
                                <Package className="h-16 w-16 text-gray-300" />
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <Link href={`/marketplace/${produto.id_produto}`}>
                                  <h3 className="text-xl font-bold text-gray-900 hover:text-purple-600">
                                    {produto.nm_produto}
                                  </h3>
                                </Link>
                                <div className="flex gap-1">
                                  {produto.st_destaque && (
                                    <Badge className="bg-purple-500">Destaque</Badge>
                                  )}
                                  {!produto.st_estoque && (
                                    <Badge variant="destructive">Esgotado</Badge>
                                  )}
                                </div>
                              </div>
                              {produto.ds_marca && (
                                <p className="text-sm text-gray-500 mb-2">{produto.ds_marca}</p>
                              )}
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {produto.ds_descricao_curta || produto.ds_descricao}
                              </p>
                              <div className="flex items-center gap-1 mb-3">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < produto.nr_avaliacao_media
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  ({produto.nr_total_avaliacoes} avaliações)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                {produto.vl_preco_promocional ? (
                                  <div>
                                    <p className="text-sm text-gray-500 line-through">
                                      {formatCurrency(produto.vl_preco)}
                                    </p>
                                    <p className="text-3xl font-bold text-blue-600">
                                      {formatCurrency(produto.vl_preco_promocional)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(produto.vl_preco)}
                                  </p>
                                )}
                              </div>
                              <Link href={`/marketplace/${produto.id_produto}`}>
                                <Button className="bg-gradient-to-r from-blue-500 to-cyan-600">
                                  Ver Detalhes
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                    disabled={page === meta.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
