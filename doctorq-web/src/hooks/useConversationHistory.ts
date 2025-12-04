import { Message } from "@/types/chat";
import { useCallback, useState } from "react";

interface ChatMessage {
  id_chat_message: string;
  id_agent: string;
  id_conversation: string;
  tools?: string;
  nm_text: string;
  nm_tipo: string;
  dt_criacao: string;
}

interface UseConversationHistoryReturn {
  loadConversationHistory: (conversationToken: string) => Promise<Message[]>;
  loading: boolean;
  error: string | null;
}

export const useConversationHistory = (): UseConversationHistoryReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversationHistory = useCallback(
    async (conversationToken: string): Promise<Message[]> => {
      setLoading(true);
      setError(null);

      try {
        // Buscar mensagens da conversa através da API route interna
        const messagesResponse = await fetch(
          `/api/agentes/conversation/${conversationToken}/messages`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!messagesResponse.ok) {
          if (messagesResponse.status === 404) {
            // Conversa não existe ou não tem mensagens ainda

            return [];
          }
          const errorData = await messagesResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            `Erro ao buscar mensagens: ${messagesResponse.status}`
          );
        }

        const messagesData: ChatMessage[] = await messagesResponse.json();

        // Converter mensagens do backend para o formato do frontend
        const convertedMessages: Message[] = messagesData.map((msg, index) => ({
          id: index + 1,
          text: msg.nm_text,
          sender: msg.nm_tipo === "userMessage" ? "user" : "bot",
          timestamp: new Date(msg.dt_criacao).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          tools: msg.tools ? [msg.tools] : undefined,
        }));

        return convertedMessages;
      } catch (err) {
        console.error("❌ Erro ao carregar histórico:", {
          error: err,
          message: err instanceof Error ? err.message : "Erro desconhecido",
          conversationToken,
          timestamp: new Date().toISOString(),
        });

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar histórico";
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loadConversationHistory,
    loading,
    error,
  };
};
