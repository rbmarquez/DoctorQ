"use client";

import Image from "next/image";
import { Package, Star, ShoppingCart, Scale, Heart } from "lucide-react";
import { PrefetchLink } from "@/components/navigation/PrefetchLink";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/app/contexts/MarketplaceContext";
import { toast } from "sonner";
import type { Produto } from "@/lib/api";

interface MarketplaceProductCardProps {
  product: Produto;
}

const calcularDesconto = (precoPromocional?: number, preco?: number) => {
  if (!preco || !precoPromocional) return 0;
  return Math.round(((precoPromocional - preco) / precoPromocional) * -100);
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number") return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
};

export function MarketplaceProductCard({ product }: MarketplaceProductCardProps) {
  const { addToCart, toggleFavorite, isFavorite, addToComparison, isInComparison, removeFromComparison } =
    useMarketplace();

  const desconto = calcularDesconto(product.vl_preco_promocional, product.vl_preco);

  return (
    <PrefetchLink href={`/marketplace/${product.id_produto}`} className="group">
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-xl hover:border-blue-300 transition-all overflow-hidden h-full flex flex-col">
        <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
          {product.ds_imagem_url ? (
            <Image
              src={product.ds_imagem_url}
              alt={product.nm_produto}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-24 w-24 text-blue-300" />
            </div>
          )}

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.ds_selo && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-lg">
                {product.ds_selo}
              </span>
            )}
            {desconto > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white shadow-lg">
                -{desconto}%
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(product);
                toast.success(
                  isFavorite(product.id_produto)
                    ? "Removido dos favoritos"
                    : "Adicionado aos favoritos"
                );
              }}
              aria-label={isFavorite(product.id_produto) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite(product.id_produto)
                    ? "fill-pink-600 text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              />
            </button>

            <button
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                if (isInComparison(product.id_produto)) {
                  removeFromComparison(product.id_produto);
                  toast.success("Removido da comparação");
                } else {
                  const added = addToComparison(product);
                  if (added) {
                    toast.success("Adicionado à comparação");
                  } else {
                    toast.error("Máximo de 4 produtos para comparar");
                  }
                }
              }}
              aria-label={isInComparison(product.id_produto) ? "Remover da comparação" : "Adicionar à comparação"}
            >
              <Scale
                className={`h-5 w-5 ${
                  isInComparison(product.id_produto)
                    ? "fill-purple-600 text-purple-600"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            {product.ds_categoria && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {product.ds_categoria}
              </span>
            )}
            {product.ds_marca && (
              <span className="text-xs text-gray-500 font-medium">{product.ds_marca}</span>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {product.nm_produto}
          </h3>

          {(product.ds_descricao_curta || product.ds_descricao) && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
              {product.ds_descricao_curta || product.ds_descricao}
            </p>
          )}

          {product.nr_avaliacao_media && (
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-900">
                  {product.nr_avaliacao_media}
                </span>
              </div>
              {product.nr_total_avaliacoes && (
                <span className="text-xs text-gray-500">
                  ({product.nr_total_avaliacoes} avaliações)
                </span>
              )}
            </div>
          )}

          <div className="mb-4">
            {product.vl_preco_promocional && (
              <div className="text-sm text-gray-500 line-through mb-1">
                {formatCurrency(product.vl_preco_promocional)}
              </div>
            )}
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-blue-600">
                {formatCurrency(product.vl_preco)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ou 12x de {formatCurrency(product.vl_preco / 12)}
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
              toast.success("Produto adicionado ao carrinho!");
            }}
            disabled={!product.st_estoque}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.st_estoque ? "Adicionar ao Carrinho" : "Esgotado"}
          </Button>
        </div>
      </div>
    </PrefetchLink>
  );
}

export default MarketplaceProductCard;
