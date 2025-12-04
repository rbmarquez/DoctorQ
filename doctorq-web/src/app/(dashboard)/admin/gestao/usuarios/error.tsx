/**
 * Error UI for Usuarios Page
 */

'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/feedback/ErrorState';

interface UsuariosErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function UsuariosError({ error, reset }: UsuariosErrorProps) {
  useEffect(() => {
    console.error('Usuarios Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <ErrorState
          title="Erro ao Carregar Usuários"
          message="Não foi possível carregar a lista de usuários. Por favor, tente novamente."
          error={error}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
