"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Phone, MapPin, Globe } from "lucide-react";
import type { ClinicaData } from "../page";

interface Props {
  data: ClinicaData;
  onUpdate: (data: Partial<ClinicaData>) => void;
}

export default function OnboardingStep1({ data, onUpdate }: Props) {
  const handleChange = (field: keyof ClinicaData, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          onUpdate({
            ds_endereco: data.logradouro,
            ds_bairro: data.bairro,
            ds_cidade: data.localidade,
            sg_estado: data.uf,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>Dados principais da sua clínica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nm_clinica">
                Nome da Clínica <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nm_clinica"
                placeholder="Clínica Estética Exemplo"
                value={data.nm_clinica}
                onChange={(e) => handleChange("nm_clinica", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nr_cnpj">
                CNPJ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nr_cnpj"
                placeholder="00.000.000/0000-00"
                value={data.nr_cnpj}
                onChange={(e) => handleChange("nr_cnpj", e.target.value)}
                maxLength={18}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nr_telefone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nr_telefone"
                placeholder="(00) 00000-0000"
                value={data.nr_telefone}
                onChange={(e) => handleChange("nr_telefone", e.target.value)}
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds_email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ds_email"
                type="email"
                placeholder="contato@clinica.com.br"
                value={data.ds_email}
                onChange={(e) => handleChange("ds_email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ds_website" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website (opcional)
              </Label>
              <Input
                id="ds_website"
                type="url"
                placeholder="https://www.clinica.com.br"
                value={data.ds_website}
                onChange={(e) => handleChange("ds_website", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço
          </CardTitle>
          <CardDescription>Localização da clínica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nr_cep">
                CEP <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nr_cep"
                placeholder="00000-000"
                value={data.nr_cep}
                onChange={(e) => handleChange("nr_cep", e.target.value)}
                onBlur={(e) => handleCepBlur(e.target.value)}
                maxLength={9}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ds_endereco">
                Endereço <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ds_endereco"
                placeholder="Rua, Avenida, etc."
                value={data.ds_endereco}
                onChange={(e) => handleChange("ds_endereco", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nr_numero">
                Número <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nr_numero"
                placeholder="123"
                value={data.nr_numero}
                onChange={(e) => handleChange("nr_numero", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ds_complemento">Complemento</Label>
              <Input
                id="ds_complemento"
                placeholder="Sala, Andar, etc. (opcional)"
                value={data.ds_complemento}
                onChange={(e) => handleChange("ds_complemento", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds_bairro">Bairro</Label>
              <Input
                id="ds_bairro"
                placeholder="Bairro"
                value={data.ds_bairro}
                onChange={(e) => handleChange("ds_bairro", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds_cidade">
                Cidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ds_cidade"
                placeholder="Cidade"
                value={data.ds_cidade}
                onChange={(e) => handleChange("ds_cidade", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sg_estado">
                Estado <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sg_estado"
                placeholder="UF"
                value={data.sg_estado}
                onChange={(e) => handleChange("sg_estado", e.target.value.toUpperCase())}
                maxLength={2}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo da Clínica</CardTitle>
          <CardDescription>Imagem que representa sua marca (opcional)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Upload de imagem será implementado em breve
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PNG, JPG (max 2MB)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
