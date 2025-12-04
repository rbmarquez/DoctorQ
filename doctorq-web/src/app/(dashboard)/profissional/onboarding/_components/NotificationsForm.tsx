"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, Calendar } from "lucide-react";

interface NotificationsFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: boolean) => void;
}

export function NotificationsForm({ formData, onChange }: NotificationsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4" />
          Preferências de Notificações
        </h3>
        <p className="text-sm text-gray-500">
          Escolha como e quando você deseja receber notificações sobre sua agenda e pacientes.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-800">Notificações de Agendamentos</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Label className="text-base font-medium">E-mail</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações por e-mail
                </p>
              </div>
            </div>
            <Switch
              checked={formData.fg_notif_email !== false}
              onCheckedChange={(checked) => onChange('fg_notif_email', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <Label className="text-base font-medium">WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações pelo WhatsApp
                </p>
              </div>
            </div>
            <Switch
              checked={formData.fg_notif_whatsapp !== false}
              onCheckedChange={(checked) => onChange('fg_notif_whatsapp', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Label className="text-base font-medium">Push (Navegador)</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações em tempo real no navegador
                </p>
              </div>
            </div>
            <Switch
              checked={formData.fg_notif_push !== false}
              onCheckedChange={(checked) => onChange('fg_notif_push', checked)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-sm text-gray-800">Tipos de Notificação</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
            <Label className="cursor-pointer">Novo agendamento</Label>
            <Switch
              checked={formData.fg_notif_novo_agendamento !== false}
              onCheckedChange={(checked) => onChange('fg_notif_novo_agendamento', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
            <Label className="cursor-pointer">Cancelamento de consulta</Label>
            <Switch
              checked={formData.fg_notif_cancelamento !== false}
              onCheckedChange={(checked) => onChange('fg_notif_cancelamento', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
            <Label className="cursor-pointer">Remarcação de consulta</Label>
            <Switch
              checked={formData.fg_notif_remarcacao !== false}
              onCheckedChange={(checked) => onChange('fg_notif_remarcacao', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
            <Label className="cursor-pointer">Lembrete antes da consulta (1 dia antes)</Label>
            <Switch
              checked={formData.fg_notif_lembrete !== false}
              onCheckedChange={(checked) => onChange('fg_notif_lembrete', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
            <Label className="cursor-pointer">Novas avaliações de pacientes</Label>
            <Switch
              checked={formData.fg_notif_avaliacoes !== false}
              onCheckedChange={(checked) => onChange('fg_notif_avaliacoes', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
            <Label className="cursor-pointer">Mensagens de pacientes</Label>
            <Switch
              checked={formData.fg_notif_mensagens !== false}
              onCheckedChange={(checked) => onChange('fg_notif_mensagens', checked)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-sm text-gray-800 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Resumo Diário
        </h4>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label className="text-base font-medium">Resumo da agenda do dia</Label>
            <p className="text-sm text-muted-foreground">
              Receber todas as manhãs (8h) um resumo dos agendamentos do dia
            </p>
          </div>
          <Switch
            checked={formData.fg_resumo_diario !== false}
            onCheckedChange={(checked) => onChange('fg_resumo_diario', checked)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <p className="text-sm text-orange-800">
          <strong>🔔 Importante:</strong> Manter notificações ativadas ajuda você a não perder
          nenhum agendamento e responder rapidamente aos seus pacientes.
        </p>
      </div>
    </div>
  );
}
