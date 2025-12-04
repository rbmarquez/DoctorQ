"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, Upload, X, Image as ImageIcon, Briefcase } from "lucide-react";

interface ProfessionalInfoFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: string) => void;
}

export function ProfessionalInfoForm({ formData, onChange }: ProfessionalInfoFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string>(formData.ds_foto_url || "");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        onChange('ds_foto_url', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview("");
    onChange('ds_foto_url', "");
  };

  return (
    <div className="space-y-6">
      {/* Upload de Foto */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Foto de Perfil
        </h3>
        <div className="flex items-start gap-4">
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Foto de perfil"
                className="w-24 h-24 object-cover rounded-full border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={removePhoto}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="w-24 h-24 border-2 border-dashed rounded-full flex items-center justify-center bg-gray-50">
              <User className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Upload className="h-4 w-4" />
                {photoPreview ? "Alterar foto" : "Upload da foto"}
              </div>
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG ou SVG até 2MB. Recomendado: 400x400px
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <User className="h-4 w-4" />
          Informações Pessoais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome Completo *</Label>
            <Input
              value={formData.nm_profissional || ""}
              onChange={(e) => onChange('nm_profissional', e.target.value)}
              placeholder="Ex: Dra. Maria Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>E-mail Profissional *</Label>
            <Input
              type="email"
              value={formData.ds_email || ""}
              onChange={(e) => onChange('ds_email', e.target.value)}
              placeholder="profissional@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone/WhatsApp *</Label>
            <Input
              value={formData.nr_telefone || ""}
              onChange={(e) => onChange('nr_telefone', e.target.value)}
              placeholder="(00) 00000-0000"
              maxLength={15}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Informações Profissionais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Especialidade *</Label>
            <Select
              value={formData.ds_especialidade || ""}
              onValueChange={(value) => onChange('ds_especialidade', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dermatologia">Dermatologia</SelectItem>
                <SelectItem value="Estética Facial">Estética Facial</SelectItem>
                <SelectItem value="Estética Corporal">Estética Corporal</SelectItem>
                <SelectItem value="Harmonização Facial">Harmonização Facial</SelectItem>
                <SelectItem value="Biomédica">Biomédica</SelectItem>
                <SelectItem value="Fisioterapia Dermatofuncional">
                  Fisioterapia Dermatofuncional
                </SelectItem>
                <SelectItem value="Nutrição Estética">Nutrição Estética</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Registro Profissional (CRM, COREN, etc.)</Label>
            <Input
              value={formData.nr_registro || ""}
              onChange={(e) => onChange('nr_registro', e.target.value)}
              placeholder="Ex: CRM 12345"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Biografia Profissional</Label>
            <Textarea
              value={formData.ds_biografia || ""}
              onChange={(e) => onChange('ds_biografia', e.target.value)}
              placeholder="Descreva sua experiência, formação e áreas de atuação..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tempo de Experiência (anos)</Label>
            <Input
              type="number"
              min="0"
              value={formData.nr_anos_experiencia || ""}
              onChange={(e) => onChange('nr_anos_experiencia', e.target.value)}
              placeholder="Ex: 5"
            />
          </div>

          <div className="space-y-2">
            <Label>Formação Principal</Label>
            <Input
              value={formData.ds_formacao || ""}
              onChange={(e) => onChange('ds_formacao', e.target.value)}
              placeholder="Ex: Medicina - Universidade XYZ"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Dica:</strong> Um perfil completo com foto profissional e biografia
          detalhada aumenta a confiança dos pacientes e melhora sua visibilidade na plataforma.
        </p>
      </div>
    </div>
  );
}
