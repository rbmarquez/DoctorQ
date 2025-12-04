"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  User,
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
  Briefcase,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ProfessionalConfig {
  // Informações Profissionais
  nm_profissional: string;
  ds_email: string;
  nr_telefone: string;
  nr_whatsapp: string;
  ds_especialidades: string[];
  nr_registro_profissional: string;
  ds_bio: string;
  ds_formacao: string;
  nr_anos_experiencia: number;
  ds_foto_perfil: string;

  // Horários de Atendimento
  ds_horarios_atendimento: Record<string, { ativo: boolean; hr_inicio?: string; hr_fim?: string }>;
  nr_tempo_consulta: number;
  qt_intervalo_consultas: number;

  // Serviços/Procedimentos
  ds_procedimentos_realizados: string[];

  // Notificações
  st_notificacao_email: boolean;
  st_notificacao_whatsapp: boolean;
  st_lembrete_agendamento: boolean;
  nr_horas_lembrete: number;

  // Configurações de Atendimento
  st_aceita_online: boolean;
  st_primeira_consulta: boolean;
  st_aceita_convenio: boolean;
  nr_antecedencia_cancelamento: number;
  nr_tolerancia_atraso: number;

  // Privacidade
  st_perfil_publico: boolean;
  st_mostrar_precos: boolean;
  st_aceitar_avaliacao: boolean;
  st_compartilhar_fotos: boolean;

  // Pagamento
  st_aceita_dinheiro: boolean;
  st_aceita_pix: boolean;
  st_aceita_credito: boolean;
  st_aceita_debito: boolean;
  pc_desconto_pix: number;
  nr_parcelas_maximo: number;

  // Aparência
  ds_tema: string;
}

const diasSemana = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

export default function ConfiguracoesProfissionalPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profissional");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [config, setConfig] = useState<ProfessionalConfig>({
    // Informações Profissionais
    nm_profissional: "",
    ds_email: "",
    nr_telefone: "",
    nr_whatsapp: "",
    ds_especialidades: [],
    nr_registro_profissional: "",
    ds_bio: "",
    ds_formacao: "",
    nr_anos_experiencia: 0,
    ds_foto_perfil: "",

    // Horários
    ds_horarios_atendimento: {
      segunda: { ativo: true, hr_inicio: "08:00", hr_fim: "18:00" },
      terca: { ativo: true, hr_inicio: "08:00", hr_fim: "18:00" },
      quarta: { ativo: true, hr_inicio: "08:00", hr_fim: "18:00" },
      quinta: { ativo: true, hr_inicio: "08:00", hr_fim: "18:00" },
      sexta: { ativo: true, hr_inicio: "08:00", hr_fim: "18:00" },
      sabado: { ativo: false },
      domingo: { ativo: false },
    },
    nr_tempo_consulta: 60,
    qt_intervalo_consultas: 0,

    // Serviços
    ds_procedimentos_realizados: [],

    // Notificações
    st_notificacao_email: true,
    st_notificacao_whatsapp: true,
    st_lembrete_agendamento: true,
    nr_horas_lembrete: 24,

    // Atendimento
    st_aceita_online: true,
    st_primeira_consulta: true,
    st_aceita_convenio: false,
    nr_antecedencia_cancelamento: 24,
    nr_tolerancia_atraso: 15,

    // Privacidade
    st_perfil_publico: true,
    st_mostrar_precos: true,
    st_aceitar_avaliacao: true,
    st_compartilhar_fotos: false,

    // Pagamento
    st_aceita_dinheiro: true,
    st_aceita_pix: true,
    st_aceita_credito: true,
    st_aceita_debito: true,
    pc_desconto_pix: 0,
    nr_parcelas_maximo: 6,

    // Aparência
    ds_tema: "light",
  });

  // Carregar dados do profissional
  useEffect(() => {
    async function loadProfessionalData() {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/profissionais/me?user_id=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();

          // Mapear dados da API para o estado
          setConfig({
            // Informações básicas
            nm_profissional: data.nm_profissional || "",
            ds_email: data.ds_email || "",
            nr_telefone: data.nr_telefone || "",
            nr_whatsapp: data.nr_whatsapp || "",
            ds_especialidades: data.ds_especialidades || [],
            nr_registro_profissional: data.nr_registro_profissional || "",
            ds_bio: data.ds_bio || "",
            ds_formacao: data.ds_formacao || "",
            nr_anos_experiencia: data.nr_anos_experiencia || 0,
            ds_foto_perfil: data.ds_foto_perfil || "",

            // Horários
            ds_horarios_atendimento: data.ds_horarios_atendimento || config.ds_horarios_atendimento,
            nr_tempo_consulta: data.nr_tempo_consulta || 60,
            qt_intervalo_consultas: data.ds_horarios_atendimento?.intervalo_consultas || 0,

            // Serviços
            ds_procedimentos_realizados:
              typeof data.ds_procedimentos_realizados === 'string'
                ? JSON.parse(data.ds_procedimentos_realizados || '[]')
                : (data.ds_procedimentos_realizados || []),

            // Notificações (do user.ds_preferencias)
            st_notificacao_email: data.user?.ds_preferencias?.notificacoes_email ?? true,
            st_notificacao_whatsapp: data.user?.ds_preferencias?.notificacoes_whatsapp ?? true,
            st_lembrete_agendamento: data.st_lembrete_agendamento ?? true,
            nr_horas_lembrete: data.nr_horas_lembrete || 24,

            // Atendimento
            st_aceita_online: data.st_aceita_online ?? true,
            st_primeira_consulta: data.st_primeira_consulta ?? true,
            st_aceita_convenio: data.st_aceita_convenio ?? false,
            nr_antecedencia_cancelamento: data.nr_antecedencia_cancelamento || 24,
            nr_tolerancia_atraso: data.nr_tolerancia_atraso || 15,

            // Privacidade
            st_perfil_publico: data.user?.ds_preferencias?.perfil_publico ?? true,
            st_mostrar_precos: data.st_mostrar_precos ?? true,
            st_aceitar_avaliacao: data.st_aceitar_avaliacao ?? true,
            st_compartilhar_fotos: data.st_compartilhar_fotos ?? false,

            // Pagamento
            st_aceita_dinheiro: data.st_aceita_dinheiro ?? true,
            st_aceita_pix: data.st_aceita_pix ?? true,
            st_aceita_credito: data.st_aceita_credito ?? true,
            st_aceita_debito: data.st_aceita_debito ?? true,
            pc_desconto_pix: data.pc_desconto_pix || 0,
            nr_parcelas_maximo: data.nr_parcelas_maximo || 6,

            // Aparência
            ds_tema: data.user?.ds_preferencias?.tema || "light",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do profissional:", error);
        toast.error("Erro ao carregar configurações");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfessionalData();
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSaving(true);
    try {
      // Salvar configurações via API
      const response = await fetch(`/api/profissionais/me/configuracoes?user_id=${session.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências profissionais e de atendimento
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
          <TabsTrigger value="profissional">
            <User className="h-4 w-4 mr-2" />
            Profissional
          </TabsTrigger>
          <TabsTrigger value="horario">
            <Clock className="h-4 w-4 mr-2" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="servicos">
            <Briefcase className="h-4 w-4 mr-2" />
            Serviços
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
        </TabsList>

        {/* Tab: Informações Profissionais */}
        <TabsContent value="profissional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
              <CardDescription>
                Dados profissionais e informações de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nm_profissional">Nome Profissional *</Label>
                  <Input
                    id="nm_profissional"
                    value={config.nm_profissional}
                    onChange={(e) => setConfig({ ...config, nm_profissional: e.target.value })}
                    placeholder="Dr(a). Seu Nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_registro_profissional">
                    <Award className="h-4 w-4 inline mr-1" />
                    Registro Profissional
                  </Label>
                  <Input
                    id="nr_registro_profissional"
                    value={config.nr_registro_profissional}
                    onChange={(e) => setConfig({ ...config, nr_registro_profissional: e.target.value })}
                    placeholder="CRM, CRO, CRF, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ds_especialidades">Especialidade Principal</Label>
                <Input
                  id="ds_especialidades"
                  value={config.ds_especialidades[0] || ""}
                  onChange={(e) => setConfig({ ...config, ds_especialidades: [e.target.value] })}
                  placeholder="Ex: Dermatologia Estética"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ds_bio">Biografia Profissional</Label>
                <Textarea
                  id="ds_bio"
                  value={config.ds_bio}
                  onChange={(e) => setConfig({ ...config, ds_bio: e.target.value })}
                  placeholder="Conte um pouco sobre sua experiência e especialidades..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ds_formacao">Formação Acadêmica</Label>
                  <Input
                    id="ds_formacao"
                    value={config.ds_formacao}
                    onChange={(e) => setConfig({ ...config, ds_formacao: e.target.value })}
                    placeholder="Ex: Medicina - USP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_anos_experiencia">Anos de Experiência</Label>
                  <Input
                    id="nr_anos_experiencia"
                    type="number"
                    min="0"
                    value={config.nr_anos_experiencia}
                    onChange={(e) => setConfig({ ...config, nr_anos_experiencia: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ds_email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    E-mail Profissional
                  </Label>
                  <Input
                    id="ds_email"
                    type="email"
                    value={config.ds_email}
                    onChange={(e) => setConfig({ ...config, ds_email: e.target.value })}
                    placeholder="contato@profissional.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_telefone">
                    <Smartphone className="h-4 w-4 inline mr-1" />
                    Telefone
                  </Label>
                  <Input
                    id="nr_telefone"
                    value={config.nr_telefone}
                    onChange={(e) => setConfig({ ...config, nr_telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nr_whatsapp">
                  <Smartphone className="h-4 w-4 inline mr-1 text-green-600" />
                  WhatsApp
                </Label>
                <Input
                  id="nr_whatsapp"
                  value={config.nr_whatsapp}
                  onChange={(e) => setConfig({ ...config, nr_whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Horários de Atendimento */}
        <TabsContent value="horario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horários de Atendimento
              </CardTitle>
              <CardDescription>
                Configure sua agenda e disponibilidade semanal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Horários por dia da semana */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Dias de Atendimento</Label>
                {Object.entries(diasSemana).map(([key, label]) => {
                  const dia = config.ds_horarios_atendimento[key] || { ativo: false };
                  return (
                    <div key={key} className="flex items-center gap-4 border-b pb-4">
                      <div className="flex items-center gap-2 w-40">
                        <Switch
                          checked={dia.ativo}
                          onCheckedChange={(checked) => {
                            setConfig({
                              ...config,
                              ds_horarios_atendimento: {
                                ...config.ds_horarios_atendimento,
                                [key]: checked
                                  ? { ativo: true, hr_inicio: "08:00", hr_fim: "18:00" }
                                  : { ativo: false },
                              },
                            });
                          }}
                        />
                        <Label className={!dia.ativo ? "text-muted-foreground" : ""}>{label}</Label>
                      </div>

                      {dia.ativo && (
                        <div className="flex gap-4 items-center flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">De:</Label>
                            <Input
                              type="time"
                              value={dia.hr_inicio || "08:00"}
                              onChange={(e) => {
                                setConfig({
                                  ...config,
                                  ds_horarios_atendimento: {
                                    ...config.ds_horarios_atendimento,
                                    [key]: { ...dia, hr_inicio: e.target.value },
                                  },
                                });
                              }}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Até:</Label>
                            <Input
                              type="time"
                              value={dia.hr_fim || "18:00"}
                              onChange={(e) => {
                                setConfig({
                                  ...config,
                                  ds_horarios_atendimento: {
                                    ...config.ds_horarios_atendimento,
                                    [key]: { ...dia, hr_fim: e.target.value },
                                  },
                                });
                              }}
                              className="w-32"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nr_tempo_consulta">
                    Duração Padrão da Consulta (minutos)
                  </Label>
                  <Select
                    value={config.nr_tempo_consulta.toString()}
                    onValueChange={(value) =>
                      setConfig({ ...config, nr_tempo_consulta: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="nr_tempo_consulta">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h 30min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qt_intervalo_consultas">
                    Intervalo entre Consultas (minutos)
                  </Label>
                  <Select
                    value={config.qt_intervalo_consultas.toString()}
                    onValueChange={(value) =>
                      setConfig({ ...config, qt_intervalo_consultas: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="qt_intervalo_consultas">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem intervalo</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                    </SelectContent>
                  </Select>
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
                      setConfig({ ...config, nr_antecedencia_cancelamento: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_tolerancia_atraso">
                    Tolerância de Atraso (minutos)
                  </Label>
                  <Input
                    id="nr_tolerancia_atraso"
                    type="number"
                    min="0"
                    value={config.nr_tolerancia_atraso}
                    onChange={(e) =>
                      setConfig({ ...config, nr_tolerancia_atraso: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Serviços/Procedimentos */}
        <TabsContent value="servicos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Serviços e Procedimentos
              </CardTitle>
              <CardDescription>
                Procedimentos que você realiza e configurações de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Procedimentos Realizados</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Lista de procedimentos configurada no onboarding. Para editar, adicione novos procedimentos abaixo:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {config.ds_procedimentos_realizados.map((proc, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {proc}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aceita Consultas Online</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir agendamentos de teleconsulta
                    </p>
                  </div>
                  <Switch
                    checked={config.st_aceita_online}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_aceita_online: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aceita Primeira Consulta</Label>
                    <p className="text-sm text-muted-foreground">
                      Aceitar novos pacientes sem consulta prévia
                    </p>
                  </div>
                  <Switch
                    checked={config.st_primeira_consulta}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_primeira_consulta: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aceita Convênio</Label>
                    <p className="text-sm text-muted-foreground">
                      Atende pacientes com plano de saúde
                    </p>
                  </div>
                  <Switch
                    checked={config.st_aceita_convenio}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, st_aceita_convenio: checked })
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
                Configure como você deseja ser notificado sobre agendamentos
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
                      Receber confirmações e lembretes por e-mail
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
                      <Smartphone className="h-4 w-4 text-green-600" />
                      Notificações por WhatsApp
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receber confirmações e lembretes por WhatsApp
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
                      Receber lembrete antes dos agendamentos
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
                      Receber lembrete com antecedência de (horas)
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
                Configure as formas de pagamento que você aceita
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
                        setConfig({ ...config, pc_desconto_pix: parseInt(e.target.value) || 0 })
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
                Privacidade e Visibilidade
              </CardTitle>
              <CardDescription>
                Configure como seu perfil é exibido publicamente
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
                      Exibir seu perfil na busca pública de profissionais
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
                      Exibir preços dos procedimentos no perfil público
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
                      Permitir que pacientes avaliem seu atendimento
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
                      Exibir resultados de procedimentos (com autorização do paciente)
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

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Suas configurações estão em conformidade com a LGPD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
