"use client";

import Link from "next/link";
import { Store } from "lucide-react";

const highlightedProducts = [
  {
    id: "kit-skin-glow",
    name: "Kit Skin Glow Profissional",
    price: "R$ 189,90",
    category: "Skincare",
    supplier: "Dermaceuticals",
    image:
      "https://images.unsplash.com/photo-1534665482403-a909d0d97c67?w=900&h=600&fit=crop&auto=format",
  },
  {
    id: "serum-vitamina-c",
    name: "Serum Concentrado de Vitamina C 20%",
    price: "R$ 129,00",
    category: "Dermocosméticos",
    supplier: "GlowLab",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&h=600&fit=crop&auto=format",
  },
  {
    id: "mascara-nutritiva",
    name: "Máscara Nutritiva de Ácido Hialurônico",
    price: "R$ 89,50",
    category: "Tratamentos",
    supplier: "SkinLabs Pro",
    image:
      "https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=900&h=600&fit=crop&auto=format",
  },
];

export function MarketplaceHighlights() {
  return (
    <section className="w-full max-w-5xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-100 text-blue-600 p-2">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              Marketplace
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Novidades exclusivas para sua clínica
            </h2>
          </div>
        </div>
        <Link
          href="/marketplace"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Explorar todos os produtos
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 px-2 sm:px-0">
        {highlightedProducts.map((product) => (
          <Link
            key={product.id}
            href={`/marketplace?produto=${product.id}`}
            className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative h-32 sm:h-36 w-full overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute left-0 top-0 m-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                {product.category}
              </span>
            </div>
            <div className="p-4 space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs text-slate-500">Fornecedor: {product.supplier}</p>
              <div className="pt-1">
                <span className="text-sm font-bold text-indigo-600">{product.price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
