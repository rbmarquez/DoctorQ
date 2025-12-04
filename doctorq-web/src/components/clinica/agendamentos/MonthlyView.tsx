"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { getProfessionalColor, getStatusBadgeColor } from "@/lib/utils/professionalColors";

interface Agendamento {
  id_agendamento: string;
  id_profissional: string;
  dt_agendamento: string;
  nr_duracao_minutos: number;
  ds_status: string;
  nm_paciente?: string;
  nm_profissional?: string;
}

interface MonthlyViewProps {
  agendamentos: Agendamento[];
  currentDate: Date;
  profissionais: Array<{ id_profissional: string; nm_profissional: string }>;
  useProfessionalColor?: boolean;
  onDayClick?: (date: Date) => void;
  onAgendamentoClick?: (agendamento: Agendamento) => void;
}

export function MonthlyView({
  agendamentos,
  currentDate,
  profissionais,
  useProfessionalColor = false,
  onDayClick,
  onAgendamentoClick,
}: MonthlyViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const agendamentosPorDia = useMemo(() => {
    const map = new Map<string, Agendamento[]>();

    agendamentos.forEach((agendamento) => {
      const dataAgendamento = parseISO(agendamento.dt_agendamento);
      const dayKey = format(dataAgendamento, "yyyy-MM-dd");

      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(agendamento);
    });

    return map;
  }, [agendamentos]);

  const getAgendamentosDoDia = (dia: Date) => {
    const dayKey = format(dia, "yyyy-MM-dd");
    return agendamentosPorDia.get(dayKey) || [];
  };

  const getStatusCount = (agendamentos: Agendamento[]) => {
    const counts = new Map<string, number>();
    agendamentos.forEach((ag) => {
      counts.set(ag.ds_status, (counts.get(ag.ds_status) || 0) + 1);
    });
    return counts;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Legenda de Cores (quando há múltiplos profissionais) */}
      {useProfessionalColor && profissionais.length > 1 && (
        <div className="bg-gray-50 border-b border-gray-200 p-3">
          <div className="flex items-center space-x-4 flex-wrap">
            <span className="text-xs font-semibold text-gray-600">Legenda:</span>
            {profissionais.map((prof) => {
              const colorClass = getProfessionalColor(prof.id_profissional, "medium");
              return (
                <div key={prof.id_profissional} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${colorClass}`} />
                  <span className="text-xs text-gray-700">{prof.nm_profissional}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header com dias da semana */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
          <div
            key={dia}
            className="p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7">
        {calendarDays.map((dia) => {
          const agendamentosDoDia = getAgendamentosDoDia(dia);
          const isCurrentMonth = isSameMonth(dia, currentDate);
          const isToday = isSameDay(dia, new Date());
          const statusCounts = getStatusCount(agendamentosDoDia);

          return (
            <button
              key={dia.toISOString()}
              onClick={() => onDayClick?.(dia)}
              className={`min-h-[120px] p-2 border-b border-r border-gray-200 hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? "bg-gray-50" : ""
              } ${isToday ? "bg-blue-50" : ""}`}
            >
              <div className="flex flex-col h-full">
                {/* Número do dia */}
                <div
                  className={`text-sm font-semibold mb-2 ${
                    !isCurrentMonth ? "text-gray-400" : isToday ? "text-blue-600" : "text-gray-900"
                  }`}
                >
                  {format(dia, "d")}
                </div>

                {/* Agendamentos do dia */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  {agendamentosDoDia.slice(0, 3).map((agendamento) => {
                    // Usar cor do profissional ou cor do status
                    const colorClass = useProfessionalColor
                      ? getProfessionalColor(agendamento.id_profissional, "medium")
                      : getStatusBadgeColor(agendamento.ds_status);

                    return (
                      <div
                        key={agendamento.id_agendamento}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAgendamentoClick?.(agendamento);
                        }}
                        className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 ${colorClass}`}
                      >
                        <div className="truncate">
                          {format(parseISO(agendamento.dt_agendamento), "HH:mm")} -{" "}
                          {agendamento.nm_paciente || "Paciente"}
                        </div>
                      </div>
                    );
                  })}

                  {/* Contador de agendamentos extras */}
                  {agendamentosDoDia.length > 3 && (
                    <div className="text-xs text-gray-600 font-medium text-center">
                      +{agendamentosDoDia.length - 3} mais
                    </div>
                  )}
                </div>

                {/* Resumo de status (pequenos dots) */}
                {agendamentosDoDia.length > 0 && (
                  <div className="flex items-center justify-center space-x-1 mt-2 pt-2 border-t border-gray-200">
                    {/* Se usar cores de profissional, mostra dots de profissionais */}
                    {useProfessionalColor ? (
                      <>
                        {Array.from(new Set(agendamentosDoDia.map((a) => a.id_profissional))).map((profId) => (
                          <div
                            key={profId}
                            className={`w-2 h-2 rounded-full ${getProfessionalColor(profId, "medium")}`}
                            title={agendamentosDoDia.find((a) => a.id_profissional === profId)?.nm_profissional}
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        {Array.from(statusCounts.entries()).map(([status]) => (
                          <div
                            key={status}
                            className={`w-2 h-2 rounded-full ${getStatusBadgeColor(status)}`}
                            title={status}
                          />
                        ))}
                      </>
                    )}
                    <span className="text-xs font-bold text-gray-600 ml-1">{agendamentosDoDia.length}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
