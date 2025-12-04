'use client';

import { useState } from 'react';
import { Package, Search, Tag, TrendingUp, Edit, Trash, Eye, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/shared/navigation/Pagination';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import { SearchInput } from '@/components/shared/forms/SearchInput';
import type { Produto } from '@/lib/api/server';
import { formatCurrency } from '@/lib/api/server';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProdutosListProps {
  initialProdutos: Produto[];
  initialMeta: { total: number; page: number; size: number; pages: number };
}

export function ProdutosList({ initialProdutos, initialMeta }: ProdutosListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [promocaoFilter, setPromocaoFilter] = useState<string>('all');

  const filtered = initialProdutos.filter((p) => {
    const matchSearch = !search || p.nm_produto?.toLowerCase().includes(search.toLowerCase());
    const matchPromocao = promocaoFilter === 'all' || (promocaoFilter === 'sim' && p.vl_preco_promocional) || (promocaoFilter === 'nao' && !p.vl_preco_promocional);
    return matchSearch && matchPromocao;
  });

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set('busca', search);
    if (promocaoFilter !== 'all') params.set('em_promocao', promocaoFilter === 'sim' ? 'true' : 'false');
    router.push(`/admin/marketplace/produtos?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar produtos..." onSearch={handleApplyFilters} />
            </div>
            <Select value={promocaoFilter} onValueChange={setPromocaoFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sim">Em Promoção</SelectItem>
                <SelectItem value="nao">Preço Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-600">Exibindo <span className="font-semibold">{filtered.length}</span> de <span className="font-semibold">{initialMeta.total}</span> produtos</p>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum produto encontrado" description="Adicione produtos ao catálogo" action={{ label: 'Novo Produto', href: '/admin/marketplace/produtos/novo' }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((produto) => {
            const emPromocao = !!produto.vl_preco_promocional;
            const desconto = emPromocao ? Math.round(((produto.vl_preco - produto.vl_preco_promocional!) / produto.vl_preco) * 100) : 0;

            return (
              <Card key={produto.id_produto} className="group hover:shadow-xl transition-all border-0 bg-gradient-to-br from-white to-gray-50">
                <div className="h-32 bg-gradient-to-br from-orange-100 to-blue-100 flex items-center justify-center">
                  <Package className="w-16 h-16 text-orange-500" />
                </div>
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{produto.nm_produto}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/admin/marketplace/produtos/${produto.id_produto}`}><Edit className="w-4 h-4 mr-2" />Editar</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href={`/produtos/${produto.id_produto}`}><Eye className="w-4 h-4 mr-2" />Visualizar</Link></DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600"><Trash className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {emPromocao && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-fit">
                      <TrendingUp className="w-3 h-3 mr-1" />-{desconto}%
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    {emPromocao && (
                      <p className="text-sm text-gray-500 line-through">{formatCurrency(produto.vl_preco)}</p>
                    )}
                    <p className={`text-2xl font-bold ${emPromocao ? 'text-orange-600' : 'text-gray-900'}`}>
                      {formatCurrency(produto.vl_preco_promocional || produto.vl_preco)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Tag className="w-4 h-4" />
                      <span>Estoque: {produto.nr_estoque}</span>
                    </div>
                    <Badge variant={produto.fl_ativo ? 'default' : 'secondary'}>{produto.fl_ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {initialMeta.pages > 1 && (
        <Pagination currentPage={initialMeta.page} totalPages={initialMeta.pages} totalItems={initialMeta.total} pageSize={initialMeta.size} onPageChange={(p) => router.push(`/admin/marketplace/produtos?page=${p}`)} />
      )}
    </div>
  );
}
