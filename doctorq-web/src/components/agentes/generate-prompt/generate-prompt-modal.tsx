"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { PromptGeneratorForm } from "./prompt-generator-form";

interface GeneratePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromptGenerated: (prompt: string) => void;
  agenteNome?: string;
}

export function GeneratePromptModal({
  open,
  onOpenChange,
  onPromptGenerated,
  agenteNome,
}: GeneratePromptModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (formData: {
    descricao: string;
    contexto: string;
    tipo_agente: string;
  }) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/agentes/generate-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar prompt");
      }

      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      toast.success("Prompt gerado com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao gerar prompt. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success("Prompt copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar prompt");
    }
  };

  const handleUsePrompt = () => {
    onPromptGenerated(generatedPrompt);
    setGeneratedPrompt("");
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Gerar Prompt com IA
          </DialogTitle>
          <DialogDescription>
            Descreva o agente que deseja criar e nossa IA irá gerar um prompt personalizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedPrompt ? (
            <PromptGeneratorForm
              onSubmit={handleGenerate}
              isLoading={isGenerating}
              agenteNome={agenteNome}
            />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Prompt Gerado</Label>
                <div className="relative">
                  <Textarea
                    value={generatedPrompt}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="absolute top-2 right-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedPrompt("")}
                >
                  Gerar Novo
                </Button>
                <Button onClick={handleUsePrompt}>
                  Usar Este Prompt
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
