"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Eye, DollarSign, MapPin } from "lucide-react";

interface PublicProfileFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: string | boolean) => void;
}

export function PublicProfileForm({ formData, onChange }: PublicProfileFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4" />
          Perfil Público
        </h3>
        <p className="text-sm text-gray-500">
          Configure como seu perfil aparecerá para pacientes na busca e na sua página pública.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-800 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Visibilidade
        </h4>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label className="text-base font-medium">Perfil público visível</Label>
            <p className="text-sm text-muted-foreground">
              Permitir que pacientes encontrem você na busca
            </p>
          </div>
          <Switch
            checked={formData.fg_perfil_publico !== false}
            onCheckedChange={(checked) => onChange('fg_perfil_publico', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label className="text-base font-medium">Aceitar novos pacientes</Label>
            <p className="text-sm text-muted-foreground">
              Permitir agendamentos de novos pacientes
            </p>
          </div>
          <Switch
            checked={formData.fg_aceita_novos_pacientes !== false}
            onCheckedChange={(checked) => onChange('fg_aceita_novos_pacientes', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label className="text-base font-medium">Mostrar número de atendimentos</Label>
            <p className="text-sm text-muted-foreground">
              Exibir quantos pacientes você já atendeu
            </p>
          </div>
          <Switch
            checked={formData.fg_mostrar_atendimentos !== false}
            onCheckedChange={(checked) => onChange('fg_mostrar_atendimentos', checked)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-sm text-gray-800 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Informações Financeiras
        </h4>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label className="text-base font-medium">Exibir preços no perfil</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar valores dos procedimentos publicamente
            </p>
          </div>
          <Switch
            checked={formData.fg_exibir_precos || false}
            onCheckedChange={(checked) => onChange('fg_exibir_precos', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Faixa de preço dos seus procedimentos</Label>
          <Select
            value={formData.ds_faixa_preco || ""}
            onValueChange={(value) => onChange('ds_faixa_preco', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a faixa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="$">$ - Econômico (até R$ 200)</SelectItem>
              <SelectItem value="$$">$$ - Moderado (R$ 200 - R$ 500)</SelectItem>
              <SelectItem value="$$$">$$$ - Alto (R$ 500 - R$ 1.000)</SelectItem>
              <SelectItem value="$$$$">$$$$ - Premium (acima de R$ 1.000)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-sm text-gray-800 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Localização
        </h4>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <Label className="text-base font-medium">Mostrar endereço completo</Label>
            <p className="text-sm text-muted-foreground">
              Exibir endereço completo antes do agendamento
            </p>
          </div>
          <Switch
            checked={formData.fg_mostrar_endereco || false}
            onCheckedChange={(checked) => onChange('fg_mostrar_endereco', checked)}
          />
        </div>

        <div className="p-4 rounded-lg bg-gray-50 border">
          <p className="text-sm text-gray-600">
            {formData.fg_mostrar_endereco ? (
              <>
                <strong>Endereço visível:</strong> Pacientes verão seu endereço completo no perfil
              </>
            ) : (
              <>
                <strong>Endereço oculto:</strong> Pacientes verão apenas bairro e cidade. O endereço completo
                será revelado apenas após confirmação do agendamento.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium text-sm text-gray-800">Outras Configurações</h4>

        <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
          <Label className="cursor-pointer">Permitir avaliações públicas</Label>
          <Switch
            checked={formData.fg_permitir_avaliacoes !== false}
            onCheckedChange={(checked) => onChange('fg_permitir_avaliacoes', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
          <Label className="cursor-pointer">Exibir fotos de antes/depois (com autorização)</Label>
          <Switch
            checked={formData.fg_exibir_portfolio || false}
            onCheckedChange={(checked) => onChange('fg_exibir_portfolio', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
          <Label className="cursor-pointer">Receber solicitações de orçamento</Label>
          <Switch
            checked={formData.fg_receber_orcamentos !== false}
            onCheckedChange={(checked) => onChange('fg_receber_orcamentos', checked)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>🌟 Dica de ouro:</strong> Perfis completos e públicos com avaliações visíveis
          aparecem 5x mais nas buscas e convertem 4x mais agendamentos!
        </p>
      </div>
    </div>
  );
}
