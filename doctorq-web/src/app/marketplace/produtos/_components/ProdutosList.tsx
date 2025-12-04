'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, Heart, TrendingUp, Tag, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/api/server';
import type { Produto } from '@/lib/api/server';
import type { PaginationMeta } from '@/lib/api/types';

interface ProdutosListProps {
  initialProdutos: Produto[];
  initialMeta: PaginationMeta;
}

export function ProdutosList({ initialProdutos, initialMeta }: ProdutosListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [promocaoFilter, setPromocaoFilter] = useState<string>('all');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('busca', search);
    if (categoriaFilter !== 'all') params.set('categoria', categoriaFilter);
    if (promocaoFilter === 'sim') params.set('promocao', 'true');
    router.push(`/marketplace/produtos?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="dermocosmeticos">Dermocosméticos</SelectItem>
                <SelectItem value="equipamentos">Equipamentos</SelectItem>
                <SelectItem value="injetaveis">Injetáveis</SelectItem>
                <SelectItem value="suplementos">Suplementos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={promocaoFilter} onValueChange={setPromocaoFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Promoção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sim">Em Promoção</SelectItem>
                <SelectItem value="nao">Preço Normal</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Exibindo <span className="font-semibold">{initialProdutos.length}</span> de{' '}
            <span className="font-semibold">{initialMeta.total}</span> produtos
          </div>
        </CardContent>
      </Card>

      {/* Grid de Produtos */}
      {initialProdutos.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Nenhum produto encontrado</h3>
            <p className="text-gray-600 mt-2">Tente ajustar os filtros de busca.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {initialProdutos.map((produto) => {
            const emPromocao = !!produto.vl_preco_promocional;
            const precoFinal = emPromocao ? produto.vl_preco_promocional! : produto.vl_preco;
            const desconto = emPromocao ? Math.round(((produto.vl_preco - produto.vl_preco_promocional!) / produto.vl_preco) * 100) : 0;

            return (
              <Card key={produto.id_produto} className="border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-0">
                  {/* Imagem do Produto */}
                  <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    {produto.ds_imagem_url ? (
                      <img src={produto.ds_imagem_url} alt={produto.nm_produto} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-20 h-20 text-gray-300" />
                      </div>
                    )}
                    {emPromocao && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                          <TrendingUp className="w-3 h-3 mr-1" />-{desconto}%
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Button variant="ghost" size="sm" className="bg-white/80 hover:bg-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Info do Produto */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">{produto.nm_produto}</h3>
                      {produto.ds_produto && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{produto.ds_produto}</p>}
                    </div>

                    <div className="space-y-1">
                      {emPromocao && (
                        <p className="text-sm text-gray-500 line-through">{formatCurrency(produto.vl_preco)}</p>
                      )}
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(precoFinal)}</p>
                    </div>

                    {produto.qt_estoque !== undefined && (
                      <div className="flex items-center gap-2">
                        {produto.qt_estoque > 0 ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-gray-600">{produto.qt_estoque} em estoque</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs text-red-600">Esgotado</span>
                          </>
                        )}
                      </div>
                    )}

                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" disabled={produto.qt_estoque === 0}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {initialMeta.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(initialMeta.pages, 5) }, (_, i) => {
            const pageNum = i + 1;
            const isActive = pageNum === initialMeta.page;
            return (
              <Button
                key={pageNum}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set('page', String(pageNum));
                  router.push(`/marketplace/produtos?${params.toString()}`);
                }}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
