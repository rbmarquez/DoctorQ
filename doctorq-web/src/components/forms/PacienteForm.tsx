"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { DocumentInput } from "@/components/ui/document-input";
import { toast } from "sonner";
import { Loader2, User, MapPin, Heart, FileText } from "lucide-react";
import type { Paciente, PacienteCreate, PacienteUpdate } from "@/types/paciente";
import { GENEROS, TIPOS_SANGUINEOS, ESTADOS_BRASIL } from "@/types/paciente";

interface PacienteFormProps {
  paciente?: Paciente;
  id_clinica?: string; // Opcional: será detectado automaticamente pelo backend
  id_profissional?: string; // Opcional: será detectado automaticamente pelo backend
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PacienteForm({
  paciente,
  id_clinica,
  id_profissional,
  onSuccess,
  onCancel,
}: PacienteFormProps) {
  console.log("[PacienteForm] id_clinica recebido:", id_clinica);
  console.log("[PacienteForm] id_profissional recebido:", id_profissional);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<PacienteCreate | PacienteUpdate>>({
    nm_paciente: "",
    nr_cpf: "",
    dt_nascimento: "",
    nm_genero: "",
    ds_email: "",
    nr_telefone: "",
    nr_whatsapp: "",
    ds_endereco: "",
    nr_numero: "",
    ds_complemento: "",
    nm_bairro: "",
    nm_cidade: "",
    nm_estado: "",
    nr_cep: "",
    ds_tipo_sanguineo: "",
    ds_alergias: "",
    ds_medicamentos_uso: "",
    ds_condicoes_medicas: "",
    ds_cirurgias_previas: "",
    ds_observacoes: "",
    st_possui_convenio: false,
    nm_convenio: "",
    nr_carteirinha: "",
    nr_rg: "",
  });

  // Carregar dados do paciente para edição
  useEffect(() => {
    if (paciente) {
      setFormData({
        id_clinica: paciente.id_clinica,
        nm_paciente: paciente.nm_paciente,
        nr_cpf: paciente.nr_cpf,
        dt_nascimento: paciente.dt_nascimento
          ? new Date(paciente.dt_nascimento).toISOString().split("T")[0]
          : "",
        nm_genero: paciente.nm_genero || "",
        ds_email: paciente.ds_email || "",
        nr_telefone: paciente.nr_telefone || "",
        nr_whatsapp: paciente.nr_whatsapp || "",
        ds_endereco: paciente.ds_endereco || "",
        nr_numero: paciente.nr_numero || "",
        ds_complemento: paciente.ds_complemento || "",
        nm_bairro: paciente.nm_bairro || "",
        nm_cidade: paciente.nm_cidade || "",
        nm_estado: paciente.nm_estado || "",
        nr_cep: paciente.nr_cep || "",
        ds_tipo_sanguineo: paciente.ds_tipo_sanguineo || "",
        ds_alergias: paciente.ds_alergias || "",
        ds_medicamentos_uso: paciente.ds_medicamentos_uso || "",
        ds_condicoes_medicas: paciente.ds_condicoes_medicas || "",
        ds_cirurgias_previas: paciente.ds_cirurgias_previas || "",
        ds_observacoes: paciente.ds_observacoes || "",
        st_possui_convenio: paciente.st_possui_convenio || false,
        nm_convenio: paciente.nm_convenio || "",
        nr_carteirinha: paciente.nr_carteirinha || "",
        nr_rg: paciente.nr_rg || "",
      });
    }
  }, [paciente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nm_paciente?.trim()) {
      toast.error("Nome do paciente é obrigatório");
      return;
    }

    if (!formData.nr_cpf?.trim()) {
      toast.error("CPF é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = paciente
        ? `/api/pacientes/${paciente.id_paciente}`
        : "/api/pacientes";
      const method = paciente ? "PUT" : "POST";

      // Limpar campos vazios ou null/undefined antes de enviar
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Incluir apenas se não for vazio/null/undefined
        if (value !== "" && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // IMPORTANTE: Incluir id_clinica ou id_profissional se foram passados
      // O backend detecta automaticamente se não forem passados
      if (id_clinica) {
        cleanedData.id_clinica = id_clinica;
      }
      if (id_profissional) {
        cleanedData.id_profissional = id_profissional;
      }

      console.log("[PacienteForm] Dados a serem enviados:", cleanedData);
      console.log("[PacienteForm] id_clinica no payload:", cleanedData.id_clinica);
      console.log("[PacienteForm] id_profissional no payload:", cleanedData.id_profissional);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        toast.success(
          paciente
            ? "Paciente atualizado com sucesso!"
            : "Paciente cadastrado com sucesso!"
        );
        onSuccess?.();
      } else {
        const error = await response.json();
        console.error("Erro ao salvar paciente:", error);

        // Tentar extrair mensagem de erro mais específica
        let errorMessage = "Erro ao salvar paciente";
        if (error.error) {
          errorMessage = error.error;
        } else if (error.detail) {
          errorMessage = typeof error.detail === 'string'
            ? error.detail
            : JSON.stringify(error.detail);
        }

        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao salvar paciente";
      toast.error(errorMessage);
      console.error("Erro ao salvar paciente:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="dados">
            <User className="h-4 w-4 mr-2" />
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger value="endereco">
            <MapPin className="h-4 w-4 mr-2" />
            Endereço
          </TabsTrigger>
          <TabsTrigger value="saude">
            <Heart className="h-4 w-4 mr-2" />
            Saúde
          </TabsTrigger>
          <TabsTrigger value="obs">
            <FileText className="h-4 w-4 mr-2" />
            Observações
          </TabsTrigger>
        </TabsList>

        {/* TAB: Dados Pessoais */}
        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Dados básicos e contato do paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nm_paciente">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nm_paciente"
                    value={formData.nm_paciente}
                    onChange={(e) =>
                      setFormData({ ...formData, nm_paciente: e.target.value })
                    }
                    placeholder="Nome completo do paciente"
                    required
                  />
                </div>

                {/* CPF */}
                <div className="space-y-2">
                  <Label htmlFor="nr_cpf">
                    CPF <span className="text-red-500">*</span>
                  </Label>
                  <DocumentInput
                    value={formData.nr_cpf || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, nr_cpf: value })
                    }
                    type="cpf"
                    label=""
                    required
                  />
                </div>

                {/* RG */}
                <div className="space-y-2">
                  <Label htmlFor="nr_rg">RG</Label>
                  <Input
                    id="nr_rg"
                    value={formData.nr_rg}
                    onChange={(e) =>
                      setFormData({ ...formData, nr_rg: e.target.value })
                    }
                    placeholder="Número do RG"
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-2">
                  <Label htmlFor="dt_nascimento">Data de Nascimento</Label>
                  <Input
                    id="dt_nascimento"
                    type="date"
                    value={formData.dt_nascimento}
                    onChange={(e) =>
                      setFormData({ ...formData, dt_nascimento: e.target.value })
                    }
                  />
                </div>

                {/* Gênero */}
                <div className="space-y-2">
                  <Label htmlFor="nm_genero">Gênero</Label>
                  <Select
                    value={formData.nm_genero}
                    onValueChange={(value) =>
                      setFormData({ ...formData, nm_genero: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GENEROS.map((gen) => (
                        <SelectItem key={gen.value} value={gen.value}>
                          {gen.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="ds_email">Email</Label>
                  <Input
                    id="ds_email"
                    type="email"
                    value={formData.ds_email}
                    onChange={(e) =>
                      setFormData({ ...formData, ds_email: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="nr_telefone">Telefone</Label>
                  <Input
                    id="nr_telefone"
                    value={formData.nr_telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, nr_telefone: e.target.value })
                    }
                    placeholder="(00) 0000-0000"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="nr_whatsapp">WhatsApp</Label>
                  <Input
                    id="nr_whatsapp"
                    value={formData.nr_whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, nr_whatsapp: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Convênio */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Possui Convênio?</Label>
                    <p className="text-sm text-muted-foreground">
                      Marque se o paciente tem plano de saúde
                    </p>
                  </div>
                  <Switch
                    checked={formData.st_possui_convenio}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, st_possui_convenio: checked })
                    }
                  />
                </div>

                {formData.st_possui_convenio && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nm_convenio">Nome do Convênio</Label>
                      <Input
                        id="nm_convenio"
                        value={formData.nm_convenio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nm_convenio: e.target.value,
                          })
                        }
                        placeholder="Ex: Unimed, Amil, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nr_carteirinha">Número da Carteirinha</Label>
                      <Input
                        id="nr_carteirinha"
                        value={formData.nr_carteirinha}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nr_carteirinha: e.target.value,
                          })
                        }
                        placeholder="Número da carteirinha"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Endereço */}
        <TabsContent value="endereco" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>
                Informações de endereço do paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* CEP */}
                <div className="space-y-2">
                  <Label htmlFor="nr_cep">CEP</Label>
                  <Input
                    id="nr_cep"
                    value={formData.nr_cep}
                    onChange={(e) =>
                      setFormData({ ...formData, nr_cep: e.target.value })
                    }
                    placeholder="00000-000"
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ds_endereco">Endereço</Label>
                  <Input
                    id="ds_endereco"
                    value={formData.ds_endereco}
                    onChange={(e) =>
                      setFormData({ ...formData, ds_endereco: e.target.value })
                    }
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                {/* Número */}
                <div className="space-y-2">
                  <Label htmlFor="nr_numero">Número</Label>
                  <Input
                    id="nr_numero"
                    value={formData.nr_numero}
                    onChange={(e) =>
                      setFormData({ ...formData, nr_numero: e.target.value })
                    }
                    placeholder="Nº"
                  />
                </div>

                {/* Complemento */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ds_complemento">Complemento</Label>
                  <Input
                    id="ds_complemento"
                    value={formData.ds_complemento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ds_complemento: e.target.value,
                      })
                    }
                    placeholder="Apto, Bloco, etc."
                  />
                </div>

                {/* Bairro */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nm_bairro">Bairro</Label>
                  <Input
                    id="nm_bairro"
                    value={formData.nm_bairro}
                    onChange={(e) =>
                      setFormData({ ...formData, nm_bairro: e.target.value })
                    }
                    placeholder="Bairro"
                  />
                </div>

                {/* Cidade */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nm_cidade">Cidade</Label>
                  <Input
                    id="nm_cidade"
                    value={formData.nm_cidade}
                    onChange={(e) =>
                      setFormData({ ...formData, nm_cidade: e.target.value })
                    }
                    placeholder="Cidade"
                  />
                </div>

                {/* Estado */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nm_estado">Estado</Label>
                  <Select
                    value={formData.nm_estado}
                    onValueChange={(value) =>
                      setFormData({ ...formData, nm_estado: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BRASIL.map((estado) => (
                        <SelectItem key={estado.uf} value={estado.uf}>
                          {estado.nome} ({estado.uf})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Saúde */}
        <TabsContent value="saude" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Saúde</CardTitle>
              <CardDescription>
                Histórico médico e informações relevantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo Sanguíneo */}
              <div className="space-y-2">
                <Label htmlFor="ds_tipo_sanguineo">Tipo Sanguíneo</Label>
                <Select
                  value={formData.ds_tipo_sanguineo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ds_tipo_sanguineo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SANGUINEOS.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Alergias */}
              <div className="space-y-2">
                <Label htmlFor="ds_alergias">Alergias</Label>
                <Textarea
                  id="ds_alergias"
                  value={formData.ds_alergias}
                  onChange={(e) =>
                    setFormData({ ...formData, ds_alergias: e.target.value })
                  }
                  placeholder="Descreva alergias conhecidas"
                  rows={3}
                />
              </div>

              {/* Medicamentos em Uso */}
              <div className="space-y-2">
                <Label htmlFor="ds_medicamentos_uso">Medicamentos em Uso</Label>
                <Textarea
                  id="ds_medicamentos_uso"
                  value={formData.ds_medicamentos_uso}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ds_medicamentos_uso: e.target.value,
                    })
                  }
                  placeholder="Liste medicamentos que o paciente usa regularmente"
                  rows={3}
                />
              </div>

              {/* Condições Médicas */}
              <div className="space-y-2">
                <Label htmlFor="ds_condicoes_medicas">Condições Médicas</Label>
                <Textarea
                  id="ds_condicoes_medicas"
                  value={formData.ds_condicoes_medicas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ds_condicoes_medicas: e.target.value,
                    })
                  }
                  placeholder="Doenças crônicas ou condições médicas relevantes"
                  rows={3}
                />
              </div>

              {/* Cirurgias Prévias */}
              <div className="space-y-2">
                <Label htmlFor="ds_cirurgias_previas">Cirurgias Prévias</Label>
                <Textarea
                  id="ds_cirurgias_previas"
                  value={formData.ds_cirurgias_previas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ds_cirurgias_previas: e.target.value,
                    })
                  }
                  placeholder="Histórico de cirurgias realizadas"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Observações */}
        <TabsContent value="obs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Observações Gerais</CardTitle>
              <CardDescription>
                Anotações e informações adicionais sobre o paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="ds_observacoes"
                value={formData.ds_observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, ds_observacoes: e.target.value })
                }
                placeholder="Observações gerais sobre o paciente..."
                rows={8}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>{paciente ? "Atualizar" : "Cadastrar"} Paciente</>
          )}
        </Button>
      </div>
    </form>
  );
}
