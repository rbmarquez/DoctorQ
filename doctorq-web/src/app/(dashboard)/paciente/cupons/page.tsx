"use client";

import { useState, useMemo } from "react";
import {
  Tag,
  Gift,
  Percent,
  Calendar,
  Clock,
  Copy,
  Check,
  Sparkles,
  Star,
  AlertCircle,
  Loader2,
  DollarSign,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { toast } from "sonner";
import { useCuponsDisponiveis } from "@/lib/api/hooks/useCupons";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Promocao {
  id_promocao: string;
  ds_titulo: string;
  ds_descricao: string;
  vl_desconto: number;
  tp_desconto: "porcentagem" | "valor_fixo";
  dt_inicio: string;
  dt_fim: string;
  ds_imagem: string;
  ds_categoria: string;
  st_ativo: boolean;
}

export default function CuponsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id || null;

  const [copiado, setCopiado] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");

  // Buscar cupons disponíveis do backend
  const { cupons, isLoading, error } = useCuponsDisponiveis(userId);

  // Mock data - promoções ativas (backend não tem ainda)
  const promocoes: Promocao[] = [
    {
      id_promocao: "1",
      ds_titulo: "Black Friday - 30% OFF",
      ds_descricao: "Desconto especial em TODOS os procedimentos durante a Black Friday!",
      vl_desconto: 30,
      tp_desconto: "porcentagem",
      dt_inicio: "2025-11-24",
      dt_fim: "2025-11-30",
      ds_imagem: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
      ds_categoria: "Geral",
      st_ativo: true,
    },
    {
      id_promocao: "2",
      ds_titulo: "Combo Beleza Total",
      ds_descricao: "Limpeza de Pele + Massagem Relaxante por um preço especial",
      vl_desconto: 25,
      tp_desconto: "porcentagem",
      dt_inicio: "2025-10-01",
      dt_fim: "2025-10-31",
      ds_imagem: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600",
      ds_categoria: "Combo",
      st_ativo: true,
    },
  ];

  const categorias = ["todos", "Facial", "Corporal", "Capilar", "Combo"];

  const handleCopiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiado(codigo);
    toast.success(`Código ${codigo} copiado!`);
    setTimeout(() => setCopiado(null), 2000);
  };

  // Separar cupons disponíveis e usados
  const cuponsDisponiveis = useMemo(() => {
    if (!cupons) return [];
    const agora = new Date();
    return cupons.filter((cupom) => {
      const dataFim = new Date(cupom.dt_fim);
      const usosRestantes = (cupom.nr_usos_maximos || Infinity) - cupom.nr_usos_atuais;
      const naoExpirado = dataFim >= agora;
      const temUsosDisponiveis = usosRestantes > 0;
      const ativo = cupom.st_ativo;

      return ativo && naoExpirado && temUsosDisponiveis;
    });
  }, [cupons]);

  const cuponsUsados = useMemo(() => {
    if (!cupons) return [];
    const agora = new Date();
    return cupons.filter((cupom) => {
      const dataFim = new Date(cupom.dt_fim);
      const usosRestantes = (cupom.nr_usos_maximos || Infinity) - cupom.nr_usos_atuais;
      const expirado = dataFim < agora;
      const semUsos = usosRestantes <= 0;
      const inativo = !cupom.st_ativo;

      return expirado || semUsos || inativo;
    });
  }, [cupons]);

  // Filtrar cupons por categoria
  const cuponsDisponiveisFiltrados = cuponsDisponiveis.filter(
    (cupom) => filtroCategoria === "todos" || cupom.ds_categorias_validas?.includes(filtroCategoria)
  );

  // Calcular estatísticas
  const totalEconomizado = useMemo(() => {
    // Simulação: assume que cada cupom usado economizou seu valor máximo
    return cuponsUsados.reduce((total, cupom) => {
      if (cupom.ds_tipo_desconto === "percentual") {
        // Assume R$ 500 de compra média para calcular economia
        const valorCompra = cupom.vl_minimo_compra || 500;
        const desconto = valorCompra * (cupom.nr_percentual_desconto || 0) / 100;
        return total + Math.min(desconto, cupom.vl_maximo_desconto || desconto);
      } else {
        return total + (cupom.vl_desconto_fixo || 0);
      }
    }, 0);
  }, [cuponsUsados]);

  const formatarDesconto = (cupom: any) => {
    if (cupom.ds_tipo_desconto === "percentual") {
      return `${cupom.nr_percentual_desconto}% OFF`;
    } else {
      return `R$ ${cupom.vl_desconto_fixo?.toFixed(2)} OFF`;
    }
  };

  const formatarValorMinimo = (valor: number | null) => {
    if (!valor) return "Sem valor mínimo";
    return `Compra mínima: ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
  };

  const formatarValidade = (data: string) => {
    const dataObj = new Date(data);
    const agora = new Date();
    const diffDias = Math.ceil((dataObj.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return "Expirado";
    if (diffDias === 0) return "Expira hoje";
    if (diffDias === 1) return "Expira amanhã";
    if (diffDias <= 7) return `Expira em ${diffDias} dias`;

    return `Válido até ${dataObj.toLocaleDateString("pt-BR")}`;
  };

  // Estados de loading e erro
  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Carregando seus cupons...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-600">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Erro ao carregar cupons</p>
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
          Cupons e Promoções
        </h1>
        <p className="text-gray-600 mt-1">
          Aproveite descontos exclusivos em procedimentos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cupons Disponíveis</p>
                <h3 className="text-3xl font-bold mt-1">{cuponsDisponiveis.length}</h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Tag className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cupons Utilizados</p>
                <h3 className="text-3xl font-bold mt-1">{cuponsUsados.length}</h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Check className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Economizado</p>
                <h3 className="text-2xl font-bold mt-1">
                  {totalEconomizado.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="disponiveis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="disponiveis">
            Disponíveis ({cuponsDisponiveis.length})
          </TabsTrigger>
          <TabsTrigger value="promocoes">
            Promoções ({promocoes.length})
          </TabsTrigger>
          <TabsTrigger value="usados">
            Usados ({cuponsUsados.length})
          </TabsTrigger>
        </TabsList>

        {/* Cupons Disponíveis */}
        <TabsContent value="disponiveis" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {categorias.map((cat) => (
                  <Button
                    key={cat}
                    variant={filtroCategoria === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroCategoria(cat)}
                    className={
                      filtroCategoria === cat
                        ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                        : ""
                    }
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Cupons */}
          {cuponsDisponiveisFiltrados.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Nenhum cupom disponível no momento
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Fique atento às nossas promoções!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cuponsDisponiveisFiltrados.map((cupom) => {
                const diasRestantes = Math.ceil(
                  (new Date(cupom.dt_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const urgente = diasRestantes <= 3;

                return (
                  <Card
                    key={cupom.id_cupom}
                    className={`relative overflow-hidden ${
                      urgente
                        ? "border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50"
                        : "hover:shadow-xl transition-all"
                    }`}
                  >
                    {urgente && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
                        <Clock className="inline h-3 w-3 mr-1" />
                        URGENTE
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="mb-2">
                          {cupom.ds_categorias_validas?.[0] || "Geral"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {((cupom.nr_usos_maximos || Infinity) - cupom.nr_usos_atuais) === Infinity
                              ? "∞"
                              : (cupom.nr_usos_maximos || 0) - cupom.nr_usos_atuais} usos
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-xl">{cupom.nm_cupom}</CardTitle>
                      <p className="text-sm text-gray-600">{cupom.ds_descricao}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Percent className="h-6 w-6" />
                          <span className="text-4xl font-bold">
                            {formatarDesconto(cupom)}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-3 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                          <code className="text-2xl font-mono font-bold tracking-wider">
                            {cupom.ds_codigo}
                          </code>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-full"
                            onClick={() => handleCopiarCodigo(cupom.ds_codigo)}
                          >
                            {copiado === cupom.ds_codigo ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatarValorMinimo(cupom.vl_minimo_compra)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className={urgente ? "text-red-600 font-semibold" : ""}>
                            {formatarValidade(cupom.dt_fim)}
                          </span>
                        </div>
                        {cupom.st_primeira_compra && (
                          <Badge variant="secondary" className="w-full justify-center">
                            <Star className="h-3 w-3 mr-1" />
                            Primeira Compra
                          </Badge>
                        )}
                      </div>

                      <Link href="/paciente/procedimentos">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                          <Gift className="h-4 w-4 mr-2" />
                          Usar Agora
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Promoções */}
        <TabsContent value="promocoes" className="space-y-6">
          {promocoes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Nenhuma promoção ativa no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promocoes.map((promo) => (
                <Card key={promo.id_promocao} className="overflow-hidden hover:shadow-xl transition-all">
                  <div className="relative h-48">
                    <Image
                      src={promo.ds_imagem}
                      alt={promo.ds_titulo}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                        {promo.tp_desconto === "porcentagem"
                          ? `${promo.vl_desconto}% OFF`
                          : `R$ ${promo.vl_desconto} OFF`}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-6">
                    <Badge variant="outline" className="mb-2">
                      {promo.ds_categoria}
                    </Badge>
                    <h3 className="text-xl font-bold mb-2">{promo.ds_titulo}</h3>
                    <p className="text-gray-600 mb-4">{promo.ds_descricao}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(promo.dt_inicio).toLocaleDateString("pt-BR")} até{" "}
                        {new Date(promo.dt_fim).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <Link href="/paciente/procedimentos">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                        Aproveitar Promoção
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cupons Usados */}
        <TabsContent value="usados" className="space-y-6">
          {cuponsUsados.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Você ainda não usou nenhum cupom
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Confira os cupons disponíveis e comece a economizar!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cuponsUsados.map((cupom) => (
                <Card key={cupom.id_cupom} className="opacity-60">
                  <CardHeader>
                    <Badge variant="secondary" className="mb-2 w-fit">
                      Usado
                    </Badge>
                    <CardTitle className="text-lg">{cupom.nm_cupom}</CardTitle>
                    <p className="text-sm text-gray-600">{cupom.ds_descricao}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <code className="text-xl font-mono font-bold text-gray-400">
                        {cupom.ds_codigo}
                      </code>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        <span>{formatarDesconto(cupom)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Expirou em {new Date(cupom.dt_fim).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
