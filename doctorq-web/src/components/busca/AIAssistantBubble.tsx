"use client";

import { useState } from "react";
import { Bot, MessageCircle, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AIAssistantBubble() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 300);
  };

  const handleOpenChat = () => {
    router.push("/chat");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bubble expandido com mensagem */}
      {isExpanded && (
        <div
          className={`mb-4 mr-2 max-w-sm rounded-2xl border border-purple-200 bg-white p-6 shadow-2xl transition-all duration-300 ${
            isClosing
              ? "translate-y-4 scale-95 opacity-0"
              : "translate-y-0 scale-100 opacity-100"
          }`}
        >
          {/* Botão de fechar */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Conteúdo */}
          <div className="space-y-4">
            {/* Ícone e Título */}
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700 shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Assistente DoctorQ
                </h3>
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Powered by IA
                </p>
              </div>
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-gray-700">
                Olá! 👋 Estou aqui para te ajudar a encontrar o{" "}
                <span className="font-semibold text-blue-600">
                  procedimento ou profissional certo
                </span>{" "}
                para você.
              </p>
              <p className="text-xs text-gray-500">
                Posso te ajudar com recomendações personalizadas, tirar dúvidas sobre
                tratamentos e muito mais!
              </p>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleOpenChat}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-purple-700 text-white shadow-lg shadow-purple-200 transition hover:from-blue-600 hover:via-purple-600 hover:to-purple-800"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Conversar agora
              </Button>
              <button
                onClick={handleClose}
                className="text-xs text-gray-500 hover:text-gray-700 transition"
              >
                Talvez depois
              </button>
            </div>
          </div>

          {/* Seta apontando para o botão */}
          <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-purple-200 bg-white"></div>
        </div>
      )}

      {/* Botão flutuante principal */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700 shadow-2xl shadow-purple-300 transition-all duration-300 hover:scale-110 hover:shadow-purple-400 ${
          isExpanded ? "rotate-0" : "animate-pulse"
        }`}
        aria-label="Abrir assistente virtual"
      >
        {/* Ícone */}
        <div className="relative">
          <Bot className="h-8 w-8 text-white transition-transform group-hover:scale-110" />

          {/* Badge de "novo" ou notificação */}
          {!isExpanded && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
            </span>
          )}
        </div>

        {/* Texto de dica (aparece no hover em telas grandes) */}
        <div className="pointer-events-none absolute -left-2 top-1/2 hidden -translate-x-full -translate-y-1/2 lg:block">
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
              Precisa de ajuda?
              <div className="absolute right-0 top-1/2 -mr-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900"></div>
            </div>
          </div>
        </div>
      </button>

      {/* Efeito de onda pulsante quando não expandido */}
      {!isExpanded && (
        <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-purple-400 opacity-20"></div>
      )}
    </div>
  );
}
