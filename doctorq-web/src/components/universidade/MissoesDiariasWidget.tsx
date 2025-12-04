/**
 * Widget de Missões Diárias
 * Sistema gamificado de desafios diários para incentivar engajamento
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Target, Zap, Trophy, Clock, TrendingUp, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

interface Missao {
  id_missao: string;
  tipo: string;
  titulo: string;
  descricao: string;
  icone: string;
  meta: number;
  progresso_atual: number;
  progresso_percentual: number;
  xp_recompensa: number;
  tokens_recompensa: number;
  fg_concluida: boolean;
  dt_conclusao: string | null;
  dt_expiracao: string;
}

interface ProximaConquista {
  tipo: string;
  meta: number;
  progresso: number;
  percentual: number;
  titulo: string;
  icone: string;
}

interface Conquista {
  id_badge: string;
  nome: string;
  descricao: string;
  icone: string;
  dt_conquista: string;
  raridade: string;
}

export function MissoesDiariasWidget() {
  const [activeTab, setActiveTab] = useState('missoes');

  // Fetch missões diárias
  const { data: missoes, isLoading: missoesLoading, mutate: mutateMissoes } = useSWR<Missao[]>(
    `${UNIV_API_URL}/missoes/diarias/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    { refreshInterval: 30000 } // Refresh a cada 30s
  );

  // Fetch conquistas desbloqueadas
  const { data: conquistas, isLoading: conquistasLoading } = useSWR<Conquista[]>(
    `${UNIV_API_URL}/missoes/conquistas/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    }
  );

  // Fetch próximas conquistas
  const { data: proximas, isLoading: proximasLoading } = useSWR<ProximaConquista[]>(
    `${UNIV_API_URL}/missoes/conquistas/proximas/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    }
  );

  const getRaridadeColor = (raridade: string) => {
    const colors: Record<string, string> = {
      comum: 'bg-gray-500',
      raro: 'bg-blue-500',
      epico: 'bg-purple-500',
      lendario: 'bg-amber-500',
    };
    return colors[raridade] || 'bg-gray-500';
  };

  const missoesCompletas = missoes?.filter((m) => m.fg_concluida).length || 0;
  const missoesPendentes = missoes?.filter((m) => !m.fg_concluida).length || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Missões & Conquistas
            </CardTitle>
            <CardDescription>Complete desafios e ganhe recompensas</CardDescription>
          </div>
          {missoes && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{missoesCompletas}/{missoes.length}</div>
              <div className="text-xs text-muted-foreground">missões completas hoje</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="missoes">
              🎯 Missões
              {missoesPendentes > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  {missoesPendentes}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="proximas">🔓 Próximas</TabsTrigger>
            <TabsTrigger value="conquistas">
              🏆 Conquistas
              {conquistas && conquistas.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({conquistas.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Missões Diárias */}
          <TabsContent value="missoes" className="space-y-4 mt-4">
            {missoesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : missoes && missoes.length > 0 ? (
              <div className="space-y-3">
                {missoes.map((missao) => (
                  <div
                    key={missao.id_missao}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      missao.fg_concluida
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-border bg-card hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{missao.icone}</div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {missao.titulo}
                            {missao.fg_concluida && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{missao.descricao}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {missao.progresso_atual}/{missao.meta}
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <Progress value={missao.progresso_percentual} className="h-2 mb-3" />

                    {/* Recompensas */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Zap className="h-4 w-4" />
                          <span>+{missao.xp_recompensa} XP</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Trophy className="h-4 w-4" />
                          <span>+{missao.tokens_recompensa} Tokens</span>
                        </div>
                      </div>
                      {missao.fg_concluida && missao.dt_conclusao && (
                        <Badge variant="default" className="bg-green-500">
                          Completa
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma missão disponível no momento</p>
              </div>
            )}
          </TabsContent>

          {/* Próximas Conquistas */}
          <TabsContent value="proximas" className="space-y-4 mt-4">
            {proximasLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : proximas && proximas.length > 0 ? (
              <div className="space-y-3">
                {proximas.map((proxima, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{proxima.icone}</div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {proxima.titulo}
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {proxima.progresso}/{proxima.meta}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {proxima.percentual.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={proxima.percentual} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Continue estudando para desbloquear conquistas</p>
              </div>
            )}
          </TabsContent>

          {/* Conquistas Desbloqueadas */}
          <TabsContent value="conquistas" className="mt-4">
            {conquistasLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conquistas && conquistas.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {conquistas.map((conquista) => (
                  <div
                    key={conquista.id_badge}
                    className="p-4 rounded-lg border bg-card text-center hover:shadow-md transition-shadow"
                  >
                    <div className="text-5xl mb-2">{conquista.icone}</div>
                    <div className="font-semibold text-sm mb-1">{conquista.nome}</div>
                    <div className="text-xs text-muted-foreground mb-2">{conquista.descricao}</div>
                    <Badge variant="secondary" className={`text-xs ${getRaridadeColor(conquista.raridade)}`}>
                      {conquista.raridade}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(conquista.dt_conquista).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">Nenhuma conquista ainda</p>
                <p className="text-sm text-muted-foreground">
                  Complete missões e cursos para desbloquear badges
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
