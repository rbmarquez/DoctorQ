/**
 * Painel de Conquistas e Badges
 * Exibe badges conquistados, progresso, coleções e raridades
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Trophy, Award, Lock, Star, TrendingUp, Medal, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

interface BadgeUsuario {
  id_badge_usuario: string;
  badge: {
    id_badge: string;
    nm_nome: string;
    ds_descricao: string;
    ds_icone: string;
    ds_criterio: string;
    tx_raridade: string;
    tx_categoria: string;
    nr_valor_criterio: number;
    nr_ordem_exibicao: number;
  };
  nr_progresso: number;
  fg_conquistado: boolean;
  dt_conquista: string | null;
}

interface ConquistasData {
  badges_conquistados: BadgeUsuario[];
  badges_em_progresso: BadgeUsuario[];
  badges_bloqueados: BadgeUsuario[];
  estatisticas: {
    total_conquistados: number;
    total_badges: number;
    percentual_completo: number;
    badges_por_raridade: {
      comum: number;
      rara: number;
      epica: number;
      lendaria: number;
    };
  };
}

const RARIDADE_COLORS = {
  comum: 'bg-gray-500',
  rara: 'bg-blue-500',
  epica: 'bg-purple-500',
  lendaria: 'bg-yellow-500',
};

const RARIDADE_TEXT_COLORS = {
  comum: 'text-gray-700',
  rara: 'text-blue-700',
  epica: 'text-purple-700',
  lendaria: 'text-yellow-700',
};

const RARIDADE_LABELS = {
  comum: 'Comum',
  rara: 'Rara',
  epica: 'Épica',
  lendaria: 'Lendária',
};

interface ConquistasPanelProps {
  idUsuario: string;
}

export function ConquistasPanel({ idUsuario }: ConquistasPanelProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeUsuario | null>(null);

  // Fetch conquistas
  const { data: conquistas, isLoading } = useSWR<ConquistasData>(
    `${UNIV_API_URL}/gamificacao/${idUsuario}/badges/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    }
  );

  const calcularPercentual = (progresso: number, meta: number) => {
    return Math.min((progresso / meta) * 100, 100);
  };

  const renderBadgeCard = (badgeUsuario: BadgeUsuario, bloqueado: boolean = false) => {
    const { badge, nr_progresso, fg_conquistado, dt_conquista } = badgeUsuario;
    const percentual = calcularPercentual(nr_progresso, badge.nr_valor_criterio);
    const raridade = badge.tx_raridade.toLowerCase() as keyof typeof RARIDADE_COLORS;

    return (
      <Card
        key={badge.id_badge}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          bloqueado ? 'opacity-60' : ''
        } ${fg_conquistado ? 'border-2 border-yellow-400' : ''}`}
        onClick={() => setSelectedBadge(badgeUsuario)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-4xl ${bloqueado ? 'filter grayscale' : ''}`}>
                {bloqueado ? '🔒' : badge.ds_icone}
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {badge.nm_nome}
                  {fg_conquistado && <Trophy className="h-4 w-4 text-yellow-600" />}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={`${RARIDADE_COLORS[raridade]} text-white text-xs mt-1`}
                >
                  {RARIDADE_LABELS[raridade]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {badge.ds_descricao}
          </p>

          {!bloqueado && !fg_conquistado && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">
                  {nr_progresso} / {badge.nr_valor_criterio}
                </span>
              </div>
              <Progress value={percentual} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {percentual.toFixed(0)}% completo
              </p>
            </div>
          )}

          {fg_conquistado && dt_conquista && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
              <Medal className="h-4 w-4" />
              <span>
                Conquistado em{' '}
                {new Date(dt_conquista).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {bloqueado && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
              <Lock className="h-4 w-4" />
              <span>Bloqueado - Continue progredindo para desbloquear</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!conquistas) {
    return (
      <div className="text-center py-8">
        <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          Erro ao carregar conquistas
        </p>
      </div>
    );
  }

  const { badges_conquistados, badges_em_progresso, badges_bloqueados, estatisticas } = conquistas;

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Conquistados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {estatisticas.total_conquistados}
            </div>
            <p className="text-xs text-yellow-100 mt-1">
              de {estatisticas.total_badges} badges
            </p>
            <Progress
              value={estatisticas.percentual_completo}
              className="h-1 mt-2 bg-yellow-300"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-400 to-gray-500 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Comuns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {estatisticas.badges_por_raridade.comum}
            </div>
            <p className="text-xs text-gray-100 mt-1">badges comuns</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Raras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {estatisticas.badges_por_raridade.rara}
            </div>
            <p className="text-xs text-blue-100 mt-1">badges raras</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Épicas + Lendárias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {estatisticas.badges_por_raridade.epica + estatisticas.badges_por_raridade.lendaria}
            </div>
            <p className="text-xs text-purple-100 mt-1">badges especiais</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Badges */}
      <Tabs defaultValue="conquistados" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="conquistados">
            Conquistados ({badges_conquistados.length})
          </TabsTrigger>
          <TabsTrigger value="progresso">
            Em Progresso ({badges_em_progresso.length})
          </TabsTrigger>
          <TabsTrigger value="bloqueados">
            Bloqueados ({badges_bloqueados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conquistados" className="mt-6">
          {badges_conquistados.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma conquista ainda
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete cursos e missões para ganhar seus primeiros badges!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges_conquistados.map((badgeUsuario) => renderBadgeCard(badgeUsuario))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progresso" className="mt-6">
          {badges_em_progresso.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum badge em progresso
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges_em_progresso.map((badgeUsuario) => renderBadgeCard(badgeUsuario))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bloqueados" className="mt-6">
          {badges_bloqueados.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Todos os badges estão disponíveis!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges_bloqueados.map((badgeUsuario) => renderBadgeCard(badgeUsuario, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes do Badge */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-md">
          {selectedBadge && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-5xl">{selectedBadge.badge.ds_icone}</div>
                  <div>
                    <DialogTitle className="text-xl">{selectedBadge.badge.nm_nome}</DialogTitle>
                    <Badge
                      variant="secondary"
                      className={`${
                        RARIDADE_COLORS[
                          selectedBadge.badge.tx_raridade.toLowerCase() as keyof typeof RARIDADE_COLORS
                        ]
                      } text-white text-xs mt-1`}
                    >
                      {
                        RARIDADE_LABELS[
                          selectedBadge.badge.tx_raridade.toLowerCase() as keyof typeof RARIDADE_LABELS
                        ]
                      }
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="text-base">
                  {selectedBadge.badge.ds_descricao}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Critério
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedBadge.badge.ds_criterio}
                  </p>
                </div>

                {!selectedBadge.fg_conquistado && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Progresso Atual</h4>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">
                        {selectedBadge.nr_progresso} / {selectedBadge.badge.nr_valor_criterio}
                      </span>
                      <span className="font-medium">
                        {calcularPercentual(
                          selectedBadge.nr_progresso,
                          selectedBadge.badge.nr_valor_criterio
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={calcularPercentual(
                        selectedBadge.nr_progresso,
                        selectedBadge.badge.nr_valor_criterio
                      )}
                      className="h-3"
                    />
                  </div>
                )}

                {selectedBadge.fg_conquistado && selectedBadge.dt_conquista && (
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <Medal className="h-5 w-5" />
                      <span className="font-semibold">Conquista Desbloqueada!</span>
                    </div>
                    <p className="text-sm text-green-600">
                      {new Date(selectedBadge.dt_conquista).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
