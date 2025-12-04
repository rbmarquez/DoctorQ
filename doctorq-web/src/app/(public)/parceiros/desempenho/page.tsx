"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Target, Star, TrendingUp, Award, Users, Package, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function ParceiroDesempenhoPage() {
  // TODO: Fetch from API
  const desempenhoGeral = {
    pontuacao: 8.7,
    nivel: "Parceiro Premium",
    progresso_proximo_nivel: 75,
    proximo_nivel: "Parceiro Elite",
    avaliacoes: 4.8,
    total_avaliacoes: 342,
  };

  const metricas = [
    {
      nome: "Taxa de Entrega no Prazo",
      valor: 94.5,
      meta: 95,
      status: "warning",
      icon: Clock,
      unidade: "%",
    },
    {
      nome: "Taxa de Satisfação",
      valor: 96.2,
      meta: 90,
      status: "success",
      icon: Star,
      unidade: "%",
    },
    {
      nome: "Taxa de Resposta",
      valor: 98.1,
      meta: 95,
      status: "success",
      icon: CheckCircle,
      unidade: "%",
    },
    {
      nome: "Taxa de Cancelamento",
      valor: 2.3,
      meta: 5,
      status: "success",
      icon: XCircle,
      unidade: "%",
      inverso: true,
    },
  ];

  const metas = [
    {
      titulo: "Alcançar 500 Pedidos",
      atual: 342,
      meta: 500,
      progresso: 68.4,
      prazo: "31/03/2025",
      recompensa: "+5% comissão",
      status: "em_andamento",
    },
    {
      titulo: "Manter Avaliação 4.8+",
      atual: 4.8,
      meta: 4.8,
      progresso: 100,
      prazo: "31/03/2025",
      recompensa: "Badge Premium",
      status: "concluido",
    },
    {
      titulo: "Expandir Catálogo",
      atual: 45,
      meta: 60,
      progresso: 75,
      prazo: "15/04/2025",
      recompensa: "Destaque na Home",
      status: "em_andamento",
    },
    {
      titulo: "Zero Reclamações",
      atual: 0,
      meta: 0,
      progresso: 100,
      prazo: "31/03/2025",
      recompensa: "+10% visibilidade",
      status: "concluido",
    },
  ];

  const historico = [
    { mes: "Out/24", pontuacao: 8.2, nivel: "Premium" },
    { mes: "Nov/24", pontuacao: 8.5, nivel: "Premium" },
    { mes: "Dez/24", pontuacao: 8.9, nivel: "Premium" },
    { mes: "Jan/25", pontuacao: 8.7, nivel: "Premium" },
  ];

  const conquistas = [
    {
      titulo: "Parceiro Confiável",
      descricao: "Manteve avaliação acima de 4.5 por 6 meses",
      data: "15/01/2025",
      icon: Award,
      cor: "gold",
    },
    {
      titulo: "Resposta Rápida",
      descricao: "Taxa de resposta acima de 95% por 3 meses",
      data: "01/02/2025",
      icon: CheckCircle,
      cor: "green",
    },
    {
      titulo: "Cliente Satisfeito",
      descricao: "Alcançou 300 avaliações positivas",
      data: "20/12/2024",
      icon: Star,
      cor: "blue",
    },
  ];

  const pontosMelhoria = [
    {
      area: "Entrega no Prazo",
      descricao: "Melhore 0.5% para atingir a meta de 95%",
      prioridade: "media",
      dicas: ["Confirme estoque antes de aceitar pedidos", "Use serviços de entrega expressa"],
    },
    {
      area: "Tempo de Resposta",
      descricao: "Continue mantendo o excelente tempo de resposta",
      prioridade: "baixa",
      dicas: ["Configure respostas automáticas fora do horário"],
    },
  ];

  const getStatusColor = (status: string) => {
    if (status === "success") return "text-green-600 bg-green-100";
    if (status === "warning") return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getMetaStatusBadge = (status: string) => {
    if (status === "concluido") return <Badge className="bg-green-500">Concluído</Badge>;
    if (status === "em_andamento") return <Badge className="bg-blue-500">Em andamento</Badge>;
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getConquistaColor = (cor: string) => {
    const colors = {
      gold: "bg-yellow-100 text-yellow-600 border-yellow-200",
      green: "bg-green-100 text-green-600 border-green-200",
      blue: "bg-blue-100 text-blue-600 border-blue-200",
    };
    return colors[cor as keyof typeof colors] || colors.blue;
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <Target className="h-8 w-8 text-purple-500" />
            Desempenho do Parceiro
          </h1>
          <p className="text-gray-600">Acompanhe suas métricas e evolução na plataforma</p>
        </div>

        {/* Desempenho Geral */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pontuação Geral</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-purple-600">{desempenhoGeral.pontuacao}</span>
                  <span className="text-2xl text-gray-500">/10</span>
                </div>
                <Badge className="mt-2 bg-purple-600">{desempenhoGeral.nivel}</Badge>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold">{desempenhoGeral.avaliacoes}</span>
                </div>
                <p className="text-sm text-gray-600">{desempenhoGeral.total_avaliacoes} avaliações</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Progresso para {desempenhoGeral.proximo_nivel}</p>
                <span className="text-sm font-medium">{desempenhoGeral.progresso_proximo_nivel}%</span>
              </div>
              <Progress value={desempenhoGeral.progresso_proximo_nivel} className="h-3" />
              <p className="text-xs text-gray-600 mt-1">Continue assim para desbloquear benefícios exclusivos!</p>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Desempenho */}
        <div>
          <h2 className="text-xl font-bold mb-4">Métricas Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricas.map((metrica, index) => {
              const Icon = metrica.icon;
              const atingiuMeta = metrica.inverso ? metrica.valor <= metrica.meta : metrica.valor >= metrica.meta;

              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`h-6 w-6 ${getStatusColor(metrica.status).split(" ")[0]}`} />
                      {atingiuMeta ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-1">
                      {metrica.valor}
                      {metrica.unidade}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">{metrica.nome}</p>
                    <div className="text-xs text-gray-500">
                      Meta: {metrica.meta}
                      {metrica.unidade}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Metas e Objetivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Metas e Objetivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metas.map((meta, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{meta.titulo}</h3>
                        {getMetaStatusBadge(meta.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {meta.atual} de {meta.meta} • Prazo: {meta.prazo}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      {meta.recompensa}
                    </Badge>
                  </div>
                  <Progress value={meta.progresso} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{meta.progresso.toFixed(1)}% concluído</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Desempenho */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Desempenho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold">Mês</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Pontuação</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Nível</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.mes}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-lg font-bold text-purple-600">{item.pontuacao}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge>{item.nivel}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Conquistas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {conquistas.map((conquista, index) => {
                const Icon = conquista.icon;
                return (
                  <div key={index} className={`p-4 border-2 rounded-lg ${getConquistaColor(conquista.cor)}`}>
                    <Icon className="h-8 w-8 mb-3" />
                    <h3 className="font-bold mb-1">{conquista.titulo}</h3>
                    <p className="text-sm mb-2">{conquista.descricao}</p>
                    <p className="text-xs opacity-75">{conquista.data}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pontos de Melhoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Pontos de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pontosMelhoria.map((ponto, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{ponto.area}</h3>
                    <Badge variant={ponto.prioridade === "media" ? "default" : "outline"}>
                      Prioridade {ponto.prioridade}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{ponto.descricao}</p>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-semibold mb-2">💡 Dicas:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {ponto.dicas.map((dica, idx) => (
                        <li key={idx}>• {dica}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="pt-6 text-center">
            <Target className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Continue Crescendo!</h3>
            <p className="mb-4 opacity-90">
              Você está no caminho certo. Mantenha a qualidade e alcance novos níveis.
            </p>
            <Button variant="secondary">Ver Benefícios do Próximo Nível</Button>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
