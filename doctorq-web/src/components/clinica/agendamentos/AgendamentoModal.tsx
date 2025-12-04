"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

interface AgendamentoModalProps {
  open: boolean;
  onClose: () => void;
  agendamento: any;
  onSuccess?: () => void;
  mode?: "view" | "edit";
}

const STATUS_OPTIONS = [
  { value: "agendado", label: "Agendado", color: "bg-blue-500" },
  { value: "confirmado", label: "Confirmado", color: "bg-green-500" },
  { value: "em_atendimento", label: "Em Atendimento", color: "bg-yellow-500" },
  { value: "concluido", label: "Concluído", color: "bg-gray-500" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-500" },
  { value: "nao_compareceu", label: "Não Compareceu", color: "bg-orange-500" },
];

export function AgendamentoModal({ open, onClose, agendamento, onSuccess, mode: initialMode = "view" }: AgendamentoModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ds_status: agendamento?.ds_status || "agendado",
    ds_observacoes: agendamento?.ds_observacoes || "",
  });

  useEffect(() => {
    if (agendamento) {
      setFormData({
        ds_status: agendamento.ds_status || "agendado",
        ds_observacoes: agendamento.ds_observacoes || "",
      });
    }
  }, [agendamento]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await apiClient.put(`/agendamentos/${agendamento.id_agendamento}`, formData);
      toast.success("Agendamento atualizado!");
      onSuccess?.();
      setMode("view");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    setLoading(true);
    try {
      await apiClient.delete(`/agendamentos/${agendamento.id_agendamento}`);
      toast.success("Agendamento cancelado!");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Erro ao cancelar");
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === agendamento?.ds_status);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <Badge className={`${currentStatus?.color} text-white`}>
              {currentStatus?.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Read-only */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500 text-xs">Paciente</Label>
              <p className="font-semibold">{agendamento?.nm_paciente || "N/A"}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Profissional</Label>
              <p className="font-semibold">{agendamento?.nm_profissional || "N/A"}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Data e Hora</Label>
              <p className="font-semibold">
                {agendamento?.dt_agendamento &&
                  format(parseISO(agendamento.dt_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Duração</Label>
              <p className="font-semibold">{agendamento?.nr_duracao_minutos} minutos</p>
            </div>
          </div>

          {/* Campos Editáveis */}
          {mode === "edit" ? (
            <>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.ds_status} onValueChange={(value) => setFormData({ ...formData, ds_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.ds_observacoes}
                  onChange={(e) => setFormData({ ...formData, ds_observacoes: e.target.value })}
                  rows={4}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label className="text-gray-500 text-xs">Observações</Label>
              <p className="text-sm">{agendamento?.ds_observacoes || "Nenhuma observação"}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {mode === "view" ? (
              <>
                <Button variant="destructive" size="sm" onClick={handleCancel} disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancelar Agendamento
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setMode("view")}>
                Voltar
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            {mode === "view" ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button onClick={() => setMode("edit")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </>
            ) : (
              <Button onClick={handleUpdate} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
