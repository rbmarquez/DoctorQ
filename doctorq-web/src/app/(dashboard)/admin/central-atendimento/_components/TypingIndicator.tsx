'use client';

/**
 * Componente Indicador de Digitação
 *
 * Mostra uma animação quando um participante está digitando na conversa.
 */

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  names?: string[];
  className?: string;
}

export function TypingIndicator({ names = [], className }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const displayText =
    names.length === 1
      ? `${names[0]} está digitando`
      : names.length === 2
        ? `${names[0]} e ${names[1]} estão digitando`
        : `${names[0]} e mais ${names.length - 1} estão digitando`;

  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      {/* Dots Animation */}
      <div className="flex gap-1">
        <span className="animate-bounce [animation-delay:-0.3s]">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground inline-block" />
        </span>
        <span className="animate-bounce [animation-delay:-0.15s]">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground inline-block" />
        </span>
        <span className="animate-bounce">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground inline-block" />
        </span>
      </div>
      <span>{displayText}</span>
    </div>
  );
}

/**
 * Versão compacta do indicador (apenas os pontos)
 */
export function TypingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 py-2 px-3', className)}>
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Bubble de mensagem de digitação (para exibir na lista de mensagens)
 */
export function TypingBubble({ name, className }: { name?: string; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 mb-3', className)}>
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
        {name ? name[0].toUpperCase() : '?'}
      </div>

      {/* Bubble */}
      <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2">
        <TypingDots />
        {name && <span className="text-xs text-gray-500 block mt-1">{name}</span>}
      </div>
    </div>
  );
}

export default TypingIndicator;
