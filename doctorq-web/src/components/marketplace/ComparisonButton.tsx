"use client";

import { useMarketplace } from "@/app/contexts/MarketplaceContext";
import { TrendingUp } from "lucide-react";

export default function ComparisonButton() {
  const { comparisonCount, setIsComparisonOpen } = useMarketplace();

  if (comparisonCount === 0) return null;

  return (
    <button
      onClick={() => setIsComparisonOpen(true)}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <TrendingUp className="h-6 w-6 text-gray-700" />
      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
        {comparisonCount}
      </span>
    </button>
  );
}
