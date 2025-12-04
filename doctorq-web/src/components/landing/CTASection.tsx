"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ";

  return (
    <section className="relative overflow-hidden pt-20 pb-36">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600" />
      <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] bg-center opacity-10" />
      <div className="absolute top-10 left-10 z-0 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-20 right-10 z-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-10 left-1/2 z-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/10 backdrop-blur-lg rounded-3xl mb-8">
            <Sparkles className="h-16 w-16 text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Pronto para realçar
            <br />
            sua beleza natural?
          </h2>

          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já transformaram sua rotina de cuidados com {appName}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/busca"
              className="inline-flex items-center px-8 py-6 bg-white text-blue-600 hover:bg-blue-50 text-lg font-semibold rounded-full shadow-xl hover:scale-105 transition-all"
            >
              Encontrar Profissionais
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/parceiros"
              className="inline-flex items-center px-8 py-6 border-2 border-white bg-white text-purple-700 hover:bg-white/90 hover:text-purple-800 text-lg font-semibold rounded-full shadow-xl"
            >
              Sou Profissional
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white font-medium">Cadastro gratuito</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white font-medium">Sem taxas ocultas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white font-medium">Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 -mb-px z-10 pointer-events-none">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
