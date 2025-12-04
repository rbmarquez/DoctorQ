"use client";

import { useState } from "react";
import {
  Star,
  Heart,
  ShoppingCart,
  Package,
  Truck,
  Shield,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  X as XIcon,
  MessageSquare,
  Award,
  Scale,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMarketplace } from "@/app/contexts/MarketplaceContext";
import { toast } from "sonner";
import { useProduto, useProdutos } from "@/lib/api";
import Image from "next/image";

interface Review {
  id: string;
  nome_usuario: string;
  nr_estrelas: number;
  ds_comentario: string;
  dt_criacao: string;
  util: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [activeTab, setActiveTab] = useState<"descricao" | "avaliacoes" | "especificacoes">(
    "descricao"
  );

  // Buscar produto da API
  const { produto, isLoading, error } = useProduto(id);

  // Buscar produtos relacionados (mesma categoria)
  const { produtos: relatedProducts } = useProdutos({
    page: 1,
    size: 3,
    // categoria: produto?.ds_categoria, // Filtrar por categoria quando disponível
  });

  // Mock data para reviews (até termos API de reviews)
  const [reviews] = useState<Review[]>([
    {
      id: "1",
      nome_usuario: "Maria Silva",
      nr_estrelas: 5,
      ds_comentario:
        "Produto excelente! Uso todos os dias e minha pele ficou muito mais protegida. Não deixa oleosa e tem ótima textura.",
      dt_criacao: "2024-10-15",
      util: 45,
    },
    {
      id: "2",
      nome_usuario: "João Santos",
      nr_estrelas: 5,
      ds_comentario:
        "Melhor protetor solar que já usei. Vale cada centavo! Realmente não deixa a pele oleosa.",
      dt_criacao: "2024-10-10",
      util: 32,
    },
    {
      id: "3",
      nome_usuario: "Ana Costa",
      nr_estrelas: 4,
      ds_comentario:
        "Muito bom, mas achei o preço um pouco alto. A proteção é realmente excelente.",
      dt_criacao: "2024-10-05",
      util: 28,
    },
  ]);

  const { addToCart, toggleFavorite, isFavorite, addToComparison, isInComparison, removeFromComparison } = useMarketplace();

  const handleAddToCart = () => {
    if (produto) {
      addToCart(produto, quantidade);
      toast.success(`${quantidade} ${quantidade === 1 ? "item adicionado" : "itens adicionados"} ao carrinho!`);
    }
  };

  const handleToggleFavorite = () => {
    if (produto) {
      toggleFavorite(produto);
      toast.success(
        isFavorite(produto.id_produto)
          ? "Removido dos favoritos"
          : "Adicionado aos favoritos"
      );
    }
  };

  const handleToggleComparison = () => {
    if (produto) {
      if (isInComparison(produto.id_produto)) {
        removeFromComparison(produto.id_produto);
        toast.success("Removido da comparação");
      } else {
        const added = addToComparison(produto);
        if (added) {
          toast.success("Adicionado à comparação");
        } else {
          toast.error("Máximo de 4 produtos para comparar");
        }
      }
    }
  };

  const calcularDesconto = (original?: number, atual?: number) => {
    if (!original || !atual) return 0;
    return Math.round(((original - atual) / original) * 100);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando produto...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 via-white to-cyan-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2 text-center">Erro ao carregar produto</h2>
          <p className="text-red-700 text-center mb-6">
            Não foi possível conectar ao servidor. Tente novamente mais tarde.
          </p>
          <Link href="/marketplace">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not found state
  if (!produto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 via-white to-cyan-50">
        <Package className="h-24 w-24 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
        <p className="text-gray-600 mb-6">O produto que você procura não existe.</p>
        <Link href="/marketplace">
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const desconto = calcularDesconto(produto.vl_preco_promocional, produto.vl_preco);

  // Filtrar produtos relacionados (excluir o atual)
  const produtosRelacionados = relatedProducts.filter(p => p.id_produto !== produto.id_produto).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50">
      {/* Back Button */}
      <div className="bg-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar ao Marketplace</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-12 flex items-center justify-center mb-4 relative overflow-hidden">
              {produto.ds_imagem_url ? (
                <div className="relative w-full h-96">
                  <Image
                    src={produto.ds_imagem_url}
                    alt={produto.nm_produto}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <Package className="h-64 w-64 text-blue-300" />
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {produto.ds_selo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white shadow-lg">
                    {produto.ds_selo}
                  </span>
                )}
                {desconto > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-600 text-white shadow-lg">
                    -{desconto}%
                  </span>
                )}
              </div>
            </div>

            {/* Image Gallery - TODO: Implementar galeria quando tivermos ds_imagens_adicionais */}
            {produto.ds_imagens_adicionais && produto.ds_imagens_adicionais.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {produto.ds_imagens_adicionais.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    className={`bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-4 flex items-center justify-center border-2 transition-all ${
                      selectedImage === idx
                        ? "border-blue-600 shadow-lg"
                        : "border-transparent hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <Image src={img} alt={`${produto.nm_produto} ${idx + 1}`} width={80} height={80} className="object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category and Brand */}
            <div className="flex items-center space-x-3 mb-4">
              {produto.ds_categoria && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                  {produto.ds_categoria}
                </span>
              )}
              {produto.ds_marca && (
                <span className="text-gray-500 font-medium">{produto.ds_marca}</span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {produto.nm_produto}
            </h1>

            {/* Rating */}
            {produto.nr_avaliacao_media && (
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  {renderStars(Math.round(produto.nr_avaliacao_media))}
                  <span className="text-lg font-semibold text-gray-900">
                    {produto.nr_avaliacao_media}
                  </span>
                </div>
                {produto.nr_total_avaliacoes && (
                  <button
                    onClick={() => setActiveTab("avaliacoes")}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    ({produto.nr_total_avaliacoes} avaliações)
                  </button>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              {produto.vl_preco_promocional && (
                <div className="text-lg text-gray-500 line-through mb-2">
                  R$ {produto.vl_preco_promocional.toFixed(2)}
                </div>
              )}
              <div className="flex items-baseline space-x-3 mb-2">
                <span className="text-5xl font-bold text-blue-600">
                  R$ {produto.vl_preco.toFixed(2)}
                </span>
                {desconto > 0 && (
                  <span className="text-xl font-semibold text-green-600">
                    {desconto}% OFF
                  </span>
                )}
              </div>
              <div className="text-gray-600">
                ou 12x de R$ {(produto.vl_preco / 12).toFixed(2)} sem juros
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Quantidade
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="px-6 text-lg font-semibold text-gray-900">
                    {quantidade}
                  </span>
                  <button
                    onClick={() => setQuantidade(quantidade + 1)}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                {produto.st_estoque ? (
                  <span className="flex items-center text-green-600 font-medium">
                    <Check className="h-5 w-5 mr-1" />
                    Em estoque
                  </span>
                ) : (
                  <span className="flex items-center text-red-600 font-medium">
                    <XIcon className="h-5 w-5 mr-1" />
                    Indisponível
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-6 text-lg font-semibold"
                disabled={!produto.st_estoque}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {produto.st_estoque ? "Adicionar ao Carrinho" : "Produto Esgotado"}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleToggleFavorite}
                  variant="outline"
                  className={`py-6 text-base font-semibold ${
                    isFavorite(produto.id_produto)
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 mr-2 ${
                      isFavorite(produto.id_produto) ? "fill-pink-600" : ""
                    }`}
                  />
                  {isFavorite(produto.id_produto) ? "Favoritado" : "Favoritar"}
                </Button>
                <Button
                  onClick={handleToggleComparison}
                  variant="outline"
                  className={`py-6 text-base font-semibold ${
                    isInComparison(produto.id_produto)
                      ? "border-purple-600 text-purple-600 bg-purple-50"
                      : "border-gray-300"
                  }`}
                >
                  <Scale
                    className={`h-5 w-5 mr-2 ${
                      isInComparison(produto.id_produto) ? "fill-purple-600" : ""
                    }`}
                  />
                  {isInComparison(produto.id_produto) ? "Na Comparação" : "Comparar"}
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                <Truck className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Frete Grátis</div>
                  <div className="text-xs text-gray-600">Acima de R$ 200</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Compra Segura</div>
                  <div className="text-xs text-gray-600">Dados protegidos</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                <Award className="h-6 w-6 text-purple-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Original</div>
                  <div className="text-xs text-gray-600">Produto certificado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("descricao")}
                className={`pb-4 px-2 font-semibold transition-colors relative ${
                  activeTab === "descricao"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Descrição
              </button>
              <button
                onClick={() => setActiveTab("avaliacoes")}
                className={`pb-4 px-2 font-semibold transition-colors relative ${
                  activeTab === "avaliacoes"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Avaliações {produto.nr_total_avaliacoes && `(${produto.nr_total_avaliacoes})`}
              </button>
              <button
                onClick={() => setActiveTab("especificacoes")}
                className={`pb-4 px-2 font-semibold transition-colors relative ${
                  activeTab === "especificacoes"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Especificações
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            {activeTab === "descricao" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Sobre este produto
                </h3>
                <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                  {produto.ds_descricao || produto.ds_descricao_curta || "Descrição não disponível."}
                </p>

                {/* TODO: Implementar ds_modo_uso, ds_cuidados quando disponível no backend */}
              </div>
            )}

            {activeTab === "avaliacoes" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Avaliações dos Clientes
                    </h3>
                    <div className="flex items-center space-x-3">
                      {renderStars(Math.round(produto.nr_avaliacao_media || 0))}
                      <span className="text-xl font-semibold text-gray-900">
                        {produto.nr_avaliacao_media || 0} de 5
                      </span>
                      <span className="text-gray-600">
                        ({produto.nr_total_avaliacoes || 0} avaliações)
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="border-blue-600 text-blue-600">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Escrever Avaliação
                  </Button>
                </div>

                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {review.nome_usuario}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {renderStars(review.nr_estrelas)}
                            <span className="text-sm text-gray-500">
                              {new Date(review.dt_criacao).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{review.ds_comentario}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <button className="hover:text-blue-600 transition-colors">
                          👍 Útil ({review.util})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "especificacoes" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Especificações Técnicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {produto.ds_marca && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Marca</div>
                      <div className="font-semibold text-gray-900">{produto.ds_marca}</div>
                    </div>
                  )}
                  {produto.ds_categoria && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Categoria</div>
                      <div className="font-semibold text-gray-900">{produto.ds_categoria}</div>
                    </div>
                  )}
                  {produto.ds_sku && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">SKU</div>
                      <div className="font-semibold text-gray-900">{produto.ds_sku}</div>
                    </div>
                  )}
                  {produto.ds_ean && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">EAN</div>
                      <div className="font-semibold text-gray-900">{produto.ds_ean}</div>
                    </div>
                  )}
                  {/* TODO: Adicionar mais especificações quando disponível (peso, dimensões, etc.) */}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {produtosRelacionados.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Produtos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtosRelacionados.map((related) => (
                <Link
                  key={related.id_produto}
                  href={`/marketplace/${related.id_produto}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-xl hover:border-blue-300 transition-all overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      {related.ds_imagem_url ? (
                        <Image
                          src={related.ds_imagem_url}
                          alt={related.nm_produto}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package className="h-20 w-20 text-blue-300" />
                      )}
                      {related.ds_selo && (
                        <span className="absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-lg">
                          {related.ds_selo}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {related.nm_produto}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {related.ds_descricao_curta || related.ds_descricao}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          {related.vl_preco_promocional && (
                            <div className="text-xs text-gray-500 line-through">
                              R$ {related.vl_preco_promocional.toFixed(2)}
                            </div>
                          )}
                          <div className="text-xl font-bold text-blue-600">
                            R$ {related.vl_preco.toFixed(2)}
                          </div>
                        </div>
                        {related.nr_avaliacao_media && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">
                              {related.nr_avaliacao_media}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
