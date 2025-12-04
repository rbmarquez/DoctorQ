"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  Stethoscope,
  User,
  RotateCcw,
  Minimize2,
  Maximize2,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGiseleChat } from "@/hooks/useGiseleChat";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  chunks_usados?: string[];
}

export function GiseleChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    conversationId,
    initConversation,
    handoffState,
    requestHandoff,
  } = useGiseleChat();

  // Auto-scroll suave
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [messages]);

  // Iniciar conversa ao abrir (silencioso - não bloqueia se AI Service não estiver rodando)
  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation().catch(() => {
        // Silenciosamente ignora erro - o handoff ainda funciona sem conversa prévia
        console.log("AI Service não disponível - handoff direto disponível");
      });
    }
  }, [isOpen, conversationId, initConversation]);

  // Focus no textarea ao abrir
  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
    }

    try {
      await sendMessage(userMessage);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "56px";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  // Sugestões rápidas
  const quickSuggestions = [
    { icon: "📅", text: "Como agendar consulta?", gradient: "from-blue-400 to-cyan-400" },
    { icon: "💉", text: "Procedimentos disponíveis", gradient: "from-purple-400 to-blue-400" },
    { icon: "✨", text: "Harmonização facial", gradient: "from-orange-400 to-rose-400" },
    { icon: "👤", text: "Falar com atendente", gradient: "from-red-400 to-blue-500", isHandoff: true },
  ];

  return (
    <>
      {/* Botão Flutuante 3D */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <div className="relative group">
              {/* Glow effect azul médico */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-full opacity-75 blur-lg group-hover:opacity-100 transition duration-500 animate-pulse" />

              <Button
                onClick={() => setIsOpen(true)}
                className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 border-4 border-white p-0 overflow-hidden flex items-center justify-center"
                size="icon"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <Stethoscope className="w-10 h-10 text-white" />
                </motion.div>
              </Button>

              {/* Badge animado */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute -top-2 -right-2"
              >
                <Badge className="h-7 w-7 p-0 flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 border-3 border-white shadow-lg">
                  <Activity className="h-4 w-4 text-white" />
                </Badge>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Janela de Chat Premium */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? "80px" : "700px"
            }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-8 right-8 w-[440px] z-50 transition-all duration-300"
            style={{ height: isMinimized ? "80px" : "700px" }}
          >
            {/* Card principal com sombra 3D */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] bg-gradient-to-br from-gray-50 via-white to-blue-50/30">

              {/* Border gradient animado */}
              <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 -z-10 opacity-60" />

              {/* Header Premium - Medical Blue */}
              <div className="relative h-20 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 shadow-lg">
                {/* Mesh gradient background */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="mesh" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="1" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#mesh)" />
                  </svg>
                </div>

                <div className="relative flex items-center justify-between px-5 h-full">
                  <div className="flex items-center gap-4">
                    {/* Avatar com animação */}
                    <motion.div
                      animate={!isMinimized ? {
                        y: [0, -5, 0],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-white rounded-full blur-md opacity-50" />
                      <Avatar className="h-12 w-12 border-3 border-white shadow-xl relative bg-white">
                        <div className="w-full h-full flex items-center justify-center">
                          <Stethoscope className="w-7 h-7 text-blue-600" />
                        </div>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-xl font-bold">
                          DQ
                        </AvatarFallback>
                      </Avatar>
                      <motion.div
                        className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>

                    <div>
                      <h3 className="text-white font-bold text-lg flex items-center gap-2 drop-shadow-md">
                        Dr. Q AI
                        <Activity className="h-4 w-4" />
                      </h3>
                      <p className="text-white/90 text-xs font-medium">
                        Assistente Virtual Médica
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsMinimized(!isMinimized)}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-all"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-[calc(100%-5rem)]"
                >
                  {/* Messages Area */}
                  <div className="flex-1 overflow-hidden bg-gradient-to-b from-blue-50/20 to-white">
                    <ScrollArea ref={scrollRef} className="h-full">
                      <div className="p-5 space-y-5">
                        {messages.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16"
                          >
                            <motion.div
                              animate={{
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                              }}
                              className="mb-6"
                            >
                              <div className="relative inline-block">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl" />
                                <Stethoscope className="h-20 w-20 text-blue-600 relative" />
                              </div>
                            </motion.div>

                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                              Olá! Sou o Dr. Q 👋
                            </h2>
                            <p className="text-gray-600 mb-8 text-sm font-medium">
                              Seu assistente virtual médico
                            </p>

                            {/* Sugestões Premium */}
                            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                              {quickSuggestions.map((suggestion, index) => (
                                <motion.button
                                  key={index}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    if ('isHandoff' in suggestion && suggestion.isHandoff) {
                                      requestHandoff("Solicitação via botão de atendente");
                                    } else {
                                      setInput(suggestion.text);
                                    }
                                  }}
                                  className={cn(
                                    "p-4 text-left rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-xl transition-all border-2 border-white/50",
                                    suggestion.gradient
                                  )}
                                >
                                  <span className="text-3xl mb-2 block filter drop-shadow-lg">{suggestion.icon}</span>
                                  <span className="text-xs text-white font-bold drop-shadow-md line-clamp-2">
                                    {suggestion.text}
                                  </span>
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, x: message.role === "user" ? 20 : -20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex gap-3 items-start",
                              message.role === "user" ? "flex-row-reverse" : "flex-row",
                              message.role === "system" && "justify-center"
                            )}
                          >
                            {/* Avatar - hide for system messages */}
                            {message.role !== "system" && (
                              <div className="flex-shrink-0">
                                <Avatar className="h-9 w-9 shadow-lg border-2 border-white bg-white">
                                  {message.role === "assistant" && (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Stethoscope className="w-5 h-5 text-blue-600" />
                                    </div>
                                  )}
                                  <AvatarFallback className={cn(
                                    "text-white text-sm font-bold",
                                    message.role === "assistant"
                                      ? "bg-gradient-to-br from-blue-500 to-cyan-600"
                                      : "bg-gradient-to-br from-blue-400 to-indigo-500"
                                  )}>
                                    {message.role === "assistant" ? "DQ" : <User className="h-4 w-4" />}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div className={cn("flex-1 min-w-0", message.role === "system" && "max-w-[90%]")}>
                              <div
                                className={cn(
                                  "group relative rounded-3xl px-5 py-4 shadow-md transition-all",
                                  message.role === "user"
                                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-12"
                                    : message.role === "system"
                                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-2 border-blue-300"
                                    : "bg-white border-2 border-gray-100 mr-12"
                                )}
                              >
                                <div className={cn(
                                  "prose prose-sm max-w-none break-words",
                                  (message.role === "user" || message.role === "system") ? "prose-invert" : ""
                                )}>
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return !inline && match ? (
                                          <SyntaxHighlighter
                                            style={materialLight}
                                            language={match[1]}
                                            PreTag="div"
                                            customStyle={{
                                              borderRadius: "12px",
                                              padding: "16px",
                                              fontSize: "13px"
                                            }}
                                            {...props}
                                          >
                                            {String(children).replace(/\n$/, "")}
                                          </SyntaxHighlighter>
                                        ) : (
                                          <code className={cn(
                                            "px-2 py-1 rounded-lg font-mono text-sm",
                                            message.role === "user"
                                              ? "bg-white/20"
                                              : "bg-blue-100 text-blue-700",
                                            className
                                          )} {...props}>
                                            {children}
                                          </code>
                                        );
                                      },
                                      p({ children }) {
                                        return <p className="mb-3 last:mb-0 leading-relaxed text-[15px]">{children}</p>;
                                      },
                                      ul({ children }) {
                                        return <ul className="my-3 space-y-2 pl-5">{children}</ul>;
                                      },
                                      ol({ children }) {
                                        return <ol className="my-3 space-y-2 pl-5">{children}</ol>;
                                      },
                                      li({ children }) {
                                        return <li className="leading-relaxed">{children}</li>;
                                      },
                                      strong({ children }) {
                                        return <strong className="font-bold">{children}</strong>;
                                      },
                                      a({ children, href }) {
                                        // Detectar links de videochamada (Jitsi)
                                        const isVideoLink = href?.includes("meet.jit.si");

                                        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                                          // Debug: confirmar que código atualizado está rodando
                                          console.log('[Gisele Chat] Link clicado:', href, 'isVideoLink:', isVideoLink);

                                          if (isVideoLink && href) {
                                            e.preventDefault();
                                            console.log('[Gisele Chat] Interceptando link de vídeo, abrindo janela controlada...');

                                            // Abrir Jitsi em janela controlada
                                            const videoWindow = window.open(href, '_blank', 'width=1024,height=768');

                                            // Monitorar fechamento da janela
                                            if (videoWindow) {
                                              const checkWindowClosed = setInterval(() => {
                                                if (videoWindow.closed) {
                                                  clearInterval(checkWindowClosed);
                                                  // Quando fechar, voltar foco para o chat
                                                  window.focus();
                                                  console.log('[Gisele Chat] Videochamada encerrada, foco retornado ao chat');
                                                }
                                              }, 500);
                                            }
                                          }
                                        };

                                        return (
                                          <a
                                            href={href}
                                            onClick={handleClick}
                                            className={cn(
                                              "underline hover:no-underline transition-all font-medium cursor-pointer",
                                              message.role === "user" ? "text-white" : "text-blue-600"
                                            )}
                                            target={isVideoLink ? undefined : "_blank"}
                                            rel="noopener noreferrer"
                                          >
                                            {children}
                                          </a>
                                        );
                                      },
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>

                                {/* Copy Button */}
                                {message.role === "assistant" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCopy(message.content, message.id)}
                                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white border-2 border-blue-200 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                  >
                                    {copiedId === message.id ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4 text-blue-500" />
                                    )}
                                  </Button>
                                )}

                                {/* Timestamp */}
                                <div className={cn(
                                  "text-[11px] mt-2 font-medium",
                                  message.role === "user" ? "text-right text-white/70" : "text-gray-400"
                                )}>
                                  {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {/* Typing Indicator Premium */}
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 items-start"
                          >
                            <Avatar className="h-9 w-9 shadow-lg border-2 border-white bg-white">
                              <div className="w-full h-full flex items-center justify-center">
                                <Stethoscope className="w-5 h-5 text-blue-600" />
                              </div>
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-sm font-bold">
                                DQ
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-white border-2 border-gray-100 rounded-3xl px-6 py-4 shadow-md">
                              <div className="flex gap-2">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                    animate={{
                                      y: [0, -8, 0],
                                    }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: Infinity,
                                      delay: i * 0.15,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Input Area Premium */}
                  <div className="p-4 bg-white/80 backdrop-blur-xl border-t-2 border-blue-100">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 relative">
                        <Textarea
                          ref={textareaRef}
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Digite sua mensagem..."
                          disabled={isLoading}
                          className="min-h-[56px] max-h-[150px] resize-none rounded-2xl border-2 border-blue-200 focus:border-blue-400 bg-white shadow-sm text-gray-800 text-[15px] font-medium placeholder:text-gray-400 leading-relaxed px-5 py-4 transition-all"
                          style={{ fontSize: "15px", lineHeight: "1.6" }}
                        />
                      </div>
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="h-14 w-14 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                        size="icon"
                      >
                        {isLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        ) : (
                          <Send className="h-6 w-6 text-white" />
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
