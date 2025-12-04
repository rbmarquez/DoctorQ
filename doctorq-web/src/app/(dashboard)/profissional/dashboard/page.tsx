import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, DollarSign, TrendingUp, Clock, Star, Activity } from 'lucide-react';
import { LoadingState } from '@/components/shared/feedback/LoadingState';
import { getProfissionalDashboardStats, getAgendaDia, formatCurrency } from '@/lib/api/server';
import { getProfissionalId } from '@/lib/auth/session';

// Forçar renderização dinâmica devido ao uso de headers()
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Painel Profissional | DoctorQ',
  description: 'Dashboard do profissional com métricas e agenda',
};

async function getDashboardStats() {
  try {
    const profissionalId = await getProfissionalId();
    if (profissionalId) {
      return await getProfissionalDashboardStats(profissionalId);
    }
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
  }

  // Retornar valores zerados se não conseguir buscar
  return {
    atendimentos_hoje: 0,
    pacientes_ativos: 0,
    faturamento_mes: 0,
    satisfacao_media: 0,
    taxa_ocupacao: 0,
  };
}

async function getAgendaHoje() {
  try {
    const profissionalId = await getProfissionalId();
    if (profissionalId) {
      const response = await getAgendaDia(profissionalId);
      return response.items;
    }
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
  }

  // Retornar array vazio se não conseguir buscar
  return [];
}

function StatsCards({ stats }: { stats: Awaited<ReturnType<typeof getDashboardStats>> }) {
  const cards = [
    { label: 'Atendimentos Hoje', value: stats.atendimentos_hoje, icon: Calendar, color: 'from-blue-500 to-indigo-600', change: '+2 vs ontem' },
    { label: 'Pacientes Ativos', value: stats.pacientes_ativos, icon: Users, color: 'from-purple-500 to-blue-600', change: '+8 este mês' },
    { label: 'Faturamento Mês', value: `R$ ${(stats.faturamento_mes / 1000).toFixed(1)}k`, icon: DollarSign, color: 'from-green-500 to-emerald-600', change: '+12% vs anterior' },
    { label: 'Satisfação Média', value: stats.satisfacao_media.toFixed(1), icon: Star, color: 'from-orange-500 to-red-600', change: '⭐⭐⭐⭐⭐' },
    { label: 'Taxa de Ocupação', value: `${stats.taxa_ocupacao}%`, icon: TrendingUp, color: 'from-cyan-500 to-blue-600', change: '+5% vs semana' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-green-600 mt-1">{card.change}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Ver Agenda', icon: Calendar, href: '/profissional/agenda', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Meus Pacientes', icon: Users, href: '/profissional/pacientes', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Financeiro', icon: DollarSign, href: '/profissional/financeiro', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Prontuários', icon: Activity, href: '/profissional/prontuarios', color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <a key={action.label} href={action.href} className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3`}>
            <Icon className="w-5 h-5" />
            <span className="font-semibold">{action.label}</span>
          </a>
        );
      })}
    </div>
  );
}

async function AgendaHoje() {
  const agenda = await getAgendaHoje();

  const statusColors: Record<string, string> = {
    confirmado: 'bg-blue-100 text-blue-700 border-blue-200',
    em_atendimento: 'bg-green-100 text-green-700 border-green-200',
    agendado: 'bg-gray-100 text-gray-700 border-gray-200',
    concluido: 'bg-green-100 text-green-700 border-green-200',
    cancelado: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    confirmado: 'Confirmado',
    em_atendimento: 'Em Atendimento',
    agendado: 'Agendado',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Agenda de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {agenda.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Nenhum agendamento para hoje</p>
            <a href="/profissional/agenda" className="text-blue-600 hover:text-blue-700 text-xs mt-2 inline-block">
              Ver agenda completa →
            </a>
          </div>
        ) : (
          <>
            {agenda.map((item: any) => (
          <div key={item.id_agendamento} className={`p-4 rounded-lg border ${statusColors[item.ds_status] || statusColors.agendado}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-gray-900">{item.hr_inicio}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[item.ds_status] || statusColors.agendado}`}>
                    {statusLabels[item.ds_status] || 'Agendado'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900">{item.paciente?.nm_completo || 'Paciente'}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.nm_procedimento}</p>
                <p className="text-xs text-gray-500 mt-1">Duração: {item.nr_duracao || 60}min</p>
              </div>
            </div>
          </div>
            ))}
            <a href="/profissional/agenda" className="block text-center text-blue-600 hover:text-blue-700 font-semibold text-sm mt-4">
              Ver agenda completa →
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}

async function DesempenhoCard() {
  const profissionalId = await getProfissionalId();

  // Stats com valores padrão caso não consiga buscar
  let totalAgendamentos = 0;
  let faturamentoMes = 0;
  let avaliacaoMedia = 0;
  let totalAvaliacoes = 0;

  if (profissionalId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const mesAtual = new Date().toISOString().slice(0, 7);
      const primeiroDiaMes = `${mesAtual}-01`;

      // Buscar stats reais do backend
      const { getProfissionalStats } = await import('@/lib/api/server');
      const stats = await getProfissionalStats(profissionalId, primeiroDiaMes, today);

      totalAgendamentos = stats.total_agendamentos;
      faturamentoMes = stats.receita_total;
      avaliacaoMedia = stats.avaliacao_media;
      totalAvaliacoes = stats.avaliacoes_positivas + stats.avaliacoes_neutras + stats.avaliacoes_negativas;
    } catch (error) {
      console.error('Erro ao buscar desempenho:', error);
    }
  }

  // Calcular percentuais (assumindo metas: 200 atendimentos, R$ 20k receita)
  const metaAtendimentos = 200;
  const metaReceita = 20000;
  const percAtendimentos = Math.min(100, Math.round((totalAgendamentos / metaAtendimentos) * 100));
  const percReceita = Math.min(100, Math.round((faturamentoMes / metaReceita) * 100));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Desempenho do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Atendimentos</span>
              <span className="text-lg font-bold text-blue-600">{totalAgendamentos}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percAtendimentos}%` }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{percAtendimentos}% da meta mensal ({metaAtendimentos})</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Receita</span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(faturamentoMes)}</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${percReceita}%` }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{percReceita}% da meta mensal ({formatCurrency(metaReceita)})</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Avaliações</span>
              <span className="text-lg font-bold text-orange-600">
                {avaliacaoMedia > 0 ? avaliacaoMedia.toFixed(1) : '0.0'} ⭐
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {totalAvaliacoes > 0 ? `Baseado em ${totalAvaliacoes} avaliações` : 'Nenhuma avaliação ainda'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ProfissionalDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-8">
        <PageHeader title="Painel Profissional" description="Acompanhe suas métricas e agenda do dia" />
        <StatsCards stats={stats} />
        <QuickActions />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<LoadingState message="Carregando agenda..." />}>
              <AgendaHoje />
            </Suspense>
          </div>
          <Suspense fallback={<LoadingState message="Carregando desempenho..." />}>
            <DesempenhoCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
