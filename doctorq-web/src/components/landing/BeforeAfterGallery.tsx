"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Eye } from "lucide-react";
import Link from "next/link";

const GALLERY_ITEMS = [
  {
    id: 1,
    procedure: "Harmonização Facial",
    beforeImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=60",
    afterImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=60",
    professional: "Dra. Ana Silva",
    location: "São Paulo, SP",
  },
  {
    id: 2,
    procedure: "Preenchimento Labial",
    beforeImage: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=60",
    afterImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=60",
    professional: "Dr. Ricardo Mendes",
    location: "Rio de Janeiro, RJ",
  },
  {
    id: 3,
    procedure: "Botox",
    beforeImage: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&q=60",
    afterImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=60",
    professional: "Dra. Fernanda Costa",
    location: "Belo Horizonte, MG",
  },
  {
    id: 4,
    procedure: "Peeling Químico",
    beforeImage: "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=400&q=60",
    afterImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=60",
    professional: "Dr. Lucas Oliveira",
    location: "Curitiba, PR",
  },
];

function BeforeAfterCard({ item }: { item: typeof GALLERY_ITEMS[0] }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* Comparação de imagens */}
      <div
        className="relative aspect-[4/5] cursor-col-resize select-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => {
          if (isDragging) {
            handleMove(e.clientX, e.currentTarget.getBoundingClientRect());
          }
        }}
        onTouchMove={(e) => {
          handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
        }}
      >
        {/* Imagem Depois (fundo) */}
        <Image
          src={item.afterImage}
          alt={`${item.procedure} - Depois`}
          fill
          loading="lazy"
          className="object-cover"
        />

        {/* Imagem Antes (com clip) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image
            src={item.beforeImage}
            alt={`${item.procedure} - Antes`}
            fill
            loading="lazy"
            className="object-cover"
          />
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="flex items-center gap-1">
              <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-400" />
              <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-400" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full">
          <span className="text-xs font-semibold text-white">ANTES</span>
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full">
          <span className="text-xs font-semibold text-gray-900">DEPOIS</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.procedure}</h3>
        <p className="text-sm text-gray-600">{item.professional}</p>
        <p className="text-xs text-gray-500">{item.location}</p>
      </div>
    </div>
  );
}

export function BeforeAfterGallery() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="px-8 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4">
            <Eye className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Resultados Reais</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-wide mb-4">
            Antes & Depois
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Veja transformações reais de pacientes que confiaram nos profissionais da nossa plataforma
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GALLERY_ITEMS.map((item) => (
            <BeforeAfterCard key={item.id} item={item} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/busca"
            className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
          >
            Ver mais resultados
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
