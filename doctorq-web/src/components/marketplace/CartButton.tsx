"use client";

import { useMarketplace } from "@/app/contexts/MarketplaceContext";
import { ShoppingCart } from "lucide-react";

export default function CartButton() {
  const { cartCount, setIsCartOpen } = useMarketplace();

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <ShoppingCart className="h-6 w-6 text-gray-700" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
}
