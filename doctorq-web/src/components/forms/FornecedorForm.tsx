/**
 * Formulário completo de edição de Fornecedor
 * Usado em /fornecedor/perfil
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
import { Loader2, Building2, MapPin, BarChart3 } from "lucide-react";
import {
  useFornecedor,
  useFornecedorStats,
  atualizarFornecedor,
  type Fornecedor,
} from "@/lib/api/hooks/useFornecedores";
import { EnderecoFields } from "./shared/EnderecoFields";
import { DocumentInput } from "@/components/ui/document-input";

interface FornecedorFormProps {
  fornecedorId: string;
  onSuccess?: () => void;
  readOnly?: boolean;
}

export function FornecedorForm({
  fornecedorId,
  onSuccess,
  readOnly = false,
}: FornecedorFormProps) {
  const { fornecedor, isLoading, error } = useFornecedor(fornecedorId);
  const { stats, isLoading: isLoadingStats } = useFornecedorStats(fornecedorId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Fornecedor>>({
    nm_fornecedor: "",
    ds_fornecedor: "",
    ds_logo_url: "",
    nm_email: "",
    ds_telefone: "",
    nr_cnpj: "",
    ds_endereco: "",
    ds_cidade: "",
    ds_estado: "",
    nr_cep: "",
    fl_ativo: true,
  });

  // Preencher formulário quando dados carregarem
  useEffect(() => {
    if (fornecedor) {
      setFormData({
        nm_fornecedor: fornecedor.nm_fornecedor || "",
        ds_fornecedor: fornecedor.ds_fornecedor || "",
        ds_logo_url: fornecedor.ds_logo_url || "",
        nm_email: fornecedor.nm_email || "",
        ds_telefone: fornecedor.ds_telefone || "",
        nr_cnpj: fornecedor.nr_cnpj || "",
        ds_endereco: fornecedor.ds_endereco || "",
        ds_cidade: fornecedor.ds_cidade || "",
        ds_estado: fornecedor.ds_estado || "",
        nr_cep: fornecedor.nr_cep || "",
        fl_ativo: fornecedor.fl_ativo ?? true,
      });
    }
  }, [fornecedor]);

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

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    handleChange("nr_cnpj", formatted);
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, "");

    if (clean.length <= 10) {
      return clean
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return clean
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    handleChange("ds_telefone", formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nm_fornecedor?.trim()) {
      toast.error("Nome do fornecedor é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      await atualizarFornecedor(fornecedorId, formData);
      toast.success("Fornecedor atualizado com sucesso!");
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar fornecedor";
      toast.error(errorMessage);
      console.error("Erro ao atualizar fornecedor:", err);
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
          <p className="text-destructive">Erro ao carregar dados do fornecedor</p>
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
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* TAB: Dados Básicos */}
        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Fornecedor</CardTitle>
              <CardDescription>
                Dados principais e identidade visual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome do Fornecedor */}
              <div className="space-y-2">
                <Label htmlFor="nm_fornecedor">
                  Nome do Fornecedor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nm_fornecedor"
                  value={formData.nm_fornecedor}
                  onChange={(e) => handleChange("nm_fornecedor", e.target.value)}
                  disabled={readOnly}
                  placeholder="MedSupply Brasil Ltda"
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
              />

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="ds_fornecedor">Descrição</Label>
                <Textarea
                  id="ds_fornecedor"
                  value={formData.ds_fornecedor}
                  onChange={(e) => handleChange("ds_fornecedor", e.target.value)}
                  disabled={readOnly}
                  placeholder="Descreva sua empresa, diferenciais e linha de produtos..."
                  rows={5}
                />
              </div>

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
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Contato & Endereço */}
        <TabsContent value="contato" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>
                Informações de contato do fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="nm_email">E-mail</Label>
                <Input
                  id="nm_email"
                  type="email"
                  value={formData.nm_email}
                  onChange={(e) => handleChange("nm_email", e.target.value)}
                  disabled={readOnly}
                  placeholder="contato@fornecedor.com.br"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="ds_telefone">Telefone</Label>
                <Input
                  id="ds_telefone"
                  value={formData.ds_telefone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={readOnly}
                  placeholder="(11) 3456-7890"
                  maxLength={15}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>
                Localização da sede ou filial principal
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
                  nr_cep: formData.nr_cep,
                }}
                onChange={(field, value) => {
                  // Mapeamento de campos
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

        {/* TAB: Estatísticas & Configurações */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Vendas</CardTitle>
              <CardDescription>
                Métricas calculadas automaticamente pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total de Produtos */}
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total de Produtos</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats?.qt_produtos || fornecedor?.qt_produtos || 0}
                    </p>
                  </div>

                  {/* Total de Vendas */}
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total de Vendas</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats?.qt_vendas || fornecedor?.qt_vendas || 0}
                    </p>
                  </div>

                  {/* Valor Total Vendas */}
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold mt-1">
                      R${" "}
                      {(stats?.vl_total_vendas || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Avaliação Média */}
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Avaliação Média</p>
                    <p className="text-2xl font-bold mt-1">
                      {(stats?.vl_nota_media || fornecedor?.vl_nota_media || 0).toFixed(1)} ⭐
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.qt_avaliacoes || 0} avaliações
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Status e configurações do fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fornecedor Ativo */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="fl_ativo">Fornecedor Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativo, produtos do fornecedor aparecem no marketplace
                  </p>
                </div>
                <Switch
                  id="fl_ativo"
                  checked={formData.fl_ativo}
                  onCheckedChange={(checked) => handleChange("fl_ativo", checked)}
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
