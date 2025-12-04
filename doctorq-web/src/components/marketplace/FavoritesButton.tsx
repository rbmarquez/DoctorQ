"use client";

import { useMarketplace } from "@/app/contexts/MarketplaceContext";
import { Heart } from "lucide-react";

export default function FavoritesButton() {
  const { favoritesCount, setIsFavoritesOpen } = useMarketplace();

  return (
    <button
      onClick={() => setIsFavoritesOpen(true)}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Heart className={`h-6 w-6 ${favoritesCount > 0 ? "fill-pink-600 text-blue-600" : "text-gray-700"}`} />
      {favoritesCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
          {favoritesCount > 99 ? "99+" : favoritesCount}
        </span>
      )}
    </button>
  );
}
