"use client";

import { Book, User, Calendar, CreditCard, ShoppingCart, Settings, HelpCircle, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

const categorias = [
  {
    id: "primeiros-passos",
    titulo: "Primeiros Passos",
    descricao: "Comece a usar a plataforma com nossos guias iniciais",
    icon: Book,
    artigos: 12,
    cor: "blue",
  },
  {
    id: "conta-perfil",
    titulo: "Conta e Perfil",
    descricao: "Gerencie sua conta, perfil e configurações pessoais",
    icon: User,
    artigos: 18,
    cor: "purple",
  },
  {
    id: "agendamentos",
    titulo: "Agendamentos",
    descricao: "Agende, cancele e gerencie suas consultas",
    icon: Calendar,
    artigos: 24,
    cor: "green",
  },
  {
    id: "pagamentos",
    titulo: "Pagamentos e Faturas",
    descricao: "Informações sobre pagamentos, faturas e reembolsos",
    icon: CreditCard,
    artigos: 15,
    cor: "orange",
  },
  {
    id: "marketplace",
    titulo: "Marketplace",
    descricao: "Compre produtos e acompanhe seus pedidos",
    icon: ShoppingCart,
    artigos: 20,
    cor: "pink",
  },
  {
    id: "configuracoes",
    titulo: "Configurações",
    descricao: "Personalize sua experiência na plataforma",
    icon: Settings,
    artigos: 16,
    cor: "gray",
  },
  {
    id: "seguranca",
    titulo: "Segurança e Privacidade",
    descricao: "Proteção de dados, privacidade e segurança",
    icon: Shield,
    artigos: 14,
    cor: "red",
  },
  {
    id: "suporte",
    titulo: "Suporte Técnico",
    descricao: "Resolva problemas técnicos e bugs",
    icon: HelpCircle,
    artigos: 22,
    cor: "indigo",
  },
];

const getColorClasses = (cor: string) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    purple: "bg-purple-100 text-purple-600 border-purple-200",
    green: "bg-green-100 text-green-600 border-green-200",
    orange: "bg-orange-100 text-orange-600 border-orange-200",
    pink: "bg-blue-100 text-blue-600 border-blue-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    red: "bg-red-100 text-red-600 border-red-200",
    indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
  };
  return colors[cor as keyof typeof colors] || colors.blue;
};

export default function CategoriasAjudaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50 to-purple-50">
      <LandingNav />
      <main className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Central de Ajuda
          </h1>
          <p className="text-gray-600 text-lg">
            Explore nossas categorias de ajuda para encontrar as respostas que você precisa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorias.map((categoria) => {
            const Icon = categoria.icon;
            return (
              <Link key={categoria.id} href={`/ajuda/${categoria.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div
                      className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 border-2 ${getColorClasses(categoria.cor)}`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{categoria.titulo}</h3>
                    <p className="text-sm text-gray-600 mb-4">{categoria.descricao}</p>
                    <Badge variant="outline">{categoria.artigos} artigos</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6 text-center">
            <HelpCircle className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Não encontrou o que procurava?</h3>
            <p className="text-gray-600 mb-4">
              Nossa equipe de suporte está pronta para ajudar
            </p>
            <Link href="/suporte">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Falar com Suporte
              </button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
