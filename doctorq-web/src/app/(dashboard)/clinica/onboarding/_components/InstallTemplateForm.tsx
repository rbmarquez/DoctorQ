"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Eye, DollarSign, Shield, Palette } from "lucide-react";

interface InstallTemplateFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: string | boolean) => void;
}

export function InstallTemplateForm({ formData, onChange }: InstallTemplateFormProps) {
  return (
    <div className="space-y-6">
      {/* Privacidade */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Privacidade e Segurança
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Perfil Público
              </Label>
              <p className="text-sm text-muted-foreground">
                Exibir perfil da clínica na busca pública
              </p>
            </div>
            <Switch
              checked={formData.st_perfil_publico !== false}
              onCheckedChange={(checked) => onChange('st_perfil_publico', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Mostrar Preços
              </Label>
              <p className="text-sm text-muted-foreground">
                Exibir preços dos procedimentos publicamente
              </p>
            </div>
            <Switch
              checked={formData.st_mostrar_precos !== false}
              onCheckedChange={(checked) => onChange('st_mostrar_precos', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Aceitar Avaliações</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que pacientes avaliem a clínica
              </p>
            </div>
            <Switch
              checked={formData.st_aceitar_avaliacao !== false}
              onCheckedChange={(checked) => onChange('st_aceitar_avaliacao', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Compartilhar Fotos Antes/Depois</Label>
              <p className="text-sm text-muted-foreground">
                Exibir fotos de resultados na galeria pública (com consentimento)
              </p>
            </div>
            <Switch
              checked={formData.st_compartilhar_fotos || false}
              onCheckedChange={(checked) => onChange('st_compartilhar_fotos', checked)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Política de Privacidade
          </Label>
          <Textarea
            value={formData.ds_politica_privacidade || ""}
            onChange={(e) => onChange('ds_politica_privacidade', e.target.value)}
            placeholder="Resumo da política de privacidade..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            ⚠️ Importante: Mantenha sua política de privacidade em conformidade com a LGPD
          </p>
        </div>
      </div>

      {/* Aparência */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Personalização Visual
        </h3>

        <div className="space-y-2">
          <Label>Tema</Label>
          <Select
            value={formData.ds_tema || "light"}
            onValueChange={(value) => onChange('ds_tema', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="auto">Automático (Sistema)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cor Primária</Label>
          <div className="flex gap-4 items-center">
            <Input
              type="color"
              value={formData.ds_cor_primaria || "#8B5CF6"}
              onChange={(e) => onChange('ds_cor_primaria', e.target.value)}
              className="w-20 h-12"
            />
            <Input
              type="text"
              value={formData.ds_cor_primaria || "#8B5CF6"}
              onChange={(e) => onChange('ds_cor_primaria', e.target.value)}
              placeholder="#8B5CF6"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Cor principal usada nos botões e destaques da interface
          </p>
        </div>

        <div className="space-y-2">
          <Label>URL da Logo</Label>
          <Input
            type="url"
            value={formData.ds_logo_url || ""}
            onChange={(e) => onChange('ds_logo_url', e.target.value)}
            placeholder="https://exemplo.com/logo.png"
          />
          <p className="text-xs text-muted-foreground">
            Link da imagem da logo da clínica (formato PNG ou SVG recomendado)
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800">
          <strong>🎉 Pronto para Começar!</strong><br />
          Você está prestes a concluir a configuração inicial. Clique em &quot;Finalizar Configuração&quot; para começar a usar o DoctorQ!
        </p>
      </div>
    </div>
  );
}
