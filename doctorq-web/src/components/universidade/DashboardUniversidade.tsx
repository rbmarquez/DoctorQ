/**
 * Dashboard Principal da Universidade da Beleza
 * Central unificada com visão geral do progresso, missões, rankings e recomendações
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  GraduationCap,
  TrendingUp,
  Trophy,
  Target,
  BookOpen,
  Play,
  Star,
  Zap,
  Flame,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Medal,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

interface DashboardData {
  progresso_geral: {
    cursos_iniciados: number;
    cursos_concluidos: number;
    aulas_assistidas: number;
    total_minutos_estudo: number;
    sequencia_dias: number;
    ultimo_acesso: string;
  };
  gamificacao: {
    xp_total: number;
    nivel: number;
    xp_proximo_nivel: number;
    tokens: number;
    badges_conquistados: number;
    posicao_ranking: number | null;
  };
  missoes_hoje: Array<{
    id_user_missao: string;
    titulo: string;
    icone: string;
    progresso_atual: number;
    meta: number;
    xp_recompensa: number;
    tokens_recompensa: number;
    fg_concluida: boolean;
  }>;
  cursos_em_andamento: Array<{
    id_inscricao: string;
    curso: {
      id_curso: string;
      nm_titulo: string;
      ds_descricao: string;
      nm_categoria: string;
      ds_thumbnail: string;
    };
    percentual_concluido: number;
    aulas_concluidas: number;
    total_aulas: number;
    ultima_aula: {
      id_aula: string;
      nm_titulo: string;
    } | null;
  }>;
  recomendacoes: Array<{
    id_curso: string;
    nm_titulo: string;
    ds_descricao: string;
    nm_categoria: string;
    ds_thumbnail: string;
    avaliacao_media: number;
    total_alunos: number;
    score_recomendacao: number;
  }>;
  ranking_semanal: Array<{
    posicao: number;
    id_usuario: string;
    nm_nome: string;
    pontuacao: number;
    is_current_user: boolean;
  }>;
}

interface DashboardUniversidadeProps {
  idUsuario: string;
}

export function DashboardUniversidade({ idUsuario }: DashboardUniversidadeProps) {
  // Fetch dashboard data
  const { data: dashboard, isLoading } = useSWR<DashboardData>(
    `${UNIV_API_URL}/analytics/${idUsuario}/dashboard/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    { refreshInterval: 60000 } // Atualiza a cada 1 minuto
  );

  const calcularPercentualNivel = () => {
    if (!dashboard) return 0;
    const { xp_total, xp_proximo_nivel } = dashboard.gamificacao;
    const xpNivelAtual = xp_proximo_nivel * (dashboard.gamificacao.nivel - 1);
    const xpProgresso = xp_total - xpNivelAtual;
    return Math.min((xpProgresso / (xp_proximo_nivel - xpNivelAtual)) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              Erro ao carregar dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { progresso_geral, gamificacao, missoes_hoje, cursos_em_andamento, recomendacoes, ranking_semanal } = dashboard;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Hero */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-20">
          <Sparkles className="h-64 w-64" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-3xl flex items-center gap-3">
            <GraduationCap className="h-10 w-10" />
            Universidade da Beleza
          </CardTitle>
          <CardDescription className="text-white/90 text-lg mt-2">
            Continue sua jornada de aprendizado e alcance novos patamares!
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-5 w-5 text-orange-300" />
                <span className="text-sm">Sequência</span>
              </div>
              <div className="text-3xl font-bold">{progresso_geral.sequencia_dias}</div>
              <div className="text-xs text-white/80">dias consecutivos</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-5 w-5 text-yellow-300" />
                <span className="text-sm">Nível</span>
              </div>
              <div className="text-3xl font-bold">{gamificacao.nivel}</div>
              <Progress value={calcularPercentualNivel()} className="h-1 mt-2 bg-white/20" />
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-5 w-5 text-purple-300" />
                <span className="text-sm">XP Total</span>
              </div>
              <div className="text-3xl font-bold">{gamificacao.xp_total.toLocaleString()}</div>
              <div className="text-xs text-white/80">{gamificacao.xp_proximo_nivel - gamificacao.xp_total} para o próximo nível</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-5 w-5 text-yellow-300" />
                <span className="text-sm">Tokens</span>
              </div>
              <div className="text-3xl font-bold">{gamificacao.tokens.toLocaleString()}</div>
              <div className="text-xs text-white/80">moedas disponíveis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Cursos em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progresso_geral.cursos_iniciados}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {progresso_geral.cursos_concluidos} concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              Aulas Assistidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progresso_geral.aulas_assistidas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.floor(progresso_geral.total_minutos_estudo / 60)}h de estudo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gamificacao.badges_conquistados}</div>
            <p className="text-xs text-muted-foreground mt-1">badges desbloqueados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Medal className="h-4 w-4 text-yellow-600" />
              Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {gamificacao.posicao_ranking ? `#${gamificacao.posicao_ranking}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">posição semanal</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="continuar" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="continuar">Continuar</TabsTrigger>
          <TabsTrigger value="missoes">Missões</TabsTrigger>
          <TabsTrigger value="recomendacoes">Para Você</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="acoes">Ações Rápidas</TabsTrigger>
        </TabsList>

        {/* Continuar Estudando */}
        <TabsContent value="continuar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Continue de Onde Parou
              </CardTitle>
              <CardDescription>
                Retome seus cursos e mantenha o ritmo de estudos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cursos_em_andamento.length > 0 ? (
                <div className="space-y-4">
                  {cursos_em_andamento.map((inscricao) => (
                    <Card key={inscricao.id_inscricao} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <Badge variant="secondary" className="mb-2 text-xs">
                              {inscricao.curso.nm_categoria}
                            </Badge>
                            <CardTitle className="text-lg">{inscricao.curso.nm_titulo}</CardTitle>
                            <CardDescription className="text-xs mt-1 line-clamp-2">
                              {inscricao.curso.ds_descricao}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">
                              {inscricao.aulas_concluidas} de {inscricao.total_aulas} aulas
                            </span>
                          </div>
                          <Progress value={inscricao.percentual_concluido} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {inscricao.percentual_concluido.toFixed(0)}% concluído
                          </p>
                        </div>
                        {inscricao.ultima_aula && (
                          <Link href={`/universidade/aula/${inscricao.ultima_aula.id_aula}`}>
                            <Button className="w-full">
                              <Play className="h-4 w-4 mr-2" />
                              Continuar: {inscricao.ultima_aula.nm_titulo}
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum curso em andamento
                  </p>
                  <Link href="/universidade/cursos">
                    <Button className="mt-4">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Explorar Cursos
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Missões do Dia */}
        <TabsContent value="missoes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Missões de Hoje
                  </CardTitle>
                  <CardDescription>
                    Complete missões e ganhe XP e Tokens
                  </CardDescription>
                </div>
                <Link href="/universidade/missoes">
                  <Button variant="outline" size="sm">
                    Ver Todas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {missoes_hoje.length > 0 ? (
                <div className="space-y-3">
                  {missoes_hoje.slice(0, 3).map((missao) => {
                    const percentual = Math.min((missao.progresso_atual / missao.meta) * 100, 100);
                    return (
                      <Card key={missao.id_user_missao} className={missao.fg_concluida ? 'bg-green-50 border-green-200' : ''}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{missao.icone}</div>
                              <div>
                                <CardTitle className="text-sm">{missao.titulo}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  {missao.xp_recompensa > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      {missao.xp_recompensa} XP
                                    </Badge>
                                  )}
                                  {missao.tokens_recompensa > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Zap className="h-3 w-3 mr-1" />
                                      {missao.tokens_recompensa}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {missao.fg_concluida && (
                              <Badge variant="default" className="bg-green-600">
                                <Trophy className="h-3 w-3 mr-1" />
                                Completa
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        {!missao.fg_concluida && (
                          <CardContent>
                            <Progress value={percentual} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {missao.progresso_atual} / {missao.meta} - {percentual.toFixed(0)}%
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma missão ativa hoje</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recomendações */}
        <TabsContent value="recomendacoes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Recomendado Para Você
              </CardTitle>
              <CardDescription>
                Cursos selecionados com base no seu perfil e interesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recomendacoes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recomendacoes.slice(0, 4).map((curso) => (
                    <Card key={curso.id_curso} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <Badge variant="secondary" className="w-fit mb-2 text-xs">
                          {curso.nm_categoria}
                        </Badge>
                        <CardTitle className="text-base line-clamp-2">{curso.nm_titulo}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {curso.ds_descricao}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium">{curso.avaliacao_media.toFixed(1)}</span>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {curso.total_alunos} alunos
                          </span>
                        </div>
                        <Link href={`/universidade/curso/${curso.id_curso}`}>
                          <Button className="w-full" size="sm">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Ver Curso
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma recomendação disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking */}
        <TabsContent value="ranking" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Ranking Semanal
                  </CardTitle>
                  <CardDescription>
                    Veja sua posição entre os melhores alunos da semana
                  </CardDescription>
                </div>
                <Link href="/universidade/ranking">
                  <Button variant="outline" size="sm">
                    Ver Completo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {ranking_semanal.length > 0 ? (
                <div className="space-y-2">
                  {ranking_semanal.slice(0, 10).map((item) => (
                    <div
                      key={item.id_usuario}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        item.is_current_user ? 'bg-primary/10 border-2 border-primary' : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            item.posicao === 1
                              ? 'bg-yellow-500 text-white'
                              : item.posicao === 2
                              ? 'bg-gray-400 text-white'
                              : item.posicao === 3
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {item.posicao}
                        </div>
                        <span className={`font-medium ${item.is_current_user ? 'text-primary' : ''}`}>
                          {item.nm_nome}
                          {item.is_current_user && ' (Você)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{item.pontuacao.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ranking será atualizado em breve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ações Rápidas */}
        <TabsContent value="acoes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/universidade/cursos">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Explorar Cursos
                  </CardTitle>
                  <CardDescription>
                    Descubra novos cursos e expanda seus conhecimentos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/universidade/favoritos">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Meus Favoritos
                  </CardTitle>
                  <CardDescription>
                    Acesse seus cursos, aulas e instrutores favoritos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/universidade/notas">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Minhas Notas
                  </CardTitle>
                  <CardDescription>
                    Revise suas anotações de todas as aulas
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/universidade/conquistas">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    Conquistas
                  </CardTitle>
                  <CardDescription>
                    Veja seus badges e progresso nas conquistas
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/universidade/certificados">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-yellow-600" />
                    Certificados
                  </CardTitle>
                  <CardDescription>
                    Baixe e compartilhe seus certificados
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/universidade/eventos">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Eventos
                  </CardTitle>
                  <CardDescription>
                    Participe de webinars e workshops ao vivo
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
