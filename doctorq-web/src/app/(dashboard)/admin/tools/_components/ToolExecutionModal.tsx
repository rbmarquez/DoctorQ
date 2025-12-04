"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Play, X } from "lucide-react";
import { toast } from "sonner";
import type { Tool } from "@/types/tools";

interface ToolExecutionModalProps {
  tool: Tool | null;
  open: boolean;
  onClose: () => void;
  onExecute: (toolId: string, parameters: Record<string, any>) => Promise<any>;
}

export function ToolExecutionModal({
  tool,
  open,
  onClose,
  onExecute,
}: ToolExecutionModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  if (!tool) return null;

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const result = await onExecute(tool.id_tool, parameters);
      setResult(result);
      toast.success("Tool executada com sucesso");
    } catch (error) {
      console.error("Erro ao executar tool:", error);
      setResult({ error: "Erro ao executar tool" });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setParameters({});
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-600" />
            Executar Tool: {tool.nm_tool}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros e execute a tool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-param">
                    Parâmetros de Teste (JSON)
                  </Label>
                  <Input
                    id="test-param"
                    placeholder='{"key": "value"}'
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value || "{}");
                        setParameters(parsed);
                      } catch {
                        // Ignora erro de parsing
                      }
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Digite um JSON com os parâmetros necessários para execução
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardContent className="pt-6">
                <Label>Resultado:</Label>
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto max-h-64 text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isExecuting}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? "Executando..." : "Executar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
