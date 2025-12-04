'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Link from 'next/link';

interface ErrorDisplayProps {
  /**
   * Título do erro
   */
  title?: string;

  /**
   * Mensagem descritiva do erro
   */
  message?: string;

  /**
   * Detalhes técnicos do erro (mostrado apenas em desenvolvimento)
   */
  details?: string;

  /**
   * Tipo de erro (afeta o estilo visual)
   */
  type?: 'error' | 'warning' | 'info';

  /**
   * Callback para tentar novamente
   */
  onRetry?: () => void;

  /**
   * Mostrar botão de voltar para home
   */
  showHomeButton?: boolean;

  /**
   * Modo de exibição (inline ou full-page)
   */
  variant?: 'inline' | 'card' | 'full';
}

export function ErrorDisplay({
  title = 'Ops! Algo deu errado',
  message = 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  details,
  type = 'error',
  onRetry,
  showHomeButton = true,
  variant = 'card',
}: ErrorDisplayProps) {
  const isDev = process.env.NODE_ENV === 'development';

  // Estilos baseados no tipo
  const typeConfig = {
    error: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      iconBgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      alertVariant: 'destructive' as const,
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      alertVariant: 'default' as const,
    },
    info: {
      icon: Bug,
      bgColor: 'bg-blue-50',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      alertVariant: 'default' as const,
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  // Renderização inline (apenas alerta)
  if (variant === 'inline') {
    return (
      <Alert variant={config.alertVariant} className="border-0">
        <Icon className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{message}</p>
          {isDev && details && (
            <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-auto max-h-32">
              {details}
            </pre>
          )}
          {onRetry && (
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="w-3 h-3 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Renderização em card
  if (variant === 'card') {
    return (
      <Card className={`border-0 shadow-md ${config.bgColor}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${config.iconBgColor}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-gray-900">{title}</CardTitle>
              <CardDescription className="text-gray-700">{message}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDev && details && (
            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-xs font-semibold text-gray-300 mb-2">Detalhes Técnicos:</p>
              <pre className="text-xs text-gray-100 overflow-auto max-h-40">{details}</pre>
            </div>
          )}

          <div className="flex gap-3">
            {onRetry && (
              <Button onClick={onRetry} variant="default" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            {showHomeButton && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderização full-page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full ${config.iconBgColor} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
            <CardDescription className="text-base mt-2 text-gray-700">{message}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isDev && details && (
            <div className="p-4 bg-gray-900 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-gray-300">Detalhes Técnicos:</p>
              <pre className="text-xs text-gray-100 overflow-auto max-h-48">{details}</pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            {showHomeButton && (
              <Button variant="outline" size="lg" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Link>
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Se o problema persistir, entre em contato com o suporte técnico.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
