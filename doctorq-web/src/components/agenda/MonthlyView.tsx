"use client";

import { useState } from "react";
import { Agendamento, BloqueioAgenda } from "@/types/agenda";
import { Plus, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthlyViewProps {
  currentDate: Date;
  agendamentos: Agendamento[];
  bloqueios?: BloqueioAgenda[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (agendamento: Agendamento) => void;
}

export function MonthlyView({
  currentDate,
  agendamentos,
  bloqueios = [],
  onDayClick,
  onAppointmentClick,
}: MonthlyViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Obter primeiro e último dia do mês
  const getMonthDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);

    // Primeiro dia da grade (pode ser do mês anterior)
    const startDay = new Date(firstDay);
    startDay.setDate(firstDay.getDate() - firstDay.getDay()); // Volta até domingo

    // Último dia da grade (pode ser do próximo mês)
    const endDay = new Date(lastDay);
    const remainingDays = 6 - lastDay.getDay();
    endDay.setDate(lastDay.getDate() + remainingDays); // Avança até sábado

    // Gerar array de dias
    const days: Date[] = [];
    const current = new Date(startDay);

    while (current <= endDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const days = getMonthDays(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Verificar se é hoje
  const isToday = (date: Date): boolean => {
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return check.getTime() === today.getTime();
  };

  // Verificar se está no mês atual
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Formatar data para comparação
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Agrupar agendamentos por data
  const agendamentosPorData: Record<string, Agendamento[]> = {};
  agendamentos.forEach((agendamento) => {
    const dateKey = agendamento.dt_agendamento;
    if (!agendamentosPorData[dateKey]) {
      agendamentosPorData[dateKey] = [];
    }
    agendamentosPorData[dateKey].push(agendamento);
  });

  // Obter agendamentos de uma data
  const getAppointmentsForDay = (date: Date): Agendamento[] => {
    const dateKey = formatDateKey(date);
    return agendamentosPorData[dateKey] || [];
  };

  // Verificar se tem bloqueio
  const hasBlockedTime = (date: Date): boolean => {
    const dateKey = formatDateKey(date);
    return bloqueios.some((bloqueio) => {
      const bloqueioInicio = new Date(bloqueio.dt_inicio + "T00:00:00");
      const bloqueioFim = new Date(bloqueio.dt_fim + "T00:00:00");
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      return checkDate >= bloqueioInicio && checkDate <= bloqueioFim;
    });
  };

  // Dividir dias em semanas
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    onDayClick(date);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header com dias da semana */}
      <div className="grid grid-cols-7 border-b-2 border-gray-300 bg-gradient-to-r from-blue-50 to-purple-50">
        {diasSemana.map((dia, index) => (
          <div
            key={index}
            className="p-3 text-center border-r border-gray-200 last:border-r-0"
          >
            <div className="text-sm font-bold text-gray-700 uppercase">{dia}</div>
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="flex-1 overflow-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200">
            {week.map((day, dayIndex) => {
              const appointments = getAppointmentsForDay(day);
              const isBlocked = hasBlockedTime(day);
              const dayIsToday = isToday(day);
              const inCurrentMonth = isCurrentMonth(day);

              return (
                <div
                  key={dayIndex}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[120px] p-2 border-r border-gray-100 last:border-r-0 cursor-pointer transition-all hover:bg-blue-50 ${
                    dayIsToday ? "bg-blue-100" : ""
                  } ${!inCurrentMonth ? "bg-gray-50" : ""} ${
                    selectedDate && formatDateKey(selectedDate) === formatDateKey(day)
                      ? "ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  {/* Número do dia */}
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`text-sm font-semibold ${
                        dayIsToday
                          ? "w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center"
                          : inCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {day.getDate()}
                    </div>

                    {/* Indicador de bloqueio */}
                    {isBlocked && (
                      <div className="w-2 h-2 rounded-full bg-red-500" title="Dia bloqueado" />
                    )}
                  </div>

                  {/* Lista de agendamentos (máximo 3) */}
                  <div className="space-y-1">
                    {appointments.slice(0, 3).map((apt, index) => (
                      <div
                        key={apt.id_agendamento}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(apt);
                        }}
                        className="text-xs p-1 rounded truncate hover:shadow-md transition-shadow cursor-pointer"
                        style={{
                          backgroundColor: apt.procedimento?.ds_cor_hex + "20" || "#3B82F620",
                          borderLeft: `3px solid ${apt.procedimento?.ds_cor_hex || "#3B82F6"}`,
                        }}
                        title={`${apt.hr_inicio} - ${apt.paciente?.nm_completo}`}
                      >
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="font-semibold">{apt.hr_inicio}</span>
                          <span className="truncate">{apt.paciente?.nm_completo}</span>
                        </div>
                      </div>
                    ))}

                    {/* Indicador de mais agendamentos */}
                    {appointments.length > 3 && (
                      <div className="text-xs text-gray-600 font-semibold pl-1">
                        +{appointments.length - 3} mais
                      </div>
                    )}

                    {/* Botão de adicionar (quando vazio) */}
                    {appointments.length === 0 && !isBlocked && inCurrentMonth && (
                      <div className="flex items-center justify-center h-8 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-center space-x-8 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-600" />
            <span className="text-gray-700">Hoje</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-gray-700">Bloqueado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded border-2 border-blue-500" />
            <span className="text-gray-700">Selecionado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
