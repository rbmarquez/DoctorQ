"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Sparkles, MapPin, Star, Award, Calendar, ArrowLeft, Search, LayoutGrid, LayoutList, Heart, Clock, CalendarDays, Filter, ChevronDown, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LeadInfoForm } from "@/components/forms/LeadInfoForm";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

interface ProfissionalMatch {
  profissional: {
    id_profissional: string;
    id_clinica?: string;
    nm_profissional: string;
    ds_especialidades: string[];
    ds_biografia: string;
    ds_foto?: string;
    nr_avaliacao_media?: number;
    nr_total_avaliacoes: number;
    nr_anos_experiencia?: number;
    nm_clinica?: string;
    clinica_cidade?: string;
    clinica_estado?: string;
  };
  score_compatibilidade: number;
  ds_justificativa: string;
}

interface BuscaInteligenteResponse {
  profissionais: ProfissionalMatch[];
  ds_resumo_analise: string;
  total_encontrados: number;
}

// Tipos para Agenda
interface ScheduleSlot {
  id: string;
  time: string;
  available: boolean;
}

interface ScheduleDay {
  date: string;
  slots: ScheduleSlot[];
}

// Tipo do backend para horário disponível
interface HorarioDisponivel {
  dt_horario: string; // ISO datetime
  disponivel: boolean;
  motivo?: string | null;
}

interface ScheduleConfirmationPayload {
  professionalId: string;
  professionalName: string;
  specialty?: string;
  clinicId?: string;
  clinicName?: string;
  location?: string;
  date: string;
  time: string;
  slotId: string;
  visitPrice?: number;
}

interface FiltersState {
  minPrice: number;
  maxPrice: number;
  rating: number;
  disponivel: boolean;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: FiltersState = {
  minPrice: 0,
  maxPrice: 1000,
  rating: 0,
  disponivel: false,
  dateFrom: "",
  dateTo: "",
};

// Helper function para formatar data
function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  return {
    weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }),
    day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: date.toLocaleDateString("pt-BR", { month: "short" }),
  };
}

// Componente de Agenda do Profissional
function ProfessionalSchedule({
  agenda,
  professionalId,
  professionalName,
  professionalSpecialty,
  professionalLocation,
  clinicId,
  clinicName,
  consultationPrice,
  onConfirmSchedule,
}: {
  agenda: ScheduleDay[];
  professionalId: string;
  professionalName: string;
  professionalSpecialty?: string;
  professionalLocation?: string;
  clinicId?: string;
  clinicName?: string;
  consultationPrice?: number;
  onConfirmSchedule: (payload: ScheduleConfirmationPayload) => void | Promise<void>;
}) {
  const MAX_VISIBLE_SLOTS = 5;
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [showAllSlots, setShowAllSlots] = useState(false);

  useEffect(() => {
    const firstAvailable = agenda[selectedDayIndex]?.slots.find((slot) => slot.available);
    setSelectedSlot(firstAvailable || null);
    setShowAllSlots(false);
  }, [agenda, selectedDayIndex]);

  const handleSelectSlot = (slot: ScheduleSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
  };

  // Filtrar apenas horários disponíveis
  const currentSlots = (agenda[selectedDayIndex]?.slots ?? []).filter(slot => slot.available);
  const hasHiddenSlots = currentSlots.length > MAX_VISIBLE_SLOTS;
  const slotsToRender = showAllSlots ? currentSlots : currentSlots.slice(0, MAX_VISIBLE_SLOTS);

  const handleAgendar = async () => {
    if (!selectedSlot) return;

    const selectedDay = agenda[selectedDayIndex];
    await onConfirmSchedule({
      professionalId,
      professionalName,
      specialty: professionalSpecialty,
      clinicId,
      clinicName: clinicName ?? professionalLocation,
      location: professionalLocation,
      date: selectedDay.date,
      time: selectedSlot.time,
      slotId: selectedSlot.id,
      visitPrice: consultationPrice,
    });
  };

  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-purple-50/60 to-blue-50/80 p-3 shadow-inner">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700 text-white shadow-lg shadow-purple-200/70">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-500">
              Agenda digital
            </p>
            <h4 className="text-sm font-semibold text-gray-900">Disponibilidade imediata</h4>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>

      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        {agenda.map((day, index) => {
          const { weekday, day: dayNumber, month } = formatDateLabel(day.date);
          const isSelected = index === selectedDayIndex;
          const availableCount = day.slots.filter((slot) => slot.available).length;

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDayIndex(index)}
              className={`flex min-w-[90px] flex-col rounded-xl border px-2 py-1.5 transition-all ${
                isSelected
                  ? "border-purple-500 bg-white shadow-lg shadow-purple-100"
                  : "border-transparent bg-white/60 hover:border-purple-300 hover:bg-white"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-400">
                {weekday}
              </span>
              <span className="text-xl font-bold text-gray-900">{dayNumber}</span>
              <span className="text-[10px] uppercase text-gray-400">{month}</span>
              <span className="mt-1 text-[10px] font-medium text-gray-500">
                {availableCount} {availableCount === 1 ? "horário" : "horários"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {slotsToRender.map((slot) => {
          const isActive = selectedSlot?.id === slot.id;
          return (
            <button
              key={slot.id}
              onClick={() => handleSelectSlot(slot)}
              className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-all ${
                slot.available
                  ? isActive
                    ? "border-purple-500 bg-white text-purple-600 shadow-md shadow-purple-100"
                    : "border-transparent bg-white/70 text-gray-700 hover:border-purple-300 hover:bg-white"
                  : "cursor-not-allowed border-transparent bg-gray-100 text-gray-400"
              }`}
              disabled={!slot.available}
            >
              <span className="font-semibold text-sm">{slot.time}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  slot.available
                    ? isActive
                      ? "bg-purple-100 text-purple-600"
                      : "bg-green-100 text-green-600"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {slot.available ? (isActive ? "Selecionado" : "Disponível") : "Indisponível"}
              </span>
            </button>
          );
        })}

        {hasHiddenSlots && (
          <button
            type="button"
            onClick={() => setShowAllSlots((previous) => !previous)}
            className="mt-0.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
          >
            {showAllSlots ? "Mostrar menos horários" : "Mostrar mais horários"}
          </button>
        )}
      </div>

      <Button
        onClick={handleAgendar}
        disabled={!selectedSlot}
        className="mt-2 w-full h-9 text-sm bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 text-white shadow-lg shadow-purple-200 transition hover:from-purple-700 hover:via-cyan-600 hover:to-purple-800 disabled:from-gray-200 disabled:via-gray-300 disabled:to-gray-200 disabled:text-gray-500"
      >
        Agendar horário selecionado
      </Button>
    </div>
  );
}

export default function BuscaInteligentePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false); // Inicializado como false
  const [resultados, setResultados] = useState<BuscaInteligenteResponse | null>(null);
  const [leadData, setLeadData] = useState<Record<string, any> | null>(null);
  const [novaBusca, setNovaBusca] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list"); // Modo de visualização
  const [currentPage, setCurrentPage] = useState(1); // Página atual
  const ITEMS_PER_PAGE = 15; // 15 profissionais por página

  // Estados para agenda
  const [profissionaisAgendas, setProfissionaisAgendas] = useState<Record<string, ScheduleDay[]>>({});
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPayload, setBookingPayload] = useState<ScheduleConfirmationPayload | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Estados para filtros
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para modal de lead
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [necessidadeTexto, setNecessidadeTexto] = useState("");

  useEffect(() => {
    // Limpar dados antigos do localStorage ao carregar a página
    // A página sempre começa vazia, sem resultados
    // Usuário deve clicar em "Buscar com IA" e preencher o formulário de lead
    localStorage.removeItem("busca_lead_data");
  }, []);

  const realizarBuscaInteligente = async (lead: Record<string, any>) => {
    setLoading(true);

    try {
      const response = await fetch("/api/profissionais/busca-inteligente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          respostas_lead: lead,
          nm_cidade: lead.cidade || null,
          nm_estado: lead.estado || null,
          limit: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao buscar profissionais");
      }

      const data: BuscaInteligenteResponse = await response.json();
      setResultados(data);

      toast.success(`${data.total_encontrados} profissionais encontrados!`);
    } catch (error: any) {
      console.error("Erro na busca inteligente:", error);
      toast.error(error.message || "Erro ao realizar busca inteligente");
    } finally {
      setLoading(false);
    }
  };

  // Buscar agendas de múltiplos profissionais de uma vez (otimizado)
  const fetchProfessionalsAgendas = async (professionalIds: string[]) => {
    if (professionalIds.length === 0) return;

    try {
      const today = new Date();
      const startOffset = today.getHours() >= 17 ? 1 : 0;
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + startOffset);

      const dataInicio = startDate.toISOString().split("T")[0];

      // Usar endpoint batch otimizado (1 requisição para N profissionais)
      const response = await apiClient.post<Array<{ id_profissional: string; horarios: HorarioDisponivel[] }>>(
        endpoints.agendamentos.disponibilidadeBatch,
        {
          ids_profissionais: professionalIds,
          data_inicio: dataInicio,
          num_dias: 7,
          duracao_minutos: 60
        }
      );

      // Transformar resposta no formato esperado (agrupar horários por data)
      const newAgendas: Record<string, ScheduleDay[]> = {};

      response.forEach((profDisponibilidade) => {
        const horariosPorData = new Map<string, HorarioDisponivel[]>();

        // Agrupar horários por data
        profDisponibilidade.horarios.forEach((horario) => {
          const dataKey = new Date(horario.dt_horario).toISOString().split("T")[0];
          if (!horariosPorData.has(dataKey)) {
            horariosPorData.set(dataKey, []);
          }
          horariosPorData.get(dataKey)!.push(horario);
        });

        // Converter para formato ScheduleDay[]
        const scheduleDays: ScheduleDay[] = Array.from(horariosPorData.entries()).map(([date, horarios]) => ({
          date,
          slots: horarios.map((h) => ({
            id: `${profDisponibilidade.id_profissional}-${h.dt_horario}`,
            time: new Date(h.dt_horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            available: h.disponivel
          }))
        }));

        newAgendas[profDisponibilidade.id_profissional] = scheduleDays;
      });

      setProfissionaisAgendas((prev) => ({
        ...prev,
        ...newAgendas
      }));
    } catch (error) {
      console.error(`Erro ao buscar agendas em batch:`, error);
    }
  };

  // Confirmar agendamento
  const handleConfirmSchedule = async (payload: ScheduleConfirmationPayload) => {
    setBookingPayload(payload);
    setBookingModalOpen(true);
  };

  // Criar agendamento na API
  const handleConfirmarAgendamento = async () => {
    if (!bookingPayload || !session?.user) {
      toast.error("Dados de agendamento incompletos");
      return;
    }

    setBookingLoading(true);

    try {
      // Combinar data e hora em um datetime ISO
      const [hours, minutes] = bookingPayload.time.split(':');
      const agendamentoDate = new Date(bookingPayload.date);
      agendamentoDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const requestBody = {
        id_paciente: session.user.id, // ID do usuário logado
        id_profissional: bookingPayload.professionalId,
        id_clinica: bookingPayload.clinicId,
        id_procedimento: null, // Opcional - pode ser implementado depois
        dt_agendamento: agendamentoDate.toISOString(),
        nr_duracao_minutos: 60, // Padrão de 60 minutos
        ds_motivo: null,
        ds_observacoes: `Agendamento via Busca Inteligente - ${bookingPayload.specialty || 'Consulta'}`,
        vl_valor: bookingPayload.visitPrice || null,
        ds_forma_pagamento: null,
      };

      // Usar API route do Next.js que tem permissões corretas
      const response = await fetch("/api/agendamentos/criar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar agendamento");
      }

      const data = await response.json();

      if (data) {
        toast.success("Agendamento confirmado com sucesso!");
        setBookingModalOpen(false);
        setBookingPayload(null);
        router.push("/paciente/agendamentos");
      }
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);

      // Mensagens de erro específicas
      if (error?.message?.includes("não encontrada")) {
        toast.error("Clínica não encontrada. Por favor, tente novamente.");
      } else if (error?.message?.includes("permissão")) {
        toast.error("Você não tem permissão para criar agendamentos.");
      } else if (error?.message?.includes("disponibilidade")) {
        toast.error("Horário não disponível. Por favor, escolha outro horário.");
      } else {
        toast.error(error?.message || "Erro ao confirmar agendamento. Tente novamente.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAgendar = (profissionalId: string) => {
    // Redirecionar para página de agendamento
    router.push(`/paciente/agendamentos/novo?profissional_id=${profissionalId}`);
  };

  const handleVoltar = () => {
    router.push("/busca");
  };

  const handleNovaBusca = () => {
    // Validar se o usuário preencheu o campo
    if (!novaBusca.trim() && !necessidadeTexto.trim()) {
      toast.error("Por favor, descreva o que você procura antes de continuar");
      return;
    }

    // Abrir modal de lead ao invés de fazer busca direta
    setNecessidadeTexto(novaBusca.trim());
    setLeadModalOpen(true);
  };

  const handleLeadSubmit = async (respostas: Record<string, any>) => {
    try {
      // Incluir necessidade/objetivo do paciente nos dados do lead
      const dadosCompletos = {
        ...respostas,
        necessidade_descrita: necessidadeTexto.trim() || novaBusca.trim() || null,
        objetivo_principal: necessidadeTexto.trim() || novaBusca.trim() || null,
      };

      // Salvar no localStorage
      localStorage.setItem("busca_lead_data", JSON.stringify(dadosCompletos));
      setLeadData(dadosCompletos);

      toast.success("Iniciando busca inteligente com IA...");

      // Fechar modal
      setLeadModalOpen(false);

      // Resetar página para 1
      setCurrentPage(1);

      // Realizar busca inteligente
      await realizarBuscaInteligente(dadosCompletos);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      toast.error("Erro ao iniciar busca inteligente");
    }
    setNovaBusca(""); // Limpar campo após busca
  };

  // Aplicar filtros aos resultados da IA
  const profissionaisFiltrados = useMemo(() => {
    if (!resultados) return [];

    let filtered = [...resultados.profissionais];

    // Filtro por avaliação mínima
    if (filters.rating > 0) {
      filtered = filtered.filter((match) => (match.profissional.nr_avaliacao_media || 0) >= filters.rating);
    }

    // Filtro por disponibilidade (se tem agenda disponível)
    if (filters.disponivel) {
      filtered = filtered.filter((match) => {
        const agenda = profissionaisAgendas[match.profissional.id_profissional];
        return agenda && agenda.some((day) => day.slots.some((slot) => slot.available));
      });
    }

    // Filtros de preço (se implementado no backend - futuramente)
    // if (filters.minPrice > 0) {
    //   filtered = filtered.filter((match) => (match.vl_consulta || 0) >= filters.minPrice);
    // }
    // if (filters.maxPrice > 0 && filters.maxPrice < 1000) {
    //   filtered = filtered.filter((match) => (match.vl_consulta || 0) <= filters.maxPrice);
    // }

    // Filtro por data (se tem disponibilidade no período)
    if (filters.dateFrom && filters.dateTo) {
      const startDate = new Date(filters.dateFrom);
      const endDate = new Date(filters.dateTo);

      filtered = filtered.filter((match) => {
        const agenda = profissionaisAgendas[match.profissional.id_profissional];
        if (!agenda) return false;

        return agenda.some((day) => {
          const dayDate = new Date(day.date);
          return dayDate >= startDate && dayDate <= endDate && day.slots.some((slot) => slot.available);
        });
      });
    }

    return filtered;
  }, [resultados, filters, profissionaisAgendas]);

  // Calcular profissionais para a página atual (após filtragem)
  const totalPages = Math.ceil(profissionaisFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const profissionaisPaginados = profissionaisFiltrados.slice(startIndex, endIndex);

  // Memorizar IDs dos profissionais paginados que ainda não têm agenda
  const profissionaisIdsSemAgenda = useMemo(() => {
    return profissionaisPaginados
      .map(match => match.profissional.id_profissional)
      .filter(id => !profissionaisAgendas[id]);
  }, [profissionaisPaginados, profissionaisAgendas]);

  // Buscar agendas em batch dos profissionais paginados (otimizado)
  useEffect(() => {
    if (profissionaisIdsSemAgenda.length > 0) {
      fetchProfessionalsAgendas(profissionaisIdsSemAgenda);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionaisIdsSemAgenda.length]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.6) return "text-blue-600 bg-blue-100";
    if (score >= 0.4) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "Altíssima Compatibilidade";
    if (score >= 0.6) return "Alta Compatibilidade";
    if (score >= 0.4) return "Boa Compatibilidade";
    return "Compatibilidade Razoável";
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Analisando seu perfil com IA
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            A Gisele está buscando os profissionais mais compatíveis com suas necessidades...
          </p>
        </div>
      </div>
    );
  }

  // Se NÃO houver resultados ainda (estado inicial), mostrar apenas o card de busca
  // A renderização principal (com o card de busca) será feita abaixo no return normal

  // Se houver resultados mas estiverem vazios (busca executada sem resultados), mostrar mensagem de erro
  if (resultados !== null && resultados.total_encontrados === 0) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum profissional encontrado
              </h2>
              <p className="text-gray-600 mb-6">
                Não encontramos profissionais compatíveis com seu perfil neste momento.
              </p>
              <Button onClick={handleVoltar} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para busca
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-cyan-50 to-purple-50">
      {/* Header Inovador com Gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white shadow-2xl">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <Button
            onClick={handleVoltar}
            variant="ghost"
            className="mb-3 text-white hover:bg-white/20 hover:text-white border-white/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-xl border border-white/30">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">
                  Busca Inteligente com IA Gisele
                </h1>
                <p className="text-purple-100 text-base md:text-lg">
                  {resultados ? "Profissionais selecionados especialmente para você" : "Encontre os profissionais ideais para suas necessidades"}
                </p>
              </div>
            </div>
            {resultados && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/30">
                <Award className="h-5 w-5" />
                <span className="font-bold text-lg">{resultados.total_encontrados}</span>
                <span className="text-sm">Matches</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 -mt-8 pb-12">
        {/* Campo de Busca - Flutuante e em Destaque */}
        <Card className="border-none bg-white shadow-2xl mb-8 overflow-hidden transform hover:scale-[1.01] transition-transform">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
          <CardContent className="p-6">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    ✨ Refinar Busca com IA
                  </h2>
                  <p className="text-gray-600">
                    Descreva uma nova necessidade e encontre profissionais perfeitos
                  </p>
                </div>
              </div>

              {/* Campo de busca */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative group">
                  <Input
                    type="text"
                    placeholder="Ex: Quero reduzir manchas no rosto, fazer harmonização facial..."
                    value={novaBusca}
                    onChange={(e) => setNovaBusca(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNovaBusca()}
                    className="h-14 text-base pl-5 pr-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-sm group-hover:shadow-md transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-5 w-5" />
                  </div>
                </div>
                <Button
                  onClick={handleNovaBusca}
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all h-14 px-8 rounded-xl"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Buscar com IA
                </Button>
              </div>

              {/* Sugestões */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  Sugestões Populares:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { emoji: "💆", text: "Quero reduzir rugas e linhas de expressão", label: "Reduzir rugas" },
                    { emoji: "✨", text: "Eliminar manchas e melhorar a textura da pele", label: "Melhorar pele" },
                    { emoji: "👁️", text: "Remover olheiras e rejuvenescer o olhar", label: "Olheiras" },
                    { emoji: "💋", text: "Fazer preenchimento labial", label: "Preenchimento" },
                    { emoji: "🎨", text: "Harmonização facial completa", label: "Harmonização" },
                  ].map((sugestao, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNovaBusca(sugestao.text)}
                      className="text-sm px-4 py-2 rounded-full bg-white border-2 border-purple-200 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-purple-400 hover:scale-105 transition-all shadow-sm hover:shadow-md font-medium"
                    >
                      <span className="mr-1.5">{sugestao.emoji}</span>
                      {sugestao.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros Avançados - Dentro do mesmo card */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors w-full"
                >
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span>Filtros Avançados</span>
                  {(filters.rating || filters.disponivel || filters.dateFrom || filters.dateTo) && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {[filters.rating, filters.disponivel, filters.dateFrom, filters.dateTo].filter(Boolean).length}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 ml-auto transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Filtros Expandidos */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {/* Avaliação */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Avaliação</label>
                      <div className="flex gap-1">
                        {[5, 4, 3].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? 0 : rating })}
                            className={`flex-1 flex items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg text-xs transition-all ${
                              filters.rating === rating
                                ? "bg-blue-500 text-white shadow-md"
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                            }`}
                          >
                            <Star className={`h-3 w-3 ${filters.rating === rating ? 'fill-white' : 'fill-yellow-400 text-yellow-400'}`} />
                            <span className="text-xs font-medium">{rating}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preço Min (desabilitado por enquanto) */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Preço Min</label>
                      <Input
                        type="number"
                        placeholder="R$ 0"
                        value={filters.minPrice || ""}
                        onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                        className="h-8 text-xs px-2"
                        disabled={true}
                        title="Filtro de preço em desenvolvimento"
                      />
                    </div>

                    {/* Preço Max (desabilitado por enquanto) */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Preço Max</label>
                      <Input
                        type="number"
                        placeholder="R$ 10k"
                        value={filters.maxPrice || ""}
                        onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                        className="h-8 text-xs px-2"
                        disabled={true}
                        title="Filtro de preço em desenvolvimento"
                      />
                    </div>

                    {/* Data De */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">De</label>
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="h-8 text-xs px-2"
                      />
                    </div>

                    {/* Data Até */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Até</label>
                      <Input
                        type="date"
                        value={filters.dateTo}
                        min={filters.dateFrom || undefined}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="h-8 text-xs px-2"
                      />
                    </div>

                    {/* Disponível */}
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer h-8 bg-white px-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors w-full">
                        <input
                          type="checkbox"
                          checked={filters.disponivel}
                          onChange={(e) => setFilters({ ...filters, disponivel: e.target.checked })}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700 font-medium">Disponível</span>
                      </label>
                    </div>

                    {/* Botão Limpar Filtros */}
                    {(filters.rating || filters.disponivel || filters.dateFrom || filters.dateTo) && (
                      <div className="col-span-full flex justify-end mt-2">
                        <Button
                          onClick={() => setFilters(DEFAULT_FILTERS)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Limpar Filtros
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da análise - Design moderno (só aparece quando houver resultados) */}
        {resultados && (
          <Card className="border-none bg-white shadow-lg mb-8 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-400 to-blue-400"></div>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    📊 Análise da IA
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{resultados.ds_resumo_analise}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de profissionais - Layout Inovador (só aparece quando houver resultados) */}
      {resultados && (
        <div className="container max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                <Star className="h-5 w-5 text-white" />
              </div>
              Profissionais Recomendados
              <span className="text-sm font-normal text-gray-500">
                ({profissionaisFiltrados.length} {profissionaisFiltrados.length === 1 ? 'resultado' : 'resultados'}
                {profissionaisFiltrados.length !== resultados.total_encontrados &&
                  ` de ${resultados.total_encontrados}`})
              </span>
            </h2>

          {/* Toggle de visualização */}
          <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              <span className="text-sm font-medium">Lista</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-sm font-medium">Grade</span>
            </button>
          </div>
        </div>

        {/* Visualização em Lista */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {profissionaisPaginados.map((match, index) => {
              const prof = match.profissional;
              const score = match.score_compatibilidade;
              const globalIndex = startIndex + index; // Índice global para ranking

              return (
                <Card
                  key={prof.id_profissional}
                  className="group rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="grid gap-6 lg:grid-cols-[120px,minmax(0,1fr)] lg:items-start">
                    {/* Avatar do profissional */}
                    <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-sm sm:h-28 sm:w-28 lg:h-32 lg:w-full">
                      {prof.ds_foto ? (
                        <img src={prof.ds_foto} alt={prof.nm_profissional} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-white md:text-4xl">
                          {prof.nm_profissional.charAt(0)}
                        </span>
                      )}
                      {globalIndex < 3 && (
                        <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg border-3 border-white">
                          <span className="text-white font-bold text-sm">#{globalIndex + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Conteúdo - Informações do profissional */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1.5">
                          {/* Nome + Score */}
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                              {prof.nm_profissional}
                            </h3>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-sm shadow-md ${getScoreColor(score)}`}>
                              <Sparkles className="h-4 w-4" />
                              {(score * 100).toFixed(0)}%
                            </div>
                          </div>

                          {/* Especialidades */}
                          <div className="flex flex-wrap gap-2">
                            {prof.ds_especialidades?.map((esp) => (
                              <Badge
                                key={esp}
                                className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200"
                              >
                                {esp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {prof.ds_biografia && (
                        <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">
                          {prof.ds_biografia}
                        </p>
                      )}

                      {/* Justificativa da IA */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-400 rounded-r-lg p-3">
                        <p className="text-sm text-gray-800">
                          <strong className="text-purple-700 flex items-center gap-2 mb-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            Por que este profissional é compatível:
                          </strong>
                          {match.ds_justificativa}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                        {/* Avaliação */}
                        {prof.nr_avaliacao_media && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                            <span className="font-semibold text-gray-900">{prof.nr_avaliacao_media.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">({prof.nr_total_avaliacoes})</span>
                          </div>
                        )}

                        {/* Experiência */}
                        {prof.nr_anos_experiencia && (
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Award className="h-4 w-4" />
                            <span className="text-sm">{prof.nr_anos_experiencia} anos</span>
                          </div>
                        )}

                        {/* Localização */}
                        {prof.clinica_cidade && (
                          <div className="flex items-center space-x-1 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{prof.nm_clinica} - {prof.clinica_cidade}, {prof.clinica_estado}</span>
                          </div>
                        )}
                      </div>

                      {/* Agenda do Profissional */}
                      {profissionaisAgendas[prof.id_profissional] && profissionaisAgendas[prof.id_profissional].length > 0 && (
                        <div className="mt-4">
                          <ProfessionalSchedule
                            agenda={profissionaisAgendas[prof.id_profissional]}
                            professionalId={prof.id_profissional}
                            professionalName={prof.nm_profissional}
                            professionalSpecialty={prof.ds_especialidades?.[0]}
                            professionalLocation={
                              prof.clinica_cidade && prof.clinica_estado
                                ? `${prof.clinica_cidade}, ${prof.clinica_estado}`
                                : undefined
                            }
                            clinicId={prof.id_clinica}
                            clinicName={prof.nm_clinica}
                            onConfirmSchedule={handleConfirmSchedule}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Visualização em Grade (3 colunas) */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profissionaisPaginados.map((match, index) => {
              const prof = match.profissional;
              const score = match.score_compatibilidade;
              const globalIndex = startIndex + index;

              return (
                <Card
                  key={prof.id_profissional}
                  className="group rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg flex flex-col"
                >
                  {/* Avatar */}
                  <div className="relative mx-auto mb-4">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden shadow-md">
                      {prof.ds_foto ? (
                        <img src={prof.ds_foto} alt={prof.nm_profissional} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-3xl font-bold text-white">
                            {prof.nm_profissional.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    {globalIndex < 3 && (
                      <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg border-2 border-white">
                        <span className="text-white font-bold text-xs">#{globalIndex + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Nome e Score */}
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {prof.nm_profissional}
                    </h3>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs shadow-md ${getScoreColor(score)}`}>
                      <Sparkles className="h-3 w-3" />
                      {(score * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                    {prof.ds_especialidades?.slice(0, 2).map((esp) => (
                      <Badge
                        key={esp}
                        className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 text-xs"
                      >
                        {esp}
                      </Badge>
                    ))}
                  </div>

                  {/* Bio */}
                  {prof.ds_biografia && (
                    <p className="text-xs leading-relaxed text-gray-600 line-clamp-2 mb-3 text-center">
                      {prof.ds_biografia}
                    </p>
                  )}

                  {/* Informações */}
                  <div className="flex flex-col gap-2 text-xs text-gray-600 mb-4 flex-1">
                    {prof.nr_avaliacao_media && (
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
                        <span className="font-semibold">{prof.nr_avaliacao_media.toFixed(1)}</span>
                        <span>({prof.nr_total_avaliacoes})</span>
                      </div>
                    )}
                    {prof.nr_anos_experiencia && (
                      <div className="flex items-center justify-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{prof.nr_anos_experiencia} anos</span>
                      </div>
                    )}
                    {prof.clinica_cidade && (
                      <div className="flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-center">{prof.clinica_cidade}, {prof.clinica_estado}</span>
                      </div>
                    )}
                  </div>

                  {/* Agenda do Profissional */}
                  {profissionaisAgendas[prof.id_profissional] && profissionaisAgendas[prof.id_profissional].length > 0 && (
                    <div className="mt-3">
                      <ProfessionalSchedule
                        agenda={profissionaisAgendas[prof.id_profissional]}
                        professionalId={prof.id_profissional}
                        professionalName={prof.nm_profissional}
                        professionalSpecialty={prof.ds_especialidades?.[0]}
                        professionalLocation={
                          prof.clinica_cidade && prof.clinica_estado
                            ? `${prof.clinica_cidade}, ${prof.clinica_estado}`
                            : undefined
                        }
                        clinicId={prof.id_clinica}
                        clinicName={prof.nm_clinica}
                        onConfirmSchedule={handleConfirmSchedule}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-purple-200 hover:border-purple-300"
              >
                Anterior
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Mostrar primeira, última, atual e adjacentes
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, idx, arr) => {
                    // Adicionar "..." entre números não consecutivos
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                        <Button
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={
                            currentPage === page
                              ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                              : "border-purple-200 hover:border-purple-300"
                          }
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <Button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-purple-200 hover:border-purple-300"
              >
                Próxima
              </Button>
            </div>

            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} ({profissionaisFiltrados.length} profissionais
              {profissionaisFiltrados.length !== resultados.total_encontrados && ` de ${resultados.total_encontrados}`})
            </span>
          </div>
        )}
        </div>
      )}

      {/* Modal de Confirmação de Agendamento */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Confirmar Agendamento
            </DialogTitle>
            <DialogDescription>
              Revise os detalhes do seu agendamento antes de confirmar
            </DialogDescription>
          </DialogHeader>

          {bookingPayload && (
            <div className="space-y-4 mt-4">
              <div className="rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  Detalhes do Agendamento
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profissional:</span>
                    <span className="font-semibold text-gray-900">{bookingPayload.professionalName}</span>
                  </div>

                  {bookingPayload.specialty && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Especialidade:</span>
                      <span className="font-medium text-purple-700">{bookingPayload.specialty}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(bookingPayload.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-semibold text-gray-900">{bookingPayload.time}</span>
                  </div>

                  {bookingPayload.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Local:</span>
                      <span className="font-medium text-gray-700">{bookingPayload.location}</span>
                    </div>
                  )}

                  {bookingPayload.visitPrice && (
                    <div className="flex justify-between pt-2 border-t border-purple-200">
                      <span className="text-gray-600">Valor da consulta:</span>
                      <span className="font-bold text-green-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(bookingPayload.visitPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setBookingModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={bookingLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarAgendamento}
                  disabled={bookingLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Lead */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Conte-nos sobre suas necessidades
            </DialogTitle>
            <DialogDescription className="text-base">
              Descreva o que você quer melhorar e responda algumas perguntas para que a IA Gisele encontre os profissionais ideais para você
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Campo de Texto Livre para Necessidade */}
            <div className="space-y-3 pb-4 border-b border-gray-200">
              <Label htmlFor="necessidade" className="text-base font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                O que você quer melhorar ou o que te incomoda?
              </Label>
              <p className="text-sm text-gray-500">
                Descreva livremente o que você busca. A IA irá interpretar e encontrar os melhores profissionais para você.
              </p>

              <Input
                id="necessidade"
                type="text"
                placeholder="Ex: Quero reduzir rugas na testa, eliminar olheiras, fazer botox, melhorar manchas no rosto..."
                value={necessidadeTexto}
                onChange={(e) => setNecessidadeTexto(e.target.value)}
                className="h-12 text-base"
              />

              {/* Sugestões/Exemplos */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setNecessidadeTexto("Quero reduzir rugas e linhas de expressão")}
                  className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  💆 Reduzir rugas
                </button>
                <button
                  type="button"
                  onClick={() => setNecessidadeTexto("Eliminar manchas e melhorar a textura da pele")}
                  className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  ✨ Melhorar pele
                </button>
                <button
                  type="button"
                  onClick={() => setNecessidadeTexto("Remover olheiras e rejuvenescer o olhar")}
                  className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  👁️ Olheiras
                </button>
                <button
                  type="button"
                  onClick={() => setNecessidadeTexto("Fazer preenchimento labial")}
                  className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  💋 Preenchimento
                </button>
                <button
                  type="button"
                  onClick={() => setNecessidadeTexto("Limpeza de pele profunda e hidratação")}
                  className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  🧼 Limpeza de pele
                </button>
              </div>

              {necessidadeTexto.trim() && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900 mb-1">
                        A IA irá analisar sua necessidade:
                      </p>
                      <p className="text-sm text-purple-700 italic">
                        "{necessidadeTexto}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Formulário de Lead (Perguntas Dinâmicas) */}
            <div>
              <LeadInfoForm
                tpPartner="paciente"
                onSubmit={handleLeadSubmit}
                submitLabel="Começar Busca Inteligente"
                showButtons={true}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
