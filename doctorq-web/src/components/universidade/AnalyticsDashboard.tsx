/**
 * Dashboard de Analytics Avançado
 * Exibe métricas, insights e progresso detalhado
 */
'use client';

import { TrendingUp, Target, Clock, Zap, Award, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useSWR from 'swr';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

interface DashboardData {
  estatisticas: {
    total_cursos_inscritos: number;
    total_cursos_concluidos: number;
    cursos_em_andamento: number;
    xp_total: number;
    nivel: number;
    total_badges: number;
    saldo_tokens: number;
    taxa_conclusao: number;
  };
  progresso_semanal: {
    aulas_assistidas: number;
    xp_ganho: number;
    dias_ativos: number;
    meta_semanal: number;
    percentual_meta: number;
  };
  tempo_estudo: {
    total_minutos: number;
    total_horas: number;
    media_diaria_minutos: number;
    tempo_formatado: string;
  };
  proximos_marcos: Array<{
    tipo: string;
    titulo: string;
    descricao: string;
    progresso_percentual: number;
    icone: string;
  }>;
  insights: Array<{
    tipo: 'info' | 'alerta' | 'sucesso' | 'dica';
    titulo: string;
    mensagem: string;
    acao: string | null;
    icone: string;
  }>;
}

export function AnalyticsDashboard() {
  const { data, isLoading } = useSWR<DashboardData>(
    `${UNIV_API_URL}/analytics/dashboard/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { estatisticas, progresso_semanal, tempo_estudo, proximos_marcos, insights } = data;

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = insight.tipo === 'alerta' ? AlertCircle : insight.tipo === 'sucesso' ? CheckCircle2 : Info;
            const variant = insight.tipo === 'alerta' ? 'destructive' : 'default';

            return (
              <Alert key={idx} variant={variant as any} className="border-l-4">
                <Icon className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  <span>{insight.icone}</span>
                  {insight.titulo}
                </AlertTitle>
                <AlertDescription>{insight.mensagem}</AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Progresso Semanal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Progresso desta Semana
              </CardTitle>
              <CardDescription>Meta: {progresso_semanal.meta_semanal} aulas</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {progresso_semanal.aulas_assistidas}
              </div>
              <div className="text-xs text-muted-foreground">aulas assistidas</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progresso_semanal.percentual_meta} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>{progresso_semanal.percentual_meta.toFixed(0)}% da meta</span>
            <span>+{progresso_semanal.xp_ganho} XP esta semana</span>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Marcos */}
      {proximos_marcos && proximos_marcos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Próximos Marcos
            </CardTitle>
            <CardDescription>Continue assim para desbloquear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proximos_marcos.map((marco, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{marco.icone}</span>
                      <div>
                        <div className="font-medium text-sm">{marco.titulo}</div>
                        <div className="text-xs text-muted-foreground">{marco.descricao}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {marco.progresso_percentual.toFixed(0)}%
                    </div>
                  </div>
                  <Progress value={marco.progresso_percentual} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas de Tempo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tempo_estudo.tempo_formatado}</div>
            <p className="text-xs text-muted-foreground mt-1">de estudo acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tempo_estudo.media_diaria_minutos} min</div>
            <p className="text-xs text-muted-foreground mt-1">últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.taxa_conclusao}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.total_cursos_concluidos} de {estatisticas.total_cursos_inscritos} cursos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
