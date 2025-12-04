"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Calendar } from "lucide-react";

interface AvailabilityFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export function AvailabilityForm({ formData, onChange }: AvailabilityFormProps) {
  const diasSemana = [
    { key: "segunda", label: "Segunda-feira" },
    { key: "terca", label: "Terça-feira" },
    { key: "quarta", label: "Quarta-feira" },
    { key: "quinta", label: "Quinta-feira" },
    { key: "sexta", label: "Sexta-feira" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];

  // Inicializar horários se não existir
  const horarios = formData.ds_horarios_atendimento || {};

  const handleDiaToggle = (key: string, checked: boolean) => {
    const newHorarios = { ...horarios };
    if (checked) {
      // Ativar dia com horários padrão
      newHorarios[key] = {
        ativo: true,
        hr_inicio: "08:00",
        hr_fim: "18:00",
      };
    } else {
      // Desativar dia
      if (newHorarios[key]) {
        newHorarios[key].ativo = false;
      } else {
        newHorarios[key] = { ativo: false };
      }
    }
    onChange("ds_horarios_atendimento", newHorarios);
  };

  const handleHorarioChange = (key: string, field: "hr_inicio" | "hr_fim", value: string) => {
    const newHorarios = { ...horarios };
    if (!newHorarios[key]) {
      newHorarios[key] = { ativo: true };
    }
    newHorarios[key][field] = value;
    onChange("ds_horarios_atendimento", newHorarios);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4" />
          Horários de Atendimento
        </h3>
        <p className="text-sm text-gray-500">
          Configure sua disponibilidade semanal. Defina horários específicos para cada dia da semana.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Dias e Horários de Atendimento
        </h4>
        <div className="space-y-4">
          {diasSemana.map((dia) => {
            const diaHorario = horarios[dia.key] || { ativo: false };
            const isAtivo = diaHorario.ativo !== false;

            return (
              <div key={dia.key} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer font-medium">{dia.label}</Label>
                  <Switch
                    checked={isAtivo}
                    onCheckedChange={(checked) => handleDiaToggle(dia.key, checked)}
                  />
                </div>

                {isAtivo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Horário de Início</Label>
                      <Input
                        type="time"
                        value={diaHorario.hr_inicio || "08:00"}
                        onChange={(e) => handleHorarioChange(dia.key, "hr_inicio", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Horário de Término</Label>
                      <Input
                        type="time"
                        value={diaHorario.hr_fim || "18:00"}
                        onChange={(e) => handleHorarioChange(dia.key, "hr_fim", e.target.value)}
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
        <h4 className="font-medium text-sm">Configurações de Agendamento</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duração padrão da consulta (minutos) *</Label>
            <Input
              type="number"
              min="15"
              step="15"
              value={formData.nr_tempo_consulta || "60"}
              onChange={(e) => onChange('nr_tempo_consulta', e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Este será o tempo padrão para cada agendamento
            </p>
          </div>

          <div className="space-y-2">
            <Label>Intervalo entre consultas (minutos)</Label>
            <Input
              type="number"
              min="0"
              step="5"
              value={formData.qt_intervalo_consultas || "0"}
              onChange={(e) => onChange('qt_intervalo_consultas', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Tempo de descanso entre atendimentos
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <p className="text-sm text-purple-800">
          <strong>⏰ Flexibilidade:</strong> Ative os dias que você atende e defina os horários específicos para cada um.
          Você poderá criar bloqueios e exceções na sua agenda depois.
        </p>
      </div>
    </div>
  );
}
