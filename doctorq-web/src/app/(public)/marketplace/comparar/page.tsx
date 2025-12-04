"use client";

import { useComparacao, compararAtributos, getMelhorValor } from "@/lib/api";
import { LoadingState, EmptyState } from "@/components/states";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Check,
  ShoppingCart,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

export default function ComparaProdutosPage() {
  const router = useRouter();
  const {
    itens,
    isLoading,
    removerProduto,
    limparComparacao,
    totalItens,
    maxItens,
  } = useComparacao();

  if (isLoading) {
    return (
      <AuthenticatedLayout title="Comparar Produtos">
        <LoadingState message="Carregando comparação..." />
      </AuthenticatedLayout>
    );
  }

  if (totalItens === 0) {
    return (
      <AuthenticatedLayout title="Comparar Produtos">
        <EmptyState
          title="Nenhum produto para comparar"
          description="Adicione produtos à comparação navegando pelo marketplace"
          actionLabel="Ir para Marketplace"
          onAction={() => router.push("/marketplace")}
        />
      </AuthenticatedLayout>
    );
  }

  const produtos = itens.map((item) => item.produto);
  const atributos = compararAtributos(produtos);

  const handleAdicionarAoCarrinho = async (produtoId: string) => {
    try {
      // TODO: Implementar adição ao carrinho
      toast.success("Produto adicionado ao carrinho!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar ao carrinho");
    }
  };

  return (
    <AuthenticatedLayout
      title="Comparar Produtos"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="outline" onClick={limparComparacao}>
            Limpar Comparação
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  Comparando {totalItens} {totalItens === 1 ? "produto" : "produtos"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Você pode comparar até {maxItens} produtos simultaneamente
                </p>
              </div>
              <Badge variant="secondary">
                {totalItens}/{maxItens}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Comparação em Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtos.map((produto) => (
            <Card key={produto.id_produto} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => removerProduto(produto.id_produto)}
              >
                <X className="h-4 w-4" />
              </Button>

              <CardHeader className="pb-4">
                <div className="aspect-square relative mb-4">
                  <Image
                    src={produto.ds_foto_url || "/placeholder.jpg"}
                    alt={produto.nm_produto}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <CardTitle className="text-base line-clamp-2">
                  {produto.nm_produto}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(produto.vl_preco)}
                    </span>
                  </div>
                </div>

                {produto.nr_avaliacao_media && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {produto.nr_avaliacao_media.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({produto.nr_avaliacoes || 0})
                    </span>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => handleAdicionarAoCarrinho(produto.id_produto)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela de Comparação Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Comparação Detalhada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Atributo</th>
                    {produtos.map((produto) => (
                      <th key={produto.id_produto} className="text-left py-3 px-4 font-medium">
                        <span className="line-clamp-1">{produto.nm_produto}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {atributos.map((attr, index) => {
                    const melhorIndex =
                      attr.atributo === "Preço"
                        ? getMelhorValor(attr.valores, "menor")
                        : getMelhorValor(attr.valores, "maior");

                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{attr.atributo}</td>
                        {attr.valores.map((valor, valorIndex) => {
                          const isMelhor = valorIndex === melhorIndex;
                          return (
                            <td
                              key={valorIndex}
                              className={`py-3 px-4 ${
                                isMelhor ? "font-semibold text-primary" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {valor !== null ? (
                                  <>
                                    {typeof valor === "number" && attr.atributo === "Preço"
                                      ? new Intl.NumberFormat("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                        }).format(valor)
                                      : typeof valor === "boolean"
                                      ? valor
                                        ? "Sim"
                                        : "Não"
                                      : valor}
                                    {isMelhor && (
                                      <TrendingUp className="h-4 w-4 text-primary" />
                                    )}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">N/A</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recomendação */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/20 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Nossa Recomendação</h3>
                <p className="text-sm text-muted-foreground">
                  Compare os preços, avaliações e características para escolher o produto que
                  melhor atende às suas necessidades. Produtos em destaque indicam os melhores
                  valores em cada categoria.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
