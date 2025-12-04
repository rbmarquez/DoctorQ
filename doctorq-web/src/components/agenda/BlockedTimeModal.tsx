"use client";

import { useState } from "react";
import { X, Calendar, Clock, Coffee, Plane, Ban, AlertCircle, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BloqueioAgenda, TipoBloqueio } from "@/types/agenda";
import { toast } from "sonner";

interface BlockedTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bloqueio: Partial<BloqueioAgenda>) => void;
  editingBlock?: BloqueioAgenda | null;
}

export function BlockedTimeModal({
  isOpen,
  onClose,
  editingBlock,
  onSave,
}: BlockedTimeModalProps) {
  const [formData, setFormData] = useState<Partial<BloqueioAgenda>>({
    tp_bloqueio: "almoco",
    dt_inicio: new Date().toISOString().split("T")[0],
    hr_inicio: "12:00",
    dt_fim: new Date().toISOString().split("T")[0],
    hr_fim: "13:00",
    ds_motivo: "",
    bo_recorrente: false,
    ds_recorrencia: "diario",
    dt_criacao: new Date().toISOString(),
    id_profissional: "prof1", // Mock
  });

  const tiposBloqueio: { value: TipoBloqueio; label: string; icon: any; color: string }[] = [
    { value: "almoco", label: "Almoço", icon: Coffee, color: "bg-orange-100 text-orange-700 border-orange-300" },
    { value: "descanso", label: "Descanso", icon: Clock, color: "bg-blue-100 text-blue-700 border-blue-300" },
    { value: "ferias", label: "Férias", icon: Plane, color: "bg-green-100 text-green-700 border-green-300" },
    { value: "congresso", label: "Congresso/Evento", icon: Calendar, color: "bg-purple-100 text-purple-700 border-purple-300" },
    { value: "ausencia", label: "Ausência", icon: Ban, color: "bg-red-100 text-red-700 border-red-300" },
  ];

  const recorrenciaOptions = [
    { value: "diario", label: "Todos os dias" },
    { value: "semanal", label: "Toda semana" },
    { value: "mensal", label: "Todo mês" },
  ];

  const handleSubmit = () => {
    // Validações
    if (!formData.dt_inicio || !formData.dt_fim) {
      toast.error("Por favor, preencha as datas de início e fim");
      return;
    }

    if (!formData.ds_motivo) {
      toast.error("Por favor, informe o motivo do bloqueio");
      return;
    }

    // Se for bloqueio de horário específico, validar horas
    if (formData.hr_inicio && formData.hr_fim) {
      const [hrInicioH, hrInicioM] = formData.hr_inicio.split(":").map(Number);
      const [hrFimH, hrFimM] = formData.hr_fim.split(":").map(Number);

      const inicioMinutos = hrInicioH * 60 + hrInicioM;
      const fimMinutos = hrFimH * 60 + hrFimM;

      if (fimMinutos <= inicioMinutos) {
        toast.error("O horário de fim deve ser posterior ao de início");
        return;
      }
    }

    // Validar datas
    const dtInicio = new Date(formData.dt_inicio + "T00:00:00");
    const dtFim = new Date(formData.dt_fim + "T00:00:00");

    if (dtFim < dtInicio) {
      toast.error("A data de fim deve ser posterior à data de início");
      return;
    }

    const bloqueio: Partial<BloqueioAgenda> = {
      ...formData,
      id_bloqueio: editingBlock?.id_bloqueio || `${Date.now()}`,
    };

    onSave(bloqueio);
    toast.success("Bloqueio de horário salvo com sucesso!");
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      tp_bloqueio: "almoco",
      dt_inicio: new Date().toISOString().split("T")[0],
      hr_inicio: "12:00",
      dt_fim: new Date().toISOString().split("T")[0],
      hr_fim: "13:00",
      ds_motivo: "",
      bo_recorrente: false,
      ds_recorrencia: "diario",
      dt_criacao: new Date().toISOString(),
      id_profissional: "prof1",
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  const selectedTipo = tiposBloqueio.find((t) => t.value === formData.tp_bloqueio) || tiposBloqueio[0];
  const IconComponent = selectedTipo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 via-red-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {editingBlock ? "Editar Bloqueio" : "Bloquear Horário"}
                </h2>
                <p className="text-white/80 mt-1">Defina períodos indisponíveis na agenda</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white hover:text-white/80 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tipo de Bloqueio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de Bloqueio <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tiposBloqueio.map((tipo) => {
                const TipoIcon = tipo.icon;
                return (
                  <button
                    key={tipo.value}
                    onClick={() => setFormData({ ...formData, tp_bloqueio: tipo.value })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.tp_bloqueio === tipo.value
                        ? `${tipo.color} border-current`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <TipoIcon className="h-6 w-6 mb-2" />
                    <div className="font-semibold text-sm">{tipo.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Período <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Data de Início</label>
                <input
                  type="date"
                  value={formData.dt_inicio}
                  onChange={(e) => setFormData({ ...formData, dt_inicio: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Data de Fim</label>
                <input
                  type="date"
                  value={formData.dt_fim}
                  onChange={(e) => setFormData({ ...formData, dt_fim: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Horário Específico */}
          <div>
            <label className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                checked={!!formData.hr_inicio}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, hr_inicio: "12:00", hr_fim: "13:00" });
                  } else {
                    setFormData({ ...formData, hr_inicio: undefined, hr_fim: undefined });
                  }
                }}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-semibold text-gray-700">Definir horário específico</span>
            </label>

            {formData.hr_inicio && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Horário de Início</label>
                  <input
                    type="time"
                    value={formData.hr_inicio}
                    onChange={(e) => setFormData({ ...formData, hr_inicio: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Horário de Fim</label>
                  <input
                    type="time"
                    value={formData.hr_fim}
                    onChange={(e) => setFormData({ ...formData, hr_fim: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Motivo do Bloqueio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.ds_motivo}
              onChange={(e) => setFormData({ ...formData, ds_motivo: e.target.value })}
              rows={3}
              placeholder="Ex: Almoço de equipe, Viagem para congresso, Férias em família..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Recorrência */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
            <label className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                checked={formData.bo_recorrente}
                onChange={(e) => setFormData({ ...formData, bo_recorrente: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <Repeat className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Bloqueio recorrente</span>
              </div>
            </label>

            {formData.bo_recorrente && (
              <div className="pl-7">
                <label className="block text-xs text-gray-600 mb-2">Frequência</label>
                <select
                  value={formData.ds_recorrencia}
                  onChange={(e) => setFormData({ ...formData, ds_recorrencia: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                >
                  {recorrenciaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className={`rounded-xl p-4 border-2 ${selectedTipo.color}`}>
            <div className="flex items-start space-x-3">
              <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Resumo do Bloqueio</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Tipo:</strong> {selectedTipo.label}
                  </p>
                  <p>
                    <strong>Período:</strong>{" "}
                    {new Date(formData.dt_inicio + "T00:00:00").toLocaleDateString("pt-BR")} até{" "}
                    {new Date(formData.dt_fim + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                  {formData.hr_inicio && formData.hr_fim && (
                    <p>
                      <strong>Horário:</strong> {formData.hr_inicio} às {formData.hr_fim}
                    </p>
                  )}
                  {formData.bo_recorrente && (
                    <p>
                      <strong>Recorrência:</strong>{" "}
                      {recorrenciaOptions.find((r) => r.value === formData.ds_recorrencia)?.label}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <Button onClick={handleClose} variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Ban className="h-4 w-4 mr-2" />
              Salvar Bloqueio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
