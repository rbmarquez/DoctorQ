"use client";

import Link from "next/link";
import Image from "next/image";
import { Syringe, Sparkles, Hand, Scissors, Smile, Zap, Heart, Leaf } from "lucide-react";

const CATEGORIES = [
  {
    id: "botox",
    name: "Botox",
    description: "Toxina botulínica",
    icon: Syringe,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=60",
    color: "from-rose-500 to-blue-600",
    searchTerm: "botox",
  },
  {
    id: "harmonizacao",
    name: "Harmonização",
    description: "Facial completa",
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=60",
    color: "from-purple-500 to-indigo-600",
    searchTerm: "harmonização facial",
  },
  {
    id: "preenchimento",
    name: "Preenchimento",
    description: "Ácido hialurônico",
    icon: Heart,
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&q=60",
    color: "from-blue-500 to-cyan-600",
    searchTerm: "preenchimento labial",
  },
  {
    id: "peeling",
    name: "Peeling",
    description: "Renovação celular",
    icon: Leaf,
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&q=60",
    color: "from-emerald-500 to-teal-600",
    searchTerm: "peeling",
  },
  {
    id: "laser",
    name: "Laser",
    description: "Alta tecnologia",
    icon: Zap,
    image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=60",
    color: "from-amber-500 to-orange-600",
    searchTerm: "laser",
  },
  {
    id: "limpeza",
    name: "Limpeza de Pele",
    description: "Cuidados faciais",
    icon: Hand,
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=60",
    color: "from-cyan-500 to-blue-600",
    searchTerm: "limpeza de pele",
  },
  {
    id: "depilacao",
    name: "Depilação",
    description: "Definitiva a laser",
    icon: Scissors,
    image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&q=60",
    color: "from-violet-500 to-purple-600",
    searchTerm: "depilação a laser",
  },
  {
    id: "estetica-dental",
    name: "Estética Dental",
    description: "Sorriso perfeito",
    icon: Smile,
    image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&q=60",
    color: "from-sky-500 to-cyan-600",
    searchTerm: "lentes de contato dental",
  },
];

export function CategoriesGrid() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Explore por Categoria
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encontre o procedimento ideal para você entre as categorias mais procuradas
          </p>
        </div>

        {/* Grid de categorias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                href={`/busca?q=${encodeURIComponent(category.searchTerm)}`}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Imagem de fundo */}
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay gradiente */}
                <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 group-hover:opacity-70 transition-opacity`} />

                {/* Conteúdo */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-white/90">
                    {category.description}
                  </p>
                </div>

                {/* Hover effect - seta */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/busca"
            className="inline-flex items-center gap-2 text-rose-600 font-semibold hover:text-rose-700 transition-colors"
          >
            Ver todos os procedimentos
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
