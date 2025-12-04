"use client";

import { BookOpen, Calendar, User, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "Os 10 Procedimentos Estéticos Mais Procurados em 2025",
      excerpt: "Descubra quais são os tratamentos que estão em alta e por que eles fazem tanto sucesso.",
      author: "Dra. Maria Silva",
      date: "25 de Outubro de 2025",
      category: "Tendências",
      image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=500&fit=crop"
    },
    {
      id: 2,
      title: "Como Escolher a Clínica de Estética Ideal",
      excerpt: "Guia completo com dicas essenciais para encontrar o melhor profissional para você.",
      author: "Dr. João Santos",
      date: "20 de Outubro de 2025",
      category: "Guias",
      image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=500&fit=crop"
    },
    {
      id: 3,
      title: "Cuidados Pós-Procedimento: Tudo que Você Precisa Saber",
      excerpt: "Saiba como cuidar da sua pele após procedimentos estéticos para resultados duradouros.",
      author: "Dra. Ana Costa",
      date: "15 de Outubro de 2025",
      category: "Cuidados",
      image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=500&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-12 w-12 text-white" />
            <h1 className="text-5xl font-bold text-white">
              Blog DoctorQ
            </h1>
          </div>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Dicas, novidades e informações sobre estética e bem-estar
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {post.category}
                  </span>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                  Ler mais
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Message */}
        <div className="mt-16 text-center">
          <Card className="border-2 border-purple-200 shadow-xl max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                Em Breve: Mais Conteúdo!
              </h2>
              <p className="text-gray-600 mb-6">
                Estamos preparando muito conteúdo incrível para você. Cadastre-se para
                receber notificações quando publicarmos novos artigos.
              </p>
              <Link href="/cadastro">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                  Cadastrar-se
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
