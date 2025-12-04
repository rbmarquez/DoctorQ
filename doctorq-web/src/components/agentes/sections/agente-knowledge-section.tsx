// src/components/agentes/sections/agente-knowledge-section.tsx
"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Plus, Trash2, X } from "lucide-react";
import { useCredenciais } from "@/hooks/useCredenciais";
import type { Credencial } from "@/types/credenciais";
import { KnowledgeConfig, Knowledge } from "@/types/agentes";

interface AgenteKnowledgeSectionProps {
  data?: KnowledgeConfig;
  onChange: (data: KnowledgeConfig) => void;
}

export function AgenteKnowledgeSection({ data, onChange }: AgenteKnowledgeSectionProps) {
  const { credenciais, fetchCredenciais } = useCredenciais();
  const [credenciaisQdrant, setCredenciaisQdrant] = useState<Credencial[]>([]);

  // Garantir que data seja sempre um objeto válido
  const safeData: KnowledgeConfig = data || { ativo: false, knowledges: [] };

  useEffect(() => {
    fetchCredenciais();
  }, [fetchCredenciais]);

  useEffect(() => {
    // Filtrar credenciais para base de conhecimento (Qdrant)
    let filteredCredenciais: Credencial[] = [];

    if (safeData.ativo) {
      // Para base de conhecimento, usar credenciais do Qdrant
      filteredCredenciais = credenciais.filter(cred => cred.nome_credencial === "qdrantApi");
    }

    setCredenciaisQdrant(filteredCredenciais);

    // Se há knowledge ativo mas alguma credencial inválida, limpar seleções inválidas
    if (safeData.ativo && safeData.knowledges.length > 0 && credenciais.length > 0) {
      const validKnowledges = safeData.knowledges.filter(knowledge => {
        return filteredCredenciais.some(c => {
          const currentCredentialId = knowledge.credentialId;
          if (!currentCredentialId) return false;

          return c.id_credencial === currentCredentialId ||
            c.id_credencial.startsWith(currentCredentialId.replace(/\*/g, ''));
        });
      });

      if (validKnowledges.length !== safeData.knowledges.length) {
        handleChange("knowledges", validKnowledges);
      }
    }
  }, [credenciais, safeData.ativo, safeData.knowledges]);

  const handleChange = (field: keyof KnowledgeConfig, value: any) => {
    const newData = {
      ...safeData,
      [field]: value,
    };

    // Se desativar knowledge, limpar configurações
    if (field === "ativo" && !value) {
      newData.knowledges = [];
    }

    onChange(newData);
  };

  const handleAddKnowledge = () => {
    if (credenciaisQdrant.length === 0) {
      return;
    }

    const newKnowledge: Knowledge = {
      credentialId: credenciaisQdrant[0].id_credencial
    };

    const updatedKnowledges = [...safeData.knowledges, newKnowledge];
    handleChange("knowledges", updatedKnowledges);
  };

  const handleRemoveKnowledge = (index: number) => {
    const updatedKnowledges = safeData.knowledges.filter((_, i) => i !== index);
    handleChange("knowledges", updatedKnowledges);
  };

  const handleKnowledgeCredentialChange = (index: number, credentialId: string) => {
    const updatedKnowledges = [...safeData.knowledges];
    updatedKnowledges[index] = {
      ...updatedKnowledges[index],
      credentialId
    };
    handleChange("knowledges", updatedKnowledges);
  };

  const getCredentialName = (credentialId: string): string => {
    const credencial = credenciaisQdrant.find(c => c.id_credencial === credentialId);
    return credencial?.nome || credentialId;
  };

  return (
    <div className="space-y-6">
      {/* Chip de Status da Base de Conhecimento */}
      <div className="flex items-center gap-3">
        <Badge
          variant={safeData.ativo ? "default" : "secondary"}
          className="flex items-center gap-1 px-3 py-1"
        >
          <Database className="h-3 w-3" />
          {safeData.ativo ? "Base de Conhecimento Ativa" : "Base de Conhecimento Desativada"}
        </Badge>

        {safeData.ativo && safeData.knowledges.length > 0 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {safeData.knowledges.length} base(s) configurada(s)
          </Badge>
        )}
      </div>

      {/* Ativar Base de Conhecimento */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={safeData.ativo}
          onCheckedChange={(checked) => handleChange("ativo", checked)}
        />
        <Label>Ativar Base de Conhecimento Vector</Label>
      </div>

      {/* Configurações de Base de Conhecimento */}
      {safeData.ativo && (
        <div className="space-y-4 pl-6 border-l-2 border-primary/20">
          {/* Verificação de Credenciais Qdrant */}
          {credenciaisQdrant.length === 0 && (
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                ⚠️ Nenhuma credencial Qdrant encontrada.
                Configure uma credencial Qdrant na seção de credenciais para habilitar a base de conhecimento vector.
              </p>
            </div>
          )}

          {/* Lista de Bases de Conhecimento */}
          {credenciaisQdrant.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Bases de Conhecimento</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddKnowledge}
                  className="gap-2"
                  disabled={credenciaisQdrant.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Base
                </Button>
              </div>

              {/* Lista de Knowledge configurados */}
              {safeData.knowledges.length > 0 ? (
                <div className="space-y-3">
                  {safeData.knowledges.map((knowledge, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-md bg-muted/30"
                    >
                      <Database className="h-4 w-4 text-primary flex-shrink-0" />
                      
                      <div className="flex-1">
                        <Select
                          value={knowledge.credentialId}
                          onValueChange={(value) => handleKnowledgeCredentialChange(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma credencial Qdrant" />
                          </SelectTrigger>
                          <SelectContent>
                            {credenciaisQdrant.map(credencial => (
                              <SelectItem key={credencial.id_credencial} value={credencial.id_credencial}>
                                {credencial.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveKnowledge(index)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma base de conhecimento configurada</p>
                  <p className="text-xs">Clique em &quot;Adicionar Base&quot; para começar</p>
                </div>
              )}
            </div>
          )}

          {/* Informações sobre Base de Conhecimento */}
          {safeData.ativo && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Base de Conhecimento Vector:</strong> Permite que o agente acesse informações 
                específicas armazenadas em bases de dados vetoriais (Qdrant) para fornecer respostas 
                mais precisas e contextualizadas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
