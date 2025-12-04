"use client";

import Link from "next/link";
import Image from "next/image";
import { Briefcase, FileText, Users, TrendingUp, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURED_JOBS = [
  {
    id: 1,
    title: "Esteticista",
    company: "Clínica Premium Beauty",
    location: "São Paulo, SP",
    type: "CLT",
    salary: "R$ 4.000 - R$ 6.000",
  },
  {
    id: 2,
    title: "Dermatologista",
    company: "Centro Estético Excellence",
    location: "Rio de Janeiro, RJ",
    type: "PJ",
    salary: "R$ 15.000 - R$ 25.000",
  },
  {
    id: 3,
    title: "Biomédica Esteta",
    company: "Espaço Harmonia",
    location: "Belo Horizonte, MG",
    type: "CLT",
    salary: "R$ 5.000 - R$ 8.000",
  },
];

export function CareersPreview() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="px-8 lg:px-16">
        {/* Título da Seção - Centralizado */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Comece Sua Jornada</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-wide mb-4">
            Escolha o Seu Caminho
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Seja você cliente em busca do tratamento perfeito ou profissional querendo expandir sua carreira
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Imagem e stats */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=60"
                alt="Profissionais de estética"
                width={600}
                height={500}
                loading="lazy"
                className="object-cover w-full h-[500px]"
              />
              {/* Overlay gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent" />

              {/* Stats card flutuante */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">120+</div>
                    <div className="text-sm text-gray-600">Vagas Abertas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">500+</div>
                    <div className="text-sm text-gray-600">Currículos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">85%</div>
                    <div className="text-sm text-gray-600">Taxa de Match</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Conteúdo */}
          <div className="space-y-8">
            {/* Vagas em destaque */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Vagas em Destaque
              </h3>
              {FEATURED_JOBS.map((job) => (
                <Link
                  key={job.id}
                  href="/carreiras/vagas"
                  className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h4>
                    <p className="text-sm text-gray-600">{job.company}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-emerald-600">{job.salary}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors ml-auto mt-1" />
                  </div>
                </Link>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-8"
              >
                <Link href="/carreiras/vagas">
                  <Briefcase className="mr-2 w-4 h-4" />
                  Ver Todas as Vagas
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-blue-400 rounded-full px-8"
              >
                <Link href="/carreiras/cadastro-curriculo">
                  <FileText className="mr-2 w-4 h-4" />
                  Cadastrar Currículo
                </Link>
              </Button>
            </div>

            {/* Info adicional */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  <strong className="text-gray-900">200+</strong> empresas parceiras
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  <strong className="text-gray-900">15</strong> novas vagas/dia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
