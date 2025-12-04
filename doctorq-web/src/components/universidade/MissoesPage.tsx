/**
 * Página de Missões Diárias - Gamificação
 * Exibe missões ativas, progresso, recompensas e histórico
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Target, Trophy, Zap, Clock, CheckCircle2, Flame, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

interface Missao {
  id_user_missao: string;
  tipo_missao: string;
  titulo: string;
  descricao: string;
  icone: string;
  meta: number;
  progresso_atual: number;
  xp_recompensa: number;
  tokens_recompensa: number;
  fg_concluida: boolean;
  dt_criacao: string;
  dt_conclusao: string | null;
  dt_expiracao: string;
}

interface DashboardMissoes {
  missoes_ativas: Missao[];
  missoes_concluidas_hoje: Missao[];
  estatisticas: {
    total_ativas: number;
    total_concluidas_hoje: number;
    xp_ganho_hoje: number;
    tokens_ganhos_hoje: number;
    sequencia_dias: number;
  };
}

export function MissoesPage() {
  const [idUsuario] = useState(() => {
    // TODO: Get from auth context
    return '65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4'; // Placeholder
  });

  // Fetch dashboard de missões
  const { data: dashboard, isLoading, mutate } = useSWR<DashboardMissoes>(
    `${UNIV_API_URL}/missoes/${idUsuario}/dashboard/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    { refreshInterval: 30000 } // Atualiza a cada 30s
  );

  const handleResgatarRecompensa = async (idMissao: string) => {
    try {
      const res = await fetch(`${UNIV_API_URL}/missoes/${idMissao}/resgatar/`, {
        method: 'POST',
      });

      if (res.ok) {
        mutate(); // Atualiza dashboard
        // TODO: Show success toast
      }
    } catch (error) {
      console.error('Erro ao resgatar recompensa:', error);
    }
  };

  const calcularPercentual = (atual: number, meta: number) => {
    return Math.min((atual / meta) * 100, 100);
  };

  const formatarTempoRestante = (dataExpiracao: string) => {
    const agora = new Date();
    const expiracao = new Date(dataExpiracao);
    const diffMs = expiracao.getTime() - agora.getTime();

    if (diffMs <= 0) return 'Expirado';

    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas}h ${minutos}m restantes`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTitle>Erro ao carregar missões</AlertTitle>
          <AlertDescription>
            Não foi possível carregar suas missões diárias. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { missoes_ativas, missoes_concluidas_hoje, estatisticas } = dashboard;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Sequência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.sequencia_dias}</div>
            <p className="text-xs text-orange-100 mt-1">dias consecutivos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Missões Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.total_ativas}</div>
            <p className="text-xs text-blue-100 mt-1">em andamento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Concluídas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.total_concluidas_hoje}</div>
            <p className="text-xs text-green-100 mt-1">missões</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              XP Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.xp_ganho_hoje}</div>
            <p className="text-xs text-purple-100 mt-1">pontos de experiência</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Tokens Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.tokens_ganhos_hoje}</div>
            <p className="text-xs text-yellow-100 mt-1">moedas ganhas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Missões */}
      <Tabs defaultValue="ativas" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ativas">
            Missões Ativas ({missoes_ativas.length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas Hoje ({missoes_concluidas_hoje.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativas" className="mt-6">
          {missoes_ativas.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma missão ativa no momento
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Volte amanhã para novas missões diárias!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {missoes_ativas.map((missao) => {
                const percentual = calcularPercentual(missao.progresso_atual, missao.meta);
                const podeResgatar = missao.fg_concluida && !missao.dt_conclusao;

                return (
                  <Card key={missao.id_user_missao} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-3xl">{missao.icone}</div>
                          <div>
                            <CardTitle className="text-lg">{missao.titulo}</CardTitle>
                            <CardDescription className="text-xs">
                              {missao.descricao}
                            </CardDescription>
                          </div>
                        </div>
                        {podeResgatar && (
                          <Badge variant="default" className="bg-green-500">
                            <Trophy className="h-3 w-3 mr-1" />
                            Completa!
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progresso */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">
                            {missao.progresso_atual} / {missao.meta}
                          </span>
                        </div>
                        <Progress value={percentual} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {percentual.toFixed(0)}% concluído
                        </p>
                      </div>

                      {/* Recompensas */}
                      <div className="flex items-center gap-4 text-sm">
                        {missao.xp_recompensa > 0 && (
                          <div className="flex items-center gap-1 text-purple-600">
                            <Star className="h-4 w-4" />
                            <span className="font-medium">{missao.xp_recompensa} XP</span>
                          </div>
                        )}
                        {missao.tokens_recompensa > 0 && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">{missao.tokens_recompensa} Tokens</span>
                          </div>
                        )}
                      </div>

                      {/* Tempo Restante */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatarTempoRestante(missao.dt_expiracao)}
                      </div>

                      {/* Botão de Resgatar */}
                      {podeResgatar && (
                        <Button
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          onClick={() => handleResgatarRecompensa(missao.id_user_missao)}
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Resgatar Recompensa
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="mt-6">
          {missoes_concluidas_hoje.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma missão concluída hoje ainda
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete suas missões ativas para ganhar XP e Tokens!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {missoes_concluidas_hoje.map((missao) => (
                <Card key={missao.id_user_missao} className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{missao.icone}</div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {missao.titulo}
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {missao.descricao}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        {missao.xp_recompensa > 0 && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            <Star className="h-3 w-3 mr-1" />
                            +{missao.xp_recompensa} XP
                          </Badge>
                        )}
                        {missao.tokens_recompensa > 0 && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            <Zap className="h-3 w-3 mr-1" />
                            +{missao.tokens_recompensa} Tokens
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
