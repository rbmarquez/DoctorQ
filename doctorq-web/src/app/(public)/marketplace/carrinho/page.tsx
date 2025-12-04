"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  Calendar,
  MapPin,
  ArrowRight,
  Gift,
  Percent,
  CreditCard,
  AlertCircle,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  useCarrinho,
  atualizarItemCarrinho,
  removerDoCarrinho,
} from "@/lib/api/hooks/useCarrinho";
import {
  aplicarCupom,
  removerCupom as removerCupomAPI,
  useCuponsDisponiveis,
} from "@/lib/api/hooks/useCupons";

export default function CarrinhoPage() {
  const { user } = useAuth();
  const userId = user?.id_user || null;

  // Buscar carrinho da API
  const { itens, totais, isLoading, error, mutate: mutateCarrinho } = useCarrinho(userId);

  // Buscar cupons disponíveis para o usuário
  const { cupons: cuponsDisponiveis } = useCuponsDisponiveis(userId);

  // Estado do cupom
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<string | null>(null);
  const [descontoAplicado, setDescontoAplicado] = useState(0);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isValidatingCupom, setIsValidatingCupom] = useState(false);

  const handleAtualizarQuantidade = async (idItem: string, novaQtd: number) => {
    if (novaQtd < 1 || !userId) return;

    setIsUpdating(idItem);
    try {
      await atualizarItemCarrinho(userId, idItem, novaQtd);
      toast.success("Quantidade atualizada!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar quantidade");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoverItem = async (idItem: string) => {
    if (!userId) return;

    setIsUpdating(idItem);
    try {
      await removerDoCarrinho(userId, idItem);
      toast.success("Item removido do carrinho!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover item");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleAplicarCupom = async () => {
    if (!cupom.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    if (!userId) {
      toast.error("Você precisa estar logado para aplicar cupons");
      return;
    }

    const subtotal = totais?.vl_subtotal || 0;
    if (subtotal === 0) {
      toast.error("Adicione produtos ao carrinho primeiro");
      return;
    }

    setIsValidatingCupom(true);
    try {
      // Validar cupom com a API
      const resultado = await aplicarCupom({
        codigo: cupom,
        userId: userId,
        valorCarrinho: subtotal,
        produtosIds: itens?.map((item) => item.id_produto) || [],
      });

      if (resultado.valido) {
        setCupomAplicado(cupom.toUpperCase());
        setDescontoAplicado(resultado.desconto);
        toast.success(resultado.mensagem);
      } else {
        toast.error(resultado.mensagem);
      }
    } catch (error: any) {
      toast.error("Erro ao validar cupom. Tente novamente.");
      console.error("Erro ao validar cupom:", error);
    } finally {
      setIsValidatingCupom(false);
    }
  };

  const handleRemoverCupom = () => {
    setCupomAplicado(null);
    setDescontoAplicado(0);
    setCupom("");
    const resultado = removerCupomAPI();
    toast.info(resultado.mensagem);
  };

  // Calcular totais (usar API + desconto validado do servidor)
  const subtotal = totais?.vl_subtotal || 0;
  const valorDesconto = descontoAplicado;
  const total = subtotal - valorDesconto;

  const handleFinalizarCompra = () => {
    if (itens.length === 0) {
      toast.error("Seu carrinho está vazio!");
      return;
    }
    toast.success("Redirecionando para checkout...");
    // Redirecionar para página de checkout
    window.location.href = "/checkout";
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              Meu Carrinho
            </h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-32 w-32 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="h-32 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-12 w-12 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-red-900 mb-2">Erro ao carregar carrinho</h2>
                <p className="text-red-700 mb-4">
                  Não foi possível conectar ao servidor. Por favor, tente novamente.
                </p>
                <Button onClick={() => mutateCarrinho()} variant="outline" className="border-red-300 text-red-700">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-blue-500" />
            Meu Carrinho
          </h1>
          <p className="text-gray-600 mt-1">
            {itens.length} {itens.length === 1 ? "item" : "itens"} no carrinho
          </p>
        </div>

        {itens.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Lista de Itens */}
            <div className="lg:col-span-2 space-y-4">
              {itens.map((item) => {
                const isItemUpdating = isUpdating === item.id_item;
                const itemImage = item.ds_imagem_url || "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400";
                const itemType = item.id_produto ? "Produto" : "Procedimento";

                return (
                  <Card key={item.id_item} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Imagem */}
                        <div className="relative h-32 w-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <Image src={itemImage} alt={item.nm_item} fill className="object-cover" />
                        </div>

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <Badge variant="outline" className="mb-2">
                                {itemType}
                              </Badge>
                              <h3 className="font-bold text-lg text-gray-900 mb-1">{item.nm_item}</h3>
                              {item.fornecedor_nome && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <MapPin className="h-4 w-4" />
                                  <span className="truncate">{item.fornecedor_nome}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoverItem(item.id_item)}
                              disabled={isItemUpdating}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {isItemUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>

                          {/* Quantidade e Preço */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAtualizarQuantidade(item.id_item, item.qt_quantidade - 1)}
                                disabled={item.qt_quantidade <= 1 || isItemUpdating}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-semibold">{item.qt_quantidade}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAtualizarQuantidade(item.id_item, item.qt_quantidade + 1)}
                                disabled={isItemUpdating}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">
                                {item.vl_subtotal.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                              {item.qt_quantidade > 1 && (
                                <p className="text-xs text-gray-500">
                                  {item.vl_preco_unitario.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}{" "}
                                  cada
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Continuar Comprando */}
              <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Quer adicionar mais procedimentos?</h3>
                  <p className="text-gray-600 mb-4">Explore nosso marketplace e encontre o procedimento ideal para você!</p>
                  <Link href="/paciente/procedimentos">
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Explorar Procedimentos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Resumo do Pedido */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Cupom de Desconto */}
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Cupom de Desconto</label>
                    {!cupomAplicado ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite o cupom"
                          value={cupom}
                          onChange={(e) => setCupom(e.target.value.toUpperCase())}
                          className="uppercase"
                        />
                        <Button
                          onClick={handleAplicarCupom}
                          variant="outline"
                          disabled={isValidatingCupom || !cupom.trim()}
                        >
                          {isValidatingCupom ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Tag className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-800">{cupomAplicado}</span>
                          <Badge className="bg-green-100 text-green-700 border-green-200">-{desconto}%</Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleRemoverCupom} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      <Percent className="h-3 w-3 inline mr-1" />
                      Cupons disponíveis: BEMVINDO10, PRIMEIRA20
                    </p>
                  </div>

                  <Separator />

                  {/* Valores */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        {subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    {desconto > 0 && (
                      <div className="flex items-center justify-between text-green-600">
                        <span>Desconto ({desconto}%)</span>
                        <span className="font-semibold">
                          -{valorDesconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-2xl text-blue-600">
                      {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>

                  {/* Informações Adicionais */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">Informações Importantes:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Agendamento será confirmado após pagamento</li>
                          <li>Horário sujeito à disponibilidade</li>
                          <li>Cancelamento gratuito até 24h antes</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-2">
                    <Button
                      onClick={handleFinalizarCompra}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 h-12"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Finalizar Compra
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <Link href="/paciente/procedimentos">
                      <Button variant="outline" className="w-full">
                        Continuar Comprando
                      </Button>
                    </Link>
                  </div>

                  {/* Métodos de Pagamento */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-600 text-center mb-2">Aceitamos:</p>
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-8 w-12 bg-gray-100 rounded border flex items-center justify-center text-xs font-bold">
                        VISA
                      </div>
                      <div className="h-8 w-12 bg-gray-100 rounded border flex items-center justify-center text-xs font-bold">
                        MASTER
                      </div>
                      <div className="h-8 w-12 bg-gray-100 rounded border flex items-center justify-center text-xs font-bold">
                        PIX
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Carrinho Vazio */
          <Card className="border-2 border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Seu carrinho está vazio</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Explore nosso marketplace e adicione procedimentos incríveis ao seu carrinho!
              </p>
              <Link href="/paciente/procedimentos">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Explorar Procedimentos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
