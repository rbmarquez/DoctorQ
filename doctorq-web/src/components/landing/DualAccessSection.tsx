"use client";

import Link from "next/link";
import {
  Sparkles,
  Building2,
  Calendar,
  MessageCircle,
  Heart,
  TrendingUp,
  Users,
  ShoppingBag,
  ArrowRight,
  Star,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function DualAccessSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Escolha Sua Jornada
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Uma plataforma completa para pacientes e profissionais da estética
          </p>
        </div>

        {/* Video + Two Cards Layout */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-center">
          {/* Left: Video Demo */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black">
            <div className="relative w-full aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Como funciona o DoctorQ"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {/* Video overlay info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h3 className="text-white text-xl font-bold mb-1">Veja como funciona</h3>
              <p className="text-white/80 text-sm">Descubra a plataforma que está revolucionando a estética</p>
            </div>
          </div>

          {/* Right: Two Cards Stacked */}
          <div className="space-y-6">
          {/* CARD 1: Clientes/Pacientes (Compacto) */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-cyan-500 to-purple-600 p-1 shadow-xl hover:shadow-rose-500/50 transition-all duration-300 hover:scale-[1.02]">
            <div className="relative h-full bg-white rounded-xl p-6">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-50" />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                  {/* Icon Badge */}
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Sou Paciente
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Encontre profissionais, agende procedimentos e transforme sua aparência
                    </p>
                  </div>
                </div>

                {/* Features List (2 colunas) */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { icon: Calendar, text: "Agendamento IA" },
                    { icon: MessageCircle, text: "Chat 24/7" },
                    { icon: Star, text: "Avaliações" },
                    { icon: Heart, text: "Acompanhamento" },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-rose-100 rounded flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-3 h-3 text-rose-600" />
                      </div>
                      <span className="text-xs text-gray-700 font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all group/btn"
                  asChild
                >
                  <Link href="/registro?tipo=paciente">
                    Criar Minha Conta
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                {/* Trust Badge */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Zap className="w-3 h-3 text-rose-500" />
                  <span>Grátis • Sem cartão</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Parceiros/Profissionais (Compacto) */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-1 shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-[1.02]">
            <div className="relative h-full bg-white rounded-xl p-6">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-50" />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                  {/* Icon Badge */}
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Quero ser Parceiro
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Gerencie sua clínica, receba leads qualificados e aumente seu faturamento
                    </p>
                  </div>
                </div>

                {/* Features List (2 colunas) */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { icon: TrendingUp, text: "Leads com IA" },
                    { icon: Users, text: "Gestão completa" },
                    { icon: ShoppingBag, text: "Marketplace B2B" },
                    { icon: Calendar, text: "Agenda integrada" },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-3 h-3 text-indigo-600" />
                      </div>
                      <span className="text-xs text-gray-700 font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all group/btn"
                  asChild
                >
                  <Link href="/parceiros">
                    Quero ser Parceiro
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                {/* Trust Badge */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Zap className="w-3 h-3 text-indigo-600" />
                  <span>30 dias grátis • Cancele quando quiser</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            { value: "1.000+", label: "Clínicas Parceiras" },
            { value: "50K+", label: "Pacientes Ativos" },
            { value: "98%", label: "Satisfação" },
            { value: "500K+", label: "Procedimentos Agendados" },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-rose-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
