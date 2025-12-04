"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { ArrowLeft, Handshake, Star, MapPin, Phone, Mail, Globe, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ParceiroDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);

  const parceiro = {
    nome: "Dermage Cosméticos",
    categoria: "Produtos",
    avaliacao: 4.9,
    cidade: "São Paulo",
    estado: "SP",
    telefone: "(11) 9876-5432",
    email: "parceria@dermage.com.br",
    website: "www.dermage.com.br",
    descricao: "Líder em cosméticos dermatológicos de alta performance. Parceiro DoctorQ desde 2023.",
    parceriaSince: "2023-01-15",
    stats: {
      produtos: 45,
      vendas: 1234,
      satisfacao: 98,
    },
    beneficios: [
      "Descontos exclusivos para usuários DoctorQ",
      "Entrega rápida em todo Brasil",
      "Suporte técnico especializado",
      "Programa de cashback",
    ],
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">{parceiro.nome[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{parceiro.nome}</h1>
                    <div className="flex gap-2 mb-3">
                      <Badge variant="outline">{parceiro.categoria}</Badge>
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        {parceiro.avaliacao}
                      </Badge>
                      <Badge className="bg-green-500">Parceiro Oficial</Badge>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{parceiro.descricao}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span>Parceiro desde {new Date(parceiro.parceriaSince).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span>{parceiro.cidade}, {parceiro.estado}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span>{parceiro.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span>{parceiro.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold">{parceiro.stats.produtos}</p>
              <p className="text-sm text-gray-600">Produtos Oferecidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-3xl font-bold">{parceiro.stats.vendas}</p>
              <p className="text-sm text-gray-600">Vendas Realizadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Handshake className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold">{parceiro.stats.satisfacao}%</p>
              <p className="text-sm text-gray-600">Satisfação</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Benefícios da Parceria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {parceiro.beneficios.map((beneficio, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Star className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6 text-center">
            <h3 className="font-bold mb-2">Conheça os Produtos</h3>
            <p className="text-sm text-gray-600 mb-4">
              Explore o catálogo completo de produtos e aproveite as ofertas exclusivas
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600" asChild>
              <Link href="/marketplace">Ver Produtos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
