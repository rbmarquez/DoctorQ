"use client";

import Link from "next/link";
import { Search, Calendar, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Busque",
    description: "Encontre clínicas e profissionais perto de você",
    icon: Search,
    color: "from-blue-500 to-rose-500",
  },
  {
    number: "02",
    title: "Compare",
    description: "Veja avaliações, fotos e preços",
    icon: Sparkles,
    color: "from-purple-500 to-blue-500",
  },
  {
    number: "03",
    title: "Agende",
    description: "Marque sua consulta de forma rápida e fácil",
    icon: Calendar,
    color: "from-violet-500 to-purple-500",
  },
  {
    number: "04",
    title: "Realize",
    description: "Apareça e aproveite seu tratamento",
    icon: CheckCircle,
    color: "from-fuchsia-500 to-blue-500",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Como Funciona
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Apenas 4 passos simples para cuidar da sua beleza
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Linha conectando os passos (desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Círculo do número */}
                <div className="flex flex-col items-center text-center">
                  <div className={`relative mb-6 w-24 h-24 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-xl z-10`}>
                    <Icon className="h-10 w-10 text-white" />
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-200">
                      <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl p-8 shadow-xl border border-blue-100">
            <div className="flex-1 text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Pronto para começar?
              </h3>
              <p className="text-gray-600">
                Crie sua conta gratuitamente e agende seu primeiro procedimento
              </p>
            </div>
            <Button
              asChild
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-full hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-pink-500/50 transition-all hover:scale-105 whitespace-nowrap"
            >
              <Link href="/cadastro">Criar Conta Grátis</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
