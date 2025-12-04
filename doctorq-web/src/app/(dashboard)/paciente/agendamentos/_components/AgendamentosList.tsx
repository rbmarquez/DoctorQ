'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Star, Loader2, CalendarDays, AlertTriangle, ChevronLeft, ChevronRight, Sun, Sunset } from 'lucide-react';
import { formatCurrency } from '@/lib/api/server';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Agendamento {
  id_agendamento: string;
  id_profissional?: string;
  dt_agendamento: string;
  nr_duracao_minutos?: number;
  ds_status: string;
  nm_profissional?: string;
  nm_procedimento?: string | null;
  vl_procedimento?: number | null;
  ds_especialidade?: string;
  ds_endereco?: string | null;
  ds_local?: string | null;
  ds_observacoes?: string;
  profissional?: {
    id: string;
    nm_completo: string;
    ds_especialidade: string;
  };
  clinica?: {
    id: string;
    nm_clinica: string;
    ds_endereco: string;
  } | null;
}

interface ScheduleSlot {
  time: string;
  available: boolean;
}

interface ScheduleDay {
  date: string;
  dayName: string;
  dayNumber: string;
  slots: ScheduleSlot[];
}

interface AgendamentosListProps {
  initialAgendamentos: Agendamento[];
}

export function AgendamentosList({ initialAgendamentos }: AgendamentosListProps) {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(initialAgendamentos);
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Estados para modais
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [remarcarModalOpen, setRemarcarModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para agenda de remarcação
  const [agenda, setAgenda] = useState<ScheduleDay[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const NUM_DAYS_TO_FETCH = 30; // Backend batch suporta até 30 dias

  const filtered = agendamentos.filter((ag) => {
    if (statusFilter === 'todos') return true;
    return ag.ds_status === statusFilter;
  });

  const today = new Date().toISOString().split('T')[0];
  const proximos = filtered.filter((ag) => ag.dt_agendamento >= today && ag.ds_status !== 'concluido' && ag.ds_status !== 'cancelado');
  const historico = filtered.filter((ag) => ag.dt_agendamento < today || ag.ds_status === 'concluido' || ag.ds_status === 'cancelado');

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    agendado: { label: 'Agendado', color: 'bg-gray-100 text-gray-700', icon: Calendar },
    concluido: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  // Buscar disponibilidade do profissional
  const fetchDisponibilidade = async (idProfissional: string, startDate?: string) => {
    setAgendaLoading(true);
    try {
      const dataParam = startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const response = await fetch(
        `/api/agendamentos/disponibilidade?id_profissional=${idProfissional}&data=${dataParam}&num_dias=${NUM_DAYS_TO_FETCH}`
      );
      if (!response.ok) {
        throw new Error('Erro ao buscar disponibilidade');
      }
      const data = await response.json();
      setAgenda(data);
      // Selecionar primeiro dia com slots disponíveis
      const firstAvailableDay = data.find((d: ScheduleDay) => d.slots.some(s => s.available));
      setSelectedDate(firstAvailableDay?.date || data[0]?.date || null);
      setSelectedSlot(null);
      setPeriodFilter('all');
      // Atualizar mês corrente baseado nos dados
      if (data[0]?.date) {
        setCurrentMonth(new Date(data[0].date + 'T12:00:00'));
      }
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      toast.error('Erro ao carregar horários disponíveis');
      setAgenda([]);
    } finally {
      setAgendaLoading(false);
    }
  };

  // Dados do dia selecionado
  const selectedDayData = useMemo(() => {
    return agenda.find(d => d.date === selectedDate);
  }, [agenda, selectedDate]);

  // Slots filtrados por período
  const filteredSlots = useMemo(() => {
    if (!selectedDayData) return [];
    const availableSlots = selectedDayData.slots.filter(s => s.available);

    if (periodFilter === 'all') return availableSlots;

    return availableSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (periodFilter === 'morning') return hour < 12;
      if (periodFilter === 'afternoon') return hour >= 12;
      return true;
    });
  }, [selectedDayData, periodFilter]);

  // Agrupar slots por período para exibição
  const groupedSlots = useMemo(() => {
    if (!selectedDayData) return { morning: [], afternoon: [] };
    const availableSlots = selectedDayData.slots.filter(s => s.available);

    return {
      morning: availableSlots.filter(s => parseInt(s.time.split(':')[0]) < 12),
      afternoon: availableSlots.filter(s => parseInt(s.time.split(':')[0]) >= 12),
    };
  }, [selectedDayData]);

  // Datas disponíveis no mês atual
  const availableDatesInMonth = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    return agenda.filter(day => {
      const dayDate = new Date(day.date + 'T12:00:00');
      return dayDate >= monthStart && dayDate <= monthEnd && day.slots.some(s => s.available);
    });
  }, [agenda, currentMonth]);

  // Gerar calendário do mês
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = domingo

    const days: { date: string; dayNumber: number; isCurrentMonth: boolean; hasSlots: boolean; isToday: boolean }[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Dias do mês anterior para preencher a primeira semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, dayNumber: d, isCurrentMonth: false, hasSlots: false, isToday: false });
    }

    // Dias do mês atual
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = agenda.find(day => day.date === dateStr);
      const hasSlots = dayData?.slots.some(s => s.available) || false;
      days.push({ date: dateStr, dayNumber: d, isCurrentMonth: true, hasSlots, isToday: dateStr === today });
    }

    // Dias do próximo mês para completar a última semana
    const remaining = 42 - days.length; // 6 semanas x 7 dias
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, dayNumber: d, isCurrentMonth: false, hasSlots: false, isToday: false });
    }

    return days;
  }, [currentMonth, agenda]);

  // Navegação de mês
  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const today = new Date();
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const maxMonth = new Date();
    maxMonth.setMonth(maxMonth.getMonth() + 2); // Limite de 2 meses à frente
    if (newMonth <= maxMonth) {
      setCurrentMonth(newMonth);
    }
  };

  // Abrir modal de cancelamento
  const handleOpenCancelModal = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento);
    setCancelMotivo('');
    setCancelModalOpen(true);
  };

  // Abrir modal de remarcação
  const handleOpenRemarcarModal = async (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento);
    setSelectedSlot(null);
    setRemarcarModalOpen(true);

    // Buscar disponibilidade do profissional
    const idProfissional = agendamento.id_profissional || agendamento.profissional?.id;
    if (idProfissional) {
      await fetchDisponibilidade(idProfissional);
    } else {
      toast.error('ID do profissional não encontrado');
    }
  };

  // Executar cancelamento
  const handleCancelar = async () => {
    if (!selectedAgendamento) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/agendamentos/${selectedAgendamento.id_agendamento}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: cancelMotivo || 'Cancelado pelo paciente' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao cancelar agendamento');
      }

      setAgendamentos((prev) =>
        prev.map((ag) =>
          ag.id_agendamento === selectedAgendamento.id_agendamento
            ? { ...ag, ds_status: 'cancelado' }
            : ag
        )
      );

      toast.success('Agendamento cancelado com sucesso!');
      setCancelModalOpen(false);
      setSelectedAgendamento(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cancelar agendamento');
    } finally {
      setLoading(false);
    }
  };

  // Executar remarcação
  const handleRemarcar = async () => {
    if (!selectedAgendamento || !selectedSlot || !selectedDate) {
      toast.error('Por favor, selecione um horário disponível');
      return;
    }

    setLoading(true);
    try {
      const novaDataHora = `${selectedDate}T${selectedSlot.time}:00`;

      const response = await fetch(`/api/agendamentos/${selectedAgendamento.id_agendamento}/remarcar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nova_data_hora: novaDataHora,
          motivo: 'Remarcado pelo paciente',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remarcar agendamento');
      }

      setAgendamentos((prev) =>
        prev.map((ag) =>
          ag.id_agendamento === selectedAgendamento.id_agendamento
            ? { ...ag, dt_agendamento: novaDataHora }
            : ag
        )
      );

      toast.success('Agendamento remarcado com sucesso!');
      setRemarcarModalOpen(false);
      setSelectedAgendamento(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remarcar agendamento');
    } finally {
      setLoading(false);
    }
  };

  // Selecionar data do calendário
  const handleSelectDate = (date: string, hasSlots: boolean, isCurrentMonth: boolean) => {
    if (!hasSlots || !isCurrentMonth) return;
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const renderAgendamento = (agendamento: Agendamento) => {
    const config = statusConfig[agendamento.ds_status] || statusConfig.agendado;
    const StatusIcon = config.icon;
    const date = new Date(agendamento.dt_agendamento);

    const hrInicio = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const endDate = new Date(date.getTime() + (agendamento.nr_duracao_minutos || 60) * 60000);
    const hrFim = endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const profissionalNome = agendamento.nm_profissional || agendamento.profissional?.nm_completo || 'Profissional';
    const especialidade = agendamento.ds_especialidade || agendamento.profissional?.ds_especialidade || '';
    const procedimento = agendamento.nm_procedimento || agendamento.ds_observacoes || 'Consulta';
    const endereco = agendamento.ds_endereco || agendamento.ds_local || agendamento.clinica?.ds_endereco;
    const clinicaNome = agendamento.clinica?.nm_clinica;

    return (
      <Card key={agendamento.id_agendamento} className="border-0 shadow-md hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={config.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
                <span className="text-sm text-gray-600">
                  {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{procedimento}</h3>
              {agendamento.vl_procedimento && (
                <p className="text-sm font-semibold text-blue-600 mt-1">{formatCurrency(agendamento.vl_procedimento)}</p>
              )}
            </div>
            <div className="flex gap-2">
              {agendamento.ds_status === 'concluido' && (
                <Button variant="outline" size="sm" className="text-orange-600 border-orange-300">
                  <Star className="w-4 h-4 mr-1" />
                  Avaliar
                </Button>
              )}
              {(agendamento.ds_status === 'agendado' || agendamento.ds_status === 'confirmado') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRemarcarModal(agendamento)}
                  >
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Remarcar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleOpenCancelModal(agendamento)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{profissionalNome}</p>
                {especialidade && <p className="text-sm text-gray-600">{especialidade}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{hrInicio} - {hrFim}</span>
            </div>
            {(clinicaNome || endereco) && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  {clinicaNome && <p className="text-sm font-medium text-gray-900">{clinicaNome}</p>}
                  {endereco && <p className="text-sm text-gray-600">{endereco}</p>}
                </div>
              </div>
            )}
            {!clinicaNome && !endereco && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-500 italic">Profissional independente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="agendado">Agendados</SelectItem>
                <SelectItem value="confirmado">Confirmados</SelectItem>
                <SelectItem value="concluido">Concluídos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              Exibindo <span className="font-semibold">{filtered.length}</span> agendamento(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Agendamentos */}
      {proximos.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Próximos Agendamentos ({proximos.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{proximos.map(renderAgendamento)}</div>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Histórico ({historico.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{historico.map(renderAgendamento)}</div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Nenhum agendamento encontrado</h3>
            <p className="text-gray-600 mt-2">Você ainda não possui agendamentos com este filtro.</p>
            <Button variant="default" className="mt-6" asChild>
              <a href="/busca">Agendar Consulta</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cancelamento */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle>Cancelar Agendamento</DialogTitle>
                <DialogDescription>Esta ação não pode ser desfeita</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAgendamento && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">
                  {selectedAgendamento.nm_procedimento || selectedAgendamento.ds_observacoes || 'Consulta'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedAgendamento.dt_agendamento).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  com {selectedAgendamento.nm_profissional || 'Profissional'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo do cancelamento (opcional)</Label>
                <Textarea
                  id="motivo"
                  placeholder="Informe o motivo do cancelamento..."
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)} disabled={loading}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Remarcação Compacto */}
      <Dialog open={remarcarModalOpen} onOpenChange={setRemarcarModalOpen}>
        <DialogContent className="sm:max-w-xl p-4">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-base">Remarcar Agendamento</DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedAgendamento && (
                    <>
                      {selectedAgendamento.nm_procedimento || 'Consulta'} com {selectedAgendamento.nm_profissional || 'Profissional'}
                      {' • '}
                      <span className="text-gray-500">
                        Atual: {new Date(selectedAgendamento.dt_agendamento).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAgendamento && (
            <div className="space-y-3">
              {/* Seletor de Agenda */}
              {agendaLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                </div>
              ) : agenda.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* Calendário Compacto */}
                  <div className="border rounded-lg p-2">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-6 w-6">
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-semibold capitalize">
                        {currentMonth.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                      </span>
                      <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-6 w-6">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Dias da semana */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-[10px] font-medium text-gray-400">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grid de dias compacto */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarDays.map((day, idx) => {
                        const isSelected = day.date === selectedDate;
                        // Comparação segura de datas usando strings (evita problemas de timezone)
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isPast = day.date < todayStr;
                        const isClickable = day.hasSlots && day.isCurrentMonth && !isPast;

                        return (
                          <button
                            key={idx}
                            onClick={() => isClickable && handleSelectDate(day.date, day.hasSlots, day.isCurrentMonth)}
                            disabled={!isClickable}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center text-[10px] rounded transition-all",
                              !day.isCurrentMonth && "text-gray-200",
                              day.isCurrentMonth && !day.hasSlots && !isPast && "text-gray-400",
                              day.isCurrentMonth && day.hasSlots && !isSelected && !isPast && "text-gray-700 hover:bg-blue-100 font-medium bg-green-100 cursor-pointer",
                              isSelected && "bg-blue-600 text-white font-bold",
                              day.isToday && !isSelected && "ring-1 ring-blue-400",
                              isPast && day.isCurrentMonth && "text-gray-300 line-through"
                            )}
                          >
                            {day.dayNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seletor de Horários Compacto */}
                  <div className="border rounded-lg p-2">
                    {selectedDate ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">
                            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                              weekday: 'short', day: '2-digit', month: 'short'
                            })}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setPeriodFilter('morning')}
                              disabled={groupedSlots.morning.length === 0}
                              className={cn(
                                "p-1 rounded text-[10px]",
                                periodFilter === 'morning' ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600",
                                groupedSlots.morning.length === 0 && "opacity-30"
                              )}
                            >
                              <Sun className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setPeriodFilter('afternoon')}
                              disabled={groupedSlots.afternoon.length === 0}
                              className={cn(
                                "p-1 rounded text-[10px]",
                                periodFilter === 'afternoon' ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600",
                                groupedSlots.afternoon.length === 0 && "opacity-30"
                              )}
                            >
                              <Sunset className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setPeriodFilter('all')}
                              className={cn(
                                "px-1 rounded text-[10px]",
                                periodFilter === 'all' ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600"
                              )}
                            >
                              Todos
                            </button>
                          </div>
                        </div>

                        {/* Grid de horários compacto */}
                        {filteredSlots.length > 0 ? (
                          <div className="grid grid-cols-4 gap-1 max-h-[140px] overflow-y-auto">
                            {filteredSlots.map((slot) => (
                              <button
                                key={slot.time}
                                onClick={() => setSelectedSlot(slot)}
                                className={cn(
                                  "px-1 py-1.5 rounded text-[11px] font-medium transition-all",
                                  selectedSlot?.time === slot.time
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 hover:bg-blue-50 text-gray-700"
                                )}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 text-center py-4">
                            Sem horários neste período
                          </p>
                        )}

                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                          {groupedSlots.morning.length} manhã • {groupedSlots.afternoon.length} tarde
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-6 text-gray-300">
                        <Calendar className="h-8 w-8 mb-1" />
                        <p className="text-[10px]">Selecione uma data</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <CalendarDays className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">Nenhum horário disponível</p>
                </div>
              )}

              {/* Slot selecionado inline */}
              {selectedSlot && selectedDate && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-xs">
                  <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-blue-800">
                    <strong>Novo:</strong>{' '}
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short', day: '2-digit', month: 'short'
                    })} às <strong>{selectedSlot.time}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setRemarcarModalOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleRemarcar} disabled={loading || !selectedSlot || !selectedDate}>
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Remarcando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
