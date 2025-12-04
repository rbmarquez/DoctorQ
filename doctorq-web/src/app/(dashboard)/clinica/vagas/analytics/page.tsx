"use client";

import { useAnalyticsEmpresa } from "@/lib/api/hooks/useCandidaturas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Target,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Award,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AnalyticsPage() {
  const { analytics, isLoading, isError } = useAnalyticsEmpresa();

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar analytics. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calcular tendências (comparação 7d vs 30d)
  const tendenciaPositiva = (novos7d: number, novos30d: number) => {
    const media7d = novos7d;
    const media30d = novos30d / 4.3; // ~4.3 semanas em 30 dias
    return media7d >= media30d;
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
          Analytics de Recrutamento
        </h1>
        <p className="text-gray-600 mt-2">
          Visão completa do desempenho de suas vagas e processos seletivos
        </p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Vagas Abertas */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Vagas Abertas
              </CardTitle>
              <Briefcase className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.total_vagas_abertas}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.total_vagas_fechadas} vagas fechadas
            </p>
          </CardContent>
        </Card>

        {/* Total Candidatos */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Candidatos
              </CardTitle>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.total_candidatos}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Todas as vagas
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa de Conversão
              </CardTitle>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.taxa_conversao_geral?.toFixed(1) || "0"}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.total_contratacoes} contratações
            </p>
          </CardContent>
        </Card>

        {/* Tempo Médio */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tempo Médio
              </CardTitle>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.tempo_medio_contratacao_dias?.toFixed(0) || "-"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dias até contratação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Conversão */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600" />
            <CardTitle>Funil de Conversão</CardTitle>
          </div>
          <CardDescription>
            Jornada dos candidatos no processo seletivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.funil_conversao || {}).map(([status, count]: [string, any]) => {
              const total = analytics.total_candidatos;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
                enviada: { label: "Enviada", color: "text-blue-700", bgColor: "bg-blue-500" },
                em_analise: { label: "Em Análise", color: "text-yellow-700", bgColor: "bg-yellow-500" },
                entrevista_agendada: { label: "Entrevista Agendada", color: "text-purple-700", bgColor: "bg-purple-500" },
                aprovado: { label: "Aprovado", color: "text-green-700", bgColor: "bg-green-500" },
                reprovado: { label: "Reprovado", color: "text-red-700", bgColor: "bg-red-500" },
                desistiu: { label: "Desistiu", color: "text-gray-700", bgColor: "bg-gray-500" },
              };

              const config = statusConfig[status] || { label: status, color: "text-gray-700", bgColor: "bg-gray-500" };

              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {count} candidatos ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${config.bgColor} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de Match Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-rose-600" />
              <CardTitle>Distribuição de Match Scores</CardTitle>
            </div>
            <CardDescription>
              Qualidade dos candidatos por faixa de compatibilidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.distribuicao_match_scores || {}).map(([faixa, count]: [string, any]) => {
                const total = Object.values(analytics.distribuicao_match_scores || {}).reduce((acc: number, val: any) => acc + val, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;

                const getColor = (faixa: string) => {
                  if (faixa === "81-100") return { bg: "bg-green-500", text: "text-green-700" };
                  if (faixa === "61-80") return { bg: "bg-blue-500", text: "text-blue-700" };
                  if (faixa === "41-60") return { bg: "bg-yellow-500", text: "text-yellow-700" };
                  if (faixa === "21-40") return { bg: "bg-orange-500", text: "text-orange-700" };
                  return { bg: "bg-red-500", text: "text-red-700" };
                };

                const colors = getColor(faixa);

                return (
                  <div key={faixa}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${colors.text}`}>
                        {faixa}%
                      </span>
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors.bg} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Match Score Médio Geral
              </span>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-600" />
                <span className="text-lg font-bold text-gray-900">
                  {analytics.match_score_medio_geral?.toFixed(0) || "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tendências (últimos 30 dias) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-600" />
              <CardTitle>Tendências (30 dias)</CardTitle>
            </div>
            <CardDescription>
              Evolução de candidaturas e contratações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Candidaturas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Candidaturas
                  </span>
                  <Badge variant="secondary">
                    {Object.values(analytics.tendencia_candidaturas_30dias || {}).reduce((acc: number, val: any) => acc + val, 0)} total
                  </Badge>
                </div>
                <div className="h-24 flex items-end gap-1">
                  {Object.entries(analytics.tendencia_candidaturas_30dias || {})
                    .slice(-14) // Últimos 14 dias
                    .map(([data, count]: [string, any]) => {
                      const maxCount = Math.max(...Object.values(analytics.tendencia_candidaturas_30dias || {}).map((v: any) => v));
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                      return (
                        <div
                          key={data}
                          className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                          style={{ height: `${height}%`, minHeight: count > 0 ? "4px" : "0" }}
                          title={`${data}: ${count} candidatura(s)`}
                        ></div>
                      );
                    })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Últimos 14 dias</p>
              </div>

              <Separator />

              {/* Contratações */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Contratações
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {Object.values(analytics.tendencia_contratacoes_30dias || {}).reduce((acc: number, val: any) => acc + val, 0)} total
                  </Badge>
                </div>
                <div className="h-24 flex items-end gap-1">
                  {Object.entries(analytics.tendencia_contratacoes_30dias || {})
                    .slice(-14) // Últimos 14 dias
                    .map(([data, count]: [string, any]) => {
                      const maxCount = Math.max(...Object.values(analytics.tendencia_contratacoes_30dias || {}).map((v: any) => v), 1);
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                      return (
                        <div
                          key={data}
                          className="flex-1 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer"
                          style={{ height: `${height}%`, minHeight: count > 0 ? "4px" : "0" }}
                          title={`${data}: ${count} contratação(ões)`}
                        ></div>
                      );
                    })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Últimos 14 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Vagas com Mais Candidatos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            <CardTitle>Top 10 Vagas com Mais Candidatos</CardTitle>
          </div>
          <CardDescription>
            Performance detalhada de cada vaga
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.vagas_com_mais_candidatos?.map((vaga: any, index: number) => {
              const isTopTres = index < 3;
              const novos7d = vaga.candidatos_novos_ultimos_7dias;
              const novos30d = vaga.candidatos_novos_ultimos_30dias;
              const temTendencia = tendenciaPositiva(novos7d, novos30d);

              return (
                <Card key={vaga.id_vaga} className={`${isTopTres ? "border-rose-200 bg-rose-50/30" : ""}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      {/* Esquerda: Info da Vaga */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isTopTres && (
                            <Badge className="bg-gradient-to-r from-rose-600 to-purple-600 text-white">
                              #{index + 1}
                            </Badge>
                          )}
                          <h3 className="font-semibold text-lg text-gray-900">
                            {vaga.nm_cargo}
                          </h3>
                          <Badge variant={vaga.ds_status === "aberta" ? "default" : "secondary"}>
                            {vaga.ds_status === "aberta" ? "Aberta" : "Fechada"}
                          </Badge>
                        </div>

                        {/* Métricas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Total Candidatos</p>
                            <p className="text-xl font-bold text-gray-900">
                              {vaga.total_candidatos}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              Novos (7d)
                              {temTendencia ? (
                                <TrendingUp className="w-3 h-3 text-green-600" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-600" />
                              )}
                            </p>
                            <p className={`text-xl font-bold ${temTendencia ? "text-green-600" : "text-red-600"}`}>
                              {novos7d}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Match Médio</p>
                            <p className="text-xl font-bold text-purple-600">
                              {vaga.match_score_medio?.toFixed(0) || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Taxa Conversão</p>
                            <p className="text-xl font-bold text-blue-600">
                              {vaga.taxa_conversao?.toFixed(1) || "0"}%
                            </p>
                          </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {Object.entries(vaga.por_status || {}).map(([status, count]: [string, any]) => {
                            const statusConfig: Record<string, { label: string; color: string }> = {
                              enviada: { label: "Enviada", color: "bg-blue-100 text-blue-700" },
                              em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-700" },
                              entrevista_agendada: { label: "Entrevista", color: "bg-purple-100 text-purple-700" },
                              aprovado: { label: "Aprovado", color: "bg-green-100 text-green-700" },
                              reprovado: { label: "Reprovado", color: "bg-red-100 text-red-700" },
                              desistiu: { label: "Desistiu", color: "bg-gray-100 text-gray-700" },
                            };

                            const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" };

                            return (
                              <Badge key={status} variant="outline" className={config.color}>
                                {config.label}: {count}
                              </Badge>
                            );
                          })}
                        </div>

                        {/* Tempo Médio */}
                        {vaga.tempo_medio_processo_dias && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              Tempo médio de processo: <strong>{vaga.tempo_medio_processo_dias.toFixed(0)} dias</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {!analytics.vagas_com_mais_candidatos?.length && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma vaga cadastrada ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
