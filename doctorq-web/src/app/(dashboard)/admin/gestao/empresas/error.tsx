/**
 * Error UI for Empresas Page
 */

'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/feedback/ErrorState';

interface EmpresasErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EmpresasError({ error, reset }: EmpresasErrorProps) {
  useEffect(() => {
    console.error('Empresas Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <ErrorState
          title="Erro ao Carregar Empresas"
          message="Não foi possível carregar a lista de empresas. Por favor, tente novamente."
          error={error}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
