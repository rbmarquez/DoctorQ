"use client";

import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  BookOpen,
  Headphones,
  Play,
  Users,
  Award,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/constants/images";

export function UniversidadeSection() {
  const courses = [
    {
      title: "Harmonização Facial Avançada",
      instructor: "Dra. Mariana Costa",
      duration: "8 horas",
      students: "2.345",
      rating: "4.9",
      price: "R$ 497",
      image: IMAGES.cursos.placeholder,
      bgGradient: "bg-gradient-to-br from-rose-400 to-blue-600"
    },
    {
      title: "Técnicas de Preenchimento",
      instructor: "Dr. Ricardo Almeida",
      duration: "6 horas",
      students: "1.892",
      rating: "4.8",
      price: "R$ 397",
      image: IMAGES.cursos.placeholder,
      bgGradient: "bg-gradient-to-br from-purple-400 to-indigo-600"
    },
    {
      title: "Bioestimuladores de Colágeno",
      instructor: "Dra. Ana Beatriz",
      duration: "5 horas",
      students: "1.567",
      rating: "4.9",
      price: "R$ 347",
      image: IMAGES.cursos.placeholder,
      bgGradient: "bg-gradient-to-br from-blue-400 to-cyan-600"
    }
  ];

  const ebooks = [
    {
      title: "Manual Completo de Estética Facial",
      pages: "320 páginas",
      downloads: "5.432",
      price: "R$ 97"
    },
    {
      title: "Protocolos de Skincare Profissional",
      pages: "180 páginas",
      downloads: "3.891",
      price: "R$ 67"
    },
    {
      title: "Marketing para Clínicas de Estética",
      pages: "250 páginas",
      downloads: "4.234",
      price: "R$ 87"
    }
  ];

  const podcasts = [
    {
      title: "O Futuro da Estética com IA",
      duration: "45 min",
      guest: "Dr. Felipe Santos",
      episode: "EP 127"
    },
    {
      title: "Bioestimuladores: Ciência e Prática",
      duration: "38 min",
      guest: "Dra. Luciana Moraes",
      episode: "EP 126"
    },
    {
      title: "Como Conquistar Pacientes na Era Digital",
      duration: "52 min",
      guest: "Paula Mendes (Marketing)",
      episode: "EP 125"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-100 to-purple-100 rounded-full mb-6">
            <GraduationCap className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-semibold text-gray-700">
              Educação Continuada
            </span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Universidade
            </span>{" "}
            da Beleza
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Aprenda com os maiores especialistas do mercado. Cursos, ebooks e podcast
            exclusivos para elevar sua carreira na estética.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 max-w-5xl mx-auto">
          {[
            { icon: Users, value: "15.000+", label: "Alunos" },
            { icon: BookOpen, value: "120+", label: "Cursos" },
            { icon: Award, value: "98%", label: "Satisfação" },
            { icon: TrendingUp, value: "50K+", label: "Certificados" }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow"
            >
              <stat.icon className="w-8 h-8 text-rose-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* TAB 1: Cursos Online */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Cursos Online</h3>
                <p className="text-gray-600">Certificação reconhecida pela SBME</p>
              </div>
            </div>

            <Button variant="ghost" className="text-rose-600 hover:text-rose-700" asChild>
              <Link href="/universidade/cursos">
                Ver Todos os Cursos
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Course Thumbnail */}
                <div className="h-48 relative overflow-hidden">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 ${course.bgGradient}`} />

                  {/* Course image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src={course.image}
                      alt={course.title}
                      width={400}
                      height={300}
                      className="object-contain opacity-80 group-hover:opacity-100 transition-opacity p-8"
                    />
                  </div>

                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-900">
                      Bestseller
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                      <Play className="w-8 h-8 text-rose-600 ml-1" />
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h4>

                  <p className="text-sm text-gray-600 mb-4">{course.instructor}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-2xl font-bold text-gray-900">{course.price}</span>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
                      asChild
                    >
                      <Link href={`/universidade/cursos/${idx + 1}`}>
                        Inscrever-se
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAB 2: Ebooks */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Ebooks Exclusivos</h3>
                <p className="text-gray-600">Conhecimento condensado por especialistas</p>
              </div>
            </div>

            <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700" asChild>
              <Link href="/universidade/ebooks">
                Ver Todos os Ebooks
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ebooks.map((ebook, idx) => (
              <div
                key={idx}
                className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-indigo-600" />
                </div>

                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {ebook.title}
                </h4>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {ebook.pages}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    {ebook.downloads} downloads
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xl font-bold text-gray-900">{ebook.price}</span>
                  <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                    Comprar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAB 3: Podcast */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Podcast DoctorQ</h3>
                <p className="text-gray-600">Conversas com os maiores nomes da estética</p>
              </div>
            </div>

            <Button variant="ghost" className="text-purple-600 hover:text-purple-700" asChild>
              <Link href="/universidade/podcast">
                Ver Todos os Episódios
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {podcasts.map((podcast, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-purple-300 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {podcast.episode}
                  </span>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </div>
                </div>

                <h4 className="text-lg font-bold text-gray-900 mb-3">
                  {podcast.title}
                </h4>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {podcast.guest}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {podcast.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 rounded-3xl p-12 shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-4">
            Comece Sua Jornada de Aprendizado Hoje
          </h3>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Acesso ilimitado a todos os cursos, ebooks e episódios do podcast por apenas R$ 97/mês
          </p>
          <Button
            size="lg"
            className="bg-white text-rose-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
            asChild
          >
            <Link href="/universidade/assinar">
              Assinar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
