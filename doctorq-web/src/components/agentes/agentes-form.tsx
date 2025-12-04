// src/components/agentes/agentes-form.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  Save,
  X,
  FileText,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useAgentes } from "@/hooks/useAgentes";
import { AgenteConfigFactory, type Agente } from "@/types/agentes";

// Interface local para dados do formulário básico
interface AgenteFormData {
  nm_agente: string;
  ds_prompt: string;
  st_principal: boolean;
}

interface AgenteFormProps {
  agente?: Agente;
  onSuccess?: () => void;
  onCancel?: () => void;
}


export function AgenteForm({
  agente,
  onSuccess,
  onCancel,
}: AgenteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AgenteFormData>({
    nm_agente: agente?.nm_agente || "",
    ds_prompt: agente?.ds_prompt || "",
    st_principal: agente?.st_principal || false,
  });

  const { createAgente, updateAgente } = useAgentes();

  // Validação simples local
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validar campos
  useEffect(() => {
    const errors: Record<string, string> = {};

    if (!formData.nm_agente.trim()) {
      errors.nm_agente = "Nome do agente é obrigatório";
    }

    if (!formData.ds_prompt.trim()) {
      errors.ds_prompt = "Prompt do agente é obrigatório";
    }

    setValidationErrors(errors);
  }, [formData]);

  const handleSubmit = async () => {

    // Validar campos obrigatórios
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Por favor, corrija os erros nos campos antes de continuar");
      return;
    }

    setIsLoading(true);

    try {
      const dataToSend = {
        nm_agente: formData.nm_agente.trim(),
        ds_prompt: formData.ds_prompt.trim(),
        ds_config: AgenteConfigFactory.createDefaultConfig(),
        st_principal: formData.st_principal,
      };


      if (agente) {
        await updateAgente(agente.id_agente, dataToSend);
      } else {
        await createAgente(dataToSend);
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar agente:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AgenteFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };


  return (
    <Dialog open={true} onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {agente ? "Editar Agente" : "Novo Agente"}
          </DialogTitle>
          <DialogDescription>
            {agente
              ? "Modifique as informações do agente abaixo"
              : "Preencha as informações para criar um novo agente"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome do Agente */}
                <div className="space-y-2">
                  <Label htmlFor="nm_agente" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Nome do Agente
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nm_agente"
                    placeholder="Digite o nome do agente..."
                    value={formData.nm_agente}
                    onChange={(e) => handleInputChange("nm_agente", e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                {/* Agente Principal */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Configurações
                  </Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="st_principal"
                      checked={formData.st_principal}
                      onCheckedChange={(checked) => handleInputChange("st_principal", checked as boolean)}
                    />
                    <Label htmlFor="st_principal" className="text-sm font-normal">
                      Agente Principal
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Marca este agente como principal/prioritário
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prompt do Agente */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="ds_prompt" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Prompt do Agente
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="ds_prompt"
                  placeholder="Digite o prompt que define o comportamento do agente..."
                  value={formData.ds_prompt}
                  onChange={(e) => handleInputChange("ds_prompt", e.target.value)}
                  className={`min-h-32 resize-y mt-2 ${validationErrors.ds_prompt ? 'border-destructive focus:border-destructive' : ''
                    }`}
                />
                {validationErrors.ds_prompt && (
                  <p className="text-sm text-destructive">{validationErrors.ds_prompt}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Prompt principal que define o comportamento, personalidade e instruções do agente
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Salvando..." : (agente ? "Atualizar" : "Criar")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
