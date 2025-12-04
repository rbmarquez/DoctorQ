"use client";

import { useProdutos } from "@/lib/api/hooks/useProdutos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Tag, TrendingDown, Clock, Zap } from "lucide-react";

export default function OfertasPage() {
  const { produtos, isLoading } = useProdutos({ ofertas: true });

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const calculateDiscount = () => {
    return Math.floor(Math.random() * 40) + 10; // 10-50%
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Ofertas Especiais
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Aproveite as melhores ofertas em produtos de estética</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <Zap className="h-8 w-8 mb-2" />
              <h3 className="text-2xl font-bold">Ofertas Relâmpago</h3>
              <p className="text-sm opacity-90">Até 50% OFF</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <CardContent className="p-6">
              <TrendingDown className="h-8 w-8 mb-2" />
              <h3 className="text-2xl font-bold">Descontos Progressivos</h3>
              <p className="text-sm opacity-90">Compre mais, economize mais</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <Clock className="h-8 w-8 mb-2" />
              <h3 className="text-2xl font-bold">Tempo Limitado</h3>
              <p className="text-sm opacity-90">Termina em 24h</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando ofertas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtos?.map((produto: any) => {
              const desconto = calculateDiscount();
              const precoOriginal = produto.vl_preco / (1 - desconto/100);

              return (
                <Card key={produto.id_produto} className="hover:shadow-xl transition-all">
                  <div className="relative">
                    <Badge className="absolute top-2 right-2 bg-red-600 text-white z-10">
                      -{desconto}%
                    </Badge>
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">{produto.nm_produto}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{produto.nr_media_avaliacoes || 5.0}</span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 line-through">
                        {formatPrice(precoOriginal)}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(produto.vl_preco)}
                      </p>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Comprar Agora
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
