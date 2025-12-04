"use client";

import { useState } from "react";
import { Agendamento, BloqueioAgenda } from "@/types/agenda";
import { Clock, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeeklyViewProps {
  currentDate: Date;
  agendamentos: Agendamento[];
  bloqueios?: BloqueioAgenda[];
  onSlotClick: (date: Date, hour: number) => void;
  onAppointmentClick: (agendamento: Agendamento) => void;
}

export function WeeklyView({
  currentDate,
  agendamentos,
  bloqueios = [],
  onSlotClick,
  onAppointmentClick,
}: WeeklyViewProps) {
  // Configuração de horários (8h às 19h, intervalos de 30 min)
  const startHour = 8;
  const endHour = 19;
  const slotDuration = 30; // minutos

  // Gerar array de horários
  const timeSlots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push(`${String(hour).padStart(2, "0")}:00`);
    if (hour < endHour) {
      timeSlots.push(`${String(hour).padStart(2, "0")}:30`);
    }
  }

  // Obter dias da semana atual
  const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Domingo

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Verificar se é hoje
  const isToday = (date: Date): boolean => {
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return check.getTime() === today.getTime();
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

  // Verificar se um horário tem agendamento
  const getAppointmentAtTime = (date: Date, time: string): Agendamento | null => {
    const dateKey = formatDateKey(date);
    const appointments = agendamentosPorData[dateKey] || [];

    return (
      appointments.find((apt) => {
        return apt.hr_inicio <= time && apt.hr_fim > time;
      }) || null
    );
  };

  // Calcular altura do agendamento em slots
  const calculateAppointmentHeight = (agendamento: Agendamento): number => {
    const [startHour, startMinute] = agendamento.hr_inicio.split(":").map(Number);
    const [endHour, endMinute] = agendamento.hr_fim.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const durationMinutes = endMinutes - startMinutes;

    return (durationMinutes / slotDuration) * 48; // 48px por slot de 30 min
  };

  // Calcular posição top do agendamento
  const calculateAppointmentTop = (agendamento: Agendamento, slotTime: string): number => {
    const [slotHour, slotMinute] = slotTime.split(":").map(Number);
    const [aptHour, aptMinute] = agendamento.hr_inicio.split(":").map(Number);

    const slotMinutes = slotHour * 60 + slotMinute;
    const aptMinutes = aptHour * 60 + aptMinute;

    if (aptMinutes < slotMinutes) return 0;

    const diff = aptMinutes - slotMinutes;
    return (diff / slotDuration) * 48; // 48px por slot
  };

  // Verificar se este é o primeiro slot do agendamento
  const isFirstSlotOfAppointment = (agendamento: Agendamento, time: string): boolean => {
    return agendamento.hr_inicio === time;
  };

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex flex-col h-full">
      {/* Header com dias da semana */}
      <div className="grid grid-cols-8 border-b border-gray-200 bg-white sticky top-0 z-10">
        {/* Coluna de horários */}
        <div className="p-4 border-r border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Horário</span>
          </div>
        </div>

        {/* Dias da semana */}
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
              isToday(day) ? "bg-blue-50" : ""
            }`}
          >
            <div className="text-xs font-medium text-gray-600 uppercase">{diasSemana[index]}</div>
            <div
              className={`text-2xl font-bold mt-1 ${
                isToday(day) ? "text-blue-600" : "text-gray-900"
              }`}
            >
              {day.getDate()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {day.toLocaleDateString("pt-BR", { month: "short" })}
            </div>
          </div>
        ))}
      </div>

      {/* Grid de horários */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8">
          {/* Coluna de horários */}
          <div className="border-r border-gray-200">
            {timeSlots.map((time, index) => (
              <div
                key={index}
                className="h-12 border-b border-gray-100 px-3 py-2 text-right"
                style={{ height: "48px" }}
              >
                <span className="text-xs font-medium text-gray-600">{time}</span>
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="border-r border-gray-200 last:border-r-0 relative">
              {timeSlots.map((time, timeIndex) => {
                const appointment = getAppointmentAtTime(day, time);
                const isFirst = appointment ? isFirstSlotOfAppointment(appointment, time) : false;

                return (
                  <div
                    key={timeIndex}
                    onClick={() => !appointment && onSlotClick(day, parseInt(time.split(":")[0]))}
                    className={`h-12 border-b border-gray-100 relative group ${
                      !appointment ? "cursor-pointer hover:bg-blue-50" : ""
                    } ${isToday(day) ? "bg-blue-50/30" : ""}`}
                    style={{ height: "48px" }}
                  >
                    {/* Botão de adicionar (hover) */}
                    {!appointment && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Agendamento */}
                    {appointment && isFirst && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(appointment);
                        }}
                        className="absolute left-1 right-1 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow z-10 overflow-hidden"
                        style={{
                          top: `${calculateAppointmentTop(appointment, time)}px`,
                          height: `${calculateAppointmentHeight(appointment)}px`,
                          backgroundColor: appointment.procedimento?.ds_cor_hex || "#3B82F6",
                        }}
                      >
                        <div className="p-2 h-full flex flex-col text-white text-xs">
                          <div className="font-bold truncate">
                            {appointment.paciente?.nm_completo || "Paciente"}
                          </div>
                          <div className="text-white/90 text-[10px] truncate">
                            {appointment.procedimento?.nm_procedimento}
                          </div>
                          <div className="text-white/80 text-[10px] mt-auto">
                            {appointment.hr_inicio} - {appointment.hr_fim}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
