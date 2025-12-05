"use client";

import Link from "next/link";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Ana Paula Silva",
    role: "Cliente",
    content: "Encontrei a clínica perfeita para fazer minha limpeza de pele mensal. O sistema de agendamento é super fácil e prático!",
    rating: 5,
    initials: "AS",
    color: "bg-blue-500",
  },
  {
    name: "Mariana Costa",
    role: "Cliente",
    content: "Adorei poder comparar preços e ver as avaliações de outros clientes antes de escolher onde fazer meu procedimento. Muito confiável!",
    rating: 5,
    initials: "MC",
    color: "bg-purple-500",
  },
  {
    name: "Juliana Santos",
    role: "Cliente",
    content: "Plataforma incrível! Consegui agendar minha harmonização facial com uma profissional excelente. Super recomendo!",
    rating: 5,
    initials: "JS",
    color: "bg-rose-500",
  },
  {
    name: "Dr. Carlos Mendes",
    role: "Dermatologista",
    content: "Como profissional, a plataforma me ajudou a organizar minha agenda e alcançar muito mais clientes. Excelente ferramenta!",
    rating: 5,
    initials: "CM",
    color: "bg-violet-500",
  },
  {
    name: "Camila Rodrigues",
    role: "Cliente",
    content: "Fiz meu preenchimento labial e ficou perfeito! A plataforma me ajudou a encontrar uma profissional de confiança perto de mim.",
    rating: 5,
    initials: "CR",
    color: "bg-fuchsia-500",
  },
  {
    name: "Patricia Lima",
    role: "Gestora de Clínica",
    content: "Nossa clínica aumentou em 40% o número de agendamentos após nos cadastrarmos. Ferramenta essencial para qualquer clínica de saúde!",
    rating: 5,
    initials: "PL",
    color: "bg-blue-600",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              O Que Dizem Nossos Clientes
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Milhares de pessoas já transformaram sua beleza conosco
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group"
            >
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                {/* Quote icon */}
                <div className="mb-6">
                  <Quote className="h-10 w-10 text-blue-400 opacity-50" />
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-6 flex-grow leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Rating */}
                <div className="flex mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center">
                  <Avatar className={`${testimonial.color} mr-4`}>
                    <AvatarFallback className="text-white font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Junte-se a milhares de pessoas satisfeitas
          </p>
          <Button
            asChild
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-full hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-pink-500/50 transition-all hover:scale-105"
          >
            <Link href="/cadastro">
              Comece Agora
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
