'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useCentralAtendimento, ConversaOmni, ContatoOmni, MensagemOmni } from '@/lib/api/hooks/central-atendimento/useCentralAtendimento';
import { useWebSocketChat, ChatMessage } from '@/lib/api/hooks/central-atendimento/useWebSocketChat';
import { NovaConversaDialog } from './NovaConversaDialog';
import { TypingIndicator, TypingBubble } from './TypingIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  Search,
  X,
  PhoneCall,
  Mail,
  Calendar,
  Plus,
  Paperclip,
  Video,
  MoreVertical,
  Star,
  Archive,
  ChevronLeft,
  ChevronRight,
  History,
  Info,
  CalendarDays,
  UserCircle,
  MessageCircle,
  Instagram,
  Facebook,
  Bot,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Ícones para cada canal
const CanalIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  whatsapp: Phone,
  instagram: Instagram,
  facebook: Facebook,
  telegram: Send,
  email: Mail,
  chat_web: MessageCircle,
  sms: MessageSquare,
};

// Cores para cada canal
const CanalColors: Record<string, string> = {
  whatsapp: 'bg-green-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-blue-500',
  facebook: 'bg-blue-600',
  telegram: 'bg-sky-500',
  email: 'bg-gray-500',
  chat_web: 'bg-primary',
  sms: 'bg-amber-500',
};

// API Key para WebSocket (fallback quando não há sessão)
const WS_API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX';

export function CentralAtendimentoLayout() {
  // Obter sessão do usuário para autenticação WebSocket
  const { data: session } = useSession();

  const {
    conversas,
    contatos,
    isLoading,
    error,
    useMensagens,
    enviarMensagem,
    buscarContato,
    criarConversa,
    criarContato,
    buscarContatos,
    mutateConversas,
    fecharConversa,
    transferirParaHumano,
    favoritarConversa,
    iniciarVideo,
  } = useCentralAtendimento();

  // Token para WebSocket: usar sessão ou API key
  const wsToken = session?.user?.accessToken || WS_API_KEY;

  const [conversaSelecionada, setConversaSelecionada] = useState<ConversaOmni | null>(null);
  const [mensagemInput, setMensagemInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contatoInfo, setContatoInfo] = useState<ContatoOmni | null>(null);
  const [novaConversaOpen, setNovaConversaOpen] = useState(false);
  const [infoColapsed, setInfoColapsed] = useState(false);
  const [filtroCanal, setFiltroCanal] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memoizar contatos para evitar re-renders no NovaConversaDialog
  const contatosMemo = useMemo(() => contatos, [contatos]);

  // Handler para criar conversa e selecionar
  const handleCriarConversa = useCallback(async (dados: Parameters<typeof criarConversa>[0]) => {
    const conversa = await criarConversa(dados);
    setConversaSelecionada(conversa);
  }, [criarConversa]);

  // Buscar mensagens da conversa selecionada
  const { mensagens, mutate: mutateMensagens, isLoading: mensagensLoading } = useMensagens(
    conversaSelecionada?.id_conversa || null
  );

  // Ref para controlar digitação
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasTypingRef = useRef(false);

  // WebSocket para chat em tempo real
  const {
    isConnected: wsConnected,
    typingParticipants,
    sendMessage: wsSendMessage,
    startTyping,
    stopTyping,
  } = useWebSocketChat({
    conversaId: conversaSelecionada?.id_conversa || null,
    role: 'attendant',
    token: wsToken,  // Token de autenticação para atendentes
    onMessage: useCallback((message: ChatMessage) => {
      // Quando receber mensagem via WebSocket, atualizar lista
      mutateMensagens();
      mutateConversas();
    }, [mutateMensagens, mutateConversas]),
    onTypingStart: useCallback((participantId: string, name?: string) => {
      // Mostrar indicador de digitando (já gerenciado pelo hook)
    }, []),
    onTypingStop: useCallback((participantId: string) => {
      // Ocultar indicador de digitando (já gerenciado pelo hook)
    }, []),
  });

  // Handler para controlar eventos de digitação
  const handleInputChange = useCallback((value: string) => {
    setMensagemInput(value);

    // Se começou a digitar e não estava digitando
    if (value.length > 0 && !wasTypingRef.current) {
      wasTypingRef.current = true;
      startTyping();
    }

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Se parou de digitar por 2 segundos, enviar stop
    typingTimeoutRef.current = setTimeout(() => {
      if (wasTypingRef.current) {
        wasTypingRef.current = false;
        stopTyping();
      }
    }, 2000);

    // Se apagou tudo, parar de digitar imediatamente
    if (value.length === 0 && wasTypingRef.current) {
      wasTypingRef.current = false;
      stopTyping();
    }
  }, [startTyping, stopTyping]);

  // Scroll para o final quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Buscar info do contato quando conversa é selecionada
  useEffect(() => {
    if (conversaSelecionada?.id_contato) {
      buscarContato(conversaSelecionada.id_contato)
        .then(setContatoInfo)
        .catch(() => setContatoInfo(null));
    } else {
      setContatoInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversaSelecionada?.id_contato]); // Removi buscarContato das dependências para evitar loop infinito

  // Filtrar conversas pela busca, canal e status
  const conversasFiltradas = useMemo(() => {
    return conversas.filter(c => {
      // Se não há termo de busca, todas passam; se há, filtra por nome ou telefone
      const matchSearch = !searchTerm.trim() ||
        c.contato?.nm_contato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contato?.nr_telefone?.includes(searchTerm);
      const matchCanal = filtroCanal === 'todos' || c.tp_canal === filtroCanal;
      const matchStatus = filtroStatus === 'todos' ||
        (filtroStatus === 'aguardando' && c.st_aguardando_humano) ||
        (filtroStatus === 'bot' && c.st_bot_ativo && !c.st_aguardando_humano) ||
        (filtroStatus === 'ativas' && c.st_aberta);
      return matchSearch && matchCanal && matchStatus;
    });
  }, [conversas, searchTerm, filtroCanal, filtroStatus]);

  // Enviar mensagem
  const handleEnviar = async () => {
    if (!mensagemInput.trim() || !conversaSelecionada || enviando) return;

    // Parar de digitar antes de enviar
    if (wasTypingRef.current) {
      wasTypingRef.current = false;
      stopTyping();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setEnviando(true);
    try {
      await enviarMensagem(conversaSelecionada.id_conversa, {
        tp_mensagem: 'texto',
        ds_conteudo: mensagemInput,
      });
      setMensagemInput('');
      await mutateMensagens();
      await mutateConversas();
    } catch (error) {
      console.error('Erro ao enviar:', error);
    } finally {
      setEnviando(false);
    }
  };

  // Formatar data relativa
  const formatarData = (data: string | undefined) => {
    if (!data) return '';
    try {
      return formatDistanceToNow(new Date(data), { addSuffix: true, locale: ptBR });
    } catch {
      return '';
    }
  };

  // Formatar data completa
  const formatarDataCompleta = (data: string | undefined) => {
    if (!data) return '';
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  // Obter iniciais do nome
  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Badge de status da conversa
  const getStatusBadge = (conversa: ConversaOmni) => {
    if (conversa.st_aguardando_humano) {
      return (
        <Badge variant="destructive" className="gap-1 text-[10px]">
          <AlertCircle className="h-3 w-3" />
          Aguardando
        </Badge>
      );
    }
    if (conversa.st_bot_ativo) {
      return (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <Bot className="h-3 w-3" />
          Bot
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-[10px]">
        <MessageSquare className="h-3 w-3" />
        Ativa
      </Badge>
    );
  };

  // Badge do canal
  const getCanalBadge = (canal: string) => {
    const Icon = CanalIcons[canal] || MessageSquare;
    const color = CanalColors[canal] || 'bg-gray-500';
    return (
      <Badge className={`${color} text-white text-[10px] gap-1`}>
        <Icon className="h-3 w-3" />
        {canal.replace('_', ' ')}
      </Badge>
    );
  };

  // Ícone de status da mensagem
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'lida':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'entregue':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'enviada':
        return <Check className="h-3 w-3 text-gray-400" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  // Handler para fechar conversa
  const handleFecharConversa = async () => {
    if (!conversaSelecionada) return;
    try {
      await fecharConversa(conversaSelecionada.id_conversa);
      setConversaSelecionada(null);
    } catch (error) {
      console.error('Erro ao fechar conversa:', error);
    }
  };

  // Handler para transferir para humano
  const handleTransferirHumano = async () => {
    if (!conversaSelecionada) return;
    try {
      await transferirParaHumano(conversaSelecionada.id_conversa, 'Transferência manual pelo atendente');
      await mutateConversas();
    } catch (error) {
      console.error('Erro ao transferir:', error);
    }
  };

  // Calcular largura das colunas
  const chatColSpan = useMemo(() => {
    if (infoColapsed) return "lg:col-span-10";
    return "lg:col-span-7";
  }, [infoColapsed]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        <AlertCircle className="h-8 w-8 mr-2" />
        Erro ao carregar conversas
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Central de Atendimento</h1>
            <p className="text-muted-foreground text-sm">
              Gerencie conversas omnichannel em tempo real
            </p>
          </div>
          <Button onClick={() => setNovaConversaOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conversa
          </Button>
        </div>
      </div>

      {/* Grid de 12 colunas */}
      <div className="grid grid-cols-12 gap-3 h-[calc(100%-4rem)]">
        {/* Coluna 1: Lista de Conversas (2 cols) */}
        <Card className="col-span-12 lg:col-span-2 flex flex-col">
          <CardHeader className="pb-2 px-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4" />
              Conversas
              <Badge variant="secondary" className="ml-auto text-xs">
                {conversas.length}
              </Badge>
            </CardTitle>
            {/* Busca */}
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
            {/* Filtros */}
            <div className="flex gap-1 mt-2">
              <Select value={filtroCanal} onValueChange={setFiltroCanal}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="chat_web">Chat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="bot">Bot</SelectItem>
                  <SelectItem value="ativas">Ativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <div className="space-y-1 p-2 pt-0">
                {conversasFiltradas.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-xs">
                    Nenhuma conversa encontrada
                  </div>
                ) : (
                  conversasFiltradas.map((conversa) => (
                    <button
                      key={conversa.id_conversa}
                      onClick={() => setConversaSelecionada(conversa)}
                      className={`w-full p-2 rounded-lg text-left transition-colors hover:bg-muted ${
                        conversaSelecionada?.id_conversa === conversa.id_conversa
                          ? 'bg-muted border-l-2 border-l-primary'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(conversa.contato?.nm_contato)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Indicador de canal */}
                          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full ${CanalColors[conversa.tp_canal] || 'bg-gray-500'} flex items-center justify-center`}>
                            {(() => {
                              const Icon = CanalIcons[conversa.tp_canal] || MessageSquare;
                              return <Icon className="h-2.5 w-2.5 text-white" />;
                            })()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium text-xs truncate">
                              {conversa.contato?.nm_contato || 'Desconhecido'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatarData(conversa.dt_ultima_mensagem)}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate mb-1">
                            {conversa.contato?.nr_telefone || 'Sem telefone'}
                          </p>
                          <div className="flex items-center justify-between">
                            {getStatusBadge(conversa)}
                            <span className="text-[10px] text-muted-foreground">
                              {conversa.nr_mensagens_total} msgs
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Coluna 2: Área de Mensagens (dinâmica) */}
        <Card className={`col-span-12 ${chatColSpan} flex flex-col`}>
          {conversaSelecionada ? (
            <>
              {/* Header do Chat */}
              <CardHeader className="border-b py-2 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(conversaSelecionada.contato?.nm_contato)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">
                          {conversaSelecionada.contato?.nm_contato || 'Desconhecido'}
                        </h3>
                        {getCanalBadge(conversaSelecionada.tp_canal)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{conversaSelecionada.contato?.nr_telefone || 'Sem telefone'}</span>
                        {wsConnected ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Wifi className="h-3 w-3" />
                            <span className="text-[10px]">Online</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <WifiOff className="h-3 w-3" />
                            <span className="text-[10px]">Offline</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Ligar"
                      onClick={() => {
                        // Click-to-Call: abre discador do telefone
                        if (conversaSelecionada?.contato?.nr_telefone) {
                          window.location.href = `tel:${conversaSelecionada.contato.nr_telefone}`;
                        }
                      }}
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Chamada de Vídeo"
                      onClick={async () => {
                        if (!conversaSelecionada) return;

                        console.log('[UI] Iniciando vídeo para conversa:', {
                          id: conversaSelecionada.id_conversa,
                          canal: conversaSelecionada.tp_canal,
                          empresa: conversaSelecionada.id_empresa
                        });

                        try {
                          const response = await iniciarVideo(conversaSelecionada.id_conversa);

                          // Verificar se response existe
                          if (!response || !response.video_url) {
                            console.error('[UI] Resposta inválida:', response);
                            alert('Erro ao gerar link de vídeo. Por favor, tente novamente.');
                            return;
                          }

                          console.log('[UI] Link gerado com sucesso:', response.video_url);

                          // Abrir Jitsi em nova janela
                          const videoWindow = window.open(response.video_url, '_blank', 'width=1024,height=768');

                          // Monitorar fechamento da janela para manter foco na central
                          if (videoWindow) {
                            const checkWindowClosed = setInterval(() => {
                              if (videoWindow.closed) {
                                clearInterval(checkWindowClosed);
                                // Quando a janela fechar, garantir que estamos de volta à central
                                window.focus();
                                console.log('[UI] Videochamada encerrada, foco retornado à central');
                              }
                            }, 500);
                          }
                        } catch (error: any) {
                          console.error('[UI] Erro ao iniciar vídeo:', error);
                          console.error('[UI] Erro type:', typeof error);
                          console.error('[UI] Erro constructor:', error?.constructor?.name);

                          const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
                          alert(`Erro ao iniciar chamada de vídeo: ${errorMessage}`);
                        }
                      }}
                    >
                      <Video className="h-3 w-3" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleTransferirHumano}>
                          <User className="h-3 w-3 mr-2" />
                          Transferir para Humano
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            if (!conversaSelecionada) return;
                            try {
                              await favoritarConversa(
                                conversaSelecionada.id_conversa,
                                !conversaSelecionada.st_favorito
                              );
                            } catch (error) {
                              console.error('Erro ao favoritar:', error);
                            }
                          }}
                        >
                          <Star
                            className={`h-3 w-3 mr-2 ${
                              conversaSelecionada?.st_favorito
                                ? 'fill-yellow-400 text-yellow-400'
                                : ''
                            }`}
                          />
                          {conversaSelecionada?.st_favorito ? 'Desfavoritar' : 'Favoritar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleFecharConversa}>
                          <Archive className="h-3 w-3 mr-2" />
                          Fechar Conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setConversaSelecionada(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Mensagens */}
              <CardContent className="flex-1 p-3 overflow-hidden">
                <ScrollArea className="h-full pr-3">
                  {mensagensLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mensagens.map((msg) => (
                        <div
                          key={msg.id_mensagem}
                          className={`flex ${msg.st_entrada ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-3 py-1.5 ${
                              msg.st_entrada
                                ? 'bg-muted'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <p className="text-xs whitespace-pre-wrap">{msg.ds_conteudo}</p>
                            <div className={`flex items-center justify-end gap-1 mt-0.5 ${
                              msg.st_entrada ? 'text-muted-foreground' : 'text-primary-foreground/70'
                            }`}>
                              <span className="text-[10px]">
                                {formatarData(msg.dt_criacao)}
                              </span>
                              {!msg.st_entrada && <StatusIcon status={msg.st_mensagem} />}
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Indicador de digitando */}
                      {typingParticipants.length > 0 && (
                        <div className="flex justify-start">
                          <TypingBubble
                            name={conversaSelecionada?.contato?.nm_contato}
                          />
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Input de Mensagem */}
              <CardContent className="border-t p-2">
                <div className="flex items-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Paperclip className="h-3 w-3" />
                  </Button>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={mensagemInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleEnviar();
                      }
                    }}
                    disabled={enviando}
                    className="min-h-[50px] max-h-[100px] resize-none text-xs flex-1"
                  />
                  <Button
                    onClick={handleEnviar}
                    size="icon"
                    className="h-7 w-7"
                    disabled={enviando || !mensagemInput.trim()}
                  >
                    {enviando ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Selecione uma conversa para começar</p>
                <p className="text-xs mt-2">ou</p>
                <Button
                  variant="outline"
                  className="mt-3 gap-2"
                  onClick={() => setNovaConversaOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Iniciar Nova Conversa
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Coluna 3: Informações do Contato (3 cols, colapsável com Tabs) */}
        {!infoColapsed && (
          <Card className="col-span-12 lg:col-span-3 flex flex-col">
            {conversaSelecionada ? (
              <>
                <CardHeader className="pb-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Informações</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setInfoColapsed(true)}
                      title="Recolher painel"
                      className="h-6 w-6"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <Tabs defaultValue="info" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 mx-3 h-8">
                      <TabsTrigger value="info" className="text-xs py-1">
                        <Info className="h-3 w-3 mr-1" />
                        Info
                      </TabsTrigger>
                      <TabsTrigger value="historico" className="text-xs py-1">
                        <History className="h-3 w-3 mr-1" />
                        Histórico
                      </TabsTrigger>
                      <TabsTrigger value="perfil" className="text-xs py-1">
                        <UserCircle className="h-3 w-3 mr-1" />
                        Perfil
                      </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1">
                      {/* Tab: Informações */}
                      <TabsContent value="info" className="p-3 mt-0">
                        <div className="space-y-4">
                          <div className="flex flex-col items-center text-center">
                            <Avatar className="h-16 w-16 mb-2">
                              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                {getInitials(contatoInfo?.nm_contato)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-sm">
                              {contatoInfo?.nm_contato || 'Carregando...'}
                            </h3>
                            <Badge className="mt-1" variant="secondary">
                              {contatoInfo?.st_contato || 'lead'}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">Canal</span>
                              {getCanalBadge(conversaSelecionada.tp_canal)}
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">Status</span>
                              {getStatusBadge(conversaSelecionada)}
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">Mensagens</span>
                              <span className="text-xs font-medium">{conversaSelecionada.nr_mensagens_total}</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">Última msg</span>
                              <span className="text-xs font-medium">
                                {formatarData(conversaSelecionada.dt_ultima_mensagem)}
                              </span>
                            </div>
                            {contatoInfo?.nr_telefone && (
                              <div className="flex items-center justify-between py-1.5 border-b">
                                <span className="text-xs text-muted-foreground">Telefone</span>
                                <span className="text-xs font-medium">{contatoInfo.nr_telefone}</span>
                              </div>
                            )}
                            {contatoInfo?.nm_email && (
                              <div className="flex items-center justify-between py-1.5 border-b">
                                <span className="text-xs text-muted-foreground">E-mail</span>
                                <span className="text-xs font-medium truncate max-w-[140px]">
                                  {contatoInfo.nm_email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Tab: Histórico */}
                      <TabsContent value="historico" className="p-3 mt-0">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-xs mb-2">Histórico de Conversas</h4>
                          <div className="space-y-2">
                            <div className="p-2 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium">Conversa Atual</span>
                                {getStatusBadge(conversaSelecionada)}
                              </div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">
                                {formatarDataCompleta(conversaSelecionada.dt_criacao)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {conversaSelecionada.nr_mensagens_total} mensagens
                              </p>
                            </div>
                            {/* Placeholder para histórico anterior */}
                            <div className="text-center text-muted-foreground text-xs py-4">
                              Histórico completo em breve...
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Tab: Perfil Completo */}
                      <TabsContent value="perfil" className="p-3 mt-0">
                        <div className="space-y-3">
                          <div className="flex flex-col items-center text-center mb-3">
                            <Avatar className="h-14 w-14 mb-1.5">
                              <AvatarFallback className="text-base bg-primary/10 text-primary">
                                {getInitials(contatoInfo?.nm_contato)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-sm">{contatoInfo?.nm_contato}</h3>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-xs">Contato</h4>
                            <div className="space-y-1.5 text-xs">
                              {contatoInfo?.nr_telefone && (
                                <div className="flex items-center gap-2">
                                  <PhoneCall className="h-3 w-3 text-muted-foreground" />
                                  <span>{contatoInfo.nr_telefone}</span>
                                </div>
                              )}
                              {contatoInfo?.nm_email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{contatoInfo.nm_email}</span>
                                </div>
                              )}
                              {contatoInfo?.id_whatsapp && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>WhatsApp: {contatoInfo.id_whatsapp}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-xs">Informações</h4>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {contatoInfo?.st_contato || 'lead'}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cliente desde:</span>
                                <span className="font-medium">
                                  {formatarData(contatoInfo?.dt_criacao)}
                                </span>
                              </div>
                              {contatoInfo?.dt_ultimo_contato && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Último contato:</span>
                                  <span className="font-medium">
                                    {formatarData(contatoInfo.dt_ultimo_contato)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Estatísticas */}
                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-xs">Estatísticas</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Card className="p-2 text-center">
                                <span className="text-lg font-bold text-primary">
                                  {conversaSelecionada.nr_mensagens_total}
                                </span>
                                <p className="text-[10px] text-muted-foreground">Total</p>
                              </Card>
                              <Card className="p-2 text-center">
                                <span className="text-lg font-bold text-green-600">
                                  {conversaSelecionada.nr_mensagens_entrada}
                                </span>
                                <p className="text-[10px] text-muted-foreground">Recebidas</p>
                              </Card>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-xs">Nenhum contato selecionado</p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Botão para expandir painel de informações quando colapsado */}
        {infoColapsed && (
          <div className="col-span-12 lg:col-span-1 flex items-start justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setInfoColapsed(false)}
              title="Expandir painel de informações"
              className="mt-2 h-7 w-7"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de Nova Conversa */}
      <NovaConversaDialog
        open={novaConversaOpen}
        onOpenChange={setNovaConversaOpen}
        contatos={contatosMemo}
        onCriarConversa={handleCriarConversa}
        onCriarContato={criarContato}
        onBuscarContatos={buscarContatos}
      />
    </div>
  );
}
