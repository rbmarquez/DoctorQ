"use client";

import Link from "next/link";
import Image from "next/image";
import { GraduationCap, BookOpen, Mic, Calendar, ArrowRight, Play, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const UNIVERSITY_ITEMS = [
  {
    id: "cursos",
    title: "Cursos",
    description: "Aprenda com os melhores profissionais do mercado",
    count: "+50 cursos",
    icon: GraduationCap,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=60",
    href: "/universidade/cursos",
    color: "from-rose-500 to-blue-600",
  },
  {
    id: "ebooks",
    title: "E-books",
    description: "Materiais exclusivos para download",
    count: "+20 e-books",
    icon: BookOpen,
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=60",
    href: "/universidade/ebooks",
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "podcast",
    title: "Podcast",
    description: "Episódios com especialistas renomados",
    count: "+100 episódios",
    icon: Mic,
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=60",
    href: "/universidade/podcast",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "eventos",
    title: "Eventos",
    description: "Workshops e congressos ao vivo",
    count: "Próximo: 15 Dez",
    icon: Calendar,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=60",
    href: "/universidade/eventos",
    color: "from-emerald-500 to-teal-600",
  },
];

export function UniversityPreview() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900 relative overflow-hidden">
      {/* Header - Acima do background decorativo */}
      <div className="px-8 lg:px-16 relative z-20 mb-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-4">
            <Activity className="w-4 h-4 text-blue-300" />
            <span className="text-sm font-semibold text-white">Educação em Saúde</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-white tracking-wide mb-4">
            Centro Universitário Saúde+
          </h2>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
            Desenvolva sua carreira na área da saúde com conteúdos exclusivos dos melhores profissionais
          </p>
        </div>
      </div>

      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
      </div>

      <div className="px-8 lg:px-16 relative z-10">
        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {UNIVERSITY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Imagem */}
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${item.color} opacity-60`} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-blue-300" />
                    <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                      {item.count}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-blue-200/80">
                    {item.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-900 hover:bg-blue-100 rounded-full px-8"
          >
            <Link href="/universidade">
              Explorar Centro Universitário
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
