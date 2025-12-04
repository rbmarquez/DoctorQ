"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Save,
  X,
  FileText,
  Star,
  Cpu,
  Database,
  Eye,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useAgentesCustom } from "@/hooks/useAgentesCustom";
import { useCredenciais } from "@/lib/api/hooks/useCredenciais";
import { useTools } from "@/lib/api/hooks/useTools";
import { AgenteConfigFactory, TipoMemoria, type Agente, type AgenteConfig } from "@/types/agentes";

interface AgenteFormCompleteProps {
  agente?: Agente;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AgenteFormComplete({
  agente,
  onSuccess,
  onCancel,
}: AgenteFormCompleteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("basico");

  // Dados básicos
  const [nmAgente, setNmAgente] = useState(agente?.nm_agente || "");
  const [dsPrompt, setDsPrompt] = useState(agente?.ds_prompt || "");
  const [stPrincipal, setStPrincipal] = useState(agente?.st_principal || false);

  // Configuração do modelo
  const [config, setConfig] = useState<AgenteConfig>(
    agente?.ds_config || AgenteConfigFactory.createDefaultConfig()
  );

  const { createAgente, updateAgente } = useAgentesCustom();
  const { credenciais } = useCredenciais({ tipo: "llm", ativo: "S" });
  const { tools } = useTools({ ativo: "S" });

  // Sync form data when agente prop changes
  useEffect(() => {
    if (agente) {
      setNmAgente(agente.nm_agente || "");
      setDsPrompt(agente.ds_prompt || "");
      setStPrincipal(agente.st_principal || false);

      // Merge config com valores padrão para garantir que todos os campos existam
      const defaultConfig = AgenteConfigFactory.createDefaultConfig();
      const mergedConfig = {
        ...defaultConfig,
        ...agente.ds_config,
        model: {
          ...defaultConfig.model,
          ...(agente.ds_config?.model || {}),
        },
        memory: {
          ...defaultConfig.memory,
          ...(agente.ds_config?.memory || {}),
        },
        knowledge: {
          ...defaultConfig.knowledge,
          ...(agente.ds_config?.knowledge || {}),
        },
        tools: agente.ds_config?.tools || defaultConfig.tools,
      };

      setConfig(mergedConfig);
    }
  }, [agente]);

  const handleSubmit = async () => {
    if (!nmAgente.trim()) {
      toast.error("Nome do agente é obrigatório");
      return;
    }

    if (!dsPrompt.trim()) {
      toast.error("Prompt do agente é obrigatório");
      return;
    }

    if (!config.model.id_credencial) {
      toast.error("Selecione uma credencial LLM");
      return;
    }

    setIsLoading(true);

    try {
      const dataToSend = {
        nm_agente: nmAgente.trim(),
        ds_prompt: dsPrompt.trim(),
        ds_config: config,
        st_principal: stPrincipal,
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

  const updateModelConfig = (key: keyof AgenteConfig["model"], value: any) => {
    setConfig((prev) => ({
      ...prev,
      model: {
        ...prev.model,
        [key]: value,
      },
    }));
  };

  const updateMemoryConfig = (updates: Partial<AgenteConfig["memory"]>) => {
    setConfig((prev) => ({
      ...prev,
      memory: {
        ...prev.memory,
        ...updates,
      },
    }));
  };

  const updateObservabilityConfig = (ativo: boolean) => {
    setConfig((prev) => ({
      ...prev,
      observability: {
        ...prev.observability,
        ativo,
      },
    }));
  };

  const toggleTool = (toolId: string, toolName: string) => {
    setConfig((prev) => {
      const toolExists = prev.tools.some(t => t.id === toolId);

      if (toolExists) {
        // Remove tool
        return {
          ...prev,
          tools: prev.tools.filter(t => t.id !== toolId),
        };
      } else {
        // Adiciona tool
        return {
          ...prev,
          tools: [
            ...prev.tools,
            {
              id: toolId,
              nome: toolName,
              ativo: true,
              configuracao: {},
            },
          ],
        };
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {agente ? "Editar Agente" : "Novo Agente"}
          </DialogTitle>
          <DialogDescription>
            {agente
              ? "Modifique as informações do agente abaixo"
              : "Configure um novo agente de IA com modelo LLM, memória e ferramentas"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="modelo">Modelo LLM</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="memoria">Memória</TabsTrigger>
            <TabsTrigger value="avancado">Avançado</TabsTrigger>
          </TabsList>

          {/* Tab Básico */}
          <TabsContent value="basico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nm_agente">
                    Nome do Agente <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nm_agente"
                    placeholder="Ex: Assistente de Agendamentos"
                    value={nmAgente}
                    onChange={(e) => setNmAgente(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ds_prompt">
                    Prompt do Sistema <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="ds_prompt"
                    placeholder="Você é um assistente especializado em... Suas responsabilidades incluem..."
                    value={dsPrompt}
                    onChange={(e) => setDsPrompt(e.target.value)}
                    className="min-h-40 resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Define o comportamento, personalidade e instruções do agente (máx. 6000 caracteres)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="st_principal"
                      checked={stPrincipal}
                      onCheckedChange={(checked) => setStPrincipal(checked as boolean)}
                    />
                    <Label htmlFor="st_principal" className="text-sm font-normal flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Marcar como agente principal (exibido na home)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    O agente principal será automaticamente exibido no chatbot da página inicial para todos os usuários
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Modelo LLM */}
          <TabsContent value="modelo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Configuração do Modelo LLM
                </CardTitle>
                <CardDescription>
                  Configure o modelo de linguagem e parâmetros de geração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id_credencial">
                    Credencial LLM <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={config.model.id_credencial || ""}
                    onValueChange={(value) => updateModelConfig("id_credencial", value)}
                  >
                    <SelectTrigger id="id_credencial">
                      <SelectValue placeholder="Selecione uma credencial..." />
                    </SelectTrigger>
                    <SelectContent>
                      {credenciais.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhuma credencial cadastrada
                        </SelectItem>
                      ) : (
                        credenciais.map((cred) => (
                          <SelectItem key={cred.id_credencial} value={cred.id_credencial}>
                            {cred.nm_credencial} ({cred.ds_provedor || "N/A"})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Credencial com API key do provedor LLM (OpenAI, Azure OpenAI, Anthropic, etc.)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Temperatura: {config.model.temperature}
                    </Label>
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.model.temperature}
                      onChange={(e) => updateModelConfig("temperature", parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = Determinístico | 2 = Muito criativo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="top_p">
                      Top P: {config.model.top_p}
                    </Label>
                    <Input
                      id="top_p"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.model.top_p}
                      onChange={(e) => updateModelConfig("top_p", parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controla diversidade de respostas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_tokens">Max Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      min="100"
                      max="32000"
                      value={config.model.max_tokens}
                      onChange={(e) => updateModelConfig("max_tokens", parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (segundos)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      min="30"
                      max="600"
                      value={config.model.timeout || 300}
                      onChange={(e) => updateModelConfig("timeout", parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stream"
                    checked={config.model.stream}
                    onCheckedChange={(checked) => updateModelConfig("stream", checked as boolean)}
                  />
                  <Label htmlFor="stream" className="text-sm font-normal">
                    Habilitar streaming de respostas
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Tools */}
          <TabsContent value="tools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Ferramentas do Agente
                </CardTitle>
                <CardDescription>
                  Selecione quais ferramentas este agente poderá utilizar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tools.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma ferramenta cadastrada
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cadastre ferramentas na página de Tools primeiro
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Ferramentas permitem que o agente execute ações como consultar APIs, buscar informações, etc.
                    </p>
                    <div className="grid gap-2">
                      {tools.map((tool) => {
                        const isSelected = config.tools.some(t => t.id === tool.id_tool);
                        return (
                          <div
                            key={tool.id_tool}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? "bg-primary/5 border-primary"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Checkbox
                              id={`tool-${tool.id_tool}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleTool(tool.id_tool, tool.nm_tool)}
                            />
                            <Label
                              htmlFor={`tool-${tool.id_tool}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-medium">{tool.nm_tool}</div>
                              {tool.ds_tool && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {tool.ds_tool}
                                </div>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      {config.tools.length} ferramenta(s) selecionada(s)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Memória */}
          <TabsContent value="memoria" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Configuração de Memória
                </CardTitle>
                <CardDescription>
                  Configure como o agente mantém histórico de conversas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="memory_ativo"
                    checked={config.memory.ativo}
                    onCheckedChange={(checked) => updateMemoryConfig({ ativo: checked as boolean })}
                  />
                  <Label htmlFor="memory_ativo" className="text-sm font-normal">
                    Ativar memória de conversação
                  </Label>
                </div>

                {config.memory.ativo && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="memory_type">Tipo de Memória</Label>
                      <Select
                        value={config.memory.tipo || TipoMemoria.CONVERSATION_BUFFER}
                        onValueChange={(value) => updateMemoryConfig({ tipo: value as TipoMemoria })}
                      >
                        <SelectTrigger id="memory_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TipoMemoria.CONVERSATION_BUFFER}>
                            Buffer Simples
                          </SelectItem>
                          <SelectItem value={TipoMemoria.CONVERSATION_BUFFER_WINDOW}>
                            Janela Deslizante (últimas K mensagens)
                          </SelectItem>
                          <SelectItem value={TipoMemoria.CONVERSATION_SUMMARY}>
                            Resumo Automático
                          </SelectItem>
                          <SelectItem value={TipoMemoria.CONVERSATION_TOKEN_BUFFER}>
                            Buffer por Tokens
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {config.memory.tipo === TipoMemoria.CONVERSATION_BUFFER_WINDOW && (
                      <div className="space-y-2">
                        <Label htmlFor="memory_k">
                          Número de Mensagens (K)
                        </Label>
                        <Input
                          id="memory_k"
                          type="number"
                          min="1"
                          max="50"
                          value={config.memory.configuracao?.k || 5}
                          onChange={(e) =>
                            updateMemoryConfig({
                              configuracao: { k: parseInt(e.target.value) },
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Mantém as últimas {config.memory.configuracao?.k || 5} mensagens
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Avançado */}
          <TabsContent value="avancado" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Observabilidade
                </CardTitle>
                <CardDescription>
                  Monitoramento e rastreamento de conversas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="observability_ativo"
                    checked={config.observability?.ativo || false}
                    onCheckedChange={(checked) => updateObservabilityConfig(checked as boolean)}
                  />
                  <Label htmlFor="observability_ativo" className="text-sm font-normal">
                    Ativar observabilidade (Langfuse)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Rastreie e monitore todas as interações do agente em tempo real
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-between items-center gap-3 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {currentTab !== "basico" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const tabs = ["basico", "modelo", "tools", "memoria", "avancado"];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex > 0) setCurrentTab(tabs[currentIndex - 1]);
                }}
              >
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-3">
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
              disabled={isLoading || !nmAgente.trim() || !dsPrompt.trim()}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Salvando..." : agente ? "Atualizar" : "Criar Agente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
