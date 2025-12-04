"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Calendar } from "lucide-react";

interface FirstAgentFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: string | boolean | any) => void;
}

interface DaySchedule {
  dia_semana: string;
  fg_ativo: boolean;
  hr_abertura: string;
  hr_fechamento: string;
  hr_inicio_intervalo: string;
  hr_fim_intervalo: string;
}

const DIAS_SEMANA = [
  { value: "Segunda-feira", label: "Segunda-feira" },
  { value: "Terça-feira", label: "Terça-feira" },
  { value: "Quarta-feira", label: "Quarta-feira" },
  { value: "Quinta-feira", label: "Quinta-feira" },
  { value: "Sexta-feira", label: "Sexta-feira" },
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dia_semana: "Segunda-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
  { dia_semana: "Terça-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
  { dia_semana: "Quarta-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
  { dia_semana: "Quinta-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
  { dia_semana: "Sexta-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
  { dia_semana: "Sábado", fg_ativo: false, hr_abertura: "08:00", hr_fechamento: "12:00", hr_inicio_intervalo: "", hr_fim_intervalo: "" },
  { dia_semana: "Domingo", fg_ativo: false, hr_abertura: "08:00", hr_fechamento: "12:00", hr_inicio_intervalo: "", hr_fim_intervalo: "" },
];

export function FirstAgentForm({ formData, onChange }: FirstAgentFormProps) {
  // Inicializar horários se não existirem
  const horarios: DaySchedule[] = formData.horarios || DEFAULT_SCHEDULE;

  const handleDayToggle = (index: number, checked: boolean) => {
    const newHorarios = [...horarios];
    newHorarios[index] = { ...newHorarios[index], fg_ativo: checked };
    onChange('horarios', newHorarios);
  };

  const handleTimeChange = (index: number, field: keyof DaySchedule, value: string) => {
    const newHorarios = [...horarios];
    newHorarios[index] = { ...newHorarios[index], [field]: value };
    onChange('horarios', newHorarios);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horário de Funcionamento
          </h3>
          <p className="text-xs text-muted-foreground">Configure os horários por dia da semana</p>
        </div>

        <div className="space-y-3">
          {DIAS_SEMANA.map((dia, index) => {
            const horarioDia = horarios[index] || DEFAULT_SCHEDULE[index];
            const isAtivo = horarioDia.fg_ativo;

            return (
              <div
                key={dia.value}
                className={`rounded-lg border p-4 transition-all ${
                  isAtivo ? "bg-white" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isAtivo}
                      onCheckedChange={(checked) => handleDayToggle(index, checked)}
                    />
                    <Label className="font-medium text-sm">{dia.label}</Label>
                  </div>
                  {!isAtivo && (
                    <span className="text-xs text-gray-500">Fechado</span>
                  )}
                </div>

                {isAtivo && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Abertura</Label>
                      <Input
                        type="time"
                        value={horarioDia.hr_abertura}
                        onChange={(e) => handleTimeChange(index, 'hr_abertura', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Intervalo Início</Label>
                      <Input
                        type="time"
                        value={horarioDia.hr_inicio_intervalo}
                        onChange={(e) => handleTimeChange(index, 'hr_inicio_intervalo', e.target.value)}
                        placeholder="Opcional"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Intervalo Fim</Label>
                      <Input
                        type="time"
                        value={horarioDia.hr_fim_intervalo}
                        onChange={(e) => handleTimeChange(index, 'hr_fim_intervalo', e.target.value)}
                        placeholder="Opcional"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Fechamento</Label>
                      <Input
                        type="time"
                        value={horarioDia.hr_fechamento}
                        onChange={(e) => handleTimeChange(index, 'hr_fechamento', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Regras de Agendamento
        </h3>

        <div className="space-y-2">
          <Label>Intervalo entre Agendamentos (minutos) *</Label>
          <Select
            value={formData.nr_intervalo_agendamento?.toString() || "30"}
            onValueChange={(value) => onChange('nr_intervalo_agendamento', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="45">45 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Antecedência para Cancelamento (horas)</Label>
            <Input
              type="number"
              min="1"
              value={formData.nr_antecedencia_cancelamento || "24"}
              onChange={(e) => onChange('nr_antecedencia_cancelamento', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Mínimo de horas antes do agendamento para cancelar
            </p>
          </div>
          <div className="space-y-2">
            <Label>Tolerância de Atraso (minutos)</Label>
            <Input
              type="number"
              min="0"
              value={formData.nr_tolerancia_atraso || "15"}
              onChange={(e) => onChange('nr_tolerancia_atraso', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Tempo de espera máximo por paciente atrasado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
