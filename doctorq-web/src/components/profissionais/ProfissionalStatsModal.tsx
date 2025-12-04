"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, TrendingUp, Users, DollarSign, Star } from "lucide-react";
import { Profissional, useEstatisticasProfissional } from "@/lib/api/hooks/useProfissionais";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfissionalStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profissional: Profissional;
}

export function ProfissionalStatsModal({
  isOpen,
  onClose,
  profissional,
}: ProfissionalStatsModalProps) {
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "mes" | "all">("30d");

  // Calcular datas de filtro
  const getFiltros = () => {
    const hoje = new Date();
    switch (periodo) {
      case "7d":
        return {
          dt_inicio: format(subDays(hoje, 7), "yyyy-MM-dd"),
          dt_fim: format(hoje, "yyyy-MM-dd"),
        };
      case "30d":
        return {
          dt_inicio: format(subDays(hoje, 30), "yyyy-MM-dd"),
          dt_fim: format(hoje, "yyyy-MM-dd"),
        };
      case "mes":
        return {
          dt_inicio: format(startOfMonth(hoje), "yyyy-MM-dd"),
          dt_fim: format(endOfMonth(hoje), "yyyy-MM-dd"),
        };
      default:
        return {};
    }
  };

  const { stats, isLoading } = useEstatisticasProfissional(
    profissional.id_profissional,
    getFiltros()
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPeriodoLabel = () => {
    switch (periodo) {
      case "7d":
        return "Últimos 7 dias";
      case "30d":
        return "Últimos 30 dias";
      case "mes":
        return "Mês atual";
      default:
        return "Todo o período";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Estatísticas - {profissional.nm_profissional}
          </DialogTitle>
          <DialogDescription>
            Visualize o desempenho e métricas do profissional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seletor de Período */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{getPeriodoLabel()}</span>
            </div>
            <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
              <TabsList>
                <TabsTrigger value="7d">7 dias</TabsTrigger>
                <TabsTrigger value="30d">30 dias</TabsTrigger>
                <TabsTrigger value="mes">Mês atual</TabsTrigger>
                <TabsTrigger value="all">Tudo</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando estatísticas...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cards de Métricas Principais */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Agendamentos</CardTitle>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_agendamentos || 0}</div>
                    <p className="text-xs text-muted-foreground">No período selecionado</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.taxa_conclusao || 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.agendamentos_concluidos || 0} de {stats?.total_agendamentos || 0}{" "}
                      concluídos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_pacientes || 0}</div>
                    <p className="text-xs text-muted-foreground">Pacientes únicos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats?.receita_total || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Receita bruta</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs de Detalhes */}
              <Tabs defaultValue="agendamentos" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
                  <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
                </TabsList>

                <TabsContent value="agendamentos" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Concluídos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                          {stats?.agendamentos_concluidos || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Pendentes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">
                          {stats?.agendamentos_pendentes || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                          {stats?.total_agendamentos || 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="avaliacoes" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Avaliação Média</CardTitle>
                        <CardDescription>Nota média das avaliações</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                          <div className="text-4xl font-bold">
                            {stats?.avaliacao_media?.toFixed(1) || "N/A"}
                          </div>
                          <span className="text-muted-foreground">/5.0</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Distribuição</CardTitle>
                        <CardDescription>Classificação das avaliações</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600">Positivas (4-5)</span>
                          <span className="font-bold">{stats?.avaliacoes_positivas || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-yellow-600">Neutras (3)</span>
                          <span className="font-bold">{stats?.avaliacoes_neutras || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-600">Negativas (1-2)</span>
                          <span className="font-bold">{stats?.avaliacoes_negativas || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
