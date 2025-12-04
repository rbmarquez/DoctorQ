'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function CentralAtendimentoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar Central de Atendimento</h2>
        <p className="text-gray-600 mb-4">
          Ocorreu um erro ao carregar a central de atendimento. Tente novamente.
        </p>
        {error.message && (
          <p className="text-sm text-red-500 mb-4 bg-red-50 p-2 rounded">
            {error.message}
          </p>
        )}
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
