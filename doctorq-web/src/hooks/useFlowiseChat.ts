// src/hooks/useFlowiseChat.ts
import { useCallback, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseFlowiseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export const useFlowiseChat = (sessionId?: string): UseFlowiseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      // Cancela qualquer requisição anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const userMessageId = `user_${Date.now()}`;
      const assistantMessageId = `assistant_${Date.now()}`;

      // Adiciona a mensagem do usuário
      const userMessage: ChatMessage = {
        id: userMessageId,
        content: message,
        role: "user",
        timestamp: new Date(),
      };

      // Adiciona a mensagem do assistente (inicialmente vazia)
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat/flowise", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            sessionId: sessionId || `session_${Date.now()}`,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Não foi possível obter o reader da resposta");
        }

        const decoder = new TextDecoder();
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() === "") continue;

            try {
              const parsed = JSON.parse(line);

              if (parsed.type === "chunk") {
                accumulatedContent += parsed.content;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              } else if (parsed.type === "error") {
                throw new Error(parsed.content);
              }
            } catch (parseError) {
              console.warn("Erro ao fazer parse do chunk:", parseError);
            }
          }
        }

        // Marca como finalizado
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Requisição foi cancelada
        }

        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMessage);

        // Remove a mensagem do assistente em caso de erro
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
        );

        console.error("Erro no chat:", err);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, sessionId]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};
