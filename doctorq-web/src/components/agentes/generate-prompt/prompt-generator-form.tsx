"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Loader2, Sparkles } from "lucide-react";

interface PromptGeneratorFormProps {
  onSubmit: (data: {
    descricao: string;
    contexto: string;
    tipo_agente: string;
  }) => void;
  isLoading: boolean;
  agenteNome?: string;
}

const TIPOS_AGENTE = [
  { value: "atendimento", label: "Atendimento ao Cliente" },
  { value: "suporte", label: "Suporte Técnico" },
  { value: "marketing", label: "Marketing e divulgação" },
  { value: "analise", label: "Análise de Dados" },
  { value: "criativo", label: "Conteúdo Criativo" },
  { value: "desenvolvimento", label: "Desenvolvimento" },
  { value: "geral", label: "Geral" },
];

const EXEMPLOS_DESCRICAO = [
  "Assistente especializado em atendimento ao cidadão, capaz de resolver dúvidas sobre produtos e serviços",
  "Agente de suporte técnico para ajudar usuários com problemas de software e hardware",
  "Especialista em vendas para qualificar leads e apresentar soluções personalizadas",
  "Analista de dados para interpretar relatórios e gerar insights",
  "Criador de conteúdo para redes sociais e marketing digital",
  "Tutor educacional para explicar conceitos complexos de forma simples",
];

export function PromptGeneratorForm({
  onSubmit,
  isLoading,
}: PromptGeneratorFormProps) {
  const [formData, setFormData] = useState({
    descricao: "",
    contexto: "",
    tipo_agente: "geral",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.descricao.trim()) {
      onSubmit(formData);
    }
  };

  const handleExampleClick = (exemplo: string) => {
    setFormData(prev => ({
      ...prev,
      descricao: exemplo,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Agente */}
      <div className="space-y-2">
        <Label>Tipo de Agente</Label>
        <Select
          value={formData.tipo_agente}
          onValueChange={(value) =>
            setFormData(prev => ({ ...prev, tipo_agente: value }))
          }
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecione o tipo de agente" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_AGENTE.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Descrição do Agente */}
      <div className="space-y-2">
        <Label>Descrição do Agente *</Label>
        <Textarea
          value={formData.descricao}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, descricao: e.target.value }))
          }
          placeholder="Descreva detalhadamente o que o agente deve fazer, suas responsabilidades e comportamento esperado..."
          className="min-h-[120px] mt-2"
          required
        />

        {/* Exemplos Rápidos */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Exemplos Rápidos:
          </Label>
          <div className="flex flex-wrap gap-2 justify-center">
            {EXEMPLOS_DESCRICAO.map((exemplo, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExampleClick(exemplo)}
                className="text-center h-auto p-2 text-xs flex-shrink-0 max-w-fit"
              >
                {exemplo}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contexto Adicional */}
      <div className="space-y-2">
        <Label>Contexto Adicional (Opcional)</Label>
        <Textarea
          value={formData.contexto}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, contexto: e.target.value }))
          }
          placeholder="Informações adicionais como público-alvo, tom de voz, restrições específicas..."
          className="min-h-[100px] mt-2"
        />
      </div>

      {/* Botão de Geração */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading || !formData.descricao.trim()}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isLoading ? "Gerando..." : "Gerar Prompt"}
        </Button>
      </div>
    </form>
  );
}
