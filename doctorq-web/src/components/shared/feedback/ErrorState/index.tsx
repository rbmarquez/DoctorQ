"use client";

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface ErrorStateProps {
  /**
   * Título do erro
   */
  title?: string;

  /**
   * Mensagem de erro
   */
  message?: string;

  /**
   * Objeto de erro
   */
  error?: Error | null;

  /**
   * Callback para tentar novamente
   */
  onRetry?: () => void;

  /**
   * Texto do botão de retry
   */
  retryLabel?: string;
}

/**
 * Componente de estado de erro
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Erro ao carregar dados"
 *   error={error}
 *   onRetry={() => mutate()}
 * />
 * ```
 */
export function ErrorState({
  title = 'Erro ao carregar',
  message,
  error,
  onRetry,
  retryLabel = 'Tentar novamente',
}: ErrorStateProps) {
  const errorMessage = message || error?.message || 'Ocorreu um erro inesperado';

  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm">{errorMessage}</p>

            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryLabel}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
