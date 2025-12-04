// src/components/agentes/sections/agente-observability-section.tsx
"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Eye } from "lucide-react";
import { useCredenciais } from "@/hooks/useCredenciais";
import type { Credencial } from "@/types/credenciais";
import { TipoObservabilidade, ObservabilityConfig, AgenteConfigFactory } from "@/types/agentes";

interface AgenteObservabilitySectionProps {
  data: ObservabilityConfig;
  onChange: (data: ObservabilityConfig) => void;
}

// Tipos de observabilidade disponíveis
const TIPOS_OBSERVABILIDADE = AgenteConfigFactory.getObservabilityTypes().map(tipo => ({
  ...tipo,
  icon: tipo.value === TipoObservabilidade.LANGFUSE ? Eye : Activity
}));

export function AgenteObservabilitySection({ data, onChange }: AgenteObservabilitySectionProps) {
  const { credenciais, fetchCredenciais } = useCredenciais();
  const [credenciaisObservabilidade, setCredenciaisObservabilidade] = useState<Credencial[]>([]);



  useEffect(() => {
    fetchCredenciais();
  }, [fetchCredenciais]);

  useEffect(() => {
    // Filtrar credenciais baseadas no tipo selecionado
    let filteredCredenciais: Credencial[] = [];

    if (data.tipo) {
      const credentialMap = {
        [TipoObservabilidade.LANGFUSE]: "langfuseApi"
      };

      const credentialType = credentialMap[data.tipo];
      if (credentialType) {
        filteredCredenciais = credenciais.filter(cred => cred.nome_credencial === credentialType);
      }
    }



    setCredenciaisObservabilidade(filteredCredenciais);

    // Se há tipo selecionado mas credencial inválida, limpar seleção
    // Considerar IDs truncados vs completos
    if (data.ativo && data.credencialId && credenciais.length > 0 && data.tipo) {
      const credentialExists = filteredCredenciais.some(c => {
        // Verificar ID completo ou se o ID salvo é uma versão truncada
        const currentCredentialId = data.credencialId;
        if (!currentCredentialId) return false;

        return c.id_credencial === currentCredentialId ||
          c.id_credencial.startsWith(currentCredentialId.replace(/\*/g, ''));
      });

      if (!credentialExists && filteredCredenciais.length > 0) {
        handleChange("credencialId", undefined);
      }
    }
  }, [credenciais, data.ativo, data.credencialId, data.tipo]);

  const handleChange = (field: keyof ObservabilityConfig, value: any) => {
    const newData = {
      ...data,
      [field]: value,
    };

    // Se desativar observabilidade, limpar configurações
    if (field === "ativo" && !value) {
      newData.credencialId = undefined;
      newData.tipo = undefined;
    }

    // Se mudar tipo, limpar credencial apenas se o tipo realmente mudou
    if (field === "tipo" && value !== data.tipo) {
      newData.credencialId = undefined;
    }



    onChange(newData);
  };

  return (
    <div className="space-y-4">


      {/* Ativar Observabilidade */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={data.ativo}
          onCheckedChange={(checked) => handleChange("ativo", checked)}
        />
        <Label>Ativar Observabilidade</Label>
      </div>

      {/* Configurações de Observabilidade */}
      {data.ativo && (
        <div className="space-y-4 pl-6 border-l-2 border-primary/20">
          {/* Tipo de Observabilidade */}
          <div className="space-y-2">
            <Label>Tipo de Observabilidade *</Label>
            <Select
              value={data.tipo || ""}
              onValueChange={(value) => handleChange("tipo", value as TipoObservabilidade)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione um tipo de observabilidade" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OBSERVABILIDADE.map(tipo => {
                  const IconComponent = tipo.icon;
                  return (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <span>{tipo.label}</span>
                          <span className="text-xs text-muted-foreground">{tipo.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Credencial */}
          {data.tipo && (
            <div className="space-y-2">
              <Label>Credencial *</Label>
              <Select
                value={data.credencialId || ""}
                onValueChange={(value) => {
                  handleChange("credencialId", value);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={`Selecione uma credencial para ${data.tipo}`} />
                </SelectTrigger>
                <SelectContent>
                  {credenciaisObservabilidade.length === 0 ? (
                    <SelectItem value="__no_credential__" disabled>
                      Nenhuma credencial encontrada para {data.tipo}
                    </SelectItem>
                  ) : (
                    credenciaisObservabilidade.map(credencial => {
                      return (
                        <SelectItem key={credencial.id_credencial} value={credencial.id_credencial}>
                          {credencial.nome}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>

              {credenciaisObservabilidade.length === 0 && data.tipo && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    ⚠️ Nenhuma credencial encontrada para {data.tipo}.
                    Configure uma credencial na seção de credenciais para habilitar a observabilidade.
                  </p>
                </div>
              )}

              {data.ativo && data.tipo && !data.credencialId && credenciaisObservabilidade.length > 0 && (
                <p className="text-sm text-destructive">
                  Selecione uma credencial para ativar a observabilidade.
                </p>
              )}
            </div>
          )}

          {data.ativo && !data.tipo && (
            <p className="text-sm text-destructive">
              Selecione um tipo de observabilidade para ativar esta funcionalidade.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
