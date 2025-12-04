import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

interface UseLoggerReturn {
  logInfo: (message: string, context?: Record<string, any>) => void;
  logWarn: (message: string, context?: Record<string, any>) => void;
  logError: (message: string, context?: Record<string, any>) => void;
  logDebug: (message: string, context?: Record<string, any>) => void;
  logPageView: (page: string, additionalContext?: Record<string, any>) => void;
  logUserAction: (action: string, context?: Record<string, any>) => void;
}

export function useLogger(): UseLoggerReturn {
  const { data: session } = useSession();
  const initializationRef = useRef<boolean>(false);

  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      
      // Configura o userId no logger se estiver logado
      if (session?.user?.email) {
        logger.setUserId(session.user.email);
      }

      // Log de inicialização da sessão apenas se estiver autenticado
      if (session?.user?.email) {
        logger.info('User session initialized', {
          sessionStatus: 'authenticated'
        });
      }
    }
  }, [session]);

  const logInfo = (message: string, context?: Record<string, any>) => {
    logger.info(message, context);
  };

  const logWarn = (message: string, context?: Record<string, any>) => {
    logger.warn(message, context);
  };

  const logError = (message: string, context?: Record<string, any>) => {
    logger.error(message, context);
  };

  const logDebug = (message: string, context?: Record<string, any>) => {
    logger.debug(message, context);
  };

  const logPageView = (page: string, additionalContext?: Record<string, any>) => {
    logger.info(`Page view: ${page}`, {
      page,
      ...additionalContext
    });
  };

  const logUserAction = (action: string, context?: Record<string, any>) => {
    logger.info(`User action: ${action}`, {
      action,
      ...context
    });
  };

  return {
    logInfo,
    logWarn,
    logError,
    logDebug,
    logPageView,
    logUserAction
  };
}
