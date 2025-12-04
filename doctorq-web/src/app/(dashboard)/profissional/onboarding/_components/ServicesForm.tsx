"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sparkles, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ServicesFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export function ServicesForm({ formData, onChange }: ServicesFormProps) {
  const [procedimentosSelecionados, setProcedimentosSelecionados] = useState<string[]>(
    formData.procedimentos_selecionados || []
  );
  const [customProcedimentos, setCustomProcedimentos] = useState<string[]>(
    formData.custom_procedimentos || []
  );
  const [novoProc, setNovoProc] = useState("");

  const procedimentosComuns = [
    { categoria: "Estética Facial", itens: [
      "Limpeza de Pele",
      "Peeling Químico",
      "Microagulhamento",
      "Radiofrequência Facial",
      "Laser CO2 Fracionado",
      "Tratamento de Acne",
    ]},
    { categoria: "Harmonização Facial", itens: [
      "Botox",
      "Preenchimento Labial",
      "Preenchimento de Bigode Chinês",
      "Preenchimento Mandibular",
      "Bichectomia",
      "Fios de Sustentação",
    ]},
    { categoria: "Estética Corporal", itens: [
      "Criolipólise",
      "Drenagem Linfática",
      "Radiofrequência Corporal",
      "Carboxiterapia",
      "Massagem Modeladora",
      "Endermologia",
    ]},
    { categoria: "Laser e Depilação", itens: [
      "Depilação a Laser",
      "Laser para Manchas",
      "Laser para Vasinhos",
      "Laser para Tatuagem",
    ]},
  ];

  const handleToggleProcedimento = (procedimento: string) => {
    const updated = procedimentosSelecionados.includes(procedimento)
      ? procedimentosSelecionados.filter((p) => p !== procedimento)
      : [...procedimentosSelecionados, procedimento];

    setProcedimentosSelecionados(updated);
    onChange('procedimentos_selecionados', updated);
  };

  const handleAddCustom = () => {
    if (novoProc.trim()) {
      const updated = [...customProcedimentos, novoProc.trim()];
      setCustomProcedimentos(updated);
      onChange('custom_procedimentos', updated);
      setNovoProc("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    const updated = customProcedimentos.filter((_, i) => i !== index);
    setCustomProcedimentos(updated);
    onChange('custom_procedimentos', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4" />
          Procedimentos que Você Realiza
        </h3>
        <p className="text-sm text-gray-500">
          Selecione os procedimentos que você oferece. Isso ajudará pacientes a encontrarem você.
        </p>
      </div>

      {procedimentosComuns.map((categoria, catIdx) => (
        <div key={catIdx} className="space-y-3">
          <h4 className="font-medium text-sm text-gray-800 border-b pb-2">
            {categoria.categoria}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoria.itens.map((item, itemIdx) => (
              <div key={itemIdx} className="flex items-center space-x-2">
                <Checkbox
                  id={`proc-${catIdx}-${itemIdx}`}
                  checked={procedimentosSelecionados.includes(item)}
                  onCheckedChange={() => handleToggleProcedimento(item)}
                />
                <Label
                  htmlFor={`proc-${catIdx}-${itemIdx}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {item}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-sm text-gray-800">
          Outros Procedimentos
        </h4>
        <p className="text-sm text-gray-500">
          Adicione procedimentos que não estão listados acima
        </p>

        <div className="flex gap-2">
          <Input
            value={novoProc}
            onChange={(e) => setNovoProc(e.target.value)}
            placeholder="Digite o nome do procedimento"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
          />
          <Button
            type="button"
            onClick={handleAddCustom}
            disabled={!novoProc.trim()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {customProcedimentos.length > 0 && (
          <div className="space-y-2">
            {customProcedimentos.map((proc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">{proc}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCustom(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800">
          <strong>✨ Destaque-se:</strong> Profissionais com portfólio completo de procedimentos
          recebem até 3x mais solicitações de agendamento.
        </p>
      </div>
    </div>
  );
}
