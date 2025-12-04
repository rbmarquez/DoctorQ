/**
 * Hook para chat com streaming SSE (Server-Sent Events)
 *
 * Permite comunicação em tempo real com o backend, recebendo
 * chunks de texto conforme são gerados pela IA.
 */

import { useState, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface SSEChunk {
  type: 'start' | 'chunk' | 'end' | 'error' | 'tool' | 'source';
  content: string;
  metadata?: any;
}

interface UseChatSSEOptions {
  onChunkReceived?: (chunk: string) => void;
  onComplete?: (fullMessage: string) => void;
  onError?: (error: Error) => void;
}

export function useChatSSE(options: UseChatSSEOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageIdRef = useRef<string>('');

  /**
   * Envia mensagem e recebe resposta via SSE
   */
  const sendMessage = useCallback(async (
    message: string,
    agentId: string,
    userId: string,
    conversationToken?: string
  ) => {
    // Cancelar stream anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Adicionar mensagem do usuário
    const userMessageId = `msg-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setCurrentStreamingMessage('');

    // Criar ID para mensagem do assistente
    const assistantMessageId = `msg-${Date.now() + 1}`;
    currentMessageIdRef.current = assistantMessageId;

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

      const response = await fetch(
        `${API_URL}/predictions/${agentId}?stream=true`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            message,
            user_id: userId,
            conversation_token: conversationToken || `conv-${Date.now()}`,
            stream: true,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      let fullMessage = '';
      let buffer = '';

      // Ler stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decodificar chunk
        buffer += decoder.decode(value, { stream: true });

        // Processar eventos SSE (formato: "data: {...}\n\n")
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Guardar último fragmento incompleto

        for (const event of events) {
          if (!event.trim() || !event.startsWith('data: ')) {
            continue;
          }

          try {
            // Extrair JSON do evento SSE
            const jsonStr = event.slice(6); // Remove "data: "
            const chunk: SSEChunk = JSON.parse(jsonStr);

            if (chunk.type === 'chunk' && chunk.content) {
              fullMessage += chunk.content;
              setCurrentStreamingMessage(fullMessage);

              if (options.onChunkReceived) {
                options.onChunkReceived(chunk.content);
              }
            } else if (chunk.type === 'error') {
              throw new Error(chunk.content);
            } else if (chunk.type === 'end') {
              // Mensagem completa
              if (options.onComplete) {
                options.onComplete(fullMessage);
              }
            }
          } catch (parseError) {
            console.error('Erro ao parsear chunk SSE:', parseError);
            // Continuar processando outros chunks
          }
        }
      }

      // Adicionar mensagem completa do assistente
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: fullMessage || 'Sem resposta',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentStreamingMessage('');
      setIsStreaming(false);

    } catch (error: any) {
      console.error('Erro no chat SSE:', error);

      if (error.name === 'AbortError') {
        console.log('Stream cancelado pelo usuário');
        return;
      }

      setIsStreaming(false);
      setCurrentStreamingMessage('');

      if (options.onError) {
        options.onError(error);
      }

      // Adicionar mensagem de erro
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Erro: ${error.message}`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  }, [options]);

  /**
   * Cancela o streaming atual
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentStreamingMessage('');
  }, []);

  /**
   * Limpa histórico de mensagens
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentStreamingMessage('');
  }, []);

  return {
    messages,
    sendMessage,
    isStreaming,
    currentStreamingMessage,
    cancelStream,
    clearMessages,
  };
}
