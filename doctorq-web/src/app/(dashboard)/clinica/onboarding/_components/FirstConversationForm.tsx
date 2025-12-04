"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, Smartphone, CreditCard, DollarSign } from "lucide-react";

interface FirstConversationFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: string | boolean) => void;
}

export function FirstConversationForm({ formData, onChange }: FirstConversationFormProps) {
  return (
    <div className="space-y-6">
      {/* Notificações */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações e Lembretes
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notificações por E-mail
              </Label>
              <p className="text-sm text-muted-foreground">
                Enviar confirmações e lembretes por e-mail
              </p>
            </div>
            <Switch
              checked={formData.st_notificacao_email !== false}
              onCheckedChange={(checked) => onChange('st_notificacao_email', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Notificações por SMS
              </Label>
              <p className="text-sm text-muted-foreground">
                Enviar confirmações e lembretes por SMS
              </p>
            </div>
            <Switch
              checked={formData.st_notificacao_sms || false}
              onCheckedChange={(checked) => onChange('st_notificacao_sms', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                Notificações por WhatsApp
              </Label>
              <p className="text-sm text-muted-foreground">
                Enviar confirmações e lembretes por WhatsApp
              </p>
            </div>
            <Switch
              checked={formData.st_notificacao_whatsapp !== false}
              onCheckedChange={(checked) => onChange('st_notificacao_whatsapp', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Lembrete de Agendamento</Label>
              <p className="text-sm text-muted-foreground">
                Enviar lembrete automático antes do agendamento
              </p>
            </div>
            <Switch
              checked={formData.st_lembrete_agendamento !== false}
              onCheckedChange={(checked) => onChange('st_lembrete_agendamento', checked)}
            />
          </div>

          {formData.st_lembrete_agendamento !== false && (
            <div className="space-y-2 ml-6">
              <Label>Enviar lembrete com antecedência de (horas)</Label>
              <Select
                value={formData.nr_horas_lembrete?.toString() || "24"}
                onValueChange={(value) => onChange('nr_horas_lembrete', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 horas</SelectItem>
                  <SelectItem value="4">4 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Pagamento */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Formas de Pagamento
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Dinheiro
              </Label>
              <p className="text-sm text-muted-foreground">Aceitar pagamento em espécie</p>
            </div>
            <Switch
              checked={formData.st_aceita_dinheiro !== false}
              onCheckedChange={(checked) => onChange('st_aceita_dinheiro', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                PIX
              </Label>
              <p className="text-sm text-muted-foreground">Aceitar pagamento via PIX</p>
            </div>
            <Switch
              checked={formData.st_aceita_pix !== false}
              onCheckedChange={(checked) => onChange('st_aceita_pix', checked)}
            />
          </div>

          {formData.st_aceita_pix !== false && (
            <div className="space-y-2 ml-6">
              <Label>Desconto para PIX (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.pc_desconto_pix || "5"}
                onChange={(e) => onChange('pc_desconto_pix', e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                Cartão de Crédito
              </Label>
              <p className="text-sm text-muted-foreground">
                Aceitar pagamento com cartão de crédito
              </p>
            </div>
            <Switch
              checked={formData.st_aceita_credito !== false}
              onCheckedChange={(checked) => onChange('st_aceita_credito', checked)}
            />
          </div>

          {formData.st_aceita_credito !== false && (
            <div className="space-y-2 ml-6">
              <Label>Número Máximo de Parcelas</Label>
              <Select
                value={formData.nr_parcelas_maximo?.toString() || "6"}
                onValueChange={(value) => onChange('nr_parcelas_maximo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">À vista</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="3">3x</SelectItem>
                  <SelectItem value="6">6x</SelectItem>
                  <SelectItem value="12">12x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600" />
                Cartão de Débito
              </Label>
              <p className="text-sm text-muted-foreground">
                Aceitar pagamento com cartão de débito
              </p>
            </div>
            <Switch
              checked={formData.st_aceita_debito !== false}
              onCheckedChange={(checked) => onChange('st_aceita_debito', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
