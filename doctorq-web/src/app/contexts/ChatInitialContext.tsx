"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { Agente } from "@/types/agentes";

export interface InitialChatData {
  message: string;
  processedFileContent?: string;
  hasFiles: boolean;
  selectedFiles?: any[]; // Incluir arquivos selecionados
  selectedAgent?: Agente | null; // Incluir agente selecionado
}

interface ChatInitialContextType {
  initialData: InitialChatData | null;
  setInitialData: (data: InitialChatData) => void;
  clearInitialData: () => void;
  consumeInitialData: () => InitialChatData | null; // Consome e limpa os dados
}

const ChatInitialContext = createContext<ChatInitialContextType | undefined>(
  undefined
);

export function ChatInitialProvider({ children }: { children: ReactNode }) {
  const [initialData, setInitialDataState] = useState<InitialChatData | null>(
    null
  );

  const setInitialData = (data: InitialChatData) => {
    setInitialDataState(data);
  };

  const clearInitialData = () => {
    setInitialDataState(null);
  };

  // Função que retorna os dados e os limpa automaticamente (padrão consume-once)
  const consumeInitialData = (): InitialChatData | null => {
    const data = initialData;
    setInitialDataState(null);
    return data;
  };

  const value = {
    initialData,
    setInitialData,
    clearInitialData,
    consumeInitialData,
  };

  return (
    <ChatInitialContext.Provider value={value}>
      {children}
    </ChatInitialContext.Provider>
  );
}

export function useChatInitial() {
  const context = useContext(ChatInitialContext);
  if (context === undefined) {
    throw new Error("useChatInitial must be used within a ChatInitialProvider");
  }
  return context;
}
