"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, MapPin, Sparkles, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthAccessModal } from "@/components/auth/AuthAccessModal";

// Imagens de alta qualidade para o carrossel (substituir por URLs reais)
const HERO_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1920&q=80",
    title: "Harmonização Facial",
    subtitle: "Realce sua beleza natural",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1920&q=80",
    title: "Tratamentos Faciais",
    subtitle: "Pele radiante e saudável",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1920&q=80",
    title: "Spa & Bem-estar",
    subtitle: "Relaxe e rejuvenesça",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1920&q=80",
    title: "Procedimentos Estéticos",
    subtitle: "Tecnologia de ponta",
  },
];

export function VisualHeroSection() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play do carrossel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("local", location);
    router.push(`/busca?${params.toString()}`);
  };

  const handleBuscaInteligente = () => {
    if (status === "authenticated") {
      router.push("/paciente/busca-inteligente");
    } else {
      setShowAuthDialog(true);
    }
  };

  return (
    <section className="relative h-screen min-h-[700px] overflow-hidden">
      {/* Carrossel de imagens de fundo */}
      <div className="absolute inset-0">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </div>
        ))}
      </div>

      {/* Controles do carrossel */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false);
              setCurrentSlide(index);
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container px-4">
          <div className="max-w-3xl">
            {/* Badge animado */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-white">
                +10.000 profissionais verificados
              </span>
            </div>

            {/* Título dinâmico baseado no slide */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
              {HERO_SLIDES[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              {HERO_SLIDES[currentSlide].subtitle}
            </p>

            {/* Barra de busca glassmorphism */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-white/20 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Botox, Harmonização, Peeling..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 h-14 bg-white/90 border-0 text-gray-900 placeholder:text-gray-500 rounded-xl"
                  />
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Cidade ou bairro"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 h-14 bg-white/90 border-0 text-gray-900 placeholder:text-gray-500 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white rounded-xl"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={handleBuscaInteligente}
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 h-12"
              >
                <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                Busca Inteligente com IA
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/50 text-white hover:bg-white/10 rounded-full px-8 h-12"
                asChild
              >
                <Link href="/registro?tipo=profissional">
                  Sou Profissional
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats flutuantes no canto inferior direito */}
      <div className="absolute bottom-20 right-8 z-10 hidden lg:block">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white">1.000+</div>
              <div className="text-sm text-white/70">Clínicas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-sm text-white/70">Pacientes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm text-white/70">Satisfação</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de autenticação */}
      <AuthAccessModal
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        initialMode="login"
        onSuccess={() => {
          setShowAuthDialog(false);
          router.push("/paciente/busca-inteligente");
        }}
      />
    </section>
  );
}
