"use client";

import { useMarketplace } from "@/app/contexts/MarketplaceContext";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, ShoppingCart, Trash2, ArrowRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartSidebar() {
  const {
    cart,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
  } = useMarketplace();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3 text-white">
            <ShoppingCart className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Seu Carrinho</h2>
              <p className="text-sm text-blue-100">
                {cartCount} {cartCount === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Seu carrinho está vazio
              </h3>
              <p className="text-gray-600 mb-6">
                Adicione produtos para começar suas compras
              </p>
              <Link href="/marketplace">
                <Button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ver Produtos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id_produto}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="h-10 w-10 text-blue-400" />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.nm_produto}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{item.ds_marca}</p>

                    {/* Price and Quantity */}
                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateCartQuantity(item.id_produto, item.quantidade - 1)
                          }
                          className="p-1 rounded-md bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-center">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(item.id_produto, item.quantidade + 1)
                          }
                          className="p-1 rounded-md bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">
                          R$ {item.vl_subtotal.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          R$ {item.vl_preco.toFixed(2)} cada
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id_produto)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Summary and Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {/* Shipping Info */}
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                {cartTotal >= 200 ? (
                  <>
                    <span className="mr-2">🎉</span>
                    Você ganhou frete grátis!
                  </>
                ) : (
                  <>
                    <span className="mr-2">📦</span>
                    Faltam R$ {(200 - cartTotal).toFixed(2)} para frete grátis
                  </>
                )}
              </p>
            </div>

            {/* Subtotal */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Frete</span>
                <span className={cartTotal >= 200 ? "text-green-600 font-semibold" : ""}>
                  {cartTotal >= 200 ? "Grátis" : "Calculado no checkout"}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-blue-600">R$ {cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Buttons */}
            <div className="space-y-3">
              <Link href="/checkout" onClick={() => setIsCartOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white py-6 text-lg font-semibold">
                  Finalizar Compra
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/marketplace" onClick={() => setIsCartOpen(false)}>
                <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                  Continuar Comprando
                </Button>
              </Link>
            </div>

            {/* Payment Methods */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 mb-2">Formas de pagamento</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="px-2 py-1 bg-white rounded text-xs font-semibold text-gray-700 border border-gray-200">
                  Pix
                </div>
                <div className="px-2 py-1 bg-white rounded text-xs font-semibold text-gray-700 border border-gray-200">
                  Cartão
                </div>
                <div className="px-2 py-1 bg-white rounded text-xs font-semibold text-gray-700 border border-gray-200">
                  Boleto
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
