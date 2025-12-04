"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import type { HorarioAtendimento } from "../page";

interface Props {
  data: HorarioAtendimento[];
  onUpdate: (data: HorarioAtendimento[]) => void;
}

export default function OnboardingStep4({ data, onUpdate }: Props) {
  const handleToggleDia = (index: number) => {
    const updated = [...data];
    updated[index].fg_ativo = !updated[index].fg_ativo;
    onUpdate(updated);
  };

  const handleUpdateHorario = (index: number, field: keyof HorarioAtendimento, value: string | boolean) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  const handleAplicarTemplate = (template: "dias_uteis" | "sabado" | "domingo") => {
    const updated = [...data];

    if (template === "dias_uteis") {
      for (let i = 0; i < 5; i++) {
        updated[i] = {
          ...updated[i],
          fg_ativo: true,
          hr_abertura: "08:00",
          hr_fechamento: "18:00",
          hr_inicio_intervalo: "12:00",
          hr_fim_intervalo: "13:00",
        };
      }
      toast.success("Template dias úteis aplicado!");
    } else if (template === "sabado") {
      updated[5] = {
        ...updated[5],
        fg_ativo: true,
        hr_abertura: "08:00",
        hr_fechamento: "12:00",
        hr_inicio_intervalo: "",
        hr_fim_intervalo: "",
      };
      toast.success("Sábado configurado!");
    } else if (template === "domingo") {
      updated[6] = {
        ...updated[6],
        fg_ativo: true,
        hr_abertura: "08:00",
        hr_fechamento: "12:00",
        hr_inicio_intervalo: "",
        hr_fim_intervalo: "",
      };
      toast.success("Domingo configurado!");
    }

    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Horários de Atendimento
          </CardTitle>
          <CardDescription>
            Configure os dias e horários de funcionamento da clínica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Templates Rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAplicarTemplate("dias_uteis")}
            >
              <Clock className="w-4 h-4 mr-2" />
              Aplicar Dias Úteis (Seg-Sex 8h-18h)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAplicarTemplate("sabado")}
            >
              Sábado (8h-12h)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAplicarTemplate("domingo")}
            >
              Domingo (8h-12h)
            </Button>
          </div>

          {/* Lista de Dias */}
          <div className="space-y-4">
            {data.map((horario, index) => (
              <Card key={horario.dia_semana} className={horario.fg_ativo ? "border-primary" : "border-muted"}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox Ativo */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id={`dia_${index}`}
                        checked={horario.fg_ativo}
                        onCheckedChange={() => handleToggleDia(index)}
                      />
                      <Label
                        htmlFor={`dia_${index}`}
                        className="font-semibold w-28 cursor-pointer"
                      >
                        {horario.dia_semana}
                      </Label>
                    </div>

                    {/* Horários */}
                    {horario.fg_ativo ? (
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`abertura_${index}`} className="text-xs">
                            Abertura
                          </Label>
                          <Input
                            id={`abertura_${index}`}
                            type="time"
                            value={horario.hr_abertura}
                            onChange={(e) =>
                              handleUpdateHorario(index, "hr_abertura", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`fechamento_${index}`} className="text-xs">
                            Fechamento
                          </Label>
                          <Input
                            id={`fechamento_${index}`}
                            type="time"
                            value={horario.hr_fechamento}
                            onChange={(e) =>
                              handleUpdateHorario(index, "hr_fechamento", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`intervalo_inicio_${index}`} className="text-xs">
                            Início Intervalo
                          </Label>
                          <Input
                            id={`intervalo_inicio_${index}`}
                            type="time"
                            value={horario.hr_inicio_intervalo}
                            onChange={(e) =>
                              handleUpdateHorario(index, "hr_inicio_intervalo", e.target.value)
                            }
                            placeholder="Opcional"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`intervalo_fim_${index}`} className="text-xs">
                            Fim Intervalo
                          </Label>
                          <Input
                            id={`intervalo_fim_${index}`}
                            type="time"
                            value={horario.hr_fim_intervalo}
                            onChange={(e) =>
                              handleUpdateHorario(index, "hr_fim_intervalo", e.target.value)
                            }
                            placeholder="Opcional"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 text-sm text-muted-foreground pt-2">
                        Fechado
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Informações */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
              Dicas de Configuração
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use os templates para configuração rápida</li>
              <li>• Intervalo de almoço é opcional</li>
              <li>• Desmarque dias que não atende</li>
              <li>• Configure pelo menos um dia de atendimento</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
