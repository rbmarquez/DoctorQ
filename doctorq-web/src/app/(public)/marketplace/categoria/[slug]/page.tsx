"use client";

import { use } from "react";
import Link from "next/link";
import { useProdutos } from "@/lib/api/hooks/useProdutos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Star, ShoppingCart, ChevronLeft, Filter, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoriaPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const categoria = decodeURIComponent(resolvedParams.slug);
  
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState("relevancia");
  
  const { produtos, isLoading } = useProdutos({
    categoria,
    busca,
    ordenacao: ordenacao as any,
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/marketplace">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{categoria}</h1>
            <p className="text-gray-600 mt-2">{produtos?.length || 0} produtos encontrados</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando produtos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtos?.map((produto: any) => (
              <Card key={produto.id_produto} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                  <h3 className="font-semibold line-clamp-2 mb-2">{produto.nm_produto}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{produto.nr_media_avaliacoes || 5.0}</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-3">
                    {formatPrice(produto.vl_preco)}
                  </p>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
