/**
 * Formulário completo de edição de Empresa (Tenant)
 * Usado em /admin/configuracoes
 */
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, Building2, MapPin, Settings } from "lucide-react";
import { EnderecoFields } from "./shared/EnderecoFields";
import { ContatoFields } from "./shared/ContatoFields";
import { DocumentInput } from "@/components/ui/document-input";
import {
  useEmpresa,
  atualizarEmpresa,
  type AtualizarEmpresaData,
} from "@/lib/api/hooks/useEmpresas";

interface EmpresaFormProps {
  empresaId: string;
  onSuccess?: () => void;
  readOnly?: boolean;
}

const PLANOS = [
  { value: "free", label: "Gratuito" },
  { value: "basic", label: "Básico" },
  { value: "professional", label: "Profissional" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
  { value: "partner", label: "Parceiro" },
];

export function EmpresaForm({
  empresaId,
  onSuccess,
  readOnly = false,
}: EmpresaFormProps) {
  const { empresa, isLoading, error } = useEmpresa(empresaId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<AtualizarEmpresaData>({
    nm_fantasia: "",
    nm_razao_social: "",
    nr_cnpj: "",
    nm_email: "",
    nr_telefone: "",
    ds_endereco: "",
    ds_cidade: "",
    ds_estado: "",
    nr_cep: "",
    ds_logo_url: "",
    ds_plano: "professional",
    st_ativo: "S",
    nr_max_users: 10,
    nr_max_agents: 5,
  });

  // Preencher formulário quando dados carregarem
  useEffect(() => {
    if (empresa) {
      setFormData({
        nm_fantasia: empresa.nm_fantasia || "",
        nm_razao_social: empresa.nm_razao_social || "",
        nr_cnpj: empresa.nr_cnpj || "",
        nm_email: empresa.nm_email || "",
        nr_telefone: empresa.nr_telefone || "",
        ds_endereco: empresa.ds_endereco || "",
        ds_cidade: empresa.ds_cidade || "",
        ds_estado: empresa.ds_estado || "",
        nr_cep: empresa.nr_cep || "",
        ds_logo_url: empresa.ds_logo_url || "",
        ds_plano: empresa.ds_plano || "professional",
        st_ativo: empresa.st_ativo || "S",
        nr_max_users: empresa.nr_max_users || 10,
        nr_max_agents: empresa.nr_max_agents || 5,
      });
    }
  }, [empresa]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, "");
    return clean
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nm_fantasia?.trim()) {
      toast.error("Nome fantasia é obrigatório");
      return;
    }

    if (!formData.nr_cnpj?.trim()) {
      toast.error("CNPJ é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      await atualizarEmpresa(empresaId, formData);
      toast.success("Empresa atualizada com sucesso!");
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar empresa";
      toast.error(errorMessage);
      console.error("Erro ao atualizar empresa:", err);
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
          <p className="text-destructive">Erro ao carregar dados da empresa</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basico" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basico">
            <Building2 className="h-4 w-4 mr-2" />
            Dados Básicos
          </TabsTrigger>
          <TabsTrigger value="endereco">
            <MapPin className="h-4 w-4 mr-2" />
            Endereço
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Plano e Config
          </TabsTrigger>
        </TabsList>

        {/* TAB: Dados Básicos */}
        <TabsContent value="basico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Dados básicos e de contato da organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome Fantasia */}
              <div className="space-y-2">
                <Label htmlFor="nm_fantasia">
                  Nome Fantasia <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nm_fantasia"
                  value={formData.nm_fantasia}
                  onChange={(e) => handleChange("nm_fantasia", e.target.value)}
                  disabled={readOnly}
                  placeholder="Clínica Estética XPTO"
                  required
                />
              </div>

              {/* Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="nm_razao_social">
                  Razão Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nm_razao_social"
                  value={formData.nm_razao_social}
                  onChange={(e) => handleChange("nm_razao_social", e.target.value)}
                  disabled={readOnly}
                  placeholder="XPTO Estética Ltda"
                  required
                />
              </div>

              {/* CNPJ */}
              <DocumentInput
                type="cnpj"
                value={formData.nr_cnpj}
                onChange={(value) => handleChange("nr_cnpj", value)}
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                disabled={readOnly}
                required
              />

              {/* Logo */}
              <div className="space-y-2">
                <Label htmlFor="ds_logo_url">URL do Logo</Label>
                <Input
                  id="ds_logo_url"
                  type="url"
                  value={formData.ds_logo_url}
                  onChange={(e) => handleChange("ds_logo_url", e.target.value)}
                  disabled={readOnly}
                  placeholder="https://..."
                />
              </div>

              {/* Contato */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-4">Contato</h3>
                <ContatoFields
                  values={{
                    ds_email: formData.nm_email,
                    nr_telefone: formData.nr_telefone,
                  }}
                  onChange={(field, value) => {
                    // Mapear ds_email para nm_email
                    const mappedField = field === "ds_email" ? "nm_email" : field;
                    handleChange(mappedField, value);
                  }}
                  disabled={readOnly}
                  showWebsite={false}
                />
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
                Localização física da empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnderecoFields
                values={{
                  ds_endereco: formData.ds_endereco,
                  nm_cidade: formData.ds_cidade,
                  nm_estado: formData.ds_estado,
                  nr_cep: formData.nr_cep,
                }}
                onChange={(field, value) => {
                  // Mapear campos do componente para o formData
                  const fieldMap: Record<string, string> = {
                    ds_endereco: "ds_endereco",
                    nm_cidade: "ds_cidade",
                    nm_estado: "ds_estado",
                    nr_cep: "nr_cep",
                  };
                  const mappedField = fieldMap[field] || field;
                  handleChange(mappedField, value);
                }}
                disabled={readOnly}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Plano e Configurações */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plano e Limites</CardTitle>
              <CardDescription>
                Configurações do plano e limites de uso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plano */}
              <div className="space-y-2">
                <Label htmlFor="ds_plano">Plano Atual</Label>
                <Select
                  value={formData.ds_plano}
                  onValueChange={(value) => handleChange("ds_plano", value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="ds_plano">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANOS.map((plano) => (
                      <SelectItem key={plano.value} value={plano.value}>
                        {plano.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Limite de Usuários */}
                <div className="space-y-2">
                  <Label htmlFor="nr_max_users">Limite de Usuários</Label>
                  <Input
                    id="nr_max_users"
                    type="number"
                    min="1"
                    max="9999"
                    value={formData.nr_max_users}
                    onChange={(e) =>
                      handleChange("nr_max_users", parseInt(e.target.value) || 0)
                    }
                    disabled={readOnly}
                  />
                </div>

                {/* Limite de Agentes IA */}
                <div className="space-y-2">
                  <Label htmlFor="nr_max_agents">Limite de Agentes IA</Label>
                  <Input
                    id="nr_max_agents"
                    type="number"
                    min="0"
                    max="999"
                    value={formData.nr_max_agents}
                    onChange={(e) =>
                      handleChange("nr_max_agents", parseInt(e.target.value) || 0)
                    }
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Status Ativo */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="st_ativo">Empresa Ativa</Label>
                  <p className="text-sm text-muted-foreground">
                    Desativar impedirá o acesso de todos os usuários
                  </p>
                </div>
                <Switch
                  id="st_ativo"
                  checked={formData.st_ativo === "S"}
                  onCheckedChange={(checked) =>
                    handleChange("st_ativo", checked ? "S" : "N")
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
