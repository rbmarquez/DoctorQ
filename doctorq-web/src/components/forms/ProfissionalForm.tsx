/**
 * Formulário completo de edição de Profissional
 * Usado em /profissional/perfil
 */
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  GraduationCap,
  Settings,
  Mail,
  Phone,
  Clock,
  Award,
  Briefcase,
  Globe,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ProfileImageUpload } from "@/components/ui/profile-image-upload";
import { PublicProfilePreview } from "@/components/profissional/PublicProfilePreview";

interface ProfissionalFormProps {
  profissionalId: string;
  onSuccess?: () => void;
  readOnly?: boolean;
}

interface ProfissionalData {
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
  ds_horarios_atendimento: Record<string, { ativo: boolean; hr_inicio?: string; hr_fim?: string }>;
  nr_tempo_consulta: number;
  ds_procedimentos_realizados: string[];
  st_ativo: boolean;
  st_aceita_online: boolean;
  st_primeira_consulta: boolean;
  st_aceita_convenio: boolean;
  ds_idiomas: string[];
  ds_redes_sociais: Record<string, string>;
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

export function ProfissionalForm({
  profissionalId,
  onSuccess,
  readOnly = false,
}: ProfissionalFormProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProfissionalData>({
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
    ds_procedimentos_realizados: [],
    st_ativo: true,
    st_aceita_online: true,
    st_primeira_consulta: true,
    st_aceita_convenio: false,
    ds_idiomas: ["Português"],
    ds_redes_sociais: {},
  });

  // Carregar dados do profissional
  useEffect(() => {
    async function loadProfessionalData() {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/profissionais/me?user_id=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();

          setFormData({
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
            ds_horarios_atendimento: data.ds_horarios_atendimento || formData.ds_horarios_atendimento,
            nr_tempo_consulta: data.nr_tempo_consulta || 60,
            ds_procedimentos_realizados:
              typeof data.ds_procedimentos_realizados === 'string'
                ? JSON.parse(data.ds_procedimentos_realizados || '[]')
                : (data.ds_procedimentos_realizados || []),
            st_ativo: data.st_ativo ?? true,
            st_aceita_online: data.st_aceita_online ?? true,
            st_primeira_consulta: data.st_primeira_consulta ?? true,
            st_aceita_convenio: data.st_aceita_convenio ?? false,
            ds_idiomas: data.ds_idiomas || ["Português"],
            ds_redes_sociais: data.ds_redes_sociais || {},
          });
        } else if (response.status === 404) {
          // Profissional não encontrado - manter valores padrão para criar novo
          console.log("Profissional não encontrado - criando novo perfil");
        } else {
          console.error("Erro ao carregar dados do profissional");
        }
      } catch (error) {
        console.error("Erro ao carregar dados do profissional:", error);
        // Não mostrar erro para o usuário, apenas log
      } finally {
        setIsLoading(false);
      }
    }

    loadProfessionalData();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nm_profissional?.trim()) {
      toast.error("Nome do profissional é obrigatório");
      return;
    }

    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/profissionais/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Perfil atualizado com sucesso!");
        onSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao atualizar perfil");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar perfil";
      toast.error(errorMessage);
      console.error("Erro ao atualizar profissional:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="dados">
            <User className="h-4 w-4 mr-2" />
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger value="formacao">
            <GraduationCap className="h-4 w-4 mr-2" />
            Formação
          </TabsTrigger>
          <TabsTrigger value="horarios">
            <Clock className="h-4 w-4 mr-2" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Globe className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* TAB: Dados Pessoais */}
        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Dados principais do seu perfil profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nm_profissional">
                    Nome Profissional <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nm_profissional"
                    value={formData.nm_profissional}
                    onChange={(e) =>
                      setFormData({ ...formData, nm_profissional: e.target.value })
                    }
                    disabled={readOnly}
                    placeholder="Dr(a). Seu Nome"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_registro_profissional">
                    <Award className="h-4 w-4 inline mr-1" />
                    Registro Profissional
                  </Label>
                  <Input
                    id="nr_registro_profissional"
                    value={formData.nr_registro_profissional}
                    onChange={(e) =>
                      setFormData({ ...formData, nr_registro_profissional: e.target.value })
                    }
                    disabled={readOnly}
                    placeholder="CRM, CRO, CRF, etc."
                  />
                </div>
              </div>

              {/* Especialidade */}
              <div className="space-y-2">
                <Label htmlFor="ds_especialidades">Especialidade Principal</Label>
                <Input
                  id="ds_especialidades"
                  value={formData.ds_especialidades[0] || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, ds_especialidades: [e.target.value] })
                  }
                  disabled={readOnly}
                  placeholder="Ex: Dermatologia Estética"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="ds_bio">Biografia Profissional</Label>
                <Textarea
                  id="ds_bio"
                  value={formData.ds_bio}
                  onChange={(e) => setFormData({ ...formData, ds_bio: e.target.value })}
                  disabled={readOnly}
                  placeholder="Conte um pouco sobre sua experiência e especialidades..."
                  rows={4}
                />
              </div>

              {/* Contato */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ds_email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    E-mail Profissional
                  </Label>
                  <Input
                    id="ds_email"
                    type="email"
                    value={formData.ds_email}
                    onChange={(e) => setFormData({ ...formData, ds_email: e.target.value })}
                    disabled={readOnly}
                    placeholder="contato@profissional.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nr_telefone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone
                  </Label>
                  <Input
                    id="nr_telefone"
                    value={formData.nr_telefone}
                    onChange={(e) => setFormData({ ...formData, nr_telefone: e.target.value })}
                    disabled={readOnly}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nr_whatsapp">
                  <Phone className="h-4 w-4 inline mr-1 text-green-600" />
                  WhatsApp
                </Label>
                <Input
                  id="nr_whatsapp"
                  value={formData.nr_whatsapp}
                  onChange={(e) => setFormData({ ...formData, nr_whatsapp: e.target.value })}
                  disabled={readOnly}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Foto de Perfil */}
              <div className="space-y-2">
                <ProfileImageUpload
                  value={formData.ds_foto_perfil}
                  onChange={(value) =>
                    setFormData({ ...formData, ds_foto_perfil: value })
                  }
                  disabled={readOnly}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Formação */}
        <TabsContent value="formacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formação e Experiência</CardTitle>
              <CardDescription>
                Informações sobre sua formação acadêmica e experiência profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formação */}
              <div className="space-y-2">
                <Label htmlFor="ds_formacao">Formação Acadêmica</Label>
                <Textarea
                  id="ds_formacao"
                  value={formData.ds_formacao}
                  onChange={(e) => setFormData({ ...formData, ds_formacao: e.target.value })}
                  disabled={readOnly}
                  placeholder="Ex: Medicina - USP, Residência em Dermatologia..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Anos de Experiência */}
                <div className="space-y-2">
                  <Label htmlFor="nr_anos_experiencia">Anos de Experiência</Label>
                  <Input
                    id="nr_anos_experiencia"
                    type="number"
                    min="0"
                    max="99"
                    value={formData.nr_anos_experiencia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nr_anos_experiencia: parseInt(e.target.value) || 0,
                      })
                    }
                    disabled={readOnly}
                  />
                </div>

                {/* Idiomas */}
                <div className="space-y-2">
                  <Label htmlFor="ds_idiomas">
                    <Globe className="h-4 w-4 inline mr-1" />
                    Idiomas
                  </Label>
                  <Input
                    id="ds_idiomas"
                    value={formData.ds_idiomas?.join(", ") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ds_idiomas: e.target.value.split(",").map((i) => i.trim()),
                      })
                    }
                    disabled={readOnly}
                    placeholder="Português, Inglês, Espanhol"
                  />
                </div>
              </div>

              {/* Procedimentos Realizados */}
              <div className="space-y-2">
                <Label>
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Procedimentos Realizados
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Procedimentos configurados no onboarding:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.ds_procedimentos_realizados.map((proc, index) => (
                    <Badge key={index} variant="secondary">
                      {proc}
                    </Badge>
                  ))}
                  {formData.ds_procedimentos_realizados.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum procedimento configurado
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Horários */}
        <TabsContent value="horarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Clock className="h-5 w-5 inline mr-2" />
                Horários de Atendimento
              </CardTitle>
              <CardDescription>
                Configure sua disponibilidade semanal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Horários por dia da semana */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Dias de Atendimento</Label>
                {Object.entries(diasSemana).map(([key, label]) => {
                  const dia = formData.ds_horarios_atendimento[key] || { ativo: false };
                  return (
                    <div key={key} className="flex items-center gap-4 border-b pb-4">
                      <div className="flex items-center gap-2 w-40">
                        <Switch
                          checked={dia.ativo}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              ds_horarios_atendimento: {
                                ...formData.ds_horarios_atendimento,
                                [key]: checked
                                  ? { ativo: true, hr_inicio: "08:00", hr_fim: "18:00" }
                                  : { ativo: false },
                              },
                            });
                          }}
                          disabled={readOnly}
                        />
                        <Label className={!dia.ativo ? "text-muted-foreground" : ""}>
                          {label}
                        </Label>
                      </div>

                      {dia.ativo && (
                        <div className="flex gap-4 items-center flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">De:</Label>
                            <Input
                              type="time"
                              value={dia.hr_inicio || "08:00"}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  ds_horarios_atendimento: {
                                    ...formData.ds_horarios_atendimento,
                                    [key]: { ...dia, hr_inicio: e.target.value },
                                  },
                                });
                              }}
                              disabled={readOnly}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Até:</Label>
                            <Input
                              type="time"
                              value={dia.hr_fim || "18:00"}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  ds_horarios_atendimento: {
                                    ...formData.ds_horarios_atendimento,
                                    [key]: { ...dia, hr_fim: e.target.value },
                                  },
                                });
                              }}
                              disabled={readOnly}
                              className="w-32"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Duração da consulta */}
              <div className="space-y-2">
                <Label htmlFor="nr_tempo_consulta">Duração Padrão da Consulta (minutos)</Label>
                <Select
                  value={formData.nr_tempo_consulta.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, nr_tempo_consulta: parseInt(value) })
                  }
                  disabled={readOnly}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Configurações */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Perfil</CardTitle>
              <CardDescription>
                Defina a disponibilidade e status do seu perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Perfil Ativo */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="st_ativo">Perfil Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Seu perfil aparecerá no marketplace quando ativo
                  </p>
                </div>
                <Switch
                  id="st_ativo"
                  checked={formData.st_ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, st_ativo: checked })}
                  disabled={readOnly}
                />
              </div>

              {/* Aceita Consultas Online */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="st_aceita_online">Aceita Consultas Online</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir agendamentos de teleconsulta
                  </p>
                </div>
                <Switch
                  id="st_aceita_online"
                  checked={formData.st_aceita_online}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, st_aceita_online: checked })
                  }
                  disabled={readOnly}
                />
              </div>

              {/* Aceita Primeira Consulta */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="st_primeira_consulta">Aceita Primeira Consulta</Label>
                  <p className="text-sm text-muted-foreground">
                    Aceitar novos pacientes sem consulta prévia
                  </p>
                </div>
                <Switch
                  id="st_primeira_consulta"
                  checked={formData.st_primeira_consulta}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, st_primeira_consulta: checked })
                  }
                  disabled={readOnly}
                />
              </div>

              {/* Aceita Convênio */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="st_aceita_convenio">Aceita Convênio</Label>
                  <p className="text-sm text-muted-foreground">
                    Atende pacientes com plano de saúde
                  </p>
                </div>
                <Switch
                  id="st_aceita_convenio"
                  checked={formData.st_aceita_convenio}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, st_aceita_convenio: checked })
                  }
                  disabled={readOnly}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Preview do Perfil Público */}
        <TabsContent value="preview">
          <PublicProfilePreview profissional={formData} />
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      {!readOnly && (
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
