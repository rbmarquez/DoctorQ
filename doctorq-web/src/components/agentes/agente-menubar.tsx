"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgentes } from "@/hooks/useAgentes";
import { useAgent } from "@/app/contexts/AgentContext";
import { Agente } from "@/types/agentes";
import { Bot, Check, Zap, ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentMenuBarProps {
  selectedAgent?: Agente | null;
  onSelectAgent: (agent: Agente | null) => void;
  className?: string;
}

export function AgentMenuBar({ selectedAgent, onSelectAgent, className }: AgentMenuBarProps) {
  const { getAgentes, loading, refreshKey } = useAgentes();
  const { autoSelectFirstAgent, refreshTrigger } = useAgent();
  const [agents, setAgents] = useState<Agente[]>([]);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      try {
        setError(null);
        const agentes = await getAgentes();
        if (isMounted) {
          setAgents(agentes || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error("❌ Erro ao carregar agentes deployados:", error);
          setError("Erro ao carregar agentes");
          setAgents([]);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [getAgentes, refreshKey, refreshTrigger]);

  useEffect(() => {
    if (!loading && agents.length > 0 && !selectedAgent) {
      autoSelectFirstAgent(agents);
    }
  }, [agents, loading, autoSelectFirstAgent, selectedAgent]);

  const handleAgentSelect = (agent: Agente) => {
    onSelectAgent(agent);
  };

  const handleClearSelection = () => {
    onSelectAgent(null);
  };

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 min-w-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-2 sm:px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
            aria-label={selectedAgent ? `Agente selecionado: ${selectedAgent.nm_agente}` : "Selecionar agente"}
            disabled={loading}
          >
            {selectedAgent ? (
              <>
                <Bot className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm font-medium truncate max-w-[120px] lg:max-w-[200px]">
                  {selectedAgent.nm_agente}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
                  Selecionar agente
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-64 sm:w-72 bg-popover border border-border shadow-xl rounded-lg"
          sideOffset={8}
          align="start"
        >
          {loading ? (
            <DropdownMenuItem disabled className="text-muted-foreground px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <span className="text-sm">Carregando agentes...</span>
              </div>
            </DropdownMenuItem>
          ) : error ? (
            <DropdownMenuItem disabled className="text-destructive px-3 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{error}</span>
                  <span className="text-xs text-muted-foreground">
                    Tente novamente mais tarde
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ) : agents.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground px-3 py-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Nenhum agente disponível</span>
                <span className="text-xs text-muted-foreground">
                  Configure agentes na seção de Agentes
                </span>
              </div>
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onClick={handleClearSelection}
                className="cursor-pointer px-3 py-2 hover:bg-muted focus:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-popover-foreground">
                      Nenhum agente selecionado
                    </span>
                  </div>
                  {!selectedAgent && (
                    <Check className="h-3 w-3 text-primary flex-shrink-0" />
                  )}
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border my-1" />

              {agents.map((agent) => (
                <DropdownMenuItem
                  key={agent.id_agente}
                  onClick={() => handleAgentSelect(agent)}
                  className="cursor-pointer px-3 py-2 hover:bg-muted focus:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Bot className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-popover-foreground truncate">
                          {agent.nm_agente}
                        </span>                    
                      </div>
                    </div>
                    {selectedAgent?.id_agente === agent.id_agente && (
                      <Check className="h-3 w-3 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
