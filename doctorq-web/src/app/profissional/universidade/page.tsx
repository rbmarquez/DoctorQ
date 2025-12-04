/**
 * Dashboard do Aluno - Universidade da Beleza
 * Área autenticada com cursos inscritos, progresso, gamificação
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Award, Trophy, Zap, TrendingUp, Clock, PlayCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useMinhasInscricoes,
  useMeuProgresso,
  useMeusBadges,
  useMeusTokens,
  formatPreco,
  getNivelLabel,
} from '@/lib/api/hooks/useUniversidade';
import { AnalyticsDashboard } from '@/components/universidade/AnalyticsDashboard';
import { RecomendacoesWidget } from '@/components/universidade/RecomendacoesWidget';
import { MissoesDiariasWidget } from '@/components/universidade/MissoesDiariasWidget';

export default function UniversidadeAlunoPage() {
  const { data: inscricoes, isLoading: inscricoesLoading } = useMinhasInscricoes();
  const { data: progresso } = useMeuProgresso();
  const { data: badges } = useMeusBadges();
  const { data: tokens } = useMeusTokens();

  // Calcular stats
  const cursosEmAndamento = inscricoes?.filter((i) => i.status === 'cursando').length || 0;
  const cursosConcluidos = inscricoes?.filter((i) => i.status === 'concluido').length || 0;
  const totalXP = progresso?.xp_total || 0;
  const nivel = progresso?.nivel || 1;
  const saldoTokens = tokens?.saldo || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Universidade da Beleza</h1>
              <p className="text-muted-foreground mt-1">Sua jornada de aprendizado</p>
            </div>
            <Button asChild>
              <Link href="/universidade/cursos">Explorar Cursos</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* XP Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">XP Total</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalXP.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Nível {nivel}</p>
              <Progress value={(totalXP % 1000) / 10} className="mt-2" />
            </CardContent>
          </Card>

          {/* Cursos em Andamento */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursosEmAndamento}</div>
              <p className="text-xs text-muted-foreground">
                {cursosEmAndamento === 1 ? 'curso ativo' : 'cursos ativos'}
              </p>
            </CardContent>
          </Card>

          {/* Cursos Concluídos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursosConcluidos}</div>
              <p className="text-xs text-muted-foreground">
                {cursosConcluidos === 1 ? 'curso finalizado' : 'cursos finalizados'}
              </p>
            </CardContent>
          </Card>

          {/* Tokens */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens $ESTQ</CardTitle>
              <Trophy className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{saldoTokens.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Disponíveis para uso</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cursos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cursos">Meus Cursos</TabsTrigger>
            <TabsTrigger value="missoes">🎯 Missões Diárias</TabsTrigger>
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="badges">Badges & Conquistas</TabsTrigger>
            <TabsTrigger value="progresso">Progresso</TabsTrigger>
          </TabsList>

          {/* Missões Diárias */}
          <TabsContent value="missoes" className="space-y-6">
            <MissoesDiariasWidget />
            <RecomendacoesWidget />
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
            <RecomendacoesWidget />
          </TabsContent>

          {/* Meus Cursos */}
          <TabsContent value="cursos" className="space-y-4">
            {inscricoesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando cursos...</p>
              </div>
            ) : inscricoes && inscricoes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inscricoes.map((inscricao) => (
                  <Card key={inscricao.id_inscricao} className="group hover:shadow-lg transition-shadow">
                    {/* Thumbnail */}
                    <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                      {inscricao.curso?.thumbnail_url ? (
                        <img
                          src={inscricao.curso.thumbnail_url}
                          alt={inscricao.curso.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-6xl opacity-20">🎓</span>
                        </div>
                      )}

                      {/* Badge de Status */}
                      <div className="absolute top-2 right-2">
                        {inscricao.status === 'concluido' ? (
                          <Badge variant="default" className="bg-green-500">
                            Concluído
                          </Badge>
                        ) : inscricao.status === 'cursando' ? (
                          <Badge variant="secondary">Em Andamento</Badge>
                        ) : (
                          <Badge variant="outline">Não Iniciado</Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="line-clamp-2">
                        {inscricao.curso?.titulo || 'Curso sem título'}
                      </CardTitle>
                      <CardDescription>
                        {inscricao.curso?.instrutor_nome && `Prof. ${inscricao.curso.instrutor_nome}`}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progresso */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">
                            {inscricao.progresso_percentual?.toFixed(0) || 0}%
                          </span>
                        </div>
                        <Progress value={inscricao.progresso_percentual || 0} />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" />
                          <span>{inscricao.total_aulas_assistidas || 0} aulas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{inscricao.tempo_total_minutos || 0} min</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Button asChild className="w-full">
                        <Link href={`/profissional/universidade/curso/${inscricao.id_curso}`}>
                          {inscricao.status === 'concluido'
                            ? 'Revisar Curso'
                            : inscricao.progresso_percentual && inscricao.progresso_percentual > 0
                            ? 'Continuar Assistindo'
                            : 'Começar Curso'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum curso inscrito</h3>
                  <p className="text-muted-foreground mb-6">
                    Explore nosso catálogo e comece sua jornada de aprendizado
                  </p>
                  <Button asChild>
                    <Link href="/universidade/cursos">Explorar Cursos</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Badges & Conquistas */}
          <TabsContent value="badges" className="space-y-4">
            {badges && badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <Card key={badge.id_badge} className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-6xl mb-3">{badge.badge_info?.icone || '🏆'}</div>
                      <div className="font-semibold">{badge.badge_info?.nome || 'Badge'}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {badge.badge_info?.descricao}
                      </div>
                      {badge.dt_conquista && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Conquistado em {new Date(badge.dt_conquista).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum badge conquistado</h3>
                  <p className="text-muted-foreground">
                    Complete cursos e desafios para ganhar badges
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progresso */}
          <TabsContent value="progresso" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* XP Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de XP</CardTitle>
                  <CardDescription>Seu progresso de experiência</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Nível Atual</span>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {nivel}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso para próximo nível</span>
                      <span className="font-semibold">{(totalXP % 1000).toLocaleString()} / 1.000 XP</span>
                    </div>
                    <Progress value={(totalXP % 1000) / 10} className="h-3" />
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-3xl font-bold text-primary">{totalXP.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">XP Total Acumulado</div>
                  </div>
                </CardContent>
              </Card>

              {/* Token Balance */}
              <Card>
                <CardHeader>
                  <CardTitle>Saldo de Tokens</CardTitle>
                  <CardDescription>Tokens $ESTQ disponíveis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                    <div className="text-4xl font-bold text-amber-500">
                      {saldoTokens.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Tokens $ESTQ</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Use seus tokens para:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Desbloquear cursos premium</li>
                      <li>Acesso exclusivo a eventos</li>
                      <li>Trocar por produtos no marketplace</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
