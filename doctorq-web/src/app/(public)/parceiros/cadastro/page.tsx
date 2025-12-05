"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Handshake, Building2, User, Mail, Phone, FileText, Upload, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function CadastroParceirosPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Empresa
    nome_empresa: "",
    cnpj: "",
    razao_social: "",
    segmento: "",
    descricao: "",
    website: "",

    // Contato
    nome_responsavel: "",
    cargo: "",
    email: "",
    telefone: "",

    // Parceria
    tipo_parceria: "",
    expectativas: "",
    aceita_termos: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    alert("Cadastro enviado! Entraremos em contato em breve.");
    router.push("/parceiros");
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <Handshake className="h-8 w-8 text-purple-500" />
            Torne-se um Parceiro
          </h1>
          <p className="text-gray-600">
            Preencha o formulário abaixo para se cadastrar como parceiro DoctorQ
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step === 1
                ? "bg-purple-600 text-white"
                : step > 1
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step === 2
                ? "bg-purple-600 text-white"
                : step > 2
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {step > 2 ? <CheckCircle className="h-5 w-5" /> : "2"}
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step === 3
                ? "bg-purple-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            3
          </div>
        </div>

        {/* Step 1: Empresa */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    onChange={(e) => handleChange("nome_empresa", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social}
                    onChange={(e) => handleChange("razao_social", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="segmento">Segmento de Atuação *</Label>
                  <Select
                    value={formData.segmento}
                    onValueChange={(value) => handleChange("segmento", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saude">Saúde</SelectItem>
                      <SelectItem value="clinica">Clínica Médica</SelectItem>
                      <SelectItem value="farmaceutica">Farmacêutica</SelectItem>
                      <SelectItem value="cosmetica">Cosmética</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição da Empresa *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  placeholder="Conte-nos sobre sua empresa..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contato */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Dados do Responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_responsavel">Nome Completo *</Label>
                  <Input
                    id="nome_responsavel"
                    value={formData.nome_responsavel}
                    onChange={(e) => handleChange("nome_responsavel", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => handleChange("cargo", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail Corporativo *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleChange("telefone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Parceria */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Detalhes da Parceria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tipo_parceria">Tipo de Parceria Desejada *</Label>
                <Select
                  value={formData.tipo_parceria}
                  onValueChange={(value) => handleChange("tipo_parceria", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fornecedor">Fornecedor de Produtos</SelectItem>
                    <SelectItem value="servicos">Prestador de Serviços</SelectItem>
                    <SelectItem value="tecnologia">Integração Tecnológica</SelectItem>
                    <SelectItem value="distribuidor">Distribuidor</SelectItem>
                    <SelectItem value="comercial">Parceria Comercial</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expectativas">Expectativas e Objetivos *</Label>
                <Textarea
                  id="expectativas"
                  value={formData.expectativas}
                  onChange={(e) => handleChange("expectativas", e.target.value)}
                  placeholder="O que você espera desta parceria?"
                  rows={5}
                  className="mt-1"
                />
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <Label className="font-semibold mb-2 block">Documentos (Opcional)</Label>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload de Apresentação Comercial
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload de Certificações
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 border rounded-lg p-4">
                <Checkbox
                  id="aceita_termos"
                  checked={formData.aceita_termos}
                  onCheckedChange={(checked) => handleChange("aceita_termos", checked as boolean)}
                />
                <Label htmlFor="aceita_termos" className="cursor-pointer text-sm">
                  Eu li e concordo com os{" "}
                  <a href="/termos-servico" className="text-purple-600 hover:underline" target="_blank">
                    Termos de Serviço
                  </a>{" "}
                  e{" "}
                  <a href="/legal/privacidade" className="text-purple-600 hover:underline" target="_blank">
                    Política de Privacidade
                  </a>
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Voltar
          </Button>
          {step < 3 ? (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!formData.aceita_termos}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Enviar Cadastro
            </Button>
          )}
        </div>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">O que acontece depois?</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>1. Nossa equipe analisará seu cadastro em até 5 dias úteis</li>
              <li>2. Você receberá um e-mail com o retorno da análise</li>
              <li>3. Caso aprovado, agendaremos uma reunião para alinhamento</li>
              <li>4. Após assinatura do contrato, a parceria será ativada</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
