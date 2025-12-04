/**
 * Hook para WebSocket de Chat em Tempo Real
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface WebSocketMessage {
  type: "message" | "typing" | "user_joined" | "user_left" | "error" | "pong";
  data?: any;
  user_id?: string;
  conversa_id?: string;
  typing?: boolean;
  message?: string;
  timestamp?: string;
}

export interface ChatMessage {
  id_mensagem: string;
  id_conversa: string;
  id_user_remetente: string;
  ds_conteudo: string;
  ds_tipo: string;
  dt_criacao: string;
  st_lida: boolean;
}

export interface UseWebSocketOptions {
  userId: string;
  conversaId?: string;
  onMessage?: (message: ChatMessage) => void;
  onUserJoined?: (userId: string, conversaId: string) => void;
  onUserLeft?: (userId: string, conversaId: string) => void;
  onTyping?: (userId: string, conversaId: string, typing: boolean) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (conversaId: string, conteudo: string, tipo?: string) => void;
  sendTyping: (conversaId: string, typing: boolean) => void;
  joinConversation: (conversaId: string) => void;
  leaveConversation: (conversaId: string) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    userId,
    conversaId,
    onMessage,
    onUserJoined,
    onUserLeft,
    onTyping,
    onError,
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // CONNECT
  // ============================================================================

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.warn("WebSocket already connected");
      return;
    }

    try {
      const WS_URL =
        process.env.NEXT_PUBLIC_WS_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") ||
        "ws://localhost:8080";

      const url = conversaId
        ? `${WS_URL}/ws/chat/${userId}?conversa_id=${conversaId}`
        : `${WS_URL}/ws/chat/${userId}`;

      console.log("Connecting to WebSocket:", url);

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Start ping/pong para manter conexão viva
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000); // 30 segundos
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          console.log("WebSocket message received:", data);

          switch (data.type) {
            case "message":
              if (onMessage && data.data) {
                onMessage(data.data as ChatMessage);
              }
              break;

            case "typing":
              if (onTyping && data.user_id && data.conversa_id) {
                onTyping(data.user_id, data.conversa_id, data.typing ?? false);
              }
              break;

            case "user_joined":
              if (onUserJoined && data.user_id && data.conversa_id) {
                onUserJoined(data.user_id, data.conversa_id);
              }
              break;

            case "user_left":
              if (onUserLeft && data.user_id && data.conversa_id) {
                onUserLeft(data.user_id, data.conversa_id);
              }
              break;

            case "error":
              console.error("WebSocket error message:", data.message);
              if (onError) {
                onError(data.message || "Unknown error");
              } else {
                toast.error(data.message || "Erro no WebSocket");
              }
              break;

            case "pong":
              // Keepalive response, do nothing
              break;

            default:
              console.warn("Unknown WebSocket message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Tentar reconectar
        if (
          autoConnect &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("Max reconnect attempts reached");
          toast.error(
            "Não foi possível conectar ao servidor. Recarregue a página."
          );
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setIsConnected(false);
    }
  }, [
    userId,
    conversaId,
    onMessage,
    onUserJoined,
    onUserLeft,
    onTyping,
    onError,
    autoConnect,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

  // ============================================================================
  // DISCONNECT
  // ============================================================================

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // ============================================================================
  // RECONNECT
  // ============================================================================

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================

  const sendMessage = useCallback(
    (conversaId: string, conteudo: string, tipo: string = "texto") => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error("WebSocket not connected");
        toast.error("Não conectado ao servidor");
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: "message",
          conversa_id: conversaId,
          conteudo,
          tipo,
        })
      );
    },
    []
  );

  // ============================================================================
  // SEND TYPING
  // ============================================================================

  const sendTyping = useCallback((conversaId: string, typing: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        conversa_id: conversaId,
        typing,
      })
    );
  }, []);

  // ============================================================================
  // JOIN CONVERSATION
  // ============================================================================

  const joinConversation = useCallback((conversaId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "join",
        conversa_id: conversaId,
      })
    );
  }, []);

  // ============================================================================
  // LEAVE CONVERSATION
  // ============================================================================

  const leaveConversation = useCallback((conversaId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "leave",
        conversa_id: conversaId,
      })
    );
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, autoConnect]); // Only reconnect when userId changes

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    isConnected,
    sendMessage,
    sendTyping,
    joinConversation,
    leaveConversation,
    connect,
    disconnect,
    reconnect,
  };
}
