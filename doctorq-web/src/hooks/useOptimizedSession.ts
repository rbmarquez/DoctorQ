// hooks/useOptimizedSession.ts

import { useSession } from "next-auth/react";
import { useMemo } from "react";

export function useOptimizedSession() {
  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated: () => { },
  });

  const optimizedData = useMemo(() => {
    return {
      session,
      status,
      isLoading: status === "loading",
      isAuthenticated: !!session,
    };
  }, [session, status]);

  return optimizedData;
}

// Hook para componentes que só precisam saber se está autenticado
export function useAuthStatus() {
  const { isAuthenticated, isLoading } = useOptimizedSession();

  return useMemo(
    () => ({
      isAuthenticated,
      isLoading,
    }),
    [isAuthenticated, isLoading]
  );
}
