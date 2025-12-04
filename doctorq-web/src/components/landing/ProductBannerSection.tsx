"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DEFAULT_PROFESSIONAL_PRODUCTS } from "@/constants/professional-products";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const CATEGORIES = ["Destaques", "Mais Vendidos", "Lançamentos"];

const FALLBACK_PRODUCT_IMAGE = "/images/placeholders/product-highlight.svg";

export function ProductBannerSection() {
  const [products, setProducts] = useState(
    DEFAULT_PROFESSIONAL_PRODUCTS.slice(0, 3)
  );
  const [promoProduct, setPromoProduct] = useState(
    DEFAULT_PROFESSIONAL_PRODUCTS[3] ?? DEFAULT_PROFESSIONAL_PRODUCTS[0]
  );
  const [promoImageError, setPromoImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/professional-products", {
          cache: "no-store",
          next: { revalidate: 0 },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Falha ao carregar produtos");
        const data = await response.json();
        const items: typeof DEFAULT_PROFESSIONAL_PRODUCTS = Array.isArray(data?.items)
          ? data.items
          : [];
        if (!isMounted || items.length === 0) return;

        setProducts(items.slice(0, 3));
        const nextPromo = items[3] ?? items[0] ?? DEFAULT_PROFESSIONAL_PRODUCTS[0];
        setPromoProduct(nextPromo);
        setPromoImageError(false);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Usando produtos padrão na vitrine:", error);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const promoImageSrc = getProductImageSrc(promoProduct.heroImage);

  return (
    <section id="produtos" className="bg-[#faf7f5] py-16 scroll-mt-24 lg:scroll-mt-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-4 border-b border-[#e8e0da] pb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#786f68]">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className="transition-colors hover:text-black"
              type="button"
            >
              {category}
            </button>
          ))}
          <Link
            href="/marketplace/produtos"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-black hover:bg-black hover:text-white transition-colors"
          >
            Shop All
          </Link>
        </nav>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          <aside className="relative flex flex-col overflow-hidden rounded-3xl bg-[#ede3da]">
            <div className="relative h-60 w-full overflow-hidden">
              <Image
                src={promoImageError ? FALLBACK_PRODUCT_IMAGE : promoImageSrc}
                alt={promoProduct.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 25vw"
                onError={() => setPromoImageError(true)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6 text-[#2f2a26]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8d7f74]">
                Oferta exclusiva
              </p>
              <h3 className="text-lg font-semibold">{promoProduct.name}</h3>
              <p className="text-sm text-[#5a524c]">
                Ganhe um mini ritual DoctorQ nas compras acima de R$ 450.
              </p>
          <Link
            href={`/produtos/${promoProduct.id}`}
            className="mt-auto inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em]"
          >
                Quero saber mais
                <span aria-hidden className="text-base">
                  →
                </span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
}: {
  product: (typeof DEFAULT_PROFESSIONAL_PRODUCTS)[number];
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = getProductImageSrc(product.heroImage);

  return (
    <Link
      href={`/produtos/${product.id}`}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#ece4dc] bg-white transition-shadow hover:shadow-[0_22px_45px_-30px_rgba(156,133,113,0.35)]"
    >
      <div className="relative h-60 w-full overflow-hidden bg-[#f9f4ef]">
        <Image
          src={imageError ? FALLBACK_PRODUCT_IMAGE : imageSrc}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 25vw"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-6 py-5 text-[#2f2a26]">
        <div className="flex items-center gap-1 text-xs text-[#bb8b6d]">
          <Star className="h-3.5 w-3.5 fill-[#bb8b6d]" />
          <span>4.8</span>
        </div>
        <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
        <p className="text-sm text-[#5a524c]">{product.summary}</p>
        <div className="mt-auto flex flex-col gap-2">
          <Button
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
          >
            Ver detalhes
          </Button>
        </div>
      </div>
    </Link>
  );
}

function getProductImageSrc(image?: string) {
  if (!image) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  if (image.startsWith("http") || image.startsWith("/")) {
    return image;
  }

  return FALLBACK_PRODUCT_IMAGE;
}
