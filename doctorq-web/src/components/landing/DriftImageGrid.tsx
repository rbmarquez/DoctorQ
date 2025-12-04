"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";

// Procedimentos com imagens de alta qualidade
const PROCEDURES = [
  {
    id: "harmonizacao",
    title: "Harmonização Facial",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=60",
    href: "/busca?q=harmonizacao",
  },
  {
    id: "botox",
    title: "Botox",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=60",
    href: "/busca?q=botox",
  },
  {
    id: "preenchimento",
    title: "Preenchimento Labial",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=60",
    href: "/busca?q=preenchimento",
  },
  {
    id: "skincare",
    title: "Skincare Avançado",
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=60",
    href: "/busca?q=skincare",
  },
  {
    id: "laser",
    title: "Tratamentos a Laser",
    image: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=600&q=60",
    href: "/busca?q=laser",
  },
  {
    id: "corporal",
    title: "Fisioterapia",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=60",
    href: "/busca?q=fisioterapia",
  },
  {
    id: "peeling",
    title: "Peeling Químico",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=60",
    href: "/busca?q=peeling",
  },
  {
    id: "lifting",
    title: "Lifting Facial",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=60",
    href: "/busca?q=lifting",
  },
  {
    id: "microagulhamento",
    title: "Microagulhamento",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=60",
    href: "/busca?q=microagulhamento",
  },
  {
    id: "bioestimuladores",
    title: "Bioestimuladores",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=60",
    href: "/busca?q=bioestimuladores",
  },
  {
    id: "depilacao",
    title: "Depilação a Laser",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=60",
    href: "/busca?q=depilacao",
  },
  {
    id: "limpeza",
    title: "Limpeza de Pele",
    image: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=60",
    href: "/busca?q=limpeza",
  },
];

export function DriftImageGrid() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Verificar estado de scroll
  const checkScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Scroll suave para navegação
  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollState);
      checkScrollState();
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", checkScrollState);
      }
    };
  }, [checkScrollState]);

  // Intersection Observer para animação de entrada
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (scrollRef.current) {
      observer.observe(scrollRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 bg-white overflow-hidden">
      {/* Header da Seção - Centralizado */}
      <div className="text-center mb-12 px-8 lg:px-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-4">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-blue-700">Tratamentos</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-wide mb-4">
          Procedimentos em Alta
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Descubra os tratamentos mais procurados na plataforma
        </p>
      </div>

      {/* Botões de navegação */}
      <div className="flex justify-end mb-6 px-8 lg:px-16">
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`p-3 rounded-full border-2 transition-all duration-300 ${
              canScrollLeft
                ? "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                : "border-gray-200 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`p-3 rounded-full border-2 transition-all duration-300 ${
              canScrollRight
                ? "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                : "border-gray-200 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carrossel horizontal */}
      <div
        ref={scrollRef}
        className={`flex gap-6 overflow-x-auto scrollbar-hide px-8 lg:px-16 pb-4 transition-opacity duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {PROCEDURES.map((procedure) => (
          <Link
            key={procedure.id}
            href={procedure.href}
            className="group flex-shrink-0 w-[280px] md:w-[350px] lg:w-[400px]"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Card com imagem */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={procedure.image}
                alt={procedure.title}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 280px, (max-width: 1024px) 350px, 400px"
              />
              {/* Overlay no hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
            </div>

            {/* Título abaixo da imagem */}
            <h3 className="mt-4 text-lg md:text-xl font-light text-gray-900 tracking-wide group-hover:text-blue-600 transition-colors duration-300">
              {procedure.title}
            </h3>
          </Link>
        ))}
      </div>

      {/* Indicadores de scroll para mobile */}
      <div className="flex md:hidden justify-center mt-6 gap-2">
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`p-2 rounded-full transition-all ${
            canScrollLeft ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-400"
          }`}
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`p-2 rounded-full transition-all ${
            canScrollRight ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-400"
          }`}
          aria-label="Próximo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* CSS para esconder scrollbar */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
