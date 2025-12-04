"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Globe, Upload, X, Image as ImageIcon } from "lucide-react";

interface AccountSetupFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: string) => void;
}

export function AccountSetupForm({ formData, onChange }: AccountSetupFormProps) {
  const [logoPreview, setLogoPreview] = useState<string>(formData.ds_logo_url || "");

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);

    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        onChange('ds_logo_url', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview("");
    onChange('ds_logo_url', "");
  };

  return (
    <div className="space-y-6">
      {/* Upload de Logo */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Logo da Clínica
        </h3>
        <div className="flex items-start gap-4">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Logo da clínica"
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={removeLogo}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Upload className="h-4 w-4" />
                {logoPreview ? "Alterar logo" : "Upload da logo"}
              </div>
            </Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG ou SVG até 2MB. Recomendado: 500x500px
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Informações da Clínica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Clínica *</Label>
            <Input
              value={formData.nm_clinica || ""}
              onChange={(e) => onChange('nm_clinica', e.target.value)}
              placeholder="Ex: Clínica Bella Donna"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input
              value={formData.nr_cnpj || ""}
              onChange={(e) => onChange('nr_cnpj', formatCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição da Clínica</Label>
          <Textarea
            value={formData.ds_descricao || ""}
            onChange={(e) => onChange('ds_descricao', e.target.value)}
            placeholder="Descreva sua clínica, especialidades e diferenciais..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              <Phone className="h-4 w-4 inline mr-1" />
              Telefone *
            </Label>
            <Input
              value={formData.nr_telefone || ""}
              onChange={(e) => onChange('nr_telefone', formatPhone(e.target.value))}
              placeholder="(00) 0000-0000"
              maxLength={15}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>
              <Mail className="h-4 w-4 inline mr-1" />
              E-mail *
            </Label>
            <Input
              type="email"
              value={formData.ds_email || ""}
              onChange={(e) => onChange('ds_email', e.target.value)}
              placeholder="contato@clinica.com.br"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Endereço
        </h3>
        <div className="space-y-2">
          <Label>Endereço Completo *</Label>
          <Input
            value={formData.ds_endereco || ""}
            onChange={(e) => onChange('ds_endereco', e.target.value)}
            placeholder="Rua, número, bairro"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Cidade *</Label>
            <Input
              value={formData.ds_cidade || ""}
              onChange={(e) => onChange('ds_cidade', e.target.value)}
              placeholder="São Paulo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Estado *</Label>
            <Select
              value={formData.ds_estado || ""}
              onValueChange={(value) => onChange('ds_estado', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Acre</SelectItem>
                <SelectItem value="AL">Alagoas</SelectItem>
                <SelectItem value="AP">Amapá</SelectItem>
                <SelectItem value="AM">Amazonas</SelectItem>
                <SelectItem value="BA">Bahia</SelectItem>
                <SelectItem value="CE">Ceará</SelectItem>
                <SelectItem value="DF">Distrito Federal</SelectItem>
                <SelectItem value="ES">Espírito Santo</SelectItem>
                <SelectItem value="GO">Goiás</SelectItem>
                <SelectItem value="MA">Maranhão</SelectItem>
                <SelectItem value="MT">Mato Grosso</SelectItem>
                <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                <SelectItem value="MG">Minas Gerais</SelectItem>
                <SelectItem value="PA">Pará</SelectItem>
                <SelectItem value="PB">Paraíba</SelectItem>
                <SelectItem value="PR">Paraná</SelectItem>
                <SelectItem value="PE">Pernambuco</SelectItem>
                <SelectItem value="PI">Piauí</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                <SelectItem value="RO">Rondônia</SelectItem>
                <SelectItem value="RR">Roraima</SelectItem>
                <SelectItem value="SC">Santa Catarina</SelectItem>
                <SelectItem value="SP">São Paulo</SelectItem>
                <SelectItem value="SE">Sergipe</SelectItem>
                <SelectItem value="TO">Tocantins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>CEP *</Label>
            <Input
              value={formData.nr_cep || ""}
              onChange={(e) => onChange('nr_cep', formatCep(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
