// src/components/agentes/sections/agente-model-section.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, Target, FileText, Zap } from "lucide-react";
import { useCredenciais } from "@/hooks/useCredenciais";
import type { Credencial } from "@/types/credenciais";

interface ModeloData {
  id: any;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface AgenteModelSectionProps {
  data: ModeloData;
  onChange: (data: ModeloData) => void;
}

// Configuração fixa para Azure OpenAI Chat
const MODELO_FIXO = {
  tipo: "AzureChatOpenAI",
  label: "Azure OpenAI Chat",
  credentialType: "azureOpenIaChatApi",
  description: "Azure OpenAI Chat models (GPT-4, GPT-3.5)"
};

// Valores padrão sugeridos para configuração do modelo
const DEFAULT_MODEL_CONFIG = {
  temperature: 0.7,
  top_p: 0.95,
  max_tokens: 4000,
  stream: true
};

// Presets de configuração para diferentes casos de uso
const MODEL_PRESETS = {
  balanced: {
    label: "Balanceado",
    description: "Configuração equilibrada para uso geral",
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 4000,
    stream: true
  },
  creative: {
    label: "Criativo",
    description: "Para respostas mais criativas e variadas",
    temperature: 0.9,
    top_p: 0.95,
    max_tokens: 4000,
    stream: true
  },
  precise: {
    label: "Preciso",
    description: "Para respostas mais determinísticas e precisas",
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: 2000,
    stream: true
  },
  long_form: {
    label: "Texto Longo",
    description: "Para geração de textos longos",
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 8000,
    stream: true
  }
};



export function AgenteModelSection({ data, onChange }: AgenteModelSectionProps) {
  const { credenciais, fetchCredenciais } = useCredenciais();
  const [credenciaisDisponiveis, setCredenciaisDisponiveis] = useState<Credencial[]>([]);

  useEffect(() => {
    fetchCredenciais();
  }, [fetchCredenciais]);

  useEffect(() => {
    // Filtrar apenas credenciais do tipo azureOpenIaChatApi
    if (credenciais.length > 0) {
      const credenciaisAzure = credenciais.filter(cred =>
        cred.nome_credencial === MODELO_FIXO.credentialType
      );

      setCredenciaisDisponiveis(credenciaisAzure);

      // Se a credencial atual não é do tipo Azure OpenAI, limpar seleção
      if (data.id?.id_credencial && !credenciaisAzure.some(c => c.id_credencial === data.id.id_credencial)) {
        handleChange("id", { id_credencial: "" });
      }
    } else {
      setCredenciaisDisponiveis([]);
    }
  }, [credenciais, data.id]);

  const handleChange = (field: keyof ModeloData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  // Função para aplicar um preset
  const applyPreset = (presetKey: keyof typeof MODEL_PRESETS) => {
    const preset = MODEL_PRESETS[presetKey];
    onChange({
      ...data,
      temperature: preset.temperature,
      top_p: preset.top_p,
      max_tokens: preset.max_tokens,
      stream: preset.stream,
    });
  };

  // Função para usar valores padrão quando campo está vazio
  const getFieldValue = (field: keyof typeof DEFAULT_MODEL_CONFIG, currentValue: any) => {
    return currentValue !== undefined ? currentValue : DEFAULT_MODEL_CONFIG[field];
  };

  return (
    <div className="space-y-6">

      {/* Selecionar Modelo (Credencial) */}
      <div className="space-y-2">
        <Label>Selecionar Modelo *</Label>
        <Select
          value={data.id?.id_credencial || ""}
          onValueChange={(value) => handleChange("id", { id_credencial: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um modelo Azure OpenAI" />
          </SelectTrigger>
          <SelectContent>
            {credenciaisDisponiveis.length === 0 ? (
              <SelectItem value="__no_credential__" disabled>
                Nenhuma credencial Azure OpenAI encontrada
              </SelectItem>
            ) : (
              credenciaisDisponiveis.map(credencial => (
                <SelectItem key={credencial.id_credencial} value={credencial.id_credencial}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{credencial.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      Azure OpenAI Chat
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <div className="text-sm">
          {credenciaisDisponiveis.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
              <p className="font-medium text-yellow-800">Nenhuma credencial encontrada</p>
              <p className="text-yellow-700">
                Configure credenciais do tipo <code className="bg-yellow-100 px-1 rounded">
                  azureOpenIaChatApi
                </code> na seção de credenciais para usar Azure OpenAI Chat.
              </p>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>

      {/* Presets de Configuração */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Configurações Rápidas</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(MODEL_PRESETS).map(([key, preset]) => {
            const icons = {
              balanced: <Zap className="h-4 w-4" />,
              creative: <Lightbulb className="h-4 w-4" />,
              precise: <Target className="h-4 w-4" />,
              long_form: <FileText className="h-4 w-4" />
            };

            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(key as keyof typeof MODEL_PRESETS)}
                className="h-auto p-3 flex flex-col items-start gap-1"
                title={preset.description}
              >
                <div className="flex items-center gap-2 w-full">
                  {icons[key as keyof typeof icons]}
                  <span className="text-xs font-medium">{preset.label}</span>
                </div>
                <div className="text-xs text-muted-foreground text-left">
                  T:{preset.temperature} • P:{preset.top_p} • Max:{preset.max_tokens}
                </div>
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Clique em uma configuração para aplicar valores otimizados para diferentes casos de uso
        </p>
      </div>

      {/* Accordion com configurações do modelo */}
      <Accordion type="single" collapsible className="w-full" defaultValue="model-settings">
        <AccordionItem value="model-settings">
          <AccordionTrigger>Configurações do Modelo</AccordionTrigger>
          <AccordionContent className="space-y-4">


            {/* Temperatura e Streaming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temperatura */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Temperatura</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getFieldValue('temperature', data.temperature)}
                    </Badge>
                  </div>
                </div>
                <input
                  type="range"
                  value={getFieldValue('temperature', data.temperature)}
                  onChange={(e) => handleChange("temperature", Number(e.target.value))}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Controla a criatividade (0.0 = preciso, 1.0 = criativo). Padrão: {DEFAULT_MODEL_CONFIG.temperature}
                </p>
              </div>

              {/* Streaming */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={getFieldValue('stream', data.stream)}
                    onCheckedChange={(checked) => handleChange("stream", checked)}
                  />
                  <Label>Streaming</Label>
                  <Badge variant="secondary" className="text-xs">
                    {getFieldValue('stream', data.stream) ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Respostas em tempo real. Padrão: {DEFAULT_MODEL_CONFIG.stream ? 'Ativado' : 'Desativado'}
                </p>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Max Tokens */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Máximo de Tokens</Label>
                    <Badge variant="outline" className="text-xs">
                      {getFieldValue('max_tokens', data.max_tokens)}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="32000"
                    step="100"
                    value={getFieldValue('max_tokens', data.max_tokens)}
                    onChange={(e) => handleChange("max_tokens", e.target.value ? Number(e.target.value) : DEFAULT_MODEL_CONFIG.max_tokens)}
                    placeholder={`Padrão: ${DEFAULT_MODEL_CONFIG.max_tokens}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Limite de tokens na resposta. Padrão: {DEFAULT_MODEL_CONFIG.max_tokens} (aprox. 3000 palavras)
                  </p>
                </div>

                {/* Top P */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Top P (Nucleus Sampling)</Label>
                    <Badge variant="outline" className="text-xs">
                      {getFieldValue('top_p', data.top_p)}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1"
                    value={getFieldValue('top_p', data.top_p)}
                    onChange={(e) => handleChange("top_p", e.target.value ? Number(e.target.value) : DEFAULT_MODEL_CONFIG.top_p)}
                    placeholder={`Padrão: ${DEFAULT_MODEL_CONFIG.top_p}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla diversidade de tokens considerados. Padrão: {DEFAULT_MODEL_CONFIG.top_p} (recomendado)
                  </p>
                </div>
              </div>
            </div>

          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
