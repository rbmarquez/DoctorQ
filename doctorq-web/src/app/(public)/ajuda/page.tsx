"use client";

import { useState } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  User,
  Shield,
  Smartphone,
  Settings,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

interface HelpCategory {
  id: string;
  nome: string;
  descricao: string;
  icon: any;
  artigos: number;
  color: string;
}

interface HelpArticle {
  id: string;
  titulo: string;
  categoria: string;
  resumo: string;
  tempoLeitura: number;
  visualizacoes: number;
}

const categorias: HelpCategory[] = [
  {
    id: "primeiros-passos",
    nome: "Primeiros Passos",
    descricao: "Aprenda o básico para começar a usar a plataforma",
    icon: BookOpen,
    artigos: 12,
    color: "blue",
  },
  {
    id: "conta-perfil",
    nome: "Conta e Perfil",
    descricao: "Gerenciar sua conta, senha e informações pessoais",
    icon: User,
    artigos: 8,
    color: "purple",
  },
  {
    id: "agendamentos",
    nome: "Agendamentos",
    descricao: "Como agendar, cancelar e gerenciar consultas",
    icon: Calendar,
    artigos: 15,
    color: "green",
  },
  {
    id: "pagamentos",
    nome: "Pagamentos e Faturas",
    descricao: "Métodos de pagamento, faturas e reembolsos",
    icon: CreditCard,
    artigos: 10,
    color: "orange",
  },
  {
    id: "marketplace",
    nome: "Marketplace",
    descricao: "Comprar produtos, acompanhar pedidos e trocas",
    icon: Smartphone,
    artigos: 9,
    color: "pink",
  },
  {
    id: "seguranca",
    nome: "Segurança e Privacidade",
    descricao: "LGPD, proteção de dados e segurança da conta",
    icon: Shield,
    artigos: 7,
    color: "red",
  },
  {
    id: "profissionais",
    nome: "Para Profissionais",
    descricao: "Guias e recursos para profissionais de estética",
    icon: Settings,
    artigos: 18,
    color: "indigo",
  },
  {
    id: "mobile",
    nome: "App Mobile",
    descricao: "Usando o app iOS e Android",
    icon: Smartphone,
    artigos: 6,
    color: "teal",
  },
];

const artigosPopulares: HelpArticle[] = [
  {
    id: "1",
    titulo: "Como criar sua primeira conta",
    categoria: "Primeiros Passos",
    resumo: "Passo a passo completo para criar e configurar sua conta na DoctorQ",
    tempoLeitura: 5,
    visualizacoes: 2453,
  },
  {
    id: "2",
    titulo: "Agendando seu primeiro procedimento",
    categoria: "Agendamentos",
    resumo: "Aprenda como encontrar profissionais e agendar procedimentos",
    tempoLeitura: 7,
    visualizacoes: 1892,
  },
  {
    id: "3",
    titulo: "Métodos de pagamento aceitos",
    categoria: "Pagamentos e Faturas",
    resumo: "Conheça todas as formas de pagamento e parcelamento disponíveis",
    tempoLeitura: 4,
    visualizacoes: 1654,
  },
  {
    id: "4",
    titulo: "Como alterar ou recuperar senha",
    categoria: "Conta e Perfil",
    resumo: "Guia de segurança para gerenciar sua senha de forma segura",
    tempoLeitura: 3,
    visualizacoes: 1432,
  },
  {
    id: "5",
    titulo: "Política de cancelamento e reembolso",
    categoria: "Agendamentos",
    resumo: "Entenda as regras para cancelamento de agendamentos e reembolsos",
    tempoLeitura: 6,
    visualizacoes: 1287,
  },
  {
    id: "6",
    titulo: "Seus direitos de privacidade (LGPD)",
    categoria: "Segurança e Privacidade",
    resumo: "Conheça seus direitos sobre seus dados pessoais conforme a LGPD",
    tempoLeitura: 8,
    visualizacoes: 1156,
  },
];

const getColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    pink: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    indigo: "bg-indigo-100 text-indigo-600",
    teal: "bg-teal-100 text-teal-600",
  };
  return colorMap[color] || colorMap.blue;
};

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50 to-purple-50">
      <LandingNav />
      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Como podemos ajudar você?
          </h1>
          <p className="text-gray-600 mb-6">
            Encontre guias, tutoriais e respostas para suas dúvidas
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar artigos, tutoriais, perguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>

          {/* Quick Links */}
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            <Link href="/faq">
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQ
              </Button>
            </Link>
            <Link href="/contato">
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Fale Conosco
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Video className="h-4 w-4 mr-2" />
              Vídeos
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Categorias de Ajuda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categorias.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.id} href={`/ajuda/${cat.id}`}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer h-full group">
                    <CardContent className="pt-6">
                      <div className={`w-12 h-12 rounded-lg ${getColorClass(cat.color)} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-1 group-hover:text-purple-600 transition-colors">
                        {cat.nome}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{cat.descricao}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{cat.artigos} artigos</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Popular Articles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Artigos Populares</h2>
            <Link href="/ajuda/todos">
              <Button variant="outline" size="sm">
                Ver Todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artigosPopulares.map((artigo) => (
              <Link key={artigo.id} href={`/ajuda/artigo/${artigo.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <Badge variant="outline" className="mb-3 text-xs">
                      {artigo.categoria}
                    </Badge>
                    <h3 className="font-semibold mb-2 hover:text-purple-600 transition-colors">
                      {artigo.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{artigo.resumo}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{artigo.tempoLeitura} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>{artigo.visualizacoes.toLocaleString()} views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Video Tutorials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              Tutoriais em Vídeo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  titulo: "Introdução à DoctorQ",
                  duracao: "5:23",
                  descricao: "Conheça a plataforma em 5 minutos",
                },
                {
                  titulo: "Como agendar procedimentos",
                  duracao: "3:47",
                  descricao: "Passo a passo do agendamento",
                },
                {
                  titulo: "Gerenciando seu prontuário",
                  duracao: "6:15",
                  descricao: "Acesse e exporte seu histórico médico",
                },
              ].map((video, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="bg-gray-200 rounded-lg aspect-video mb-3 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{video.titulo}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {video.duracao}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{video.descricao}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Chat ao Vivo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fale com nosso suporte em tempo real
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Iniciar Chat
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Telefone</h3>
                <p className="text-sm text-gray-600 mb-1">0800 123 4567</p>
                <p className="text-xs text-gray-500 mb-4">Seg-Sex, 8h-20h | Sáb, 9h-13h</p>
                <Button variant="outline" size="sm" className="w-full">
                  Ligar Agora
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-sm text-gray-600 mb-1">suporte@doctorq.com.br</p>
                <p className="text-xs text-gray-500 mb-4">Resposta em até 24h</p>
                <Link href="/contato">
                  <Button variant="outline" size="sm" className="w-full">
                    Enviar Email
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Recursos Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/legal/termos">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Termos de Uso</p>
                    <p className="text-xs text-gray-500">Leia nossos termos e condições</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>

              <Link href="/legal/privacidade">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Política de Privacidade</p>
                    <p className="text-xs text-gray-500">Como protegemos seus dados</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>

              <Link href="/legal/lgpd">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Conformidade LGPD</p>
                    <p className="text-xs text-gray-500">Seus direitos sobre seus dados</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>

              <Link href="/faq">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <HelpCircle className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Perguntas Frequentes</p>
                    <p className="text-xs text-gray-500">24 perguntas mais comuns</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Ainda precisa de ajuda?</h3>
              <p className="text-purple-100 mb-4">
                Nossa equipe de suporte está sempre disponível para você
              </p>
              <Link href="/contato">
                <Button variant="secondary" size="lg">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Entre em Contato
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
