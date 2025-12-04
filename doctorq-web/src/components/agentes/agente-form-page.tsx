"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bot,
  ArrowLeft,
  Save,
  Wrench,
  Activity,
  HardDrive,
  Link,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { useAgentes } from "@/hooks/useAgentes";
import { useCredenciais } from "@/hooks/useCredenciais";
import { AgenteConfig, AgenteConfigFactory } from "@/types/agentes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AgentApiUrl } from "./agente-api-url";

// Importar seções do formulário
import { AgenteBasicSection } from "./sections/agente-basic-section";
import { AgenteToolsSection } from "./sections/agente-tools-section";
import { AgenteObservabilitySection } from "./sections/agente-observability-section";
import { AgenteMemorySection } from "./sections/agente-memory-section";
import { AgenteKnowledgeSection } from "./sections/agente-knowledge-section";
import { AgentDocumentStores } from "./agent-document-stores";

interface AgenteFormPageProps {
  agenteId?: string;
}

interface AgenteFormData {
  // Dados básicos
  nm_agente: string;
  ds_prompt: string;
  ds_config: AgenteConfig;
  st_principal: boolean;
}

const initialFormData: AgenteFormData = {
  nm_agente: "",
  ds_prompt: "",
  ds_config: AgenteConfigFactory.createDefaultConfig(),
  st_principal: false,
};

export function AgenteFormPage({ agenteId }: AgenteFormPageProps) {
  const router = useRouter();
  const { fetchAgenteById, createAgente, updateAgente, addToolToAgent } = useAgentes();
  const { fetchCredenciais } = useCredenciais();

  const [formData, setFormData] = useState<AgenteFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [showApiUrlDialog, setShowApiUrlDialog] = useState(false);
  const [currentAgente, setCurrentAgente] = useState<any>(null);
  const [showPrincipalConfirmDialog, setShowPrincipalConfirmDialog] = useState(false);
  const [pendingPrincipalValue, setPendingPrincipalValue] = useState(false);
  const [principalLoading, setPrincipalLoading] = useState(false);
  const [agentesParaValidacao, setAgentesParaValidacao] = useState<any[]>([]);

  useEffect(() => {
    if (agenteId) {
      setIsEditing(true);
      loadAgente();
    } else {
      // Pré-carregar credenciais para novo agente
      fetchCredenciais(1, "", "all", 100);
    }
  }, [agenteId, fetchCredenciais]);

  // Carregar lista de agentes para validação de agente principal
  useEffect(() => {
    if (isEditing) {
      // Carregar agentes para validação
      const loadAgentes = async () => {
        try {
          // Usar uma função simples para carregar agentes
          const response = await fetch('/api/agentes?size=100');
          if (response.ok) {
            const data = await response.json();
            setAgentesParaValidacao(data.items || []);
          }
        } catch (error) {
          console.warn('Erro ao carregar agentes para validação:', error);
        }
      };
      loadAgentes();
    }
  }, [isEditing]);

  const loadAgente = async () => {
    if (!agenteId) return;

    try {
      setLoading(true);

      // Carregar agente e credenciais em paralelo
      const [agente] = await Promise.all([
        fetchAgenteById(agenteId),
        fetchCredenciais(1, "", "all", 100) // Carregar todas as credenciais
      ]);

      // Converter tools do backend para o formato esperado pelo frontend
      const backendTools = agente.tools || [];
      const frontendTools = backendTools.map((tool: any) => ({
        id: tool.id_tool,
        nome: tool.nm_tool,
        ativo: true,
        configuracao: {}
      }));

      const validatedConfig = {
        tools: frontendTools,
        model: {
          id_credencial: agente.ds_config?.model?.id_credencial || "",
          temperature: agente.ds_config?.model?.temperature ?? 0.7,
          top_p: agente.ds_config?.model?.top_p ?? 0.95,
          max_tokens: agente.ds_config?.model?.max_tokens ?? 4000,
          stream: agente.ds_config?.model?.stream ?? true
        },
        observability: agente.ds_config?.observability || { ativo: false },
        memory: agente.ds_config?.memory || { ativo: false },
        api_key: agente.ds_config?.api_key || { idApiKey: "" },
        knowledge: agente.ds_config?.knowledge || { ativo: false, knowledges: [] }
      };


      setCurrentAgente(agente);
      setFormData({
        nm_agente: agente.nm_agente,
        ds_prompt: agente.ds_prompt,
        ds_config: validatedConfig,
        st_principal: agente.st_principal || false,
      });
    } catch (error) {
      toast.error("Erro ao carregar agente");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validações básicas
      if (!formData.nm_agente.trim()) {
        toast.error("Nome do agente é obrigatório");
        return;
      }

      if (!formData.ds_prompt.trim()) {
        toast.error("Prompt do agente é obrigatório");
        return;
      }

      // Validações do modelo
      if (!formData.ds_config?.model?.id_credencial) {
        toast.error("Seleção de modelo é obrigatória");
        return;
      }

      if (formData.ds_config?.model?.temperature === undefined || formData.ds_config.model.temperature === null) {
        toast.error("Temperatura do modelo é obrigatória");
        return;
      }

      if (formData.ds_config?.model?.top_p === undefined || formData.ds_config.model.top_p === null) {
        toast.error("Top P do modelo é obrigatório");
        return;
      }

      if (!formData.ds_config?.model?.max_tokens) {
        toast.error("Máximo de tokens é obrigatório");
        return;
      }

      const agenteData = {
        nm_agente: formData.nm_agente.trim(),
        ds_prompt: formData.ds_prompt.trim(),
        ds_config: formData.ds_config || AgenteConfigFactory.createDefaultConfig(),
        st_principal: formData.st_principal,
      };

      if (isEditing && agenteId) {
        await updateAgente(agenteId, agenteData);
        toast.success("Agente atualizado com sucesso!");
      } else {
        // Criar agente primeiro
        const newAgente = await createAgente(agenteData);

        // Se há tools selecionadas, adicioná-las ao agente recém-criado
        if (formData.ds_config?.tools && formData.ds_config.tools.length > 0) {
          try {
            for (const tool of formData.ds_config.tools) {
              await addToolToAgent(newAgente.id_agente, tool.id);
            }
            toast.success("Agente criado com sucesso e ferramentas adicionadas!");
          } catch (toolError) {
            console.error("Erro ao adicionar ferramentas:", toolError);
            toast.success("Agente criado com sucesso, mas houve erro ao adicionar algumas ferramentas");
          }
        } else {
          toast.success("Agente criado com sucesso!");
        }
      }

      router.push("/agentes");
    } catch (error) {
      toast.error(isEditing ? "Erro ao atualizar agente" : "Erro ao criar agente");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/agentes");
  };

  const handleShowApiUrl = () => {
    setShowApiUrlDialog(true);
  };

  const handlePrincipalChange = (checked: boolean) => {
    if (!isEditing || !agenteId) {
      // Para agentes novos, apenas atualizar o estado local
      setFormData(prev => ({ ...prev, st_principal: checked }));
      return;
    }

    // Se está tentando desativar um agente principal, verificar se é seguro
    if (!checked && formData.st_principal) {
      // Verificar se há outros agentes principais no sistema
      const outrosAgentesPrincipais = agentesParaValidacao.filter(
        agente => agente.id_agente !== agenteId && agente.st_principal
      );

      if (outrosAgentesPrincipais.length === 0) {
        toast.error("⚠️ Não é possível desativar o último agente principal. Marque outro agente como principal primeiro.", {
          duration: 6000,
          action: {
            label: "Entendi",
            onClick: () => { }
          }
        });
        return;
      }
    }

    // Para agentes existentes, mostrar modal de confirmação
    setPendingPrincipalValue(checked);
    setShowPrincipalConfirmDialog(true);
  };

  const confirmPrincipalChange = async () => {
    if (!isEditing || !agenteId) return;

    try {
      setPrincipalLoading(true);

      // Enviar todos os dados do agente com o novo valor de st_principal
      const agenteData = {
        nm_agente: formData.nm_agente,
        ds_prompt: formData.ds_prompt,
        ds_config: formData.ds_config,
        st_principal: pendingPrincipalValue,
      };

      await updateAgente(agenteId, agenteData);

      // Atualizar estado local
      setFormData(prev => ({ ...prev, st_principal: pendingPrincipalValue }));
      setCurrentAgente((prev: any) => ({ ...prev, st_principal: pendingPrincipalValue }));

      toast.success(
        pendingPrincipalValue
          ? "Agente marcado como principal com sucesso!"
          : "Agente desmarcado como principal com sucesso!"
      );

      setShowPrincipalConfirmDialog(false);
    } catch (error: any) {
      console.error("Erro ao alterar status principal:", error);

      // Tratamento de erro específico para o último agente principal
      let errorMessage = "Erro desconhecido ao alterar status principal";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      if (errorMessage.includes("último agente principal")) {
        toast.error("⚠️ Não é possível desativar o último agente principal. Deve existir pelo menos um agente principal no sistema.", {
          duration: 5000,
          action: {
            label: "Entendi",
            onClick: () => { }
          }
        });
      } else {
        toast.error(`Erro ao alterar status principal: ${errorMessage}`, {
          duration: 4000
        });
      }
    } finally {
      setPrincipalLoading(false);
    }
  };

  const handleApiKeyChange = async (apiKeyId: string) => {
    if (!isEditing || !agenteId) return;

    try {
      // const updatedConfig = {
      //   ...formData.ds_config,
      //   api_key: { idApiKey: apiKeyId }
      // };

      // setFormData(prev => ({
      //   ...prev,
      //   ds_config: updatedConfig
      // }));

      // setCurrentAgente((prev: any) => ({
      //   ...prev,
      //   ds_config: updatedConfig
      // }));

      // const agenteData = {
      //   nm_agente: formData.nm_agente,
      //   ds_prompt: formData.ds_prompt,
      //   ds_config: updatedConfig,
      //   st_principal: formData.st_principal,
      // };

      // await updateAgente(agenteId, agenteData);
      // toast.success("API Key atualizada com sucesso!");
    } catch (error) {
      // toast.error("Erro ao atualizar API Key");
    }
  };

  const updateFormData = (section: string, data: any) => {
    if (section === "nm_agente" || section === "ds_prompt") {
      setFormData(prev => ({
        ...prev,
        [section]: data,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        ds_config: {
          ...(prev.ds_config || AgenteConfigFactory.createDefaultConfig()),
          [section]: typeof data === "function" ? data(prev.ds_config?.[section as keyof typeof prev.ds_config]) : data,
        },
      }));
    }
  };

  const handleSectionSave = async (sectionName: string, sectionData: any) => {
    if (!isEditing || !agenteId) {
      toast.error("Só é possível salvar seções em agentes existentes");
      return;
    }

    try {
      setSectionLoading(prev => ({ ...prev, [sectionName]: true }));

      let agenteData;

      // Tratamento especial para seção básica que inclui campos raiz
      if (sectionName === "basic") {
        agenteData = {
          nm_agente: sectionData.nm_agente,
          ds_prompt: sectionData.ds_prompt,
          ds_config: sectionData.ds_config,
          st_principal: formData.st_principal,
        };
        // Atualizar estado local para seção básica
        setFormData({
          nm_agente: sectionData.nm_agente,
          ds_prompt: sectionData.ds_prompt,
          ds_config: sectionData.ds_config,
          st_principal: formData.st_principal,
        });
      } else {
        // Para outras seções, atualizar apenas a config
        const updatedFormData = {
          ...formData,
          ds_config: {
            ...(formData.ds_config || AgenteConfigFactory.createDefaultConfig()),
            [sectionName]: sectionData,
          },
        };

        agenteData = {
          nm_agente: formData.nm_agente,
          ds_prompt: formData.ds_prompt,
          ds_config: updatedFormData.ds_config,
          st_principal: formData.st_principal,
        };

        // Atualizar estado local
        setFormData(updatedFormData);
      }

      await updateAgente(agenteId, agenteData);
    } catch (error) {
      toast.error(`Erro ao salvar seção ${getSectionDisplayName(sectionName)}`);
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const getSectionDisplayName = (sectionName: string): string => {
    const names: Record<string, string> = {
      basic: "Configuração do Agente",
      model: "Modelo de IA",
      tools: "Tools",
      observability: "Observabilidade",
      memory: "Memória",
      knowledge: "Base de Conhecimento"
    };
    return names[sectionName] || sectionName;
  };

  if (loading && isEditing) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-2">Carregando agente...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar Agente" : "Novo Agente"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Switch Agente Principal */}
          <div className="flex items-center space-x-2">
            <Switch
              id="st_principal_header"
              checked={formData.st_principal}
              onCheckedChange={handlePrincipalChange}
              disabled={principalLoading}
            />
            <Label htmlFor="st_principal_header" className="flex items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 text-yellow-500" />
              Principal
              {principalLoading && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current ml-1" />
              )}
            </Label>
          </div>
          {isEditing && currentAgente && (
            <Button
              size="sm"
              onClick={handleShowApiUrl}
              className="gap-2"
              title="Ver API URL"
            >
              <Link className="h-4 w-4" />
              API URL
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Seção Básica - Informações do Agente + Modelo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configuração do Agente
              </CardTitle>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={() => handleSectionSave("basic", {
                    nm_agente: formData.nm_agente,
                    ds_prompt: formData.ds_prompt,
                    ds_config: formData.ds_config
                  })}
                  disabled={
                    sectionLoading.basic ||
                    !formData.nm_agente.trim() ||
                    !formData.ds_prompt.trim() ||
                    !formData.ds_config?.model?.id_credencial
                  }
                  className="gap-2"
                >
                  {sectionLoading.basic ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {sectionLoading.basic ? "Salvando..." : "Salvar Seção"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AgenteBasicSection
              data={{
                nm_agente: formData.nm_agente,
                ds_prompt: formData.ds_prompt,
                ds_config: formData.ds_config || AgenteConfigFactory.createDefaultConfig()
              }}
              onChange={(data) => {
                updateFormData("nm_agente", data.nm_agente);
                updateFormData("ds_prompt", data.ds_prompt);
                setFormData(prev => ({
                  ...prev,
                  ds_config: data.ds_config || prev.ds_config || AgenteConfigFactory.createDefaultConfig()
                }));
              }}
            />
          </CardContent>
        </Card>

        {/* Seção de Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tools (Ferramentas)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <AgenteToolsSection
              agentId={agenteId}
              selectedTools={formData.ds_config?.tools || []}
              onChange={(tools) => updateFormData("tools", tools)}
            />
          </CardContent>
        </Card>

        {/* Seção de Observabilidade */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Observabilidade
              </CardTitle>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={() => handleSectionSave("observability", formData.ds_config?.observability || { ativo: false })}
                  disabled={sectionLoading.observability}
                  className="gap-2"
                >
                  {sectionLoading.observability ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {sectionLoading.observability ? "Salvando..." : "Salvar Seção"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AgenteObservabilitySection
              data={formData.ds_config?.observability || { ativo: false }}
              onChange={(data) => updateFormData("observability", data)}
            />
          </CardContent>
        </Card>


        {/* Seção de Memória */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Memória
              </CardTitle>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={() => handleSectionSave("memory", formData.ds_config?.memory || { ativo: false })}
                  disabled={sectionLoading.memory}
                  className="gap-2"
                >
                  {sectionLoading.memory ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {sectionLoading.memory ? "Salvando..." : "Salvar Seção"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AgenteMemorySection
              data={formData.ds_config?.memory || { ativo: false }}
              onChange={(data) => updateFormData("memory", data)}
            />
          </CardContent>
        </Card>

        {/* Seção de Base de Conhecimento */}
        {/* <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Base de Conhecimento Vector
              </CardTitle>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={() => handleSectionSave("knowledge", formData.ds_config?.knowledge || { ativo: false, knowledges: [] })}
                  disabled={sectionLoading.knowledge}
                  className="gap-2"
                >
                  {sectionLoading.knowledge ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {sectionLoading.knowledge ? "Salvando..." : "Salvar Seção"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AgenteKnowledgeSection
              data={formData.ds_config?.knowledge || { ativo: false, knowledges: [] }}
              onChange={(data) => updateFormData("knowledge", data)}
            />
          </CardContent>
        </Card> */}

        {/* Document Stores (RAG) */}
        {isEditing && agenteId && (
          <AgentDocumentStores agentId={agenteId} />
        )}

        {/* Botões de Ação */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancelar
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.nm_agente.trim() ||
              !formData.ds_prompt.trim() ||
              !formData.ds_config?.model?.id_credencial
            }
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Salvando..." : (isEditing ? "Atualizar Agente" : "Criar Agente")}
          </Button>
        </div>
      </div>

      <Dialog open={showApiUrlDialog} onOpenChange={setShowApiUrlDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5 text-primary" />
              Use as API
            </DialogTitle>
          </DialogHeader>
          {currentAgente && (
            <AgentApiUrl
              agente={currentAgente}
              onApiKeyChange={handleApiKeyChange}
              isOpen={showApiUrlDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação para Agente Principal */}
      <Dialog open={showPrincipalConfirmDialog} onOpenChange={setShowPrincipalConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Confirmar Alteração
            </DialogTitle>
            <div className="space-y-3">
              {pendingPrincipalValue ? (
                <>
                  <div>
                    Tem certeza que deseja marcar <strong>{formData.nm_agente}</strong> como agente principal?
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="text-amber-800 text-sm font-medium">
                      ⚠️ Impacto desta ação:
                    </div>
                    <ul className="text-amber-700 text-sm mt-2 space-y-1">
                      <li>• Qualquer outro agente principal será automaticamente desmarcado</li>
                      <li>• Este agente se tornará o único agente principal do sistema</li>
                      <li>• Todas as operações prioritárias usarão este agente</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    Tem certeza que deseja remover <strong>{formData.nm_agente}</strong> como agente principal?
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-800 text-sm font-medium">
                      ⚠️ Restrições importantes:
                    </div>
                    <ul className="text-red-700 text-sm mt-2 space-y-1">
                      <li>• O sistema deve manter pelo menos um agente principal ativo</li>
                      <li>• Se este for o último agente principal, a operação será rejeitada</li>
                      <li>• Recomenda-se marcar outro agente como principal antes desta ação</li>
                    </ul>
                    {(() => {
                      const outrosAgentesPrincipais = agentesParaValidacao.filter(
                        agente => agente.id_agente !== agenteId && agente.st_principal
                      );
                      if (outrosAgentesPrincipais.length === 0) {
                        return (
                          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
                            <div className="text-red-800 text-xs font-semibold">
                              🚫 Operação bloqueada: Este é o único agente principal ativo
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                          <div className="text-green-800 text-xs font-semibold">
                            ✅ Operação permitida: Existem {outrosAgentesPrincipais.length} outro(s) agente(s) principal(is)
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPrincipalConfirmDialog(false)}
              disabled={principalLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmPrincipalChange}
              disabled={
                principalLoading ||
                (!pendingPrincipalValue && (() => {
                  const outrosAgentesPrincipais = agentesParaValidacao.filter(
                    agente => agente.id_agente !== agenteId && agente.st_principal
                  );
                  return outrosAgentesPrincipais.length === 0;
                })())
              }
              className="gap-2"
            >
              {principalLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Salvando...
                </>
              ) : !pendingPrincipalValue && (() => {
                const outrosAgentesPrincipais = agentesParaValidacao.filter(
                  agente => agente.id_agente !== agenteId && agente.st_principal
                );
                return outrosAgentesPrincipais.length === 0;
              })() ? (
                <>
                  <Star className="h-4 w-4" />
                  Operação Bloqueada
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
