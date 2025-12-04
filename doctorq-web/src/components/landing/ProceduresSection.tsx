"use client";

import { Sparkles, Heart, Droplets, Sun, Flower2, Smile, Zap, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const procedures = [
  {
    name: "Limpeza de Pele",
    icon: Sparkles,
    description: "Remoção profunda de impurezas",
    color: "from-blue-500 to-rose-500",
    bgColor: "bg-blue-50",
  },
  {
    name: "Botox",
    icon: Star,
    description: "Redução de rugas e linhas de expressão",
    color: "from-purple-500 to-blue-500",
    bgColor: "bg-purple-50",
  },
  {
    name: "Preenchimento",
    icon: Heart,
    description: "Harmonização facial e aumento de volume",
    color: "from-rose-500 to-blue-500",
    bgColor: "bg-rose-50",
  },
  {
    name: "Microagulhamento",
    icon: Zap,
    description: "Rejuvenescimento e renovação celular",
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50",
  },
  {
    name: "Peeling",
    icon: Sun,
    description: "Renovação da pele e textura",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
  },
  {
    name: "Massagem Facial",
    icon: Flower2,
    description: "Relaxamento e drenagem linfática",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
  },
  {
    name: "Depilação a Laser",
    icon: Droplets,
    description: "Remoção permanente de pelos",
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-50",
  },
  {
    name: "Harmonização",
    icon: Smile,
    description: "Equilíbrio e proporção facial",
    color: "from-fuchsia-500 to-blue-500",
    bgColor: "bg-fuchsia-50",
  },
];

export function ProceduresSection() {
  return (
    <section id="procedimentos" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Procedimentos
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra os tratamentos mais procurados e agende com os melhores profissionais
          </p>
        </div>

        {/* Grid de procedimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {procedures.map((procedure, index) => {
            const Icon = procedure.icon;
            return (
              <Link
                key={index}
                href="/procedimentos"
                className="group cursor-pointer"
              >
                <div className={`${procedure.bgColor} rounded-2xl p-6 border border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300 h-full`}>
                  {/* Ícone */}
                  <div className="mb-4">
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${procedure.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {procedure.name}
                  </h3>
                  <p className="text-gray-700 text-sm font-medium">
                    {procedure.description}
                  </p>

                  {/* Arrow */}
                  <div className="mt-4 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium">Ver mais</span>
                    <svg
                      className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            asChild
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-full hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-pink-500/50 transition-all hover:scale-105"
          >
            <Link href="/procedimentos">
              Ver Todos os Procedimentos
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
