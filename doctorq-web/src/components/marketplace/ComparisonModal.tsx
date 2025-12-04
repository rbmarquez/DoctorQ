"use client";

import { useMarketplace } from "@/app/contexts/MarketplaceContext";
import { Button } from "@/components/ui/button";
import {
  X,
  Package,
  Star,
  ShoppingCart,
  Check,
  XIcon,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ComparisonModal() {
  const {
    comparison,
    comparisonCount,
    isComparisonOpen,
    setIsComparisonOpen,
    removeFromComparison,
    clearComparison,
    addToCart,
  } = useMarketplace();

  if (!isComparisonOpen || comparisonCount === 0) return null;

  const handleAddToCart = (product: typeof comparison[0]) => {
    addToCart(product);
    toast.success("Produto adicionado ao carrinho!");
  };

  const features = [
    { key: "ds_marca", label: "Marca" },
    { key: "ds_categoria", label: "Categoria" },
    { key: "vl_preco", label: "Preço", format: (val: number) => `R$ ${val.toFixed(2)}` },
    {
      key: "vl_preco_original",
      label: "Preço Original",
      format: (val?: number) => (val ? `R$ ${val.toFixed(2)}` : "-"),
    },
    {
      key: "nr_avaliacao_media",
      label: "Avaliação",
      format: (val?: number) => (val ? val.toFixed(1) : "-"),
    },
    {
      key: "nr_total_avaliacoes",
      label: "Nº Avaliações",
      format: (val?: number) => val?.toString() || "-",
    },
    {
      key: "st_estoque",
      label: "Estoque",
      format: (val: boolean) => (val ? "✓ Disponível" : "✗ Indisponível"),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setIsComparisonOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center space-x-3 text-white">
              <TrendingUp className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Comparar Produtos</h2>
                <p className="text-sm text-blue-100">
                  {comparisonCount} {comparisonCount === 1 ? "produto" : "produtos"} selecionados
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={clearComparison}
                variant="outline"
                className="border-white text-white hover:bg-white/20"
                size="sm"
              >
                Limpar Todos
              </Button>
              <button
                onClick={() => setIsComparisonOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 bg-gray-50 sticky left-0 z-10 w-48">
                      <span className="text-sm font-semibold text-gray-700">Característica</span>
                    </th>
                    {comparison.map((product) => (
                      <th key={product.id_produto} className="p-4 min-w-[280px]">
                        <div className="relative">
                          {/* Remove Button */}
                          <button
                            onClick={() => {
                              removeFromComparison(product.id_produto);
                              if (comparisonCount === 1) {
                                setIsComparisonOpen(false);
                              }
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg z-20"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          {/* Product Image */}
                          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-8 flex items-center justify-center mb-4">
                            <Package className="h-20 w-20 text-blue-300" />
                          </div>

                          {/* Product Info */}
                          <Link
                            href={`/marketplace/${product.id_produto}`}
                            onClick={() => setIsComparisonOpen(false)}
                          >
                            <h3 className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2 min-h-[3rem]">
                              {product.nm_produto}
                            </h3>
                          </Link>

                          {/* Selo */}
                          {product.ds_selo && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-3">
                              {product.ds_selo}
                            </span>
                          )}

                          {/* Price */}
                          <div className="mb-4">
                            {product.vl_preco_original && (
                              <div className="text-sm text-gray-500 line-through">
                                R$ {product.vl_preco_original.toFixed(2)}
                              </div>
                            )}
                            <div className="text-2xl font-bold text-blue-600">
                              R$ {product.vl_preco.toFixed(2)}
                            </div>
                          </div>

                          {/* Add to Cart Button */}
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                            disabled={!product.st_estoque}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {product.st_estoque ? "Adicionar ao Carrinho" : "Indisponível"}
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={feature.key}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-4 font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10">
                        {feature.label}
                      </td>
                      {comparison.map((product) => {
                        const value = (product as any)[feature.key];
                        const displayValue = feature.format ? (feature.format as any)(value) : value;

                        // Destaque visual para melhor valor
                        let isHighlight = false;
                        if (feature.key === "vl_preco") {
                          const minPrice = Math.min(...comparison.map((p) => p.vl_preco));
                          isHighlight = value === minPrice;
                        } else if (feature.key === "nr_avaliacao_media") {
                          const maxRating = Math.max(
                            ...comparison
                              .map((p) => p.nr_avaliacao_media || 0)
                              .filter((r) => r > 0)
                          );
                          isHighlight = value === maxRating && value > 0;
                        }

                        return (
                          <td
                            key={product.id_produto}
                            className={`p-4 text-center ${
                              isHighlight ? "bg-green-50 font-semibold text-green-700" : ""
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {isHighlight && (
                                <Check className="h-4 w-4 text-green-600 mr-1" />
                              )}
                              <span>{displayValue}</span>
                            </div>

                            {/* Stars for rating */}
                            {feature.key === "nr_avaliacao_media" && value > 0 && (
                              <div className="flex items-center justify-center mt-1 space-x-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= Math.round(value)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Description Row */}
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10 align-top">
                      Descrição
                    </td>
                    {comparison.map((product) => (
                      <td key={product.id_produto} className="p-4 text-sm text-gray-600 align-top">
                        <p className="line-clamp-4">{product.ds_descricao}</p>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Empty Slots Message */}
            {comparisonCount < 4 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-blue-800">
                  💡 Você pode adicionar até {4 - comparisonCount} produto
                  {4 - comparisonCount > 1 ? "s" : ""} para comparar
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p>
                <strong>Dica:</strong> Produtos com destaque verde são os melhores valores em
                cada categoria
              </p>
            </div>
            <Button
              onClick={() => setIsComparisonOpen(false)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Fechar Comparação
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
