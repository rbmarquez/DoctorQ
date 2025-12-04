"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendamentoData {
  id_agendamento: string;
  nm_paciente?: string;
  nm_profissional?: string;
  dt_agendamento: string;
}

interface ConfirmarReagendamentoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  agendamento: AgendamentoData | null;
  novaData: Date | null;
  loading?: boolean;
}

export function ConfirmarReagendamentoModal({
  open,
  onClose,
  onConfirm,
  agendamento,
  novaData,
  loading = false,
}: ConfirmarReagendamentoModalProps) {
  if (!agendamento || !novaData) return null;

  const dataAtual = parseISO(agendamento.dt_agendamento);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span>Confirmar Reagendamento</span>
          </DialogTitle>
          <DialogDescription>
            Você está prestes a alterar a data e horário deste agendamento. Por favor, revise as informações abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações do Paciente */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-700">Paciente:</span>
              <span className="text-gray-900">{agendamento.nm_paciente || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-700">Profissional:</span>
              <span className="text-gray-900">{agendamento.nm_profissional || "N/A"}</span>
            </div>
          </div>

          {/* Comparação de Datas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Data Atual */}
            <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4">
              <div className="text-xs font-semibold text-red-600 uppercase mb-3">Data Atual</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    {format(dataAtual, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    {format(dataAtual, "HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="text-xs text-red-700 mt-2">
                  {format(dataAtual, "EEEE", { locale: ptBR })}
                </div>
              </div>
            </div>

            {/* Nova Data */}
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
              <div className="text-xs font-semibold text-green-600 uppercase mb-3">Nova Data</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    {format(novaData, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    {format(novaData, "HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="text-xs text-green-700 mt-2">
                  {format(novaData, "EEEE", { locale: ptBR })}
                </div>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Atenção:</p>
              <p>O paciente deve ser notificado sobre a alteração do agendamento.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Reagendando...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Confirmar Reagendamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
