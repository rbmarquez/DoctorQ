'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/api/server';

interface Agendamento {
  id_agendamento: string;
  dt_agendamento: string;
  hr_inicio: string;
  hr_fim: string;
  nm_procedimento: string;
  paciente: {
    id_paciente: string;
    nm_completo: string;
    nm_email: string;
    ds_telefone: string;
  };
  ds_status: string;
  vl_procedimento: number;
}

interface AgendaCalendarProps {
  initialAgendamentos: Agendamento[];
}

export function AgendaCalendar({ initialAgendamentos }: AgendaCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Filtrar agendamentos do dia selecionado
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const agendamentosDoDia = initialAgendamentos.filter((ag) => ag.dt_agendamento === selectedDateStr);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
    em_atendimento: { label: 'Em Atendimento', color: 'bg-green-100 text-green-700 border-green-200', icon: AlertCircle },
    agendado: { label: 'Agendado', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Calendar },
    concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Estatísticas do dia
  const stats = {
    total: agendamentosDoDia.length,
    confirmados: agendamentosDoDia.filter((ag) => ag.ds_status === 'confirmado').length,
    concluidos: agendamentosDoDia.filter((ag) => ag.ds_status === 'concluido').length,
    faturamento: agendamentosDoDia.reduce((sum, ag) => sum + ag.vl_procedimento, 0),
  };

  return (
    <div className="space-y-6">
      {/* Controles de navegação */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{formatDateDisplay(selectedDate)}</h3>
              </div>
              <Button variant="outline" size="sm" onClick={goToNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={goToToday}>
                Hoje
              </Button>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <Button variant={viewMode === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('day')}>
                  Dia
                </Button>
                <Button variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('week')}>
                  Semana
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do dia */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Agendamentos</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Confirmados</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmados}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Concluídos</p>
            <p className="text-2xl font-bold text-purple-600">{stats.concluidos}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Faturamento</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.faturamento)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de agendamentos */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Agendamentos do Dia ({agendamentosDoDia.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agendamentosDoDia.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Nenhum agendamento</h3>
              <p className="text-gray-600 mt-2">Você não tem agendamentos para este dia.</p>
            </div>
          ) : (
            agendamentosDoDia.map((agendamento) => {
              const config = statusConfig[agendamento.ds_status] || statusConfig.agendado;
              const StatusIcon = config.icon;

              return (
                <div key={agendamento.id_agendamento} className={`p-5 rounded-lg border ${config.color}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-gray-900">
                          {agendamento.hr_inicio} - {agendamento.hr_fim}
                        </span>
                        <Badge className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">{agendamento.nm_procedimento}</h4>
                      <p className="text-sm font-semibold text-gray-700 mt-1">{formatCurrency(agendamento.vl_procedimento)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      {agendamento.ds_status === 'agendado' && (
                        <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                          Iniciar
                        </Button>
                      )}
                      {agendamento.ds_status === 'em_atendimento' && (
                        <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Concluir
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{agendamento.paciente.nm_completo}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{agendamento.paciente.ds_telefone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{agendamento.paciente.nm_email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
