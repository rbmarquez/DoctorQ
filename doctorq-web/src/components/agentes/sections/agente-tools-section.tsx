"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SelectWithInput, SelectWithInputOption } from "@/components/ui/select-with-input";
import { X, Edit } from "lucide-react";
import { useTools } from "@/hooks/useTools";
import { useAgentes } from "@/hooks/useAgentes";
import type { Tool } from "@/types/tools";
import { ToolForm } from "@/components/tools/tool-form";
import { ToolConfig } from "@/types/agentes";
import { toast } from "sonner";

interface AgenteToolsSectionProps {
  agentId?: string;
  selectedTools?: ToolConfig[];
  onChange: (tools: ToolConfig[]) => void;
}

export function AgenteToolsSection({ agentId, selectedTools, onChange }: AgenteToolsSectionProps) {
  const { tools, loading, fetchTools } = useTools();
  const { addToolToAgent, removeToolFromAgent } = useAgentes();

  // Garantir que selectedTools seja sempre um array
  const safeSelectedTools = selectedTools || [];
  const [currentConfig, setCurrentConfig] = useState<ToolConfig>({
    id: "",
    nome: "",
    ativo: true,
    configuracao: {}
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  // Debounce e cancelamento de requisições
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Estados para busca (usando fetch direto)
  const [searchResults, setSearchResults] = useState<Tool[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");

  // Proteção contra chamadas duplicadas
  const [addingTool, setAddingTool] = useState<string | null>(null);

  useEffect(() => {
    // Carregar apenas 3 tools iniciais
    fetchTools(1, "", undefined, true, 10);

    // Cleanup: cancelar requisições pendentes e limpar timeouts
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTools]);

  // As tools do agente agora vêm junto com o objeto do agente
  // Não é necessário carregá-las separadamente


  const handleRemoveTool = async (toolId: string) => {
    try {
      // Remover da lista local imediatamente para melhor UX
      const originalTools = [...safeSelectedTools];
      onChange(safeSelectedTools.filter(t => t.id !== toolId));

      // Se estiver no modo edição, sincronizar com a API em background
      if (agentId) {
        try {
          await removeToolFromAgent(agentId, toolId);
        } catch (apiError) {
          // Se a API falhar, restaurar a lista local
          onChange(originalTools);
          console.error("Erro ao sincronizar com API:", apiError);
          // O toast de erro já é exibido pelo hook useAgentes
        }
      }
    } catch (error) {
      console.error("Erro ao remover tool:", error);
      toast.error("Erro ao remover tool");
    }
  };

  const handleSelectTool = (toolId: string) => {
    if (!toolId) {
      setCurrentConfig({
        id: "",
        nome: "",
        ativo: true,
        configuracao: {}
      });
      return;
    }

    // Buscar a tool nos resultados da busca ou na lista carregada
    // Deduplicar tools por id_tool para evitar chaves duplicadas
    const allToolsMap = new Map();
    [...tools, ...searchResults].forEach(tool => {
      allToolsMap.set(tool.id_tool, tool);
    });
    const allTools = Array.from(allToolsMap.values());
    const tool = allTools.find(t => t.id_tool === toolId);

    if (tool) {
      // Verificar se a tool já não foi adicionada
      const isAlreadyAdded = safeSelectedTools.some(t => t.id === tool.id_tool);

      // Verificar se já está sendo adicionada (proteção contra duplicatas)
      if (addingTool === tool.id_tool) {
        return;
      }

      if (!isAlreadyAdded) {
        // Adicionar automaticamente à lista
        const newToolConfig = {
          id: tool.id_tool,
          nome: tool.nm_tool,
          ativo: true,
          configuracao: {}
        };

        // Adicionar à lista local imediatamente
        onChange([...safeSelectedTools, newToolConfig]);

        // Se estiver no modo edição, sincronizar com a API em background
        if (agentId) {
          // Marcar como sendo adicionada
          setAddingTool(tool.id_tool);

          // Validar se os IDs são válidos
          if (!agentId || !tool.id_tool) {
            console.error("IDs inválidos:", { agentId, toolId: tool.id_tool });
            toast.error("IDs inválidos para adicionar tool");
            setAddingTool(null);
            return;
          }

          // Validar formato UUID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(agentId) || !uuidRegex.test(tool.id_tool)) {
            console.error("IDs não são UUIDs válidos:", { agentId, toolId: tool.id_tool });
            toast.error("IDs não são UUIDs válidos");
            setAddingTool(null);
            return;
          }

          addToolToAgent(agentId, tool.id_tool)
            .then(() => {
              setAddingTool(null);
            })
            .catch(error => {
              console.error("Erro ao sincronizar com API:", error);

              // Verificar se é erro de tool já associada
              if (error.message.includes("já está associada")) {
                toast.success("Tool já está associada ao agente");
                // Não remover da lista local se já está associada
              } else {
                toast.error("Erro ao adicionar tool ao agente");
                // Se a API falhar, remover da lista local
                onChange(safeSelectedTools.filter(t => t.id !== tool.id_tool));
              }

              setAddingTool(null);
            });
        }
      }

      // Limpar a seleção atual
      setCurrentConfig({
        id: "",
        nome: "",
        ativo: true,
        configuracao: {}
      });
    }
  };

  // Função interna para fazer a busca real
  const performSearch = useCallback(async (searchTerm: string) => {
    setSearchLoading(true);
    try {
      const searchQuery = searchTerm.trim() || "";
      const response = await fetch(`/api/tools?page=1&size=3&search=${encodeURIComponent(searchQuery)}&order_by=dt_criacao&order_desc=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.items || []);
        setCurrentPage(1);
        setHasMore(result.meta?.totalPages > 1);
      } else {
        console.error("Erro na pesquisa da API:", response.status, response.statusText);
        setSearchResults([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Erro ao pesquisar na API:", error);
      setSearchResults([]);
      setHasMore(false);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Função com debounce para ser chamada pelo componente
  const handleSearch = useCallback((searchTerm: string) => {
    // Atualizar termo de busca atual
    setCurrentSearchTerm(searchTerm);

    // Limpar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Configurar novo timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);
  }, [performSearch]);

  const handleLoadMore = async () => {
    if (!hasMore || searchLoading) return;

    setSearchLoading(true);
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(`/api/tools?page=${nextPage}&size=3&search=&order_by=dt_criacao&order_desc=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSearchResults(prev => [...prev, ...(result.items || [])]);
        setCurrentPage(nextPage);
        setHasMore(result.meta?.totalPages > nextPage);
      }
    } catch (error) {
      console.error("Erro ao carregar mais tools:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEditTool = (toolId: string) => {
    const tool = tools.find(t => t.id_tool === toolId);

    if (tool) {
      setEditingTool(tool);
      setEditModalOpen(true);
    }
  };

  const handleSaveEdit = () => {
    // Após salvar a tool, atualizar a lista
    fetchTools();
    setEditModalOpen(false);
    setEditingTool(null);
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingTool(null);
  };

  // Usar resultados da busca se houver, senão usar tools carregadas
  // Deduplicar tools para evitar chaves duplicadas no React
  const deduplicateTools = (toolsList: Tool[]) => {
    const toolsMap = new Map();
    toolsList.forEach(tool => {
      toolsMap.set(tool.id_tool, tool);
    });
    return Array.from(toolsMap.values());
  };

  // Se há termo de busca, sempre usar searchResults (mesmo se vazio)
  // Se não há termo de busca, usar tools carregadas
  const toolsToShow = currentSearchTerm.trim() 
    ? deduplicateTools(searchResults) 
    : deduplicateTools(tools);

  // Filtrar tools já selecionadas
  const availableTools = toolsToShow.filter(tool => !safeSelectedTools.some(t => t.id === tool.id_tool));

  // Sempre permitir busca - nunca desabilitar o campo
  const isDisabled = false;

  // Verificar se alguma tool está sendo adicionada
  const isAddingAnyTool = addingTool !== null;

  return (
    <div className="space-y-4">
      {/* Tool Configuration Form */}
      <div className="space-y-4 border rounded-lg p-4">
        {/* Tool Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Ferramentas
            </Label>
            <Badge variant="outline" className="h-6 min-w-[24px] flex items-center justify-center">
              {safeSelectedTools.length}
            </Badge>
          </div>

          <SelectWithInput
            options={availableTools.map((tool) => ({
              value: tool.id_tool,
              label: tool.nm_tool,
            }))}
            value={currentConfig.id}
            onValueChange={() => { }} // Não fazer nada aqui
            onSelect={handleSelectTool}
            onSearch={handleSearch}
            onLoadMore={handleLoadMore}
            placeholder={loading ? "Carregando tools..." : isAddingAnyTool ? "Adicionando tool..." : "Selecione uma tool..."}
            searchPlaceholder="Buscar tool..."
            emptyText="Digite para buscar tools..."
            loading={loading || searchLoading}
            disabled={isDisabled}
            hasMore={hasMore}
          />
        </div>
      </div>

      {/* Tool Selection Info */}
      <div className="text-sm text-muted-foreground text-center">
        Selecione uma tool para adicioná-la automaticamente à lista
      </div>

      {/* Selected Tools List */}
      {safeSelectedTools.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-2">
            {safeSelectedTools.map(toolConfig => {
              const tool = tools.find(t => t.id_tool === toolConfig.id);
              return (
                <div key={toolConfig.id} className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50" onClick={() => handleEditTool(toolConfig.id)}>
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {toolConfig.nome || tool?.nm_tool || toolConfig.id}
                      <Badge variant={toolConfig.ativo ? "default" : "secondary"} className="text-xs">
                        {toolConfig.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Object.keys(toolConfig.configuracao || {}).length > 0
                        ? `Configurações: ${Object.keys(toolConfig.configuracao || {}).join(", ")}`
                        : "Sem configurações personalizadas"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTool(toolConfig.id);
                      }}
                      className="h-8 w-8 p-0 rounded-full"
                      title="Editar Tool"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTool(toolConfig.id);
                      }}
                      className="h-8 w-8 p-0 rounded-full"
                      title="Desvincular Tool"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Edição com ToolForm */}
      {editModalOpen && editingTool && (
        <ToolForm
          tool={editingTool}
          onSuccess={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}
