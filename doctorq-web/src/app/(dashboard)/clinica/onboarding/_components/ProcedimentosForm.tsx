"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Plus, Trash2, Stethoscope } from "lucide-react";

interface Procedimento {
  id: string;
  nm_procedimento: string;
  ds_categoria: string;
  qt_duracao: number;
  vl_procedimento: number;
  ds_procedimento: string;
}

interface ProcedimentosFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export function ProcedimentosForm({ formData, onChange }: ProcedimentosFormProps) {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>(
    formData.procedimentos || []
  );

  const addProcedimento = () => {
    const newProcedimento: Procedimento = {
      id: Date.now().toString(),
      nm_procedimento: "",
      ds_categoria: "",
      qt_duracao: 30,
      vl_procedimento: 0,
      ds_procedimento: "",
    };
    const updated = [...procedimentos, newProcedimento];
    setProcedimentos(updated);
    onChange('procedimentos', updated);
  };

  const removeProcedimento = (id: string) => {
    const updated = procedimentos.filter((p) => p.id !== id);
    setProcedimentos(updated);
    onChange('procedimentos', updated);
  };

  const updateProcedimento = (id: string, field: keyof Procedimento, value: any) => {
    const updated = procedimentos.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setProcedimentos(updated);
    onChange('procedimentos', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Procedimentos e Serviços
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre os procedimentos oferecidos pela clínica
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProcedimento}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Procedimento
        </Button>
      </div>

      {procedimentos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Nenhum procedimento cadastrado
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Clique em &quot;Adicionar Procedimento&quot; para começar
              </p>
              <Button
                type="button"
                onClick={addProcedimento}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Procedimento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {procedimentos.map((procedimento, index) => (
            <Card key={procedimento.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-sm">
                    Procedimento #{index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProcedimento(procedimento.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Procedimento *</Label>
                    <Input
                      value={procedimento.nm_procedimento}
                      onChange={(e) =>
                        updateProcedimento(procedimento.id, "nm_procedimento", e.target.value)
                      }
                      placeholder="Ex: Botox, Preenchimento Labial"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={procedimento.ds_categoria}
                      onValueChange={(value) =>
                        updateProcedimento(procedimento.id, "ds_categoria", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Estética Facial">Estética Facial</SelectItem>
                        <SelectItem value="Estética Corporal">Estética Corporal</SelectItem>
                        <SelectItem value="Harmonização Facial">Harmonização Facial</SelectItem>
                        <SelectItem value="Injetáveis">Injetáveis</SelectItem>
                        <SelectItem value="Laser">Laser</SelectItem>
                        <SelectItem value="Peeling">Peeling</SelectItem>
                        <SelectItem value="Limpeza de Pele">Limpeza de Pele</SelectItem>
                        <SelectItem value="Massagem">Massagem</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duração (minutos) *</Label>
                    <Select
                      value={procedimento.qt_duracao.toString()}
                      onValueChange={(value) =>
                        updateProcedimento(procedimento.id, "qt_duracao", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1h 30min</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="180">3 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={procedimento.vl_procedimento}
                      onChange={(e) =>
                        updateProcedimento(
                          procedimento.id,
                          "vl_procedimento",
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={procedimento.ds_procedimento}
                      onChange={(e) =>
                        updateProcedimento(procedimento.id, "ds_procedimento", e.target.value)
                      }
                      placeholder="Descreva o procedimento, benefícios e indicações..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <p className="text-sm text-purple-800">
          <strong>💡 Dica:</strong> Adicione os principais procedimentos. Você poderá editar,
          adicionar fotos e configurar detalhes depois na seção de Procedimentos.
        </p>
      </div>
    </div>
  );
}
