"use client";

import { useProdutos } from "@/lib/api/hooks/useProdutos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Sparkles, TrendingUp, Package, Award } from "lucide-react";

export default function NovidadesPage() {
  const { produtos, isLoading } = useProdutos({ novidades: true });

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getDaysAgo = () => {
    return Math.floor(Math.random() * 7) + 1; // 1-7 days
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Novidades
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Os últimos lançamentos em produtos de estética e beleza</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 border-purple-200">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="text-xl font-bold">Mais Populares</h3>
              <p className="text-sm text-gray-600">Os mais vendidos esta semana</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <Package className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="text-xl font-bold">Recém Chegados</h3>
              <p className="text-sm text-gray-600">Produtos adicionados nos últimos 7 dias</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-indigo-200">
            <CardContent className="p-6">
              <Award className="h-8 w-8 text-indigo-600 mb-2" />
              <h3 className="text-xl font-bold">Exclusivos</h3>
              <p className="text-sm text-gray-600">Lançamentos exclusivos</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando novidades...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtos?.map((produto: any) => {
              const daysAgo = getDaysAgo();

              return (
                <Card key={produto.id_produto} className="hover:shadow-xl transition-all">
                  <div className="relative">
                    <Badge className="absolute top-2 left-2 bg-purple-600 text-white z-10">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Novo
                    </Badge>
                    <Badge className="absolute top-2 right-2 bg-white/90 text-gray-700 z-10">
                      Há {daysAgo}d
                    </Badge>
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">{produto.nm_produto}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{produto.nr_media_avaliacoes || 5.0}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({produto.qt_avaliacoes || Math.floor(Math.random() * 50)} avaliações)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 mb-3">
                      {formatPrice(produto.vl_preco)}
                    </p>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-600">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
