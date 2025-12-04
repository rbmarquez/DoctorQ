"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, UserPlus, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useProfissionais } from "@/lib/api/hooks/useProfissionais";
import { useProcedimentos } from "@/lib/api/hooks/useProcedimentos";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

interface NovoAgendamentoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: Date;
  clinicaId: string;
  profissionalIdInicial?: string;
}

export function NovoAgendamentoModal({
  open,
  onClose,
  onSuccess,
  initialDate,
  clinicaId,
  profissionalIdInicial,
}: NovoAgendamentoModalProps) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id_paciente: user?.id || "",
    id_profissional: profissionalIdInicial || "",
    id_procedimento: "",
    dt_agendamento: initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    hr_inicio: "09:00",
    nr_duracao_minutos: 60,
    ds_observacoes: "",
  });

  const { profissionais, isLoading: loadingProfissionais } = useProfissionais({
    id_clinica: clinicaId,
    st_ativo: true,
  });

  const { procedimentos, isLoading: loadingProcedimentos } = useProcedimentos({
    st_ativo: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_profissional) {
      toast.error("Selecione um profissional");
      return;
    }

    if (!formData.id_paciente) {
      toast.error("Paciente não identificado");
      return;
    }

    setLoading(true);

    try {
      // Combinar data e hora
      const dtAgendamento = new Date(`${formData.dt_agendamento}T${formData.hr_inicio}:00`);

      const payload = {
        id_paciente: formData.id_paciente,
        id_profissional: formData.id_profissional,
        id_clinica: clinicaId,
        id_procedimento: formData.id_procedimento || undefined,
        dt_agendamento: dtAgendamento.toISOString(),
        nr_duracao_minutos: formData.nr_duracao_minutos,
        ds_observacoes: formData.ds_observacoes || undefined,
      };

      await apiClient.post("/agendamentos/", payload);

      toast.success("Agendamento criado com sucesso!");
      onSuccess?.();
      onClose();

      // Resetar form
      setFormData({
        id_paciente: user?.id || "",
        id_profissional: profissionalIdInicial || "",
        id_procedimento: "",
        dt_agendamento: format(new Date(), "yyyy-MM-dd"),
        hr_inicio: "09:00",
        nr_duracao_minutos: 60,
        ds_observacoes: "",
      });
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast.error(error?.response?.data?.detail || "Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Novo Agendamento</span>
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo agendamento na clínica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profissional */}
          <div className="space-y-2">
            <Label htmlFor="id_profissional" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Profissional *</span>
            </Label>
            <Select
              value={formData.id_profissional}
              onValueChange={(value) => setFormData({ ...formData, id_profissional: value })}
              disabled={loadingProfissionais}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {profissionais?.map((prof: any) => (
                  <SelectItem key={prof.id_profissional} value={prof.id_profissional}>
                    {prof.nm_profissional}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Procedimento */}
          <div className="space-y-2">
            <Label htmlFor="id_procedimento" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Procedimento (opcional)</span>
            </Label>
            <Select
              value={formData.id_procedimento}
              onValueChange={(value) => setFormData({ ...formData, id_procedimento: value })}
              disabled={loadingProcedimentos}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedimentos?.map((proc: any) => (
                  <SelectItem key={proc.id_procedimento} value={proc.id_procedimento}>
                    {proc.nm_procedimento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dt_agendamento" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Data *</span>
              </Label>
              <Input
                id="dt_agendamento"
                type="date"
                value={formData.dt_agendamento}
                onChange={(e) => setFormData({ ...formData, dt_agendamento: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hr_inicio" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Hora *</span>
              </Label>
              <Input
                id="hr_inicio"
                type="time"
                value={formData.hr_inicio}
                onChange={(e) => setFormData({ ...formData, hr_inicio: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="nr_duracao_minutos">Duração (minutos) *</Label>
            <Select
              value={String(formData.nr_duracao_minutos)}
              onValueChange={(value) => setFormData({ ...formData, nr_duracao_minutos: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h 30min</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="ds_observacoes">Observações</Label>
            <Textarea
              id="ds_observacoes"
              placeholder="Adicione observações sobre o agendamento..."
              value={formData.ds_observacoes}
              onChange={(e) => setFormData({ ...formData, ds_observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Agendamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
