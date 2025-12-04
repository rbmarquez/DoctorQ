"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Building2,
  Clock,
  Bell,
  Lock,
  CreditCard,
  Mail,
  Smartphone,
  Shield,
  Eye,
  Globe,
  Palette,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("geral");
  const [isSaving, setIsSaving] = useState(false);

  // Estado das configurações
  const [config, setConfig] = useState({
    // Geral
    nm_clinica: "Clínica Bella Donna",
    ds_descricao: "Clínica de estética especializada em tratamentos faciais e corporais",
    nr_cnpj: "12.345.678/0001-90",
    nr_telefone: "(11) 3456-7890",
    ds_email: "contato@belladonna.com.br",
    ds_endereco: "Rua das Flores, 123 - Centro",
    ds_cidade: "São Paulo",
    ds_estado: "SP",
    nr_cep: "01234-567",

    // Horário
    hr_abertura: "08:00",
    hr_fechamento: "18:00",
    nr_intervalo_agendamento: 30,
    st_agenda_sabado: true,
    st_agenda_domingo: false,
    nr_antecedencia_cancelamento: 24,
    nr_tolerancia_atraso: 15,

    // Notificações
    st_notificacao_email: true,
    st_notificacao_sms: true,
    st_notificacao_whatsapp: true,
    st_lembrete_agendamento: true,
    nr_horas_lembrete: 24,
    st_confirmacao_automatica: false,

    // Pagamento
    st_aceita_dinheiro: true,
    st_aceita_pix: true,
    st_aceita_credito: true,
    st_aceita_debito: true,
    st_aceita_boleto: false,
    pc_desconto_pix: 5,
    nr_parcelas_maximo: 6,

    // Privacidade
    st_perfil_publico: true,
    st_mostrar_precos: true,
    st_aceitar_avaliacao: true,
    st_compartilhar_fotos: false,
    ds_politica_privacidade: "Em conformidade com a LGPD",

    // Aparência
    ds_tema: "light",
    ds_cor_primaria: "#8B5CF6",
    ds_logo_url: "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    alert("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações e preferências da clínica
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Settings className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="geral">
            <Building2 className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="horario">
            <Clock className="h-4 w-4 mr-2" />
            Horário
          </TabsTrigger>
          <TabsTrigger value="notificacoes">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="pagamento">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="privacidade">
            <Lock className="h-4 w-4 mr-2" />
            Privacidade
          </TabsTrigger>
          <TabsTrigger value="aparencia">
            <Palette className="h-4 w-4 mr-2" />
            Aparência
          </TabsTrigger>
        </TabsList>

        {/* Tab: Geral */}
        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Clínica
              </CardTitle>
              <CardDescription>
                Dados básicos e informações de contato da clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nm_clinica">Nome da Clínica *</Label>
                  <Input
                    id="nm_clinica"
                    value={config.nm_clinica}
                    onChange={(e) => setConfig({ ...config, nm_clinica: e.target.value })}
                    placeholder="Ex: Clínica Bella Donna"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_cnpj">CNPJ</Label>
                  <Input
                    id="nr_cnpj"
                    value={config.nr_cnpj}
                    onChange={(e) => setConfig({ ...config, nr_cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ds_descricao">Descrição</Label>
                <Textarea
                  id="ds_descricao"
                  value={config.ds_descricao}
                  onChange={(e) => setConfig({ ...config, ds_descricao: e.target.value })}
                  placeholder="Descreva sua clínica..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nr_telefone">
                    <Smartphone className="h-4 w-4 inline mr-1" />
                    Telefone
                  </Label>
                  <Input
                    id="nr_telefone"
                    value={config.nr_telefone}
                    onChange={(e) => setConfig({ ...config, nr_telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ds_email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    E-mail
                  </Label>
                  <Input
                    id="ds_email"
                    type="email"
                    value={config.ds_email}
                    onChange={(e) => setConfig({ ...config, ds_email: e.target.value })}
                    placeholder="contato@clinica.com.br"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ds_endereco">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Endereço
                </Label>
                <Input
                  id="ds_endereco"
                  value={config.ds_endereco}
                  onChange={(e) => setConfig({ ...config, ds_endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ds_cidade">Cidade</Label>
                  <Input
                    id="ds_cidade"
                    value={config.ds_cidade}
                    onChange={(e) => setConfig({ ...config, ds_cidade: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ds_estado">Estado</Label>
                  <Select
                    value={config.ds_estado}
                    onValueChange={(value) => setConfig({ ...config, ds_estado: value })}
                  >
                    <SelectTrigger id="ds_estado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      {/* Adicionar outros estados */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_cep">CEP</Label>
                  <Input
                    id="nr_cep"
                    value={config.nr_cep}
                    onChange={(e) => setConfig({ ...config, nr_cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Horário */}
        <TabsContent value="horario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>
                Configure o horário de atendimento e regras de agendamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hr_abertura">Horário de Abertura</Label>
                  <Input
                    id="hr_abertura"
                    type="time"
                    value={config.hr_abertura}
                    onChange={(e) => setConfig({ ...config, hr_abertura: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hr_fechamento">Horário de Fechamento</Label>
                  <Input
                    id="hr_fechamento"
                    type="time"
                    value={config.hr_fechamento}
                    onChange={(e) => setConfig({ ...config, hr_fechamento: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nr_intervalo_agendamento">
                  Intervalo entre Agendamentos (minutos)
                </Label>
                <Select
                  value={config.nr_intervalo_agendamento.toString()}
                  onValueChange={(value) =>
                    setConfig({ ...config, nr_intervalo_agendamento: parseInt(value) })
                  }
                >
                  <SelectTrigger id="nr_intervalo_agendamento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atendimento aos Sábados</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir agendamentos aos sábados
                    </p>
                  </div>
                  <Switch
                    checked={config.st_agenda_sabado}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_agenda_sabado: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atendimento aos Domingos</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir agendamentos aos domingos
                    </p>
                  </div>
                  <Switch
                    checked={config.st_agenda_domingo}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_agenda_domingo: checked })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nr_antecedencia_cancelamento">
                    Antecedência para Cancelamento (horas)
                  </Label>
                  <Input
                    id="nr_antecedencia_cancelamento"
                    type="number"
                    min="1"
                    value={config.nr_antecedencia_cancelamento}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        nr_antecedencia_cancelamento: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_tolerancia_atraso">Tolerância de Atraso (minutos)</Label>
                  <Input
                    id="nr_tolerancia_atraso"
                    type="number"
                    min="0"
                    value={config.nr_tolerancia_atraso}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        nr_tolerancia_atraso: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificações */}
        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações e Lembretes
              </CardTitle>
              <CardDescription>
                Configure como e quando notificar pacientes e profissionais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                    checked={config.st_notificacao_email}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_notificacao_email: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
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
                    checked={config.st_notificacao_sms}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_notificacao_sms: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
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
                    checked={config.st_notificacao_whatsapp}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_notificacao_whatsapp: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Lembrete de Agendamento
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembrete automático antes do agendamento
                    </p>
                  </div>
                  <Switch
                    checked={config.st_lembrete_agendamento}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_lembrete_agendamento: checked })
                    }
                  />
                </div>

                {config.st_lembrete_agendamento && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="nr_horas_lembrete">
                      Enviar lembrete com antecedência de (horas)
                    </Label>
                    <Select
                      value={config.nr_horas_lembrete.toString()}
                      onValueChange={(value) =>
                        setConfig({ ...config, nr_horas_lembrete: parseInt(value) })
                      }
                    >
                      <SelectTrigger id="nr_horas_lembrete">
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmação Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Confirmar agendamentos automaticamente sem aprovação manual
                    </p>
                  </div>
                  <Switch
                    checked={config.st_confirmacao_automatica}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_confirmacao_automatica: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pagamento */}
        <TabsContent value="pagamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Formas de Pagamento
              </CardTitle>
              <CardDescription>
                Configure as formas de pagamento aceitas pela clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Dinheiro
                    </Label>
                    <p className="text-sm text-muted-foreground">Aceitar pagamento em espécie</p>
                  </div>
                  <Switch
                    checked={config.st_aceita_dinheiro}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_aceita_dinheiro: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      PIX
                    </Label>
                    <p className="text-sm text-muted-foreground">Aceitar pagamento via PIX</p>
                  </div>
                  <Switch
                    checked={config.st_aceita_pix}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_aceita_pix: checked })
                    }
                  />
                </div>

                {config.st_aceita_pix && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="pc_desconto_pix">Desconto para PIX (%)</Label>
                    <Input
                      id="pc_desconto_pix"
                      type="number"
                      min="0"
                      max="100"
                      value={config.pc_desconto_pix}
                      onChange={(e) =>
                        setConfig({ ...config, pc_desconto_pix: parseInt(e.target.value) })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
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
                    checked={config.st_aceita_credito}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_aceita_credito: checked })
                    }
                  />
                </div>

                {config.st_aceita_credito && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="nr_parcelas_maximo">Número Máximo de Parcelas</Label>
                    <Select
                      value={config.nr_parcelas_maximo.toString()}
                      onValueChange={(value) =>
                        setConfig({ ...config, nr_parcelas_maximo: parseInt(value) })
                      }
                    >
                      <SelectTrigger id="nr_parcelas_maximo">
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

                <div className="flex items-center justify-between">
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
                    checked={config.st_aceita_debito}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_aceita_debito: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Boleto Bancário</Label>
                    <p className="text-sm text-muted-foreground">
                      Aceitar pagamento via boleto bancário
                    </p>
                  </div>
                  <Switch
                    checked={config.st_aceita_boleto}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_aceita_boleto: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Privacidade */}
        <TabsContent value="privacidade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacidade e Segurança
              </CardTitle>
              <CardDescription>
                Configure as opções de privacidade e visibilidade da clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Perfil Público
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir perfil da clínica na busca pública
                    </p>
                  </div>
                  <Switch
                    checked={config.st_perfil_publico}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_perfil_publico: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Mostrar Preços
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir preços dos procedimentos publicamente
                    </p>
                  </div>
                  <Switch
                    checked={config.st_mostrar_precos}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_mostrar_precos: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aceitar Avaliações</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que pacientes avaliem a clínica
                    </p>
                  </div>
                  <Switch
                    checked={config.st_aceitar_avaliacao}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_aceitar_avaliacao: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compartilhar Fotos Antes/Depois</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir fotos de resultados na galeria pública (com consentimento)
                    </p>
                  </div>
                  <Switch
                    checked={config.st_compartilhar_fotos}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_compartilhar_fotos: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ds_politica_privacidade">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Política de Privacidade
                </Label>
                <Textarea
                  id="ds_politica_privacidade"
                  value={config.ds_politica_privacidade}
                  onChange={(e) =>
                    setConfig({ ...config, ds_politica_privacidade: e.target.value })
                  }
                  placeholder="Resumo da política de privacidade..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ Importante: Mantenha sua política de privacidade em conformidade com a LGPD
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Aparência */}
        <TabsContent value="aparencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalização Visual
              </CardTitle>
              <CardDescription>
                Personalize as cores e aparência da interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ds_tema">Tema</Label>
                <Select
                  value={config.ds_tema}
                  onValueChange={(value) => setConfig({ ...config, ds_tema: value })}
                >
                  <SelectTrigger id="ds_tema">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático (Sistema)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ds_cor_primaria">Cor Primária</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="ds_cor_primaria"
                    type="color"
                    value={config.ds_cor_primaria}
                    onChange={(e) => setConfig({ ...config, ds_cor_primaria: e.target.value })}
                    className="w-20 h-12"
                  />
                  <Input
                    type="text"
                    value={config.ds_cor_primaria}
                    onChange={(e) => setConfig({ ...config, ds_cor_primaria: e.target.value })}
                    placeholder="#8B5CF6"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cor principal usada nos botões e destaques da interface
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ds_logo_url">URL da Logo</Label>
                <Input
                  id="ds_logo_url"
                  type="url"
                  value={config.ds_logo_url}
                  onChange={(e) => setConfig({ ...config, ds_logo_url: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Link da imagem da logo da clínica (formato PNG ou SVG recomendado)
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Palette className="h-4 w-4" />
                  <span>Prévia das cores será aplicada ao salvar</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
