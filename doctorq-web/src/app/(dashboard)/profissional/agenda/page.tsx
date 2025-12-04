"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Filter,
  Download,
  Settings,
  List,
  Grid3x3,
  CalendarDays,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TipoVisualizacao, BloqueioAgenda, type Agendamento } from "@/types/agenda";
import { toast } from "sonner";
import { AppointmentModal } from "@/components/agenda/AppointmentModal";
import { WeeklyView } from "@/components/agenda/WeeklyView";
import { BlockedTimeModal } from "@/components/agenda/BlockedTimeModal";
import { MonthlyView } from "@/components/agenda/MonthlyView";
import { useAgendamentos, criarAgendamento, type AgendamentoListItem } from "@/lib/api/hooks/useAgendamentos";
import { useMemo } from "react";

export default function AgendaPage() {
  const [selectedView, setSelectedView] = useState<TipoVisualizacao>("semana");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([]);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showBlockedTimeModal, setShowBlockedTimeModal] = useState(false);

  // Calcular filtros de data baseado na visualização
  const filtros = useMemo(() => {
    const date = new Date(currentDate);
    let data_inicio: string;
    let data_fim: string;

    if (selectedView === "dia") {
      data_inicio = date.toISOString().split("T")[0];
      data_fim = data_inicio;
    } else if (selectedView === "semana") {
      // Início da semana (domingo)
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      data_inicio = startOfWeek.toISOString().split("T")[0];

      // Fim da semana (sábado)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      data_fim = endOfWeek.toISOString().split("T")[0];
    } else {
      // Mês
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      data_inicio = startOfMonth.toISOString().split("T")[0];
      data_fim = endOfMonth.toISOString().split("T")[0];
    }

    return {
      data_inicio,
      data_fim,
      page: 1,
      size: 100,
    };
  }, [currentDate, selectedView]);

  // Usar hook SWR para buscar agendamentos
  const { agendamentos: agendamentosApi, isLoading, isError, error } = useAgendamentos(filtros);

  // Converter dados da API para formato dos componentes
  const agendamentos = useMemo((): Agendamento[] => {
    if (!agendamentosApi) return [];

    return agendamentosApi.map((ag) => {
      // Calcular hr_inicio e hr_fim a partir de dt_agendamento
      const dt = new Date(ag.dt_agendamento);
      const hr_inicio = dt.toTimeString().slice(0, 5);
      const hrFim = new Date(dt.getTime() + ag.nr_duracao_minutos * 60000);
      const hr_fim = hrFim.toTimeString().slice(0, 5);

      // Gerar cores aleatórias para procedimentos (será substituído por dados reais da API)
      const cores = ["#3B82F6", "#A855F7", "#10B981", "#EC4899", "#F59E0B"];
      const cor = cores[Math.floor(Math.random() * cores.length)];

      return {
        id_agendamento: ag.id_agendamento,
        id_paciente: ag.id_paciente || "",
        id_profissional: ag.id_profissional || "",
        id_procedimento: ag.id_procedimento,
        dt_agendamento: ag.dt_agendamento.split("T")[0],
        hr_inicio,
        hr_fim,
        nr_duracao_minutos: ag.nr_duracao_minutos,
        st_status: ag.ds_status as any,
        ds_observacoes: ag.ds_observacoes,
        bo_primeira_vez: false, // TODO: adicionar no backend
        bo_confirmado_sms: ag.st_confirmado,
        bo_confirmado_whatsapp: ag.st_confirmado,
        dt_criacao: ag.dt_agendamento,
        dt_atualizacao: ag.dt_agendamento,
        id_usuario_criacao: "",
        paciente: {
          id_paciente: ag.id_paciente || "",
          nm_completo: ag.nm_paciente || "Paciente não informado",
          nr_telefone: "",
          nm_email: "",
        },
        procedimento: {
          id_procedimento: ag.id_procedimento || "",
          nm_procedimento: ag.nm_procedimento || "Procedimento não informado",
          nr_duracao_minutos: ag.nr_duracao_minutos,
          vl_preco: ag.vl_procedimento || 0,
          ds_cor_hex: cor,
        },
      };
    });
  }, [agendamentosApi]);

  // Exibir erros
  useEffect(() => {
    if (isError && error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agenda");
    }
  }, [isError, error]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);

    if (selectedView === "dia") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (selectedView === "semana") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (selectedView === "mes") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSaveAppointment = async (newAgendamento: Partial<Agendamento>) => {
    try {
      // Converter para formato da API
      // NOTA: Precisa ajustar conforme os dados reais disponíveis no modal
      // Por enquanto, usar valores mockados para id_clinica e id_profissional
      const agendamentoData = {
        id_paciente: newAgendamento.id_paciente || "",
        id_profissional: newAgendamento.id_profissional || "prof1", // TODO: obter do contexto do usuário
        id_clinica: "clinic1", // TODO: obter do contexto do usuário
        id_procedimento: newAgendamento.id_procedimento,
        dt_agendamento: `${newAgendamento.dt_agendamento}T${newAgendamento.hr_inicio}:00`,
        nr_duracao_minutos: newAgendamento.nr_duracao_minutos || 60,
        ds_observacoes: newAgendamento.ds_observacoes,
        vl_valor: newAgendamento.procedimento?.vl_preco,
      };

      await criarAgendamento(agendamentoData as any);
      toast.success("Agendamento criado com sucesso!");
      setShowNewAppointmentModal(false);
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao criar agendamento");
    }
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setCurrentDate(date);
    setShowNewAppointmentModal(true);
  };

  const handleAppointmentClick = (agendamento: Agendamento) => {
    toast.info(`Agendamento: ${agendamento.paciente?.nm_completo}`);
    // Futuramente: abrir modal de edição
  };

  const handleSaveBlockedTime = (bloqueio: Partial<BloqueioAgenda>) => {
    const newBloqueio = bloqueio as BloqueioAgenda;
    setBloqueios([...bloqueios, newBloqueio]);
    setShowBlockedTimeModal(false);
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "long",
      year: "numeric",
    };

    if (selectedView === "mes") {
      return currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    } else if (selectedView === "semana") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${endOfWeek.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("pt-BR", options);
    }
  };

  const getStatusColor = (status: Agendamento["st_status"]) => {
    const colors = {
      confirmado: "bg-green-100 text-green-700 border-green-300",
      pendente: "bg-amber-100 text-amber-700 border-amber-300",
      cancelado: "bg-red-100 text-red-700 border-red-300",
      concluido: "bg-blue-100 text-blue-700 border-blue-300",
      nao_compareceu: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return colors[status] || colors.pendente;
  };

  const getStatusText = (status: Agendamento["st_status"]) => {
    const texts = {
      confirmado: "Confirmado",
      pendente: "Pendente",
      cancelado: "Cancelado",
      concluido: "Concluído",
      nao_compareceu: "Não Compareceu",
    };
    return texts[status] || "Pendente";
  };

  // Estatísticas calculadas dinamicamente
  const estatisticas = useMemo(() => {
    const total = agendamentos.length;
    const confirmados = agendamentos.filter((a) => a.st_status === "confirmado").length;
    const pendentes = agendamentos.filter((a) => a.st_status === "pendente").length;
    const concluidos = agendamentos.filter((a) => a.st_status === "concluido").length;
    const cancelados = agendamentos.filter((a) => a.st_status === "cancelado").length;
    const noShows = agendamentos.filter((a) => a.st_status === "nao_compareceu").length;

    const faturamentoPrevisto = agendamentos
      .filter((a) => a.st_status !== "cancelado" && a.st_status !== "nao_compareceu")
      .reduce((sum, a) => sum + (a.procedimento?.vl_preco || 0), 0);

    const faturamentoRealizado = agendamentos
      .filter((a) => a.st_status === "concluido")
      .reduce((sum, a) => sum + (a.procedimento?.vl_preco || 0), 0);

    return {
      dt_referencia: currentDate.toISOString().split("T")[0],
      nr_total_agendamentos: total,
      nr_agendamentos_confirmados: confirmados,
      nr_agendamentos_pendentes: pendentes,
      nr_agendamentos_concluidos: concluidos,
      nr_cancelamentos: cancelados,
      nr_no_shows: noShows,
      vl_faturamento_previsto: faturamentoPrevisto,
      vl_faturamento_realizado: faturamentoRealizado,
      nr_taxa_ocupacao_percentual: total > 0 ? Math.round((confirmados / total) * 100) : 0,
      nr_tempo_medio_procedimento_minutos: total > 0
        ? Math.round(agendamentos.reduce((sum, a) => sum + a.nr_duracao_minutos, 0) / total)
        : 0,
      procedimentos_mais_agendados: [],
    };
  }, [agendamentos, currentDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center space-x-3">
                  <Calendar className="h-8 w-8" />
                  <span>Agenda Inteligente</span>
                </h1>
                <p className="text-white/80 mt-1">Gerencie seus agendamentos e otimize seu tempo</p>
              </div>
              <Button
                onClick={() => setShowNewAppointmentModal(true)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </div>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.nr_total_agendamentos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmados</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.nr_agendamentos_confirmados}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Faturamento Previsto</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(estatisticas.vl_faturamento_previsto)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taxa de Ocupação</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.nr_taxa_ocupacao_percentual}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Navigation */}
                <div className="flex items-center space-x-2">
                  <Button onClick={() => navigateDate("prev")} variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={goToToday} variant="outline" size="sm">
                    Hoje
                  </Button>
                  <Button onClick={() => navigateDate("next")} variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="ml-4">
                    <h2 className="text-lg font-bold text-gray-900">{formatDateHeader()}</h2>
                  </div>
                </div>

                {/* View Selector */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setSelectedView("dia")}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        selectedView === "dia"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <List className="h-4 w-4" />
                        <span>Dia</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedView("semana")}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        selectedView === "semana"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <Grid3x3 className="h-4 w-4" />
                        <span>Semana</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedView("mes")}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        selectedView === "mes"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <CalendarDays className="h-4 w-4" />
                        <span>Mês</span>
                      </div>
                    </button>
                  </div>

                  <Button
                    onClick={() => setShowBlockedTimeModal(true)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Bloquear Horário
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Link href="/profissional/agenda/configuracoes">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Calendar View */}
            <div className="p-6">
              {selectedView === "dia" && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Mostrando {agendamentos.length} agendamento(s) para hoje
                  </div>
                  {agendamentos.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum agendamento</h3>
                      <p className="text-gray-600 mb-6">Não há agendamentos para este dia</p>
                      <Button
                        onClick={() => setShowNewAppointmentModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Agendamento
                      </Button>
                    </div>
                  ) : (
                    agendamentos.map((agendamento) => (
                      <div
                        key={agendamento.id_agendamento}
                        className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                        style={{
                          borderLeftWidth: "6px",
                          borderLeftColor: agendamento.procedimento?.ds_cor_hex || "#3B82F6",
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            {/* Foto do Paciente */}
                            {agendamento.paciente?.ds_foto_url ? (
                              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                  src={agendamento.paciente.ds_foto_url}
                                  alt={agendamento.paciente.nm_completo}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Users className="h-8 w-8 text-white" />
                              </div>
                            )}

                            {/* Informações */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {agendamento.paciente?.nm_completo}
                                </h3>
                                {agendamento.bo_primeira_vez && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                    Primeira Vez
                                  </span>
                                )}
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(agendamento.st_status)}`}>
                                  {getStatusText(agendamento.st_status)}
                                </span>
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {agendamento.hr_inicio} - {agendamento.hr_fim}
                                  </span>
                                  <span className="text-gray-400">({agendamento.nr_duracao_minutos} min)</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: agendamento.procedimento?.ds_cor_hex || "#3B82F6" }}
                                />
                                <span className="font-semibold text-gray-900">
                                  {agendamento.procedimento?.nm_procedimento}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(agendamento.procedimento?.vl_preco || 0)}
                                </span>
                              </div>

                              {agendamento.ds_observacoes && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-600">
                                    <strong>Observações:</strong> {agendamento.ds_observacoes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              Editar
                            </Button>
                            <Button size="sm" variant="outline">
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedView === "semana" && (
                <div className="h-[600px]">
                  <WeeklyView
                    currentDate={currentDate}
                    agendamentos={agendamentos}
                    onSlotClick={handleSlotClick}
                    onAppointmentClick={handleAppointmentClick}
                  />
                </div>
              )}

              {selectedView === "mes" && (
                <div className="h-[700px]">
                  <MonthlyView
                    currentDate={currentDate}
                    agendamentos={agendamentos}
                    bloqueios={bloqueios}
                    onDayClick={(date) => handleSlotClick(date, 9)}
                    onAppointmentClick={handleAppointmentClick}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Modal de Novo Agendamento */}
      <AppointmentModal
          isOpen={showNewAppointmentModal}
          onClose={() => setShowNewAppointmentModal(false)}
          onSave={handleSaveAppointment}
          selectedDate={currentDate}
        />

      {/* Modal de Bloqueio de Horário */}
      <BlockedTimeModal
          isOpen={showBlockedTimeModal}
          onClose={() => setShowBlockedTimeModal(false)}
          onSave={handleSaveBlockedTime}
      />
    </div>
  );
}
