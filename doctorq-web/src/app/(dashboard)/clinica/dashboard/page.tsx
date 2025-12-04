"use client";

import { useMemo } from "react";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Activity,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfissionais } from "@/lib/api/hooks/useProfissionais";
import { useAgendamentos } from "@/lib/api/hooks/useAgendamentos";

export default function ClinicaDashboardPage() {
  const { user } = useAuth();

  // Buscar ID da clínica do usuário
  const clinicaId = user?.id_clinica || null;

  // Buscar profissionais da clínica
  const { profissionais, isLoading: loadingProfissionais } = useProfissionais({
    id_clinica: clinicaId || undefined,
    st_ativo: true,
  });

  // Calcular data de hoje
  const hoje = new Date().toISOString().split('T')[0];

  // Buscar agendamentos de hoje
  const { agendamentos: agendamentosHoje, isLoading: loadingAgendamentos } = useAgendamentos({
    id_clinica: clinicaId || undefined,
    data_inicio: hoje,
    data_fim: hoje,
  });

  // Buscar agendamentos do mês
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const fimMes = new Date();
  fimMes.setMonth(fimMes.getMonth() + 1, 0);

  const { agendamentos: agendamentosMes, isLoading: loadingAgendamentosMes } = useAgendamentos({
    id_clinica: clinicaId || undefined,
    data_inicio: inicioMes.toISOString().split('T')[0],
    data_fim: fimMes.toISOString().split('T')[0],
  });

  const isLoading = loadingProfissionais || loadingAgendamentos || loadingAgendamentosMes;

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = agendamentosHoje.length;
    const confirmados = agendamentosHoje.filter(
      (a) => a.ds_status === 'confirmado' || a.st_confirmado
    ).length;

    // Calcular receita do dia
    const receitaHoje = agendamentosHoje
      .filter((a) => a.ds_status === 'concluido' && a.vl_valor)
      .reduce((acc, a) => acc + (a.vl_valor || 0), 0);

    // Calcular avaliação média dos profissionais
    const avaliacaoMedia = profissionais.length > 0
      ? profissionais.reduce((acc, p) => acc + (p.vl_avaliacao_media || 0), 0) / profissionais.length
      : 0;

    const totalAvaliacoes = profissionais.reduce((acc, p) => acc + (p.nr_total_avaliacoes || 0), 0);

    return [
      {
        label: "Agendamentos Hoje",
        value: total.toString(),
        icon: Calendar,
        color: "from-blue-500 to-indigo-600",
        change: `+${confirmados}`,
        changeLabel: "confirmados",
        trend: "up",
      },
      {
        label: "Profissionais Ativos",
        value: profissionais.length.toString(),
        icon: Users,
        color: "from-green-500 to-emerald-600",
        change: "+12",
        changeLabel: "este mês",
        trend: "up",
      },
      {
        label: "Faturamento Hoje",
        value: `R$ ${receitaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        icon: DollarSign,
        color: "from-purple-500 to-blue-600",
        change: "+18%",
        changeLabel: "vs ontem",
        trend: "up",
      },
      {
        label: "Avaliação Média",
        value: avaliacaoMedia.toFixed(1),
        icon: Star,
        color: "from-yellow-500 to-orange-600",
        change: totalAvaliacoes.toString(),
        changeLabel: "avaliações",
        trend: "neutral",
      },
    ];
  }, [agendamentosHoje, profissionais]);

  // Próximos agendamentos
  const nextAppointments = useMemo(() => {
    return agendamentosHoje
      .sort((a, b) => new Date(a.dt_agendamento).getTime() - new Date(b.dt_agendamento).getTime())
      .slice(0, 3)
      .map((agendamento) => ({
        time: new Date(agendamento.dt_agendamento).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        patient: agendamento.nm_paciente || 'Paciente não identificado',
        procedure: agendamento.nm_procedimento || 'Procedimento não especificado',
        duration: "30min",
        status: (agendamento.ds_status === 'confirmado' || agendamento.st_confirmado) ? "confirmado" : "pendente",
      }));
  }, [agendamentosHoje]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.nm_completo?.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid - KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.trend === "up"
              ? ArrowUpRight
              : stat.trend === "down"
              ? ArrowDownRight
              : Activity;

          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {stat.trend !== "neutral" && (
                  <div
                    className={`flex items-center space-x-1 ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-xs font-semibold">{stat.change}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-gray-500">
                {stat.trend === "neutral" ? stat.change + " " : ""}
                {stat.changeLabel}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column - Appointments (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Next Appointments */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Próximos Agendamentos</h2>
                <p className="text-sm text-gray-600 mt-1">Hoje, {new Date().getDate()} de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {nextAppointments.map((apt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{apt.patient}</p>
                      <p className="text-sm text-gray-600 truncate">{apt.procedure}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-gray-500">{apt.duration}</p>
                        <span className="text-xs text-gray-400">•</span>
                        {apt.status === "confirmado" ? (
                          <span className="inline-flex items-center space-x-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Confirmado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-xs text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-lg font-bold text-gray-900">{apt.time}</p>
                    <button className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium">
                      Ver detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {nextAppointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Nenhum agendamento para hoje</p>
                <p className="text-sm text-gray-500">Aproveite para organizar sua agenda!</p>
              </div>
            )}
          </div>

          {/* Revenue Chart */}
          <RevenueChart />
        </div>

        {/* Right Column - Sidebar (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mini Calendar */}
          <MiniCalendar />

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 text-left bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all hover:shadow-md group">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Ver Agenda Completa</span>
                </div>
              </button>
              <button className="w-full px-4 py-3 text-left bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all hover:shadow-md group">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Gerenciar Profissionais</span>
                </div>
              </button>
              <button className="w-full px-4 py-3 text-left bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-all hover:shadow-md group">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Relatório Financeiro</span>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Notificações</h3>
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-yellow-900">5 novas mensagens</p>
                <p className="text-xs text-yellow-700 mt-1">Pacientes aguardando resposta</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-blue-900">3 avaliações pendentes</p>
                <p className="text-xs text-blue-700 mt-1">Responda para manter o perfil ativo</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-green-900">2 confirmações necessárias</p>
                <p className="text-xs text-green-700 mt-1">Agendamentos aguardando confirmação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
