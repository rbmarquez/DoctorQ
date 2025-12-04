'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilas } from '@/lib/api/hooks/central-atendimento/useFilas';
import { useCampanhas } from '@/lib/api/hooks/central-atendimento/useCampanhas';
import { useCentralAtendimento } from '@/lib/api/hooks/central-atendimento/useCentralAtendimento';
import {
  Users,
  MessageSquare,
  Clock,
  TrendingUp,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Headphones,
  Activity,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardCentralAtendimento() {
  const { filas, isLoading: filasLoading } = useFilas();
  const { campanhas, isLoading: campanhasLoading } = useCampanhas();
  const { conversas, isLoading: conversasLoading } = useCentralAtendimento();

  const [metricas, setMetricas] = useState({
    conversasAbertas: 0,
    aguardandoAtendimento: 0,
    emAtendimento: 0,
    atendidosHoje: 0,
    tempoMedioEspera: 0,
    tempoMedioAtendimento: 0,
    taxaSatisfacao: 0,
    campanhasAtivas: 0,
  });

  // Calcular métricas
  useEffect(() => {
    const abertas = conversas.filter(c => c.st_aberta).length;
    const aguardando = conversas.filter(c => c.st_aguardando_humano).length;
    const bot = conversas.filter(c => c.st_bot_ativo && !c.st_aguardando_humano).length;
    const campanhasAtivas = campanhas.filter(c => c.st_campanha === 'em_andamento').length;

    setMetricas({
      conversasAbertas: abertas,
      aguardandoAtendimento: aguardando,
      emAtendimento: abertas - aguardando - bot,
      atendidosHoje: 0, // TODO: calcular do backend
      tempoMedioEspera: 0,
      tempoMedioAtendimento: 0,
      taxaSatisfacao: 4.5,
      campanhasAtivas,
    });
  }, [conversas, campanhas]);

  const isLoading = filasLoading || campanhasLoading || conversasLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Dashboard - Central de Atendimento
          </h1>
          <p className="text-muted-foreground">
            Visão geral das métricas e performance do atendimento
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversas Abertas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.conversasAbertas}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +12% em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Atendimento</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metricas.aguardandoAtendimento}</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio: {metricas.tempoMedioEspera}min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Headphones className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metricas.emAtendimento}</div>
            <p className="text-xs text-muted-foreground">
              {filas.length} filas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metricas.campanhasAtivas}</div>
            <p className="text-xs text-muted-foreground">
              {campanhas.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status das Filas */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Filas de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma fila configurada
              </p>
            ) : (
              filas.slice(0, 5).map((fila) => (
                <div key={fila.id_fila} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${fila.st_ativa ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">{fila.nm_fila}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {fila.nr_atendimentos_simultaneos} slots
                  </Badge>
                </div>
              ))
            )}
            <Link href="/admin/central-atendimento/filas">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Ver todas as filas
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Conversas Recentes */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma conversa ativa
              </p>
            ) : (
              conversas.slice(0, 5).map((conversa) => (
                <div key={conversa.id_conversa} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      conversa.st_aguardando_humano ? 'bg-orange-500' :
                      conversa.st_bot_ativo ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm truncate max-w-[120px]">
                      {conversa.contato?.nm_contato || 'Desconhecido'}
                    </span>
                  </div>
                  <Badge variant={conversa.st_aguardando_humano ? 'destructive' : 'secondary'} className="text-xs">
                    {conversa.st_aguardando_humano ? 'Aguardando' : conversa.st_bot_ativo ? 'Bot' : 'Ativo'}
                  </Badge>
                </div>
              ))
            )}
            <Link href="/admin/central-atendimento">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Ver todas as conversas
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Campanhas */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Campanhas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campanhas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma campanha criada
              </p>
            ) : (
              campanhas.slice(0, 5).map((campanha) => (
                <div key={campanha.id_campanha} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      campanha.st_campanha === 'em_andamento' ? 'bg-green-500' :
                      campanha.st_campanha === 'pausada' ? 'bg-orange-500' :
                      campanha.st_campanha === 'finalizada' ? 'bg-gray-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-sm truncate max-w-[120px]">{campanha.nm_campanha}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {campanha.nr_enviados}/{campanha.nr_total_destinatarios}
                  </Badge>
                </div>
              ))
            )}
            <Link href="/admin/central-atendimento/campanhas">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Ver todas as campanhas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Links rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link href="/admin/central-atendimento">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Conversas</span>
              </Button>
            </Link>
            <Link href="/admin/central-atendimento/canais">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Phone className="h-5 w-5" />
                <span className="text-xs">Canais</span>
              </Button>
            </Link>
            <Link href="/admin/central-atendimento/filas">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Users className="h-5 w-5" />
                <span className="text-xs">Filas</span>
              </Button>
            </Link>
            <Link href="/admin/central-atendimento/campanhas">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Target className="h-5 w-5" />
                <span className="text-xs">Campanhas</span>
              </Button>
            </Link>
            <Link href="/admin/central-atendimento/relatorios">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">Relatórios</span>
              </Button>
            </Link>
            <Link href="/admin/central-atendimento/configuracoes">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Activity className="h-5 w-5" />
                <span className="text-xs">Configurações</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
