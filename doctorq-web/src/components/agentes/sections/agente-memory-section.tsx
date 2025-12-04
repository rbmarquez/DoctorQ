// src/components/agentes/sections/agente-memory-section.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HardDrive, Brain, Clock, MessageCircle, Users } from "lucide-react";
import { useCredenciais } from "@/hooks/useCredenciais";
import type { Credencial } from "@/types/credenciais";
import { TipoMemoria, MemoryConfig, AgenteConfigFactory } from "@/types/agentes";

interface AgenteMemorySectionProps {
  data?: MemoryConfig;
  onChange: (data: MemoryConfig) => void;
}

// Tipos de memória disponíveis baseados no schema do backend
const TIPOS_MEMORIA = AgenteConfigFactory.getMemoryTypes().map(tipo => ({
  ...tipo,
  icon: tipo.value === TipoMemoria.CONVERSATION_BUFFER ? MessageCircle :
    tipo.value === TipoMemoria.CONVERSATION_BUFFER_WINDOW ? Clock :
      tipo.value === TipoMemoria.CONVERSATION_SUMMARY ? Brain :
        tipo.value === TipoMemoria.CONVERSATION_TOKEN_BUFFER ? Users : MessageCircle
}));

export function AgenteMemorySection({ data, onChange }: AgenteMemorySectionProps) {
  const { credenciais, fetchCredenciais } = useCredenciais();
  const [credenciaisMemoria, setCredenciaisMemoria] = useState<Credencial[]>([]);

  // Garantir que data seja sempre um objeto válido
  const safeData: MemoryConfig = data || { ativo: false };



  useEffect(() => {
    fetchCredenciais();
  }, [fetchCredenciais]);

  useEffect(() => {
    // Filtrar credenciais para memória (Redis)
    let filteredCredenciais: Credencial[] = [];

    if (safeData.ativo) {
      // Para memória, usar credenciais do Redis
      filteredCredenciais = credenciais.filter(cred => cred.nome_credencial === "redisApi");
    }


    setCredenciaisMemoria(filteredCredenciais);

    // Se há memória ativa mas credencial inválida, limpar seleção
    // Considerar IDs truncados vs completos
    if (safeData.ativo && safeData.credencialId && credenciais.length > 0) {
      const credentialExists = filteredCredenciais.some(c => {
        // Verificar ID completo ou se o ID salvo é uma versão truncada
        const currentCredentialId = safeData.credencialId;
        if (!currentCredentialId) return false;

        return c.id_credencial === currentCredentialId ||
          c.id_credencial.startsWith(currentCredentialId.replace(/\*/g, ''));
      });

      if (!credentialExists && filteredCredenciais.length > 0) {
        handleChange("credencialId", undefined);
      }
    }
  }, [credenciais, safeData.ativo, safeData.credencialId]);

  const handleChange = (field: keyof MemoryConfig, value: any) => {
    const newData = {
      ...safeData,
      [field]: value,
    };

    // Se desativar memória, limpar configurações
    if (field === "ativo" && !value) {
      newData.tipo = undefined;
      newData.configuracao = {};
      newData.credencialId = undefined;
    }

    // Se mudar tipo de memória, usar configuração padrão
    if (field === "tipo" && value) {
      newData.configuracao = AgenteConfigFactory.getDefaultMemoryConfig(value as TipoMemoria);
    }



    onChange(newData);
  };

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = {
      ...safeData.configuracao,
      [key]: value,
    };
    handleChange("configuracao", newConfig);
  };

  const tipoSelecionado = TIPOS_MEMORIA.find(t => t.value === safeData.tipo);

  return (
    <div className="space-y-6">


      {/* Chip de Status da Memória */}
      <div className="flex items-center gap-3">
        <Badge
          variant={safeData.ativo ? "default" : "secondary"}
          className="flex items-center gap-1 px-3 py-1"
        >
          <HardDrive className="h-3 w-3" />
          {safeData.ativo ? "Memória Ativa" : "Memória Desativada"}
        </Badge>

        {safeData.ativo && safeData.tipo && (
          <Badge variant="outline" className="flex items-center gap-1">
            {tipoSelecionado && <tipoSelecionado.icon className="h-3 w-3" />}
            {tipoSelecionado?.label}
          </Badge>
        )}
      </div>

      {/* Ativar Memória */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={safeData.ativo}
          onCheckedChange={(checked) => handleChange("ativo", checked)}
        />
        <Label>Ativar Memória</Label>
      </div>

      {/* Configurações de Memória */}
      {safeData.ativo && (
        <div className="space-y-4 pl-6 border-l-2 border-primary/20">
          {/* Tipo de Memória */}
          <div className="space-y-2">
            <Label>Tipo de Memória *</Label>
            <Select
              value={safeData.tipo || ""}
              onValueChange={(value) => handleChange("tipo", value || undefined)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione um tipo de memória" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_MEMORIA.map(tipo => {
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
            {tipoSelecionado && (
              <p className="text-sm text-muted-foreground">
                {tipoSelecionado.description}
              </p>
            )}
          </div>

          {/* Credencial para Memória */}
          {safeData.ativo && (
            <div className="space-y-2">
              <Label>Credencial Redis *</Label>
              <Select
                value={safeData.credencialId || ""}
                onValueChange={(value) => {
                  handleChange("credencialId", value);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione uma credencial Redis para memória" />
                </SelectTrigger>
                <SelectContent>
                  {credenciaisMemoria.length === 0 ? (
                    <SelectItem value="__no_credential__" disabled>
                      Nenhuma credencial Redis encontrada
                    </SelectItem>
                  ) : (
                    credenciaisMemoria.map(credencial => {
                      return (
                        <SelectItem key={credencial.id_credencial} value={credencial.id_credencial}>
                          {credencial.nome}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>

              {credenciaisMemoria.length === 0 && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    ⚠️ Nenhuma credencial Redis encontrada.
                    Configure uma credencial Redis na seção de credenciais para habilitar a memória persistente.
                  </p>
                </div>
              )}

              {safeData.ativo && !safeData.credencialId && credenciaisMemoria.length > 0 && (
                <p className="text-sm text-destructive">
                  Selecione uma credencial Redis para ativar a memória persistente.
                </p>
              )}
            </div>
          )}

          {/* Configurações Específicas do Tipo */}
          {safeData.tipo && safeData.configuracao && (safeData.tipo === TipoMemoria.CONVERSATION_BUFFER_WINDOW || safeData.tipo === TipoMemoria.CONVERSATION_TOKEN_BUFFER) && (
            <div className="space-y-4 bg-muted/30 p-4 rounded-md">
              <h4 className="font-medium text-sm">Configurações de Memória</h4>

              {/* Configuração para Buffer Window */}
              {safeData.tipo === TipoMemoria.CONVERSATION_BUFFER_WINDOW && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Janela (K mensagens) *</Label>
                    <Input
                      type="number"
                      value={safeData.configuracao?.k || ""}
                      onChange={(e) => handleConfigChange("k", Number(e.target.value))}
                      placeholder="5"
                      min="1"
                      className="mt-2"
                      max="50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Número de mensagens recentes a manter na memória
                    </p>
                  </div>
                </div>
              )}

              {/* Configuração para Token Buffer */}
              {safeData.tipo === TipoMemoria.CONVERSATION_TOKEN_BUFFER && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Limite de Tokens *</Label>
                    <Input
                      type="number"
                      value={safeData.configuracao?.max_token_limit || ""}
                      onChange={(e) => handleConfigChange("max_token_limit", Number(e.target.value))}
                      placeholder="2000"
                      min="100"
                      className="mt-2"
                      max="10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Limite de tokens antes de iniciar o resumo (padrão: 2000)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {safeData.ativo && !safeData.tipo && (
            <p className="text-sm text-destructive">
              Selecione um tipo de memória para ativar esta funcionalidade.
            </p>
          )}
        </div>
      )}


    </div>
  );
}
