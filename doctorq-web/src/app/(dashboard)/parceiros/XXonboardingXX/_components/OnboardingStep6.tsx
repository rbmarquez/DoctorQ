"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Building2,
  Users,
  Briefcase,
  Calendar,
  Zap,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
} from "lucide-react";
import type { OnboardingData } from "../page";

interface Props {
  data: OnboardingData;
  onFinish: () => void;
}

export default function OnboardingStep6({ data, onFinish }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const diasAtivos = data.horarios.filter((h) => h.fg_ativo);
  const totalIntegracoes = [
    data.integracoes.fg_google_calendar,
    data.integracoes.fg_whatsapp,
    data.integracoes.fg_pagamento,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Mensagem de Sucesso */}
      <Card className="border-2 border-green-600 bg-green-50 dark:bg-green-950">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
            Configuração Quase Concluída!
          </h2>
          <p className="text-green-800 dark:text-green-200">
            Revise as informações abaixo e confirme para começar a usar o DoctorQ
          </p>
        </CardContent>
      </Card>

      {/* Dados da Clínica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Dados da Clínica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-bold text-lg">{data.clinica.nm_clinica}</h4>
            <p className="text-sm text-muted-foreground">CNPJ: {data.clinica.nr_cnpj}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{data.clinica.nr_telefone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{data.clinica.ds_email}</span>
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>
                {data.clinica.ds_endereco}, {data.clinica.nr_numero}
                {data.clinica.ds_complemento && ` - ${data.clinica.ds_complemento}`}
                <br />
                {data.clinica.ds_bairro && `${data.clinica.ds_bairro}, `}
                {data.clinica.ds_cidade} - {data.clinica.sg_estado}
                <br />
                CEP: {data.clinica.nr_cep}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Equipe Profissional
            <Badge variant="secondary" className="ml-2">
              {data.profissionais.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.profissionais.map((prof) => (
              <div key={prof.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{prof.nm_profissional}</p>
                  <p className="text-xs text-muted-foreground">
                    {prof.ds_especialidade} - {prof.nr_registro}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Procedimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Procedimentos
            <Badge variant="secondary" className="ml-2">
              {data.procedimentos.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.procedimentos.map((proc) => (
              <div key={proc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{proc.nm_procedimento}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {proc.ds_categoria}
                      </Badge>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {proc.qt_duracao} min
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {formatCurrency(proc.vl_procedimento)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Horários de Atendimento
            <Badge variant="secondary" className="ml-2">
              {diasAtivos.length} dias ativos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.horarios.map((horario) => (
              <div
                key={horario.dia_semana}
                className={`p-2 rounded-lg text-sm ${
                  horario.fg_ativo ? "bg-green-50 dark:bg-green-950" : "bg-muted/30"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{horario.dia_semana}</span>
                  {horario.fg_ativo ? (
                    <span className="text-xs text-green-700 dark:text-green-300">
                      {horario.hr_abertura} - {horario.hr_fechamento}
                      {horario.hr_inicio_intervalo &&
                        ` (Intervalo: ${horario.hr_inicio_intervalo}-${horario.hr_fim_intervalo})`}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Fechado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Integrações
            <Badge variant="secondary" className="ml-2">
              {totalIntegracoes} ativas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.integracoes.fg_google_calendar && (
              <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 dark:bg-blue-950 rounded">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Google Calendar</span>
              </div>
            )}
            {data.integracoes.fg_whatsapp && (
              <div className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-950 rounded">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>WhatsApp Business ({data.integracoes.nr_whatsapp})</span>
              </div>
            )}
            {data.integracoes.fg_pagamento && (
              <div className="flex items-center gap-2 text-sm p-2 bg-purple-50 dark:bg-purple-950 rounded">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Gateway de Pagamento</span>
              </div>
            )}
            {totalIntegracoes === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma integração ativada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão Final */}
      <Card className="border-2 border-primary">
        <CardContent className="p-6 text-center space-y-4">
          <h3 className="text-xl font-bold">Tudo Pronto!</h3>
          <p className="text-muted-foreground">
            Ao confirmar, sua clínica será configurada e você será redirecionado para o dashboard
          </p>
          <Button
            onClick={onFinish}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto px-12"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Confirmar e Finalizar Configuração
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
