"use client";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Star, TrendingUp, Users, Zap, Gift, Award, DollarSign, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const beneficios = [
  {
    titulo: "Visibilidade Premium",
    descricao: "Destaque seu perfil para milhares de clientes em potencial",
    icon: Star,
    detalhes: [
      "Perfil destacado nos resultados de busca",
      "Selo de parceiro verificado",
      "Prioridade em recomendações",
      "Aparição em banners promocionais",
    ],
    cor: "purple",
  },
  {
    titulo: "Crescimento Acelerado",
    descricao: "Ferramentas para impulsionar seu negócio",
    icon: TrendingUp,
    detalhes: [
      "Dashboard analítico avançado",
      "Relatórios de performance",
      "Insights de mercado",
      "Consultoria estratégica",
    ],
    cor: "blue",
  },
  {
    titulo: "Rede de Contatos",
    descricao: "Conecte-se com outros profissionais e parceiros",
    icon: Users,
    detalhes: [
      "Acesso a eventos exclusivos",
      "Networking com especialistas",
      "Comunidade privada de parceiros",
      "Mentoria e suporte",
    ],
    cor: "green",
  },
  {
    titulo: "Tecnologia de Ponta",
    descricao: "Utilize as melhores ferramentas do mercado",
    icon: Zap,
    detalhes: [
      "Sistema de agendamento online",
      "Integração com pagamentos",
      "CRM completo",
      "Automação de marketing",
    ],
    cor: "orange",
  },
  {
    titulo: "Benefícios Exclusivos",
    descricao: "Vantagens especiais para parceiros",
    icon: Gift,
    detalhes: [
      "Descontos em produtos parceiros",
      "Créditos mensais de marketing",
      "Acesso antecipado a novidades",
      "Suporte prioritário 24/7",
    ],
    cor: "pink",
  },
  {
    titulo: "Certificação e Credibilidade",
    descricao: "Aumente sua autoridade no mercado",
    icon: Award,
    detalhes: [
      "Certificado de parceiro oficial",
      "Avaliações e reviews",
      "Badge de excelência",
      "Destaque em materiais de marketing",
    ],
    cor: "indigo",
  },
];

const planos = [
  {
    nome: "Básico",
    preco: "Gratuito",
    beneficios: [
      "Perfil na plataforma",
      "Até 10 agendamentos/mês",
      "Suporte por email",
      "Dashboard básico",
    ],
  },
  {
    nome: "Profissional",
    preco: "R$ 99/mês",
    popular: true,
    beneficios: [
      "Tudo do plano Básico",
      "Agendamentos ilimitados",
      "Selo de verificação",
      "Analytics avançado",
      "Suporte prioritário",
      "Créditos de marketing (R$ 50)",
    ],
  },
  {
    nome: "Enterprise",
    preco: "Sob Consulta",
    beneficios: [
      "Tudo do plano Profissional",
      "Múltiplas unidades",
      "API dedicada",
      "Gerente de conta",
      "SLA garantido",
      "Créditos de marketing (R$ 200)",
    ],
  },
];

export default function BeneficiosPage() {
  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Benefícios para Parceiros
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Descubra todas as vantagens de fazer parte da maior rede de saúde do Brasil
          </p>
        </div>

        {/* Benefícios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficios.map((beneficio) => {
            const Icon = beneficio.icon;
            return (
              <Card key={beneficio.titulo} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{beneficio.titulo}</h3>
                  <p className="text-sm text-gray-600 mb-4">{beneficio.descricao}</p>
                  <ul className="space-y-2">
                    {beneficio.detalhes.map((detalhe, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{detalhe}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Planos */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-center mb-8">Escolha seu Plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planos.map((plano) => (
              <Card
                key={plano.nome}
                className={plano.popular ? "border-2 border-purple-600" : ""}
              >
                <CardContent className="pt-6">
                  {plano.popular && (
                    <Badge className="mb-3 bg-purple-600">Mais Popular</Badge>
                  )}
                  <h3 className="font-bold text-2xl mb-2">{plano.nome}</h3>
                  <p className="text-3xl font-bold text-purple-600 mb-6">{plano.preco}</p>
                  <ul className="space-y-3 mb-6">
                    {plano.beneficios.map((beneficio, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plano.popular
                        ? "bg-gradient-to-r from-purple-600 to-blue-600"
                        : ""
                    }`}
                    variant={plano.popular ? "default" : "outline"}
                  >
                    {plano.nome === "Enterprise" ? "Falar com Vendas" : "Começar Agora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="pt-6 text-center py-12">
            <h2 className="text-3xl font-bold mb-3">Pronto para Começar?</h2>
            <p className="text-lg mb-6 opacity-90">
              Junte-se a milhares de profissionais que já fazem parte da nossa rede
            </p>
            <Button size="lg" variant="secondary">
              Tornar-se Parceiro
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
