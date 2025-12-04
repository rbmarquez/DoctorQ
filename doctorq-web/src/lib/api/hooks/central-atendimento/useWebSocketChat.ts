/**
 * Hook para WebSocket de Chat da Central de Atendimento
 *
 * Conecta ao endpoint /ws/central-atendimento/chat/{conversa_id}
 * Suporta:
 * - Mensagens em tempo real
 * - Indicador de digitação
 * - Presença de participantes
 * - Notificações de sistema
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type ChatEventType =
  | 'connected'
  | 'disconnected'
  | 'reconnected'
  | 'message'
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'typing_start'
  | 'typing_stop'
  | 'presence'
  | 'queue_position'
  | 'attendant_joined'
  | 'attendant_left'
  | 'session_started'
  | 'session_ended'
  | 'transferred'
  | 'error'
  | 'ping'
  | 'pong';

export interface ChatParticipant {
  connection_id: string;
  role: 'contact' | 'attendant' | 'bot' | 'system';
  name: string;
  online?: boolean;
  is_typing?: boolean;
}

export interface ChatMessage {
  from: {
    connection_id: string;
    role: string;
    name: string;
  };
  content: string;
  type: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface QueuePosition {
  position: number;
  total: number;
  message: string;
}

export interface WebSocketChatEvent {
  type: ChatEventType;
  data: unknown;
}

export interface UseWebSocketChatOptions {
  conversaId: string | null;
  token?: string;
  role?: 'attendant' | 'contact';
  name?: string;
  contactId?: string;
  autoConnect?: boolean;
  onMessage?: (message: ChatMessage) => void;
  onTypingStart?: (participantId: string, name: string) => void;
  onTypingStop?: (participantId: string) => void;
  onPresenceChange?: (participant: ChatParticipant) => void;
  onQueuePosition?: (position: QueuePosition) => void;
  onAttendantJoined?: (attendantId: string, name: string) => void;
  onSessionEnded?: (reason: string) => void;
  onError?: (error: string) => void;
}

export interface UseWebSocketChatReturn {
  isConnected: boolean;
  isConnecting: boolean;
  participants: ChatParticipant[];
  typingParticipants: string[];
  sendMessage: (content: string, type?: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  connect: () => void;
  disconnect: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useWebSocketChat(options: UseWebSocketChatOptions): UseWebSocketChatReturn {
  const {
    conversaId,
    token,
    role = 'attendant',
    name = '',
    contactId,
    autoConnect = true,
    onMessage,
    onTypingStart,
    onTypingStop,
    onPresenceChange,
    onQueuePosition,
    onAttendantJoined,
    onSessionEnded,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [typingParticipants, setTypingParticipants] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // ============================================================================
  // BUILD WS URL
  // ============================================================================

  const buildWsUrl = useCallback(() => {
    if (!conversaId) return null;

    const baseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') ||
      'ws://localhost:8080';

    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (role) params.append('role', role);
    if (name) params.append('name', name);
    if (contactId) params.append('contact_id', contactId);

    const queryString = params.toString();
    return `${baseUrl}/ws/central-atendimento/chat/${conversaId}${queryString ? `?${queryString}` : ''}`;
  }, [conversaId, token, role, name, contactId]);

  // ============================================================================
  // CONNECT
  // ============================================================================

  const connect = useCallback(() => {
    if (!conversaId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = buildWsUrl();
    if (!url) return;

    setIsConnecting(true);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WS Chat] Conectado:', conversaId);
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', data: {} }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketChatEvent = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('[WS Chat] Erro ao parsear mensagem:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS Chat] Erro:', error);
        setIsConnected(false);
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('[WS Chat] Desconectado:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Tentar reconectar
        if (autoConnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

          console.log(`[WS Chat] Reconectando em ${delay}ms (tentativa ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WS Chat] Erro ao criar conexão:', error);
      setIsConnecting(false);
    }
  }, [conversaId, buildWsUrl, autoConnect]);

  // ============================================================================
  // HANDLE MESSAGE
  // ============================================================================

  const handleMessage = useCallback(
    (event: WebSocketChatEvent) => {
      const { type, data } = event;

      switch (type) {
        case 'connected':
          console.log('[WS Chat] Conexão confirmada:', data);
          break;

        case 'message':
          if (onMessage && data) {
            onMessage(data as ChatMessage);
          }
          break;

        case 'typing_start':
          if (data && typeof data === 'object' && 'participant_id' in data) {
            const d = data as { participant_id: string; name?: string };
            setTypingParticipants((prev) => [...new Set([...prev, d.participant_id])]);
            onTypingStart?.(d.participant_id, d.name || '');
          }
          break;

        case 'typing_stop':
          if (data && typeof data === 'object' && 'participant_id' in data) {
            const d = data as { participant_id: string };
            setTypingParticipants((prev) => prev.filter((id) => id !== d.participant_id));
            onTypingStop?.(d.participant_id);
          }
          break;

        case 'presence':
          if (data && typeof data === 'object' && 'participant' in data) {
            const d = data as { participant: ChatParticipant };
            setParticipants((prev) => {
              const existing = prev.findIndex((p) => p.connection_id === d.participant.connection_id);
              if (d.participant.online === false) {
                return prev.filter((p) => p.connection_id !== d.participant.connection_id);
              }
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = d.participant;
                return updated;
              }
              return [...prev, d.participant];
            });
            onPresenceChange?.(d.participant);
          }
          break;

        case 'queue_position':
          if (onQueuePosition && data) {
            onQueuePosition(data as QueuePosition);
          }
          break;

        case 'attendant_joined':
          if (data && typeof data === 'object' && 'attendant_id' in data) {
            const d = data as { attendant_id: string; name: string };
            onAttendantJoined?.(d.attendant_id, d.name);
          }
          break;

        case 'session_ended':
          if (data && typeof data === 'object' && 'reason' in data) {
            const d = data as { reason: string };
            onSessionEnded?.(d.reason);
          }
          break;

        case 'error':
          if (data && typeof data === 'object' && 'message' in data) {
            const d = data as { message: string };
            console.error('[WS Chat] Erro:', d.message);
            onError?.(d.message);
            toast.error(d.message);
          }
          break;

        case 'pong':
          // Keepalive response
          break;

        default:
          console.log('[WS Chat] Evento não tratado:', type, data);
      }
    },
    [onMessage, onTypingStart, onTypingStop, onPresenceChange, onQueuePosition, onAttendantJoined, onSessionEnded, onError]
  );

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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setParticipants([]);
    setTypingParticipants([]);
  }, []);

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================

  const sendMessage = useCallback(
    (content: string, type: string = 'text') => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('[WS Chat] Não conectado');
        toast.error('Não conectado ao servidor');
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'message',
          data: {
            content,
            type,
            message_id: crypto.randomUUID(),
          },
        })
      );
    },
    []
  );

  // ============================================================================
  // TYPING INDICATORS
  // ============================================================================

  const startTyping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: 'typing_start', data: {} }));

    // Auto-stop após 3 segundos
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, []);

  const stopTyping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: 'typing_stop', data: {} }));

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-connect quando conversaId muda
  useEffect(() => {
    if (autoConnect && conversaId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [conversaId, autoConnect]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    isConnected,
    isConnecting,
    participants,
    typingParticipants,
    sendMessage,
    startTyping,
    stopTyping,
    connect,
    disconnect,
  };
}

export default useWebSocketChat;
