"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  /**
   * Mensagem de loading
   */
  message?: string;

  /**
   * Tamanho do spinner
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Se true, ocupa toda a tela
   */
  fullScreen?: boolean;
}

/**
 * Componente de estado de carregamento
 *
 * @example
 * ```tsx
 * <LoadingState message="Carregando dados..." />
 * ```
 */
export function LoadingState({
  message = 'Carregando...',
  size = 'md',
  fullScreen = false,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}

/**
 * Skeleton loading para cards
 */
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}
