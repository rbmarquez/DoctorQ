"use client";

import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User } from "lucide-react";
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { getAgendamentoCardClasses, getStatusBadgeColor } from "@/lib/utils/professionalColors";

interface Agendamento {
  id_agendamento: string;
  id_profissional: string;
  dt_agendamento: string;
  nr_duracao_minutos: number;
  ds_status: string;
  nm_paciente?: string;
  nm_profissional?: string;
  ds_observacoes?: string;
}

interface WeeklyViewProps {
  agendamentos: Agendamento[];
  currentDate: Date;
  profissionais: Array<{ id_profissional: string; nm_profissional: string }>;
  useProfessionalColor?: boolean;
  onAgendamentoClick?: (agendamento: Agendamento) => void;
  onAgendamentoReschedule?: (agendamento: Agendamento, novaData: Date) => void;
}

const HORAS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h às 20h

// Componente do card arrastável
function DraggableAgendamento({
  agendamento,
  useProfessionalColor,
  onClick,
}: {
  agendamento: Agendamento;
  useProfessionalColor: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: agendamento.id_agendamento,
    data: agendamento,
  });

  const cardClasses = getAgendamentoCardClasses(agendamento.id_profissional, agendamento.ds_status, useProfessionalColor);
  const statusColor = getStatusBadgeColor(agendamento.ds_status);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`w-full text-left p-2 rounded-md border-l-4 mb-2 transition-all hover:shadow-md cursor-move ${cardClasses} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span className="text-xs font-semibold">{format(parseISO(agendamento.dt_agendamento), "HH:mm")}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${statusColor}`} title={agendamento.ds_status} />
      </div>
      <div className="flex items-center space-x-1 mb-1">
        <User className="h-3 w-3" />
        <span className="text-xs truncate">{agendamento.nm_paciente || "Paciente"}</span>
      </div>
      <div className="text-xs font-medium truncate">{agendamento.nm_profissional || "Profissional"}</div>
      {agendamento.ds_observacoes && (
        <div className="text-xs opacity-75 truncate mt-1">{agendamento.ds_observacoes}</div>
      )}
    </div>
  );
}

// Componente do slot de tempo (droppable)
function DroppableTimeSlot({
  dia,
  hora,
  agendamentos,
  useProfessionalColor,
  onAgendamentoClick,
}: {
  dia: Date;
  hora: number;
  agendamentos: Agendamento[];
  useProfessionalColor: boolean;
  onAgendamentoClick?: (agendamento: Agendamento) => void;
}) {
  const slotId = `${format(dia, "yyyy-MM-dd")}-${hora}`;
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { dia, hora },
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[80px] transition-colors ${
        isOver ? "bg-blue-100 border-blue-300" : ""
      }`}
    >
      {agendamentos.map((agendamento) => (
        <DraggableAgendamento
          key={agendamento.id_agendamento}
          agendamento={agendamento}
          useProfessionalColor={useProfessionalColor}
          onClick={() => onAgendamentoClick?.(agendamento)}
        />
      ))}
    </div>
  );
}

export function WeeklyView({
  agendamentos,
  currentDate,
  profissionais,
  useProfessionalColor = false,
  onAgendamentoClick,
  onAgendamentoReschedule,
}: WeeklyViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedAgendamento, setDraggedAgendamento] = useState<Agendamento | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Domingo
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

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

  const getAgendamentosParaHora = (dia: Date, hora: number) => {
    const dayKey = format(dia, "yyyy-MM-dd");
    const agendamentosDoDia = agendamentosPorDia.get(dayKey) || [];

    return agendamentosDoDia.filter((agendamento) => {
      const dataAgendamento = parseISO(agendamento.dt_agendamento);
      const horaAgendamento = dataAgendamento.getHours();
      return horaAgendamento === hora;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const agendamento = agendamentos.find((a) => a.id_agendamento === event.active.id);
    setDraggedAgendamento(agendamento || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const agendamento = agendamentos.find((a) => a.id_agendamento === active.id);
      if (agendamento && over.data.current) {
        const { dia, hora } = over.data.current as { dia: Date; hora: number };

        // Criar nova data combinando o dia do drop com a hora
        const novaData = new Date(dia);
        novaData.setHours(hora, 0, 0, 0);

        // Chamar callback de reagendamento
        onAgendamentoReschedule?.(agendamento, novaData);
      }
    }

    setActiveId(null);
    setDraggedAgendamento(null);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Legenda de Cores (quando há múltiplos profissionais) */}
        {useProfessionalColor && profissionais.length > 1 && (
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <div className="flex items-center space-x-4 flex-wrap">
              <span className="text-xs font-semibold text-gray-600">Legenda:</span>
              {profissionais.map((prof) => {
                const cardClasses = getAgendamentoCardClasses(prof.id_profissional, "", true);
                return (
                  <div key={prof.id_profissional} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded border-2 ${cardClasses}`} />
                    <span className="text-xs text-gray-700">{prof.nm_profissional}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Header com dias da semana */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
          <div className="p-4 text-sm font-semibold text-gray-600 border-r border-gray-200">Horário</div>
          {weekDays.map((dia) => (
            <div
              key={dia.toISOString()}
              className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                isSameDay(dia, new Date()) ? "bg-blue-50" : ""
              }`}
            >
              <div className="text-xs font-medium text-gray-600">{format(dia, "EEE", { locale: ptBR })}</div>
              <div className={`text-lg font-bold ${isSameDay(dia, new Date()) ? "text-blue-600" : "text-gray-900"}`}>
                {format(dia, "dd")}
              </div>
              <div className="text-xs text-gray-500">{format(dia, "MMM", { locale: ptBR })}</div>
            </div>
          ))}
        </div>

        {/* Grid de horários */}
        <div className="overflow-y-auto max-h-[600px]">
          {HORAS.map((hora) => (
            <div key={hora} className="grid grid-cols-8 border-b border-gray-200 hover:bg-gray-50">
              <div className="p-3 text-sm font-medium text-gray-600 border-r border-gray-200 flex items-start">
                {String(hora).padStart(2, "0")}:00
              </div>
              {weekDays.map((dia) => {
                const agendamentosHora = getAgendamentosParaHora(dia, hora);

                return (
                  <DroppableTimeSlot
                    key={`${dia.toISOString()}-${hora}`}
                    dia={dia}
                    hora={hora}
                    agendamentos={agendamentosHora}
                    useProfessionalColor={useProfessionalColor}
                    onAgendamentoClick={onAgendamentoClick}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Overlay de arrastar */}
      <DragOverlay>
        {activeId && draggedAgendamento ? (
          <div className="w-[200px]">
            <DraggableAgendamento
              agendamento={draggedAgendamento}
              useProfessionalColor={useProfessionalColor}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
