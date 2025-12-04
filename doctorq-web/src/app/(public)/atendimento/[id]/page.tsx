'use client';

/**
 * Página de Chat do Cliente (Atendimento)
 *
 * Simula a interface que o cliente veria ao acessar o atendimento.
 * URL: /atendimento/{id_conversa}
 *
 * Features:
 * - Conecta via WebSocket (role='contact')
 * - Exibe histórico de mensagens
 * - Recebe mensagens em tempo real
 * - Mostra links de vídeo clicáveis
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Video, Loader2, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWebSocketChat } from '@/lib/api/hooks/central-atendimento/useWebSocketChat';

interface Mensagem {
  id_mensagem: string;
  st_entrada: boolean;
  nm_remetente?: string;
  ds_conteudo: string;
  dt_criacao: string;
}

export default function AtendimentoClientePage() {
  const params = useParams();
  const idConversa = params.id as string;

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [mensagemInput, setMensagemInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket para chat em tempo real
  const {
    isConnected: wsConnected,
    sendMessage: wsSendMessage,
    startTyping,
    stopTyping,
  } = useWebSocketChat({
    conversaId: idConversa,
    role: 'contact',
    name: 'Cliente Teste',
    autoConnect: true,
    onMessage: useCallback((message: any) => {
      console.log('[Cliente] Nova mensagem via WebSocket:', message);
      // Recarregar mensagens quando receber via WebSocket
      carregarMensagens();
    }, []),
  });

  // Carregar mensagens do histórico
  const carregarMensagens = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${API_URL}/central-atendimento/conversas/${idConversa}/mensagens/?page_size=100`
      );

      if (!response.ok) throw new Error('Erro ao carregar mensagens');

      const data = await response.json();
      setMensagens(data.items || []);
      setCarregando(false);
    } catch (error) {
      console.error('[Cliente] Erro ao carregar mensagens:', error);
      setCarregando(false);
    }
  }, [idConversa]);

  // Carregar mensagens inicialmente
  useEffect(() => {
    carregarMensagens();
  }, [carregarMensagens]);

  // Polling de backup (caso WebSocket falhe)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!wsConnected) {
        console.log('[Cliente] WebSocket desconectado, usando polling...');
        carregarMensagens();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [wsConnected, carregarMensagens]);

  // Scroll para o final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Enviar mensagem
  const handleEnviar = async () => {
    if (!mensagemInput.trim() || enviando) return;

    setEnviando(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      await fetch(
        `${API_URL}/central-atendimento/conversas/${idConversa}/enviar/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tp_mensagem: 'text',
            ds_conteudo: mensagemInput,
          }),
        }
      );

      setMensagemInput('');
      await carregarMensagens();
    } catch (error) {
      console.error('[Cliente] Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  // Detectar link de vídeo na mensagem
  const detectarLinkVideo = (conteudo: string) => {
    const urlMatch = conteudo.match(/(https?:\/\/meet\.jit\.si\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-2 border-blue-200">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6" />
                <div>
                  <CardTitle className="text-xl">Atendimento DoctorQ</CardTitle>
                  <p className="text-sm text-blue-100 mt-1">
                    {wsConnected ? (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Conectado
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                        Reconectando...
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                ID: {idConversa.slice(0, 8)}
              </Badge>
            </div>
          </CardHeader>

          {/* Mensagens */}
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              {carregando ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : mensagens.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm mt-2">Envie uma mensagem para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mensagens.map((msg) => {
                    const videoUrl = detectarLinkVideo(msg.ds_conteudo);
                    const isEntrada = msg.st_entrada; // true = cliente enviou, false = recebeu

                    return (
                      <div
                        key={msg.id_mensagem}
                        className={`flex ${isEntrada ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            isEntrada
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                              : 'bg-white border-2 border-blue-200 text-gray-900'
                          }`}
                        >
                          {!isEntrada && msg.nm_remetente && (
                            <p className="text-xs font-semibold text-blue-600 mb-1">
                              {msg.nm_remetente}
                            </p>
                          )}

                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.ds_conteudo}
                          </p>

                          {/* Botão de vídeo se houver link */}
                          {videoUrl && (
                            <Button
                              onClick={() => window.open(videoUrl, '_blank', 'width=1024,height=768')}
                              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white gap-2"
                              size="sm"
                            >
                              <Video className="h-4 w-4" />
                              Entrar na Chamada de Vídeo
                            </Button>
                          )}

                          <p
                            className={`text-xs mt-2 ${
                              isEntrada ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {format(new Date(msg.dt_criacao), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="border-t-2 border-blue-200 p-4 bg-white">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={mensagemInput}
                  onChange={(e) => setMensagemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviar();
                    }
                  }}
                  onFocus={() => startTyping()}
                  onBlur={() => stopTyping()}
                  disabled={enviando}
                  className="flex-1 border-2 border-blue-200 focus:border-blue-500"
                />
                <Button
                  onClick={handleEnviar}
                  disabled={enviando || !mensagemInput.trim()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                >
                  {enviando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center mt-4 text-sm text-gray-600">
          <p>Esta é uma simulação da interface do cliente</p>
          <p className="text-xs mt-1">
            WebSocket: {wsConnected ? '🟢 Conectado' : '🟡 Reconectando'}
          </p>
        </div>
      </div>
    </div>
  );
}
