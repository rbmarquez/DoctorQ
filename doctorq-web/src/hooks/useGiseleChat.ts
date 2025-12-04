// src/hooks/useGiseleChat.ts
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  chunks_usados?: string[];
  isHandoff?: boolean;
}

interface HandoffState {
  isTransferring: boolean;
  conversaId: string | null;
  posicaoFila: number | null;
  tempoEstimado: number | null;
}

interface UseGiseleChatReturn {
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  handoffState: HandoffState;
  sendMessage: (content: string) => Promise<void>;
  sendFeedback: (messageId: string, tipo: "positivo" | "negativo") => Promise<void>;
  initConversation: () => Promise<void>;
  clearConversation: () => void;
  requestHandoff: (motivo?: string) => Promise<void>;
}

// Padrões para detectar intenção de handoff
const HANDOFF_PATTERNS = [
  "falar com atendente",
  "falar com humano",
  "atendente humano",
  "atendimento humano",
  "quero falar com alguem",
  "quero falar com alguém",
  "pessoa real",
  "atendente real",
  "falar com pessoa",
  "falar com uma pessoa",
  "preciso de ajuda humana",
  "transferir para atendente",
  "transferir atendimento",
  "sair do bot",
  "nao quero falar com robo",
  "não quero falar com robô",
  "falar com suporte",
  "suporte humano",
  "atendente por favor",
  "me ajude de verdade",
  "voce é um robo",
  "você é um robô",
  "isso é um bot",
];

function detectarIntencaoHandoff(mensagem: string): boolean {
  const mensagemLower = mensagem.toLowerCase().trim();
  const mensagemNormalized = mensagemLower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const pattern of HANDOFF_PATTERNS) {
    const patternNormalized = pattern
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (mensagemNormalized.includes(patternNormalized)) {
      return true;
    }
  }

  return false;
}

export function useGiseleChat(): UseGiseleChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [handoffState, setHandoffState] = useState<HandoffState>({
    isTransferring: false,
    conversaId: null,
    posicaoFila: null,
    tempoEstimado: null,
  });

  // WebSocket ref para comunicação em tempo real após handoff
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para conectar ao WebSocket após handoff
  const connectWebSocket = useCallback((conversaId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") ||
      "ws://localhost:8080";

    const wsUrl = `${baseUrl}/ws/central-atendimento/chat/${conversaId}?role=contact&name=Visitante`;

    console.log("[Gisele Chat] Conectando WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[Gisele Chat] WebSocket conectado");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[Gisele Chat] Mensagem WS:", data);

        // Receber mensagem do atendente ou sistema
        if (data.type === "message") {
          const fromRole = data.data?.from?.role;

          // Processar mensagens de atendente ou sistema
          if (fromRole === "attendant" || fromRole === "system") {
            const newMessage: Message = {
              id: `ws-${Date.now()}`,
              content: data.data.content,
              role: fromRole === "system" ? "system" : "assistant",
              timestamp: new Date(data.data.timestamp || Date.now()),
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        }

        // Notificar quando atendente entrou
        if (data.type === "attendant_joined") {
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: `👤 **${data.data.name || "Atendente"}** entrou na conversa.`,
            role: "system",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, systemMessage]);
        }

        // Notificar fim de sessão
        if (data.type === "session_ended") {
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: `✅ Atendimento finalizado. ${data.data.reason || "Obrigado pelo contato!"}`,
            role: "system",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, systemMessage]);
          setHandoffState({
            isTransferring: false,
            conversaId: null,
            posicaoFila: null,
            tempoEstimado: null,
          });
        }
      } catch (error) {
        console.error("[Gisele Chat] Erro ao processar mensagem WS:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[Gisele Chat] Erro WebSocket:", error);
    };

    ws.onclose = () => {
      console.log("[Gisele Chat] WebSocket desconectado");
      // Tentar reconectar se ainda em handoff
      if (handoffState.isTransferring) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(conversaId);
        }, 3000);
      }
    };

    wsRef.current = ws;
  }, [handoffState.isTransferring]);

  // Função para enviar mensagem via WebSocket
  const sendWebSocketMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          data: {
            content,
            type: "text",
            message_id: `msg-${Date.now()}`,
          },
        })
      );
      return true;
    }
    return false;
  }, []);

  // Desconectar WebSocket ao limpar conversa
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnect");
      wsRef.current = null;
    }
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Inicializar conversa com Gisele (opcional - não bloqueia handoff)
  const initConversation = useCallback(async () => {
    try {
      const response = await fetch("/api/conversas/gisele", {
        method: "GET",
      });

      if (!response.ok) {
        // Não lança erro - apenas retorna null
        console.warn("AI Service não disponível - handoff direto disponível");
        return null;
      }

      const data = await response.json();
      setConversationId(data.id_conversa);
      return data.id_conversa;
    } catch (error) {
      // Silenciosamente ignora erro - o handoff ainda funciona
      console.warn("Erro ao inicializar conversa (AI Service offline?):", error);
      return null;
    }
  }, []);

  // Solicitar transferência para atendente humano
  const requestHandoff = useCallback(
    async (motivo?: string) => {
      // Se já está em transferência, ignorar
      if (handoffState.isTransferring) {
        return;
      }

      setIsLoading(true);

      try {
        // Preparar histórico de mensagens para contexto
        const historico = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        }));

        const response = await fetch("/api/handoff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_conversa_gisele: conversationId || null,
            ds_motivo: motivo || "Solicitação de atendimento humano",
            historico_mensagens: historico.length > 0 ? historico : undefined,
            tp_canal: "webchat",
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao transferir para atendente");
        }

        const data = await response.json();

        // Atualizar estado de handoff
        setHandoffState({
          isTransferring: true,
          conversaId: data.id_conversa,
          posicaoFila: data.nr_posicao_fila,
          tempoEstimado: data.tempo_estimado_minutos,
        });

        // Adicionar mensagem de sistema
        const handoffMessage: Message = {
          id: `handoff-${Date.now()}`,
          content: `🔄 **Transferindo para atendente humano**\n\n${data.mensagem}\n\n📍 Posição na fila: ${data.nr_posicao_fila || 1}\n⏱️ Tempo estimado: ${data.tempo_estimado_minutos || 5} minutos`,
          role: "system",
          timestamp: new Date(),
          isHandoff: true,
        };

        setMessages((prev) => [...prev, handoffMessage]);
        toast.success("Você será atendido em breve!");

        // Conectar ao WebSocket para receber mensagens do atendente
        connectWebSocket(data.id_conversa);
      } catch (error) {
        console.error("Erro ao solicitar handoff:", error);
        toast.error("Erro ao transferir para atendente. Tente novamente.");

        // Mensagem de erro
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content:
            "Desculpe, não consegui transferir para um atendente no momento. Por favor, tente novamente ou entre em contato pelo WhatsApp.",
          role: "assistant",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, messages, handoffState.isTransferring, connectWebSocket]
  );

  // Enviar mensagem
  const sendMessage = useCallback(
    async (content: string) => {
      // Se já transferiu para humano, enviar via WebSocket
      if (handoffState.isTransferring) {
        // Adicionar mensagem do usuário localmente
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content,
          role: "user",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Enviar via WebSocket
        const sent = sendWebSocketMessage(content);
        if (!sent) {
          toast.error("Erro ao enviar mensagem. Reconectando...");
          // Tentar reconectar
          if (handoffState.conversaId) {
            connectWebSocket(handoffState.conversaId);
          }
        }
        return;
      }

      let currentConversationId = conversationId;

      // Se não há conversa, tentar criar uma
      if (!currentConversationId) {
        currentConversationId = await initConversation();
      }

      // Adicionar mensagem do usuário imediatamente
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Verificar se é uma solicitação de handoff
      if (detectarIntencaoHandoff(content)) {
        // Mostrar mensagem de confirmação antes de transferir
        const confirmMessage: Message = {
          id: `confirm-${Date.now()}`,
          content:
            "Entendi que você gostaria de falar com um atendente humano. 👤\n\nVou transferir você agora mesmo! Aguarde um momento...",
          role: "assistant",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, confirmMessage]);

        // Iniciar handoff
        await requestHandoff(content);
        return;
      }

      // Se não há conversa (AI Service offline), oferecer handoff
      if (!currentConversationId) {
        const offlineMessage: Message = {
          id: `offline-${Date.now()}`,
          content:
            "Olá! No momento estou em manutenção. 🔧\n\nMas você pode falar diretamente com um de nossos atendentes! Clique em **'Falar com atendente'** ou digite: **falar com atendente**",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, offlineMessage]);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/conversas/${currentConversationId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            message: content,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao enviar mensagem");
        }

        // Processar SSE (Server-Sent Events)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let assistantMessage = "";
        const assistantMessageId = `assistant-${Date.now()}`;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  // Backend envia: { type: "content", content: "..." }
                  if (data.type === "content" && data.content) {
                    assistantMessage += data.content;

                    // Atualizar mensagem em tempo real
                    setMessages((prev) => {
                      const lastMessage = prev[prev.length - 1];
                      if (lastMessage?.id === assistantMessageId) {
                        return [
                          ...prev.slice(0, -1),
                          {
                            ...lastMessage,
                            content: assistantMessage,
                          },
                        ];
                      } else {
                        return [
                          ...prev,
                          {
                            id: assistantMessageId,
                            content: assistantMessage,
                            role: "assistant" as const,
                            timestamp: new Date(),
                          },
                        ];
                      }
                    });
                  }

                  // Backend envia: { type: "done", ... }
                  if (data.type === "done") {
                    break;
                  }
                } catch (e) {
                  // Ignorar erros de parsing
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        toast.error("Erro ao enviar mensagem. Tente novamente.");

        // Adicionar mensagem de erro
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content:
            "Desculpe, tive um problema técnico. 😅 Por favor, tente novamente ou digite **'falar com atendente'** para ser atendido por uma pessoa.",
          role: "assistant",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, initConversation, handoffState.isTransferring, handoffState.conversaId, requestHandoff, sendWebSocketMessage, connectWebSocket]
  );

  // Enviar feedback
  const sendFeedback = useCallback(
    async (messageId: string, tipo: "positivo" | "negativo") => {
      try {
        const response = await fetch("/api/conversas/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_mensagem: messageId,
            ds_tipo_feedback: tipo,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao enviar feedback");
        }

        toast.success(
          tipo === "positivo"
            ? "Obrigada pelo feedback! 💙"
            : "Vou melhorar! Obrigada pelo feedback."
        );
      } catch (error) {
        console.error("Erro ao enviar feedback:", error);
        // Não mostrar erro ao usuário (feedback é opcional)
      }
    },
    []
  );

  // Limpar conversa
  const clearConversation = useCallback(() => {
    disconnectWebSocket();
    setMessages([]);
    setConversationId(null);
    setHandoffState({
      isTransferring: false,
      conversaId: null,
      posicaoFila: null,
      tempoEstimado: null,
    });
  }, [disconnectWebSocket]);

  return {
    messages,
    isLoading,
    conversationId,
    handoffState,
    sendMessage,
    sendFeedback,
    initConversation,
    clearConversation,
    requestHandoff,
  };
}
