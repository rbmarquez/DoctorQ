'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/feedback/ErrorState';

export default function AgentesError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error('Agentes Error:', error), [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <ErrorState
          title="Erro ao Carregar Agentes"
          message="Não foi possível carregar os agentes de IA."
          error={error}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
