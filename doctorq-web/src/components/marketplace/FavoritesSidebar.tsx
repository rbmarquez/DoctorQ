"use client";

import { useMarketplace } from "@/app/contexts/MarketplaceContext";
import { Button } from "@/components/ui/button";
import { X, Heart, ShoppingCart, Package, Star } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function FavoritesSidebar() {
  const {
    favorites,
    favoritesCount,
    isFavoritesOpen,
    setIsFavoritesOpen,
    removeFromFavorites,
    addToCart,
  } = useMarketplace();

  if (!isFavoritesOpen) return null;

  const handleAddToCart = (product: typeof favorites[0]) => {
    addToCart(product);
    toast.success("Produto adicionado ao carrinho!");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setIsFavoritesOpen(false)}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3 text-white">
            <Heart className="h-6 w-6 fill-white" />
            <div>
              <h2 className="text-xl font-bold">Favoritos</h2>
              <p className="text-sm text-blue-100">
                {favoritesCount} {favoritesCount === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFavoritesOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Favorites Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum favorito ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Adicione produtos aos favoritos para acessá-los facilmente
              </p>
              <Link href="/marketplace">
                <Button
                  onClick={() => setIsFavoritesOpen(false)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ver Produtos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((item) => (
                <div
                  key={item.id_produto}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  {/* Product Image */}
                  <Link
                    href={`/marketplace/${item.id_produto}`}
                    onClick={() => setIsFavoritesOpen(false)}
                    className="flex-shrink-0"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="h-10 w-10 text-blue-400" />
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/marketplace/${item.id_produto}`}
                      onClick={() => setIsFavoritesOpen(false)}
                    >
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                        {item.nm_produto}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 mb-2">{item.ds_marca}</p>

                    {/* Rating */}
                    {item.nr_avaliacao_media && (
                      <div className="flex items-center space-x-1 mb-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold text-gray-900">
                          {item.nr_avaliacao_media}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({item.nr_total_avaliacoes})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-3">
                      {item.vl_preco_original && (
                        <div className="text-xs text-gray-500 line-through">
                          R$ {item.vl_preco_original.toFixed(2)}
                        </div>
                      )}
                      <div className="text-lg font-bold text-blue-600">
                        R$ {item.vl_preco.toFixed(2)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center"
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Adicionar
                      </button>
                      <button
                        onClick={() => {
                          removeFromFavorites(item.id_produto);
                          toast.success("Removido dos favoritos");
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {favorites.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="space-y-3">
              <Button
                onClick={() => {
                  favorites.forEach((item) => addToCart(item));
                  toast.success(`${favoritesCount} ${favoritesCount === 1 ? "item adicionado" : "itens adicionados"} ao carrinho!`);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white py-6 text-lg font-semibold"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Adicionar Todos ao Carrinho
              </Button>
              <Link href="/marketplace" onClick={() => setIsFavoritesOpen(false)}>
                <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                  Continuar Comprando
                </Button>
              </Link>
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800 font-medium text-center">
                ❤️ {favoritesCount} {favoritesCount === 1 ? "produto salvo" : "produtos salvos"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
