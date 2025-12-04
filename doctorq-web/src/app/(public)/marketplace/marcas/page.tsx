"use client";

import { useState } from "react";
import { useProdutos } from "@/lib/api/hooks/useProdutos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Award, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const marcasDisponiveis = [
  { nome: "La Roche-Posay", logo: "LRP", produtos: 45, cor: "from-blue-500 to-blue-600" },
  { nome: "Vichy", logo: "V", produtos: 38, cor: "from-green-500 to-green-600" },
  { nome: "Bioderma", logo: "B", produtos: 32, cor: "from-blue-500 to-blue-600" },
  { nome: "Avène", logo: "A", produtos: 28, cor: "from-orange-500 to-orange-600" },
  { nome: "SkinCeuticals", logo: "SC", produtos: 35, cor: "from-purple-500 to-purple-600" },
  { nome: "Isdin", logo: "I", produtos: 40, cor: "from-indigo-500 to-indigo-600" },
  { nome: "Neutrogena", logo: "N", produtos: 50, cor: "from-cyan-500 to-cyan-600" },
  { nome: "CeraVe", logo: "C", produtos: 25, cor: "from-teal-500 to-teal-600" },
];

export default function MarcasPage() {
  const [marcaSelecionada, setMarcaSelecionada] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const { produtos, isLoading } = useProdutos({
    marca: marcaSelecionada || undefined,
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const marcasFiltradas = marcasDisponiveis.filter((m) =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Marcas</h1>
          </div>
          <p className="text-gray-600 text-lg">Explore produtos das melhores marcas de estética</p>
        </div>

        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar marca..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {marcasFiltradas.map((marca) => (
              <Card
                key={marca.nome}
                className={`cursor-pointer transition-all ${
                  marcaSelecionada === marca.nome
                    ? "ring-2 ring-blue-600 shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => setMarcaSelecionada(marca.nome)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${marca.cor} text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3`}>
                    {marca.logo}
                  </div>
                  <h3 className="font-semibold mb-1">{marca.nome}</h3>
                  <p className="text-sm text-gray-600">{marca.produtos} produtos</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {marcaSelecionada && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Produtos {marcaSelecionada}</h2>
              <Button variant="outline" onClick={() => setMarcaSelecionada(null)}>
                Limpar Filtro
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">Carregando produtos...</div>
        ) : produtos && produtos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtos.map((produto: any) => (
              <Card key={produto.id_produto} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                  <Badge className="mb-2">{marcaSelecionada}</Badge>
                  <h3 className="font-semibold line-clamp-2 mb-2">{produto.nm_produto}</h3>
                  <div className="flex items-center gap-1 mb-3">
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
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Selecione uma marca para ver os produtos</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
