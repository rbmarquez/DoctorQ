/**
 * Error UI for Admin Dashboard
 *
 * Captura erros durante o rendering da página e exibe UI amigável.
 * Este arquivo DEVE ser Client Component ('use client').
 */

'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/shared/feedback';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Log do erro para monitoramento (Sentry, etc)
    console.error('Dashboard Error:', error);
  }, [error]);

  // Parsear mensagem de erro para exibir de forma amigável
  let errorMessage = 'Ocorreu um problema ao carregar o dashboard administrativo.';
  let errorDetails = error.message;

  // Detectar erros comuns e fornecer mensagens mais amigáveis
  if (error.message.includes('500')) {
    errorMessage = 'O servidor encontrou um erro interno. Tente novamente em alguns instantes.';
  } else if (error.message.includes('401') || error.message.includes('authentication')) {
    errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
  } else if (error.message.includes('404')) {
    errorMessage = 'Não foi possível encontrar os dados solicitados.';
  } else if (error.message.includes('Network')) {
    errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Adicionar error digest aos detalhes técnicos
  if (error.digest) {
    errorDetails += `\n\nError Digest: ${error.digest}`;
  }

  return (
    <ErrorDisplay
      title="Erro ao Carregar Dashboard"
      message={errorMessage}
      details={errorDetails}
      type="error"
      variant="full"
      onRetry={reset}
      showHomeButton={true}
    />
  );
}
