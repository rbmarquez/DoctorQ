/**
 * Formulário completo de edição de Clínica
 * Usado em páginas de gestão de clínicas
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Building2, MapPin, Clock } from "lucide-react";
import {
  useClinica,
  atualizarClinica,
  type AtualizarClinicaData,
} from "@/lib/api/hooks/useClinicas";
import { EnderecoFields } from "./shared/EnderecoFields";
import { ContatoFields } from "./shared/ContatoFields";
import { HorarioFuncionamentoEditor } from "./shared/HorarioFuncionamentoEditor";

interface ClinicaFormProps {
  clinicaId: string;
  onSuccess?: () => void;
  readOnly?: boolean;
}

export function ClinicaForm({
  clinicaId,
  onSuccess,
  readOnly = false,
}: ClinicaFormProps) {
  const { clinica, isLoading, error } = useClinica(clinicaId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<AtualizarClinicaData>({
    nm_clinica: "",
    ds_descricao: "",
    ds_endereco: "",
    ds_cidade: "",
    ds_estado: "",
    ds_cep: "",
    ds_telefone: "",
    ds_email: "",
    ds_site: "",
    ds_foto_principal: "",
    ds_fotos_galeria: [],
    nr_latitude: undefined,
    nr_longitude: undefined,
    ds_horario_funcionamento: {},
    ds_especialidades: [],
    ds_convenios: [],
    st_ativa: true,
    st_aceita_agendamento_online: true,
    ds_redes_sociais: {},
  });

  // Preencher formulário quando dados carregarem
  useEffect(() => {
    if (clinica) {
      setFormData({
        nm_clinica: clinica.nm_clinica || "",
        ds_descricao: clinica.ds_descricao || "",
        ds_endereco: clinica.ds_endereco || "",
        ds_cidade: clinica.ds_cidade || "",
        ds_estado: clinica.ds_estado || "",
        ds_cep: clinica.ds_cep || "",
        ds_telefone: clinica.ds_telefone || "",
        ds_email: clinica.ds_email || "",
        ds_site: clinica.ds_site || "",
        ds_foto_principal: clinica.ds_foto_principal || "",
        ds_fotos_galeria: clinica.ds_fotos_galeria || [],
        nr_latitude: clinica.nr_latitude,
        nr_longitude: clinica.nr_longitude,
        ds_horario_funcionamento: clinica.ds_horario_funcionamento || {},
        ds_especialidades: clinica.ds_especialidades || [],
        ds_convenios: clinica.ds_convenios || [],
        st_ativa: clinica.st_ativa ?? true,
        st_aceita_agendamento_online: clinica.st_aceita_agendamento_online ?? true,
        ds_redes_sociais: clinica.ds_redes_sociais || {},
      });
    }
  }, [clinica]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nm_clinica?.trim()) {
      toast.error("Nome da clínica é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      await atualizarClinica(clinicaId, formData);
      toast.success("Clínica atualizada com sucesso!");
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar clínica";
      toast.error(errorMessage);
      console.error("Erro ao atualizar clínica:", err);
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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Erro ao carregar dados da clínica</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados">
            <Building2 className="h-4 w-4 mr-2" />
            Dados Básicos
          </TabsTrigger>
          <TabsTrigger value="contato">
            <MapPin className="h-4 w-4 mr-2" />
            Contato & Endereço
          </TabsTrigger>
          <TabsTrigger value="horarios">
            <Clock className="h-4 w-4 mr-2" />
            Horários & Especialidades
          </TabsTrigger>
        </TabsList>

        {/* TAB: Dados Básicos */}
        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Clínica</CardTitle>
              <CardDescription>
                Dados principais da clínica e fotos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome da Clínica */}
              <div className="space-y-2">
                <Label htmlFor="nm_clinica">
                  Nome da Clínica <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nm_clinica"
                  value={formData.nm_clinica}
                  onChange={(e) => handleChange("nm_clinica", e.target.value)}
                  disabled={readOnly}
                  placeholder="Clínica Estética Premium"
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="ds_descricao">Descrição</Label>
                <Textarea
                  id="ds_descricao"
                  value={formData.ds_descricao}
                  onChange={(e) => handleChange("ds_descricao", e.target.value)}
                  disabled={readOnly}
                  placeholder="Descreva os diferenciais e serviços da clínica..."
                  rows={5}
                />
              </div>

              {/* Foto Principal */}
              <div className="space-y-2">
                <Label htmlFor="ds_foto_principal">URL da Foto Principal</Label>
                <Input
                  id="ds_foto_principal"
                  type="url"
                  value={formData.ds_foto_principal}
                  onChange={(e) => handleChange("ds_foto_principal", e.target.value)}
                  disabled={readOnly}
                  placeholder="https://..."
                />
              </div>

              {/* Galeria de Fotos */}
              <div className="space-y-2">
                <Label htmlFor="ds_fotos_galeria">
                  URLs da Galeria (uma por linha)
                </Label>
                <Textarea
                  id="ds_fotos_galeria"
                  value={formData.ds_fotos_galeria?.join("\n") || ""}
                  onChange={(e) =>
                    handleChange(
                      "ds_fotos_galeria",
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  disabled={readOnly}
                  placeholder="https://foto1.jpg&#10;https://foto2.jpg&#10;https://foto3.jpg"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Cole as URLs das fotos da clínica, uma por linha
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Contato & Endereço */}
        <TabsContent value="contato" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>
                Informações de contato da clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContatoFields
                values={{
                  ds_email: formData.ds_email,
                  nr_telefone: formData.ds_telefone,
                  nr_whatsapp: formData.ds_telefone, // Usando mesmo telefone
                  ds_site: formData.ds_site,
                }}
                onChange={(field, value) => {
                  // Mapeamento de campos do ContatoFields para API
                  const fieldMap: Record<string, string> = {
                    ds_email: "ds_email",
                    nr_telefone: "ds_telefone",
                    nr_whatsapp: "ds_telefone", // Pode criar campo separado se necessário
                    ds_site: "ds_site",
                  };
                  const mappedField = fieldMap[field] || field;
                  handleChange(mappedField, value);
                }}
                disabled={readOnly}
                showWebsite={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>
                Localização física da clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnderecoFields
                values={{
                  ds_endereco: formData.ds_endereco,
                  nr_numero: "", // Campo não existe na API
                  ds_complemento: "", // Campo não existe na API
                  nm_bairro: "", // Campo não existe na API
                  nm_cidade: formData.ds_cidade,
                  nm_estado: formData.ds_estado,
                  nr_cep: formData.ds_cep,
                }}
                onChange={(field, value) => {
                  // Mapeamento de campos
                  const fieldMap: Record<string, string> = {
                    ds_endereco: "ds_endereco",
                    nm_cidade: "ds_cidade",
                    nm_estado: "ds_estado",
                    nr_cep: "ds_cep",
                  };
                  const mappedField = fieldMap[field] || field;
                  handleChange(mappedField, value);
                }}
                disabled={readOnly}
              />

              {/* Coordenadas (opcional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nr_latitude">Latitude (opcional)</Label>
                  <Input
                    id="nr_latitude"
                    type="number"
                    step="0.000001"
                    value={formData.nr_latitude || ""}
                    onChange={(e) =>
                      handleChange("nr_latitude", parseFloat(e.target.value) || undefined)
                    }
                    disabled={readOnly}
                    placeholder="-23.550520"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nr_longitude">Longitude (opcional)</Label>
                  <Input
                    id="nr_longitude"
                    type="number"
                    step="0.000001"
                    value={formData.nr_longitude || ""}
                    onChange={(e) =>
                      handleChange("nr_longitude", parseFloat(e.target.value) || undefined)
                    }
                    disabled={readOnly}
                    placeholder="-46.633308"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Horários & Especialidades */}
        <TabsContent value="horarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>
                Defina os horários de atendimento da clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Nota: O sistema de horários está em desenvolvimento. Por enquanto, edite manualmente.
              </p>
              <Textarea
                value={JSON.stringify(formData.ds_horario_funcionamento, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange("ds_horario_funcionamento", parsed);
                  } catch {
                    // Ignora JSON inválido
                  }
                }}
                disabled={readOnly}
                placeholder='{"segunda": "08:00-18:00", "terca": "08:00-18:00"}'
                rows={6}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Especialidades e Convênios</CardTitle>
              <CardDescription>
                Serviços oferecidos e convênios aceitos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Especialidades */}
              <div className="space-y-2">
                <Label htmlFor="ds_especialidades">Especialidades</Label>
                <Input
                  id="ds_especialidades"
                  value={formData.ds_especialidades?.join(", ") || ""}
                  onChange={(e) =>
                    handleChange(
                      "ds_especialidades",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  disabled={readOnly}
                  placeholder="Dermatologia, Estética Facial, Harmonização (separadas por vírgula)"
                />
                <p className="text-sm text-muted-foreground">
                  Separe múltiplas especialidades por vírgula
                </p>
              </div>

              {/* Convênios */}
              <div className="space-y-2">
                <Label htmlFor="ds_convenios">Convênios Aceitos</Label>
                <Input
                  id="ds_convenios"
                  value={formData.ds_convenios?.join(", ") || ""}
                  onChange={(e) =>
                    handleChange(
                      "ds_convenios",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  disabled={readOnly}
                  placeholder="Unimed, Bradesco Saúde, Amil (separados por vírgula)"
                />
                <p className="text-sm text-muted-foreground">
                  Separe múltiplos convênios por vírgula
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Status da clínica e opções de agendamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clínica Ativa */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="st_ativa">Clínica Ativa</Label>
                  <p className="text-sm text-muted-foreground">
                    A clínica aparecerá no marketplace quando ativa
                  </p>
                </div>
                <Switch
                  id="st_ativa"
                  checked={formData.st_ativa}
                  onCheckedChange={(checked) => handleChange("st_ativa", checked)}
                  disabled={readOnly}
                />
              </div>

              {/* Aceita Agendamento Online */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="st_aceita_agendamento_online">
                    Aceita Agendamento Online
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que pacientes agendem consultas online
                  </p>
                </div>
                <Switch
                  id="st_aceita_agendamento_online"
                  checked={formData.st_aceita_agendamento_online}
                  onCheckedChange={(checked) =>
                    handleChange("st_aceita_agendamento_online", checked)
                  }
                  disabled={readOnly}
                />
              </div>
            </CardContent>
          </Card>
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
