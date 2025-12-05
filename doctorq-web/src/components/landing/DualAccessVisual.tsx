"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Building2, ArrowRight, Heart, Calendar, Star, TrendingUp, Users, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DualAccessVisual() {
  return (
    <section className="relative px-8 lg:px-16 py-20">
      {/* Título da Seção */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-100 to-purple-100 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-semibold text-gray-700">Comece Sua Jornada</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-wide mb-4">
          Escolha o Seu Caminho
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Seja você cliente em busca do tratamento perfeito ou profissional querendo expandir sua carreira
        </p>
      </div>

      <div className="grid md:grid-cols-2 min-h-[600px] rounded-2xl overflow-hidden shadow-2xl">
        {/* Para Clientes */}
        <div id="para-voce" className="relative group overflow-hidden">
          {/* Background image */}
          <Image
            src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=60"
            alt="Para você"
            fill
            loading="lazy"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-600/90 to-purple-700/90" />

          {/* Conteúdo */}
          <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 lg:p-16">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <Heart className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Para Você</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Encontre o profissional ideal
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Busque, compare e agende com os melhores especialistas em saúde perto de você
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90">Busca inteligente com IA</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90">Agendamento online 24h</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90">Avaliações verificadas</span>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-white text-rose-600 hover:bg-gray-100 rounded-full px-8 group/btn"
              >
                <Link href="/busca">
                  Buscar Profissionais
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Para Profissionais */}
        <div id="para-parceiros" className="relative group overflow-hidden">
          {/* Background image */}
          <Image
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=60"
            alt="Para profissionais"
            fill
            loading="lazy"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-700/90" />

          {/* Conteúdo */}
          <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 lg:p-16">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <Building2 className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Para Profissionais</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Cresça seu negócio
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Aumente sua visibilidade, gerencie agendamentos e fidelize seus pacientes
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90">Aumente sua visibilidade</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90">Gestão completa de pacientes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90">Relatórios e analytics</span>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-8 group/btn"
              >
                <Link href="/parceiros">
                  Cadastre-se Grátis
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
