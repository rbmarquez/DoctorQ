"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Smartphone, Mail, Calendar as CalendarIcon, CreditCard, Zap } from "lucide-react";

interface IntegracoesFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: string | boolean) => void;
}

export function IntegracoesForm({ formData, onChange }: IntegracoesFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4" />
          Integrações e Automações
        </h3>
        <p className="text-sm text-gray-500">
          Configure integrações com serviços externos para automatizar processos
        </p>
      </div>

      <div className="space-y-4">
        {/* WhatsApp */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <Label className="text-base font-medium">WhatsApp Business</Label>
                <p className="text-sm text-muted-foreground">
                  Envie confirmações e lembretes automáticos
                </p>
              </div>
            </div>
            <Switch
              checked={formData.fg_whatsapp || false}
              onCheckedChange={(checked) => onChange('fg_whatsapp', checked)}
            />
          </div>

          {formData.fg_whatsapp && (
            <div className="space-y-2 pl-13">
              <Label>Número do WhatsApp Business</Label>
              <Input
                value={formData.nr_whatsapp || ""}
                onChange={(e) => onChange('nr_whatsapp', e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
              <p className="text-xs text-gray-500">
                Número vinculado à conta WhatsApp Business API
              </p>
            </div>
          )}
        </div>

        {/* Google Calendar */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Label className="text-base font-medium">Google Calendar</Label>
                <p className="text-sm text-muted-foreground">
                  Sincronize agendamentos com Google Calendar
                </p>
              </div>
            </div>
            <Switch
              checked={formData.fg_google_calendar || false}
              onCheckedChange={(checked) => onChange('fg_google_calendar', checked)}
            />
          </div>

          {formData.fg_google_calendar && (
            <div className="space-y-2 pl-13">
              <p className="text-sm text-blue-800 bg-blue-50 p-3 rounded-lg">
                <strong>📅 Próximo passo:</strong> Após concluir o onboarding, você poderá conectar
                sua conta Google nas Configurações.
              </p>
            </div>
          )}
        </div>

        {/* Gmail */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <Mail className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <Label className="text-base font-medium">Gmail / SMTP</Label>
                <p className="text-sm text-muted-foreground">
                  Configure e-mail para envio de notificações
                </p>
              </div>
            </div>
            <Switch
              checked={formData.fg_email_smtp || false}
              onCheckedChange={(checked) => onChange('fg_email_smtp', checked)}
            />
          </div>

          {formData.fg_email_smtp && (
            <div className="space-y-3 pl-13">
              <div className="space-y-2">
                <Label>E-mail de Envio</Label>
                <Input
                  type="email"
                  value={formData.ds_email_smtp || ""}
                  onChange={(e) => onChange('ds_email_smtp', e.target.value)}
                  placeholder="noreply@suaclinica.com.br"
                />
              </div>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                <strong>📧 Próximo passo:</strong> Configurações avançadas de SMTP (servidor, porta, senha)
                poderão ser definidas nas Configurações.
              </p>
            </div>
          )}
        </div>

        {/* Pagamento Online */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Label className="text-base font-medium">Gateway de Pagamento</Label>
                <p className="text-sm text-muted-foreground">
                  Aceite pagamentos online (Stripe, MercadoPago)
                </p>
              </div>
            </div>
            <Switch
              checked={formData.fg_pagamento_online || false}
              onCheckedChange={(checked) => onChange('fg_pagamento_online', checked)}
            />
          </div>

          {formData.fg_pagamento_online && (
            <div className="space-y-3 pl-13">
              <div className="space-y-2">
                <Label>Chave de API (Opcional)</Label>
                <Input
                  type="password"
                  value={formData.ds_api_key_pagamento || ""}
                  onChange={(e) => onChange('ds_api_key_pagamento', e.target.value)}
                  placeholder="Deixe em branco para configurar depois"
                />
                <p className="text-xs text-gray-500">
                  Você pode configurar as credenciais completas depois nas Configurações
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <p className="text-sm text-orange-800">
          <strong>⚡ Opcional:</strong> Todas as integrações são opcionais. Você pode ativá-las
          e configurá-las com mais detalhes depois na seção de Configurações.
        </p>
      </div>
    </div>
  );
}
