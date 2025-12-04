"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, ChevronLeft, ChevronRight, BadgeCheck, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dados de exemplo (em produção, viriam da API)
const FEATURED_PROFESSIONALS = [
  {
    id: "1",
    name: "Dra. Ana Carolina Silva",
    specialty: "Dermatologista",
    subspecialty: "Harmonização Facial",
    rating: 4.9,
    reviews: 247,
    location: "São Paulo, SP",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=60",
    verified: true,
    nextAvailable: "Hoje",
  },
  {
    id: "2",
    name: "Dr. Ricardo Mendes",
    specialty: "Cirurgião Plástico",
    subspecialty: "Estética Facial",
    rating: 4.8,
    reviews: 189,
    location: "Rio de Janeiro, RJ",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=60",
    verified: true,
    nextAvailable: "Amanhã",
  },
  {
    id: "3",
    name: "Dra. Fernanda Costa",
    specialty: "Esteticista",
    subspecialty: "Tratamentos a Laser",
    rating: 5.0,
    reviews: 156,
    location: "Belo Horizonte, MG",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=60",
    verified: true,
    nextAvailable: "Hoje",
  },
  {
    id: "4",
    name: "Dr. Lucas Oliveira",
    specialty: "Dermatologista",
    subspecialty: "Peeling e Bioestimuladores",
    rating: 4.7,
    reviews: 203,
    location: "Curitiba, PR",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=60",
    verified: true,
    nextAvailable: "Sexta",
  },
  {
    id: "5",
    name: "Dra. Juliana Santos",
    specialty: "Biomédica Esteta",
    subspecialty: "Preenchimento Labial",
    rating: 4.9,
    reviews: 312,
    location: "Brasília, DF",
    image: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=60",
    verified: true,
    nextAvailable: "Hoje",
  },
  {
    id: "6",
    name: "Dr. Pedro Almeida",
    specialty: "Cirurgião Dentista",
    subspecialty: "Harmonização Orofacial",
    rating: 4.8,
    reviews: 178,
    location: "Salvador, BA",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=60",
    verified: true,
    nextAvailable: "Amanhã",
  },
];

export function FeaturedProfessionals() {
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
    <section className="py-20 bg-gray-50 overflow-hidden">
      {/* Header da Seção - Centralizado */}
      <div className="text-center mb-12 px-8 lg:px-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
          <Users className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Especialistas</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-wide mb-4">
          Profissionais em Destaque
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Os mais bem avaliados da plataforma
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
        {FEATURED_PROFESSIONALS.map((professional) => (
          <Link
            key={professional.id}
            href={`/busca?q=${encodeURIComponent(professional.specialty)}`}
            className="group flex-shrink-0 w-[300px] md:w-[340px] lg:w-[380px]"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Card com imagem */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={professional.image}
                alt={professional.name}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 300px, (max-width: 1024px) 340px, 380px"
              />
              {/* Overlay no hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

              {/* Badges */}
              {professional.verified && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
                  <BadgeCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-800">Verificado</span>
                </div>
              )}
              {professional.nextAvailable === "Hoje" && (
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-green-500 rounded-full shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-semibold text-white">Agenda hoje</span>
                </div>
              )}
            </div>

            {/* Conteúdo abaixo da imagem */}
            <div className="mt-5">
              <h3 className="text-xl font-medium text-gray-900 tracking-wide group-hover:text-rose-600 transition-colors duration-300">
                {professional.name}
              </h3>
              <p className="text-gray-600 mt-1">{professional.specialty}</p>
              <p className="text-sm text-purple-600 font-medium mt-0.5">{professional.subspecialty}</p>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold text-gray-900">{professional.rating}</span>
                  <span className="text-sm text-gray-500">({professional.reviews})</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{professional.location}</span>
                </div>
              </div>
            </div>
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

      {/* CTA */}
      <div className="text-center mt-12 px-8">
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white rounded-full px-10 py-6 text-base"
        >
          <Link href="/busca">
            Ver todos os profissionais
          </Link>
        </Button>
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
