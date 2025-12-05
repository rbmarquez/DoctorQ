"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PremiumHeroSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,207,232,0.3),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(233,213,255,0.3),transparent_50%)]" />

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-rose-300/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-rose-200 shadow-lg">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-gray-700">
                O futuro da saúde é inteligente
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Transforme
                </span>
                <br />
                <span className="text-gray-900">
                  Sua Beleza
                </span>
                <br />
                <span className="text-gray-700">
                  Com Inteligência
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A plataforma mais completa para conectar você aos melhores profissionais
                de saúde. Agendamento inteligente, IA personalizada e resultado garantido.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-6 rounded-full group"
                asChild
              >
                <Link href="/registro">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-rose-400 hover:bg-rose-50 text-gray-700 text-lg px-8 py-6 rounded-full transition-all duration-300"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="mr-2 w-5 h-5" />
                Ver Como Funciona
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>1.000+ Clínicas Parceiras</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>50.000+ Pacientes Atendidos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>98% Satisfação</span>
              </div>
            </div>
          </div>

          {/* Right Content - Video */}
          <div className="relative">
            <div className="relative aspect-[9/16] lg:aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm">
              {!isVideoPlaying ? (
                // Video Thumbnail
                <div
                  className="absolute inset-0 bg-gradient-to-br from-rose-500 via-purple-500 to-indigo-600 cursor-pointer group"
                  onClick={() => setIsVideoPlaying(true)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                      <Play className="w-10 h-10 text-rose-600 ml-1" />
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />

                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                      <p className="text-white font-semibold text-lg mb-2">
                        Descubra o DoctorQ
                      </p>
                      <p className="text-white/90 text-sm">
                        Veja como nossa plataforma revoluciona o mercado de saúde
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Embedded Video (Placeholder - substituir URL)
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="DoctorQ Platform Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Floating Cards */}
            <div className="hidden lg:block absolute -left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-float" style={{ animationDelay: "0s" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full" />
                <div>
                  <p className="font-semibold text-sm">Dra. Ana Silva</p>
                  <p className="text-xs text-gray-500">★★★★★ (248 avaliações)</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -right-8 bottom-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-float" style={{ animationDelay: "2s" }}>
              <p className="text-sm font-semibold text-gray-900">Agendamento confirmado! ✓</p>
              <p className="text-xs text-gray-500 mt-1">Terça, 15h00 - Harmonização</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-gray-400 rounded-full" />
        </div>
      </div>
    </section>
  );
}
