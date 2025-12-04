// src/hooks/useAuth.ts
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export function useAuth() {
  const { data: session, status } = useSession();

  const authData = useMemo(() => {
    // Obter o role do usuário da sessão
    const userRole =
      session?.user?.role ||
      session?.user?.backendData?.nm_papel ||
      session?.user?.profile?.role ||
      session?.user?.tipo_usuario;

    // Retornar o role original sem mapeamento
    // O role já vem correto do backend: admin, gestor_clinica, medico, paciente, etc.
    const normalizedRole = typeof userRole === "string" ? userRole : undefined;

    if (typeof window !== "undefined") {
      console.log("[useAuth] estado atual", {
        status,
        rawRole: userRole,
        role: normalizedRole,
        hasSession: !!session,
      });
    }

    return {
      role: normalizedRole,
      isAuthenticated: status === "authenticated" && !!session,
      isLoading: status === "loading",
      user: session?.user,
    };
  }, [session, status]);

  return authData;
} 
