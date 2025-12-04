"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  List,
  Grid3x3,
  CalendarDays,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAgendamentos } from "@/lib/api/hooks/useAgendamentos";
import { useProfissionais } from "@/lib/api/hooks/useProfissionais";
import { useProcedimentos } from "@/lib/api/hooks/useProcedimentos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WeeklyView,
  MonthlyView,
  NovoAgendamentoModal,
  AgendamentoModal,
  AgendamentosToolbar,
  ConfirmarReagendamentoModal,
} from "@/components/clinica/agendamentos";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { getAgendamentoCardClasses, getStatusBadgeColor } from "@/lib/utils/professionalColors";

type TipoVisualizacao = "dia" | "semana" | "mes";

export default function AgendamentosClinicaPage() {
  const { user } = useAuth();
  const [selectedView, setSelectedView] = useState<TipoVisualizacao>("dia");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>("todos");

  // Modals
  const [novoAgendamentoModalOpen, setNovoAgendamentoModalOpen] = useState(false);
  const [agendamentoModalOpen, setAgendamentoModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);

  // Modal de confirmação de reagendamento
  const [confirmarReagendamentoModalOpen, setConfirmarReagendamentoModalOpen] = useState(false);
  const [agendamentoParaReagendar, setAgendamentoParaReagendar] = useState<any>(null);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState<Date | null>(null);
  const [loadingReagendamento, setLoadingReagendamento] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<any>({});

  // Buscar ID da clínica do usuário
  const clinicaId = user?.id_clinica || null;

  // Buscar profissionais da clínica
  const { profissionais, isLoading: loadingProfissionais } = useProfissionais({
    id_clinica: clinicaId || undefined,
    st_ativo: true,
  });

  // Buscar procedimentos
  const { procedimentos, isLoading: loadingProcedimentos } = useProcedimentos({
    st_ativo: true,
  });

  // Calcular período baseado na visualização
  const periodo = useMemo(() => {
    if (selectedView === "dia") {
      const dia = format(currentDate, "yyyy-MM-dd");
      return { inicio: dia, fim: dia };
    } else if (selectedView === "semana") {
      const inicio = startOfWeek(currentDate, { weekStartsOn: 0 });
      const fim = endOfWeek(currentDate, { weekStartsOn: 0 });
      return {
        inicio: format(inicio, "yyyy-MM-dd"),
        fim: format(fim, "yyyy-MM-dd"),
      };
    } else {
      const inicio = startOfMonth(currentDate);
      const fim = endOfMonth(currentDate);
      return {
        inicio: format(inicio, "yyyy-MM-dd"),
        fim: format(fim, "yyyy-MM-dd"),
      };
    }
  }, [currentDate, selectedView]);

  // Parâmetros para buscar agendamentos
  const agendamentosParams = useMemo(() => ({
    id_clinica: clinicaId || undefined,
    id_profissional: selectedProfissionalId === "todos" ? undefined : selectedProfissionalId,
    data_inicio: periodo.inicio,
    data_fim: periodo.fim,
  }), [clinicaId, selectedProfissionalId, periodo]);

  console.log("🔍 DEBUG - Parâmetros useAgendamentos:", {
    selectedProfissionalId,
    params: agendamentosParams,
    periodo,
  });

  // Buscar agendamentos
  const { agendamentos, isLoading: loadingAgendamentos, mutate } = useAgendamentos(agendamentosParams);

  // Log dos dados retornados pela API
  useEffect(() => {
    if (agendamentos && agendamentos.length > 0) {
      console.log("📥 DEBUG - Dados retornados pela API:", {
        total: agendamentos.length,
        primeiroAgendamento: agendamentos[0],
        profissionaisNosAgendamentos: [...new Set(agendamentos.map(a => a.id_profissional))],
        agendamentosPorProfissional: agendamentos.reduce((acc: any, a: any) => {
          const prof = a.nm_profissional || "Sem nome";
          acc[prof] = (acc[prof] || 0) + 1;
          return acc;
        }, {}),
      });
    }
  }, [agendamentos]);

  const isLoading = loadingProfissionais || loadingAgendamentos;

  // Filtros base (para estatísticas) - SEM filtro de dia
  const agendamentosBase = useMemo(() => {
    let filtered = agendamentos || [];

    // Busca APENAS por nome do paciente
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter((a: any) => a.nm_paciente?.toLowerCase().includes(search));
    }

    if (filters.status) {
      filtered = filtered.filter((a: any) => a.ds_status === filters.status);
    }

    if (filters.procedimento) {
      filtered = filtered.filter((a: any) => a.id_procedimento === filters.procedimento);
    }

    return filtered;
  }, [agendamentos, filters]);

  // Filtros para visualização (inclui filtro de dia quando aplicável)
  const agendamentosFiltrados = useMemo(() => {
    let filtered = agendamentosBase;

    // Filtro adicional para visualização diária - apenas consultas do dia selecionado
    if (selectedView === "dia") {
      const diaAtual = format(currentDate, "yyyy-MM-dd");
      filtered = filtered.filter((a: any) => {
        const dataAgendamento = format(parseISO(a.dt_agendamento), "yyyy-MM-dd");
        return dataAgendamento === diaAtual;
      });
    }

    return filtered;
  }, [agendamentosBase, selectedView, currentDate]);

  // Determinar se deve usar cores de profissional
  // Usa cores quando "Todos os Profissionais" está selecionado E há múltiplos profissionais
  const useProfessionalColor = useMemo(() => {
    const shouldUse = selectedProfissionalId === "todos" && (profissionais?.length || 0) > 1;

    console.log("🎨 DEBUG - Sistema de Cores:", {
      selectedProfissionalId,
      profissionaisCount: profissionais?.length,
      shouldUse,
      profissionais: profissionais?.map(p => ({ id: p.id_profissional, name: p.nm_profissional })),
      agendamentosBase: agendamentosBase?.length,
      agendamentosFiltrados: agendamentosFiltrados?.length,
      agendamentosRaw: agendamentos?.length,
      periodo,
      selectedView,
    });

    return shouldUse;
  }, [selectedProfissionalId, profissionais, agendamentos, agendamentosFiltrados, agendamentosBase, periodo, selectedView]);

  // Calcular estatísticas (usa dados base, sem filtro de dia)
  const estatisticas = useMemo(() => {
    const total = agendamentosBase.length;
    const confirmados = agendamentosBase.filter(
      (a) => a.ds_status === "confirmado" || a.st_confirmado
    ).length;
    const pendentes = agendamentosBase.filter((a) => a.ds_status === "agendado").length;
    const concluidos = agendamentosBase.filter((a) => a.ds_status === "concluido").length;

    const faturamentoRealizado = agendamentosBase
      .filter((a) => a.ds_status === "concluido" && a.vl_valor)
      .reduce((acc, a) => acc + (a.vl_valor || 0), 0);

    const taxaOcupacao = total > 0 ? Math.round((confirmados / total) * 100) : 0;

    console.log("📊 DEBUG - Estatísticas Atualizadas:", {
      total,
      confirmados,
      pendentes,
      concluidos,
      faturamentoRealizado,
      taxaOcupacao,
      profissionalSelecionado: selectedProfissionalId,
      periodo,
    });

    return {
      total,
      confirmados,
      pendentes,
      concluidos,
      faturamentoRealizado,
      taxaOcupacao,
    };
  }, [agendamentosBase, selectedProfissionalId, periodo]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (selectedView === "dia") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (selectedView === "semana") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAgendamentoClick = (agendamento: any) => {
    setSelectedAgendamento(agendamento);
    setAgendamentoModalOpen(true);
  };

  const handleSuccess = () => {
    mutate();
  };

  // Handler de reagendamento - abre modal de confirmação
  const handleAgendamentoReschedule = (agendamento: any, novaData: Date) => {
    setAgendamentoParaReagendar(agendamento);
    setNovaDataReagendamento(novaData);
    setConfirmarReagendamentoModalOpen(true);
  };

  // Confirmar reagendamento - chama API
  const confirmarReagendamento = async () => {
    if (!agendamentoParaReagendar || !novaDataReagendamento) return;

    setLoadingReagendamento(true);

    try {
      const payload = {
        dt_agendamento: novaDataReagendamento.toISOString(),
      };

      await apiClient.put(`/agendamentos/${agendamentoParaReagendar.id_agendamento}`, payload);

      toast.success("Agendamento reagendado com sucesso!");
      mutate(); // Revalida dados
      setConfirmarReagendamentoModalOpen(false);
      setAgendamentoParaReagendar(null);
      setNovaDataReagendamento(null);
    } catch (error: any) {
      console.error("Erro ao reagendar:", error);
      toast.error(error?.response?.data?.detail || "Erro ao reagendar agendamento");
    } finally {
      setLoadingReagendamento(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Agendamentos da Clínica</h1>
              <p className="text-blue-100">Gerencie todos os agendamentos da sua clínica</p>
            </div>
          </div>

          {/* Seletor de Profissional */}
          <div className="mt-6 flex items-center space-x-3">
            <UserPlus className="h-5 w-5" />
            <span className="text-sm font-medium">Profissional:</span>
            <Select value={selectedProfissionalId} onValueChange={setSelectedProfissionalId}>
              <SelectTrigger className="w-64 bg-white/10 border-white/30 text-white">
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Profissionais</SelectItem>
                {profissionais?.map((prof: any) => (
                  <SelectItem key={prof.id_profissional} value={prof.id_profissional}>
                    {prof.nm_profissional}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total</p>
                  <p className="text-3xl font-bold">{estatisticas.total}</p>
                </div>
                <Calendar className="h-8 w-8 opacity-50" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Confirmados</p>
                  <p className="text-3xl font-bold">{estatisticas.confirmados}</p>
                </div>
                <Users className="h-8 w-8 opacity-50" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Taxa de Ocupação</p>
                  <p className="text-3xl font-bold">{estatisticas.taxaOcupacao}%</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-50" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Faturamento</p>
                  <p className="text-2xl font-bold">
                    R$ {estatisticas.faturamentoRealizado.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <Clock className="h-8 w-8 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Toolbar com filtros e ações */}
        <AgendamentosToolbar
          filters={filters}
          onFiltersChange={setFilters}
          onNovoAgendamento={() => setNovoAgendamentoModalOpen(true)}
          procedimentos={procedimentos}
          totalAgendamentos={agendamentosFiltrados.length}
        />

        {/* Navegação e seletor de visualização */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-lg font-semibold min-w-[200px] text-center">
              {selectedView === "dia" && format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              {selectedView === "semana" && `Semana de ${format(currentDate, "dd MMM", { locale: ptBR })}`}
              {selectedView === "mes" && format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </div>

            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={selectedView === "dia" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("dia")}
            >
              <List className="h-4 w-4 mr-2" />
              Dia
            </Button>
            <Button
              variant={selectedView === "semana" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("semana")}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Semana
            </Button>
            <Button
              variant={selectedView === "mes" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("mes")}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Mês
            </Button>
          </div>
        </div>

        {/* Visualizações */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando agendamentos...</p>
            </div>
          </div>
        ) : selectedView === "dia" ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {agendamentosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum agendamento encontrado para este dia</p>
                </div>
              ) : (
                agendamentosFiltrados.map((agendamento: any) => {
                  const cardClasses = getAgendamentoCardClasses(
                    agendamento.id_profissional,
                    agendamento.ds_status,
                    useProfessionalColor
                  );
                  const statusColor = getStatusBadgeColor(agendamento.ds_status);

                  return (
                    <div
                      key={agendamento.id_agendamento}
                      onClick={() => handleAgendamentoClick(agendamento)}
                      className={`flex items-center justify-between p-4 rounded-lg border-l-4 hover:shadow-md cursor-pointer transition-all ${cardClasses}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="font-semibold">
                            {format(new Date(agendamento.dt_agendamento), "HH:mm")}
                          </span>
                          <span className="text-sm text-gray-600">•</span>
                          <span className="text-sm">{agendamento.nm_paciente || "Paciente"}</span>
                          <span className="text-sm text-gray-600">•</span>
                          <span className="text-sm text-gray-600">{agendamento.nm_profissional}</span>
                        </div>
                        {agendamento.ds_observacoes && (
                          <p className="text-sm text-gray-600 mt-1">{agendamento.ds_observacoes}</p>
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${statusColor}`} title={agendamento.ds_status} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : selectedView === "semana" ? (
          <WeeklyView
            agendamentos={agendamentosFiltrados}
            currentDate={currentDate}
            profissionais={profissionais || []}
            useProfessionalColor={useProfessionalColor}
            onAgendamentoClick={handleAgendamentoClick}
            onAgendamentoReschedule={handleAgendamentoReschedule}
          />
        ) : (
          <MonthlyView
            agendamentos={agendamentosFiltrados}
            currentDate={currentDate}
            profissionais={profissionais || []}
            useProfessionalColor={useProfessionalColor}
            onDayClick={(date) => {
              setCurrentDate(date);
              setSelectedView("dia");
            }}
            onAgendamentoClick={handleAgendamentoClick}
          />
        )}
      </div>

      {/* Modals */}
      <NovoAgendamentoModal
        open={novoAgendamentoModalOpen}
        onClose={() => setNovoAgendamentoModalOpen(false)}
        onSuccess={handleSuccess}
        initialDate={currentDate}
        clinicaId={clinicaId || ""}
        profissionalIdInicial={selectedProfissionalId === "todos" ? undefined : selectedProfissionalId}
      />

      {selectedAgendamento && (
        <AgendamentoModal
          open={agendamentoModalOpen}
          onClose={() => {
            setAgendamentoModalOpen(false);
            setSelectedAgendamento(null);
          }}
          agendamento={selectedAgendamento}
          onSuccess={handleSuccess}
        />
      )}

      <ConfirmarReagendamentoModal
        open={confirmarReagendamentoModalOpen}
        onClose={() => {
          setConfirmarReagendamentoModalOpen(false);
          setAgendamentoParaReagendar(null);
          setNovaDataReagendamento(null);
        }}
        onConfirm={confirmarReagendamento}
        agendamento={agendamentoParaReagendar}
        novaData={novaDataReagendamento}
        loading={loadingReagendamento}
      />
    </div>
  );
}
