"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Calendar as CalendarIcon, MessageCircle, CreditCard, Mail, Smartphone } from "lucide-react";
import type { Integracoes } from "../page";

interface Props {
  data: Integracoes;
  onUpdate: (data: Integracoes) => void;
}

export default function OnboardingStep5({ data, onUpdate }: Props) {
  const handleToggle = (field: keyof Integracoes) => {
    onUpdate({ ...data, [field]: !data[field] });
  };

  const handleChange = (field: keyof Integracoes, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleConnectGoogleCalendar = () => {
    console.log("🔗 Conectar Google Calendar (placeholder)");
    alert("Funcionalidade em desenvolvimento.\nEm breve você poderá sincronizar sua agenda com o Google Calendar.");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Integrações e Conexões
          </CardTitle>
          <CardDescription>
            Conecte ferramentas externas para otimizar sua clínica (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Calendar */}
          <Card className={data.fg_google_calendar ? "border-primary" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="google_calendar"
                    checked={data.fg_google_calendar}
                    onCheckedChange={() => handleToggle("fg_google_calendar")}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <Label htmlFor="google_calendar" className="font-semibold cursor-pointer">
                      Google Calendar
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sincronize agendamentos automaticamente com sua conta Google
                  </p>
                  {data.fg_google_calendar && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectGoogleCalendar}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                    >
                      Conectar Conta Google
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Business */}
          <Card className={data.fg_whatsapp ? "border-primary" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="whatsapp"
                    checked={data.fg_whatsapp}
                    onCheckedChange={() => handleToggle("fg_whatsapp")}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <Label htmlFor="whatsapp" className="font-semibold cursor-pointer">
                      WhatsApp Business
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Envie lembretes e confirmações de agendamentos via WhatsApp
                  </p>
                  {data.fg_whatsapp && (
                    <div className="space-y-2">
                      <Label htmlFor="nr_whatsapp" className="text-sm">
                        Número WhatsApp Business
                      </Label>
                      <Input
                        id="nr_whatsapp"
                        placeholder="(00) 00000-0000"
                        value={data.nr_whatsapp}
                        onChange={(e) => handleChange("nr_whatsapp", e.target.value)}
                        maxLength={15}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pagamentos */}
          <Card className={data.fg_pagamento ? "border-primary" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="pagamento"
                    checked={data.fg_pagamento}
                    onCheckedChange={() => handleToggle("fg_pagamento")}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <Label htmlFor="pagamento" className="font-semibold cursor-pointer">
                      Gateway de Pagamento
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Integre Mercado Pago ou Stripe para receber pagamentos online
                  </p>
                  {data.fg_pagamento && (
                    <div className="space-y-2">
                      <Label htmlFor="api_key_pagamento" className="text-sm">
                        API Key (Mercado Pago ou Stripe)
                      </Label>
                      <Input
                        id="api_key_pagamento"
                        type="password"
                        placeholder="sk_test_..."
                        value={data.ds_api_key_pagamento}
                        onChange={(e) => handleChange("ds_api_key_pagamento", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Você pode configurar isso depois em Configurações
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notificacao_email"
                    checked={data.fg_notificacao_email}
                    onCheckedChange={() => handleToggle("fg_notificacao_email")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-orange-600" />
                  <Label htmlFor="notificacao_email" className="cursor-pointer">
                    Notificações por E-mail
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notificacao_sms"
                    checked={data.fg_notificacao_sms}
                    onCheckedChange={() => handleToggle("fg_notificacao_sms")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-600" />
                  <Label htmlFor="notificacao_sms" className="cursor-pointer">
                    Notificações por SMS
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-100">
              Todas as integrações são opcionais
            </h4>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Você pode ativar ou desativar essas integrações a qualquer momento em Configurações.
              Elas ajudam a automatizar processos e melhorar a experiência dos pacientes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
