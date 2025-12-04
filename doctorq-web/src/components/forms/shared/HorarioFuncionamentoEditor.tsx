/**
 * Componente para editar horários de funcionamento
 * Usado em formulários de Clínica e Profissional
 */
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Clock, Plus, X } from "lucide-react";

interface HorarioItem {
  abertura: string; // "08:00"
  fechamento: string; // "18:00"
}

interface HorariosFuncionamento {
  [key: string]: HorarioItem[] | undefined;
  segunda?: HorarioItem[];
  terca?: HorarioItem[];
  quarta?: HorarioItem[];
  quinta?: HorarioItem[];
  sexta?: HorarioItem[];
  sabado?: HorarioItem[];
  domingo?: HorarioItem[];
}

interface HorarioFuncionamentoEditorProps {
  value: HorariosFuncionamento;
  onChange: (horarios: HorariosFuncionamento) => void;
  disabled?: boolean;
}

const DIAS_SEMANA = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

export function HorarioFuncionamentoEditor({
  value = {},
  onChange,
  disabled = false,
}: HorarioFuncionamentoEditorProps) {
  const [horarios, setHorarios] = useState<HorariosFuncionamento>(value);

  const isDiaAtivo = (dia: string) => {
    return horarios[dia] && horarios[dia]!.length > 0;
  };

  const toggleDia = (dia: string, ativo: boolean) => {
    const novosHorarios = { ...horarios };

    if (ativo) {
      // Ativar com horário padrão
      novosHorarios[dia] = [{ abertura: "08:00", fechamento: "18:00" }];
    } else {
      // Desativar
      novosHorarios[dia] = undefined;
    }

    setHorarios(novosHorarios);
    onChange(novosHorarios);
  };

  const adicionarPeriodo = (dia: string) => {
    const novosHorarios = { ...horarios };
    const periodosAtuais = novosHorarios[dia] || [];

    novosHorarios[dia] = [
      ...periodosAtuais,
      { abertura: "13:00", fechamento: "17:00" },
    ];

    setHorarios(novosHorarios);
    onChange(novosHorarios);
  };

  const removerPeriodo = (dia: string, index: number) => {
    const novosHorarios = { ...horarios };
    const periodosAtuais = novosHorarios[dia] || [];

    if (periodosAtuais.length === 1) {
      // Se for o único período, desativa o dia
      novosHorarios[dia] = undefined;
    } else {
      novosHorarios[dia] = periodosAtuais.filter((_, i) => i !== index);
    }

    setHorarios(novosHorarios);
    onChange(novosHorarios);
  };

  const atualizarHorario = (
    dia: string,
    index: number,
    campo: "abertura" | "fechamento",
    valor: string
  ) => {
    const novosHorarios = { ...horarios };
    const periodosAtuais = [...(novosHorarios[dia] || [])];

    periodosAtuais[index] = {
      ...periodosAtuais[index],
      [campo]: valor,
    };

    novosHorarios[dia] = periodosAtuais;
    setHorarios(novosHorarios);
    onChange(novosHorarios);
  };

  const copiarHorario = (diaOrigem: string) => {
    const horarioCopiar = horarios[diaOrigem];
    if (!horarioCopiar) return;

    const novosHorarios = { ...horarios };

    // Copiar para todos os dias úteis
    ["segunda", "terca", "quarta", "quinta", "sexta"].forEach((dia) => {
      if (dia !== diaOrigem) {
        novosHorarios[dia] = JSON.parse(JSON.stringify(horarioCopiar));
      }
    });

    setHorarios(novosHorarios);
    onChange(novosHorarios);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4" />
        <Label className="text-base font-semibold">Horários de Funcionamento</Label>
      </div>

      <div className="space-y-4">
        {DIAS_SEMANA.map(({ key, label }) => {
          const ativo = isDiaAtivo(key);
          const periodos = horarios[key] || [];

          return (
            <div
              key={key}
              className="border rounded-lg p-4 space-y-3"
            >
              {/* Cabeçalho do dia */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={ativo}
                    onCheckedChange={(checked) => toggleDia(key, checked)}
                    disabled={disabled}
                  />
                  <Label className="font-medium">{label}</Label>
                </div>

                {ativo && periodos.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copiarHorario(key)}
                    disabled={disabled}
                  >
                    Copiar para dias úteis
                  </Button>
                )}
              </div>

              {/* Períodos do dia */}
              {ativo && (
                <div className="space-y-2">
                  {periodos.map((periodo, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <Input
                        type="time"
                        value={periodo.abertura}
                        onChange={(e) =>
                          atualizarHorario(key, index, "abertura", e.target.value)
                        }
                        disabled={disabled}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={periodo.fechamento}
                        onChange={(e) =>
                          atualizarHorario(key, index, "fechamento", e.target.value)
                        }
                        disabled={disabled}
                        className="w-32"
                      />

                      {periodos.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerPeriodo(key, index)}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Botão para adicionar período */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adicionarPeriodo(key)}
                    disabled={disabled}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar período
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
