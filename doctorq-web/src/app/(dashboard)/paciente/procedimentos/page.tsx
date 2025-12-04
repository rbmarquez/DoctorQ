"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Heart,
  Star,
  Clock,
  Sparkles,
  ChevronRight,
  Grid3x3,
  List,
  Loader2,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { useProcedimentos } from "@/lib/api/hooks/useProcedimentos";

// Categorias disponíveis (pode vir do backend depois)
const categorias = [
  "Todas",
  "Facial",
  "Corporal",
  "Injetáveis",
  "Rejuvenescimento",
  "Capilar",
];

export default function ProcedimentosPage() {
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [ordenacao, setOrdenacao] = useState<"relevancia" | "preco_asc" | "preco_desc" | "duracao" | "nome">("relevancia");
  const [visualizacao, setVisualizacao] = useState<"grid" | "list">("grid");
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  // Buscar procedimentos com filtros (usa SWR para cache automático)
  const { procedimentos, isLoading, isError } = useProcedimentos({
    search: busca || undefined,
    categoria: categoriaFiltro !== "Todas" ? categoriaFiltro : undefined,
    ordenacao: ordenacao,
    page: 1,
    size: 50,
  });

  const toggleFavorito = (id: string) => {
    setFavoritos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        toast.success("Removido dos favoritos");
      } else {
        newSet.add(id);
        toast.success("Adicionado aos favoritos");
      }
      return newSet;
    });
  };

  // Destaques: procedimentos com mais avaliações (top 3)
  const destaques = useMemo(() => {
    if (!procedimentos || procedimentos.length === 0) return [];
    return [...procedimentos]
      .sort((a, b) => (b.nr_media_avaliacoes || 0) - (a.nr_media_avaliacoes || 0))
      .slice(0, 3);
  }, [procedimentos]);

  // Placeholder para imagens (Unsplash por categoria)
  const getImagePlaceholder = (categoria: string) => {
    const imageMap: Record<string, string> = {
      "Facial": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400",
      "Corporal": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400",
      "Injetáveis": "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400",
      "Rejuvenescimento": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400",
      "Capilar": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
    };
    return imageMap[categoria] || "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400";
  };

  // Estados de loading e erro
  if (isError) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Erro ao carregar procedimentos</p>
          <p className="text-sm mt-2">Tente novamente mais tarde</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Procedimentos Disponíveis
        </h1>
        <p className="text-gray-600 mt-1">
          Descubra os melhores tratamentos de beleza e estética
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar procedimentos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={ordenacao} onValueChange={(value: any) => setOrdenacao(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevancia">Relevância</SelectItem>
                  <SelectItem value="preco_asc">Menor Preço</SelectItem>
                  <SelectItem value="preco_desc">Maior Preço</SelectItem>
                  <SelectItem value="duracao">Duração</SelectItem>
                  <SelectItem value="nome">Nome</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <Button
                  key={cat}
                  variant={categoriaFiltro === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoriaFiltro(cat)}
                  className={
                    categoriaFiltro === cat
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                      : ""
                  }
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando procedimentos...</span>
          </CardContent>
        </Card>
      )}

      {/* Destaques */}
      {!isLoading && busca === "" && categoriaFiltro === "Todas" && destaques.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Procedimentos em Destaque</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {destaques.map((proc) => (
              <Card key={proc.id_procedimento} className="group hover:shadow-xl transition-all border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={proc.ds_foto_principal || getImagePlaceholder(proc.ds_categoria)}
                      alt={proc.nm_procedimento}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full shadow-lg"
                        onClick={() => toggleFavorito(proc.id_procedimento)}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favoritos.has(proc.id_procedimento)
                              ? "fill-pink-500 text-blue-500"
                              : ""
                          }`}
                        />
                      </Button>
                    </div>
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{proc.ds_categoria}</Badge>
                      {proc.nr_media_avaliacoes > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{proc.nr_media_avaliacoes.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">
                            ({proc.qt_total_avaliacoes})
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{proc.nm_procedimento}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {proc.ds_procedimento}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{proc.nr_duracao_minutos} min</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {proc.vl_preco_base.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                    </div>
                    <Link href={`/paciente/procedimentos/${proc.id_procedimento}`}>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                        Ver Detalhes
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            {procedimentos.length} Procedimento(s) Encontrado(s)
          </h2>

          {procedimentos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Nenhum procedimento encontrado com os filtros selecionados
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setBusca("");
                    setCategoriaFiltro("Todas");
                  }}
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          ) : visualizacao === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {procedimentos.map((proc) => (
                <Card key={proc.id_procedimento} className="group hover:shadow-xl transition-all">
                  <CardContent className="p-0">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <Image
                        src={proc.ds_foto_principal || getImagePlaceholder(proc.ds_categoria)}
                        alt={proc.nm_procedimento}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="rounded-full shadow-lg"
                          onClick={() => toggleFavorito(proc.id_procedimento)}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favoritos.has(proc.id_procedimento)
                                ? "fill-pink-500 text-blue-500"
                                : ""
                            }`}
                          />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">{proc.ds_categoria}</Badge>
                        {proc.nr_media_avaliacoes > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{proc.nr_media_avaliacoes.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">
                              ({proc.qt_total_avaliacoes})
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-2">{proc.nm_procedimento}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {proc.ds_procedimento}
                      </p>
                      {proc.qt_clinicas_oferecem > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Award className="h-4 w-4" />
                          <span>{proc.qt_clinicas_oferecem} clínicas oferecem</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{proc.nr_duracao_minutos} min</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {proc.vl_preco_base.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                      </div>
                      <Link href={`/paciente/procedimentos/${proc.id_procedimento}`}>
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                          Ver Detalhes
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {procedimentos.map((proc) => (
                <Card key={proc.id_procedimento} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={proc.ds_foto_principal || getImagePlaceholder(proc.ds_categoria)}
                          alt={proc.nm_procedimento}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{proc.ds_categoria}</Badge>
                              {proc.ds_subcategoria && (
                                <Badge variant="secondary" className="text-xs">
                                  {proc.ds_subcategoria}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-bold text-xl">{proc.nm_procedimento}</h3>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleFavorito(proc.id_procedimento)}
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                favoritos.has(proc.id_procedimento)
                                  ? "fill-pink-500 text-blue-500"
                                  : ""
                              }`}
                            />
                          </Button>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {proc.ds_procedimento}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{proc.nr_duracao_minutos} minutos</span>
                          </div>
                          {proc.nr_media_avaliacoes > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{proc.nr_media_avaliacoes.toFixed(1)}</span>
                              <span className="text-gray-400">({proc.qt_total_avaliacoes} avaliações)</span>
                            </div>
                          )}
                          {proc.qt_clinicas_oferecem > 0 && (
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              <span>{proc.qt_clinicas_oferecem} clínicas</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold text-blue-600">
                            {proc.vl_preco_base.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </div>
                          <Link href={`/paciente/procedimentos/${proc.id_procedimento}`}>
                            <Button className="bg-gradient-to-r from-blue-500 to-cyan-600">
                              Ver Detalhes
                              <ChevronRight className="h-4 w-4 ml-2" />
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
        </div>
      )}
    </div>
  );
}
