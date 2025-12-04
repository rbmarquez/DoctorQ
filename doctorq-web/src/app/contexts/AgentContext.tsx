"use client";

import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { Agente } from "@/types/agentes";
import { storage } from "@/utils/storage";
import { useAuth } from "./AuthContext";

interface AgentContextType {
  selectedAgent: Agente | null;
  setSelectedAgent: (agent: Agente | null) => void;
  autoSelectFirstAgent: (agents: Agente[]) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<Agente | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  // Função para disparar atualização global
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Função personalizada para setSelectedAgent
  const handleSetSelectedAgent = useCallback((agent: Agente | null) => {
    setSelectedAgent(agent);

    // Atualizar idAgenteSelect no localStorage quando o agente for selecionado
    if (agent?.id_agente) {
      storage.setItem('idAgenteSelect', agent.id_agente);
    } else {
      storage.removeItem('idAgenteSelect');
    }
  }, [setSelectedAgent]);

  // Função para selecionar automaticamente o primeiro agente
  const autoSelectFirstAgent = useCallback((agents: Agente[]) => {
    if (agents.length > 0 && !selectedAgent) {
      const principalAgent = agents.find(agent => agent.st_principal === true);
      const agentToSelect = principalAgent || agents[0];
      handleSetSelectedAgent(agentToSelect);
    }
  }, [selectedAgent, handleSetSelectedAgent]);

  // Função para buscar agente principal da API
  const fetchPrincipalAgent = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/agentes', {
        headers: {
          'st-principal': 'true'
        }
      });

      if (!response.ok) {
        // Não logar erro se for 404 (agente não encontrado) ou 500 (endpoint não implementado)
        // Isso é esperado em alguns contextos (ex: página de agendamentos da clínica)
        if (response.status !== 404 && response.status !== 500) {
          console.warn('Aviso: Não foi possível buscar agente principal:', response.status);
        }
        return null;
      }

      const agentId = await response.text();
      return agentId;
    } catch (error) {
      // Erro de rede - silencioso, pois pode acontecer durante desenvolvimento
      return null;
    }
  }, []);

  // Verificar e buscar agente principal ao inicializar - só se usuário autenticado
  useEffect(() => {
    // Não executar se ainda estiver carregando ou usuário não autenticado
    if (isLoading || !isAuthenticated) {
      return;
    }

    const checkPrincipalAgent = async () => {
      // Verificar se já existe no localStorage
      const storedAgentId = storage.getItem('idAgenteSelect');

      if (!storedAgentId) {
        // Se não existe, buscar da API
        const principalAgentId = await fetchPrincipalAgent();

        if (principalAgentId) {
          // Salvar UUID no localStorage
          storage.setItem('idAgenteSelect', principalAgentId);
        }
      }
    };

    checkPrincipalAgent();
  }, [isAuthenticated, isLoading, fetchPrincipalAgent]); // Executar quando autenticação mudar



  const value = {
    selectedAgent,
    setSelectedAgent: handleSetSelectedAgent,
    autoSelectFirstAgent,
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}
