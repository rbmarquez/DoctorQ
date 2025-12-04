"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAuthToken } from "@/lib/api/client";

/**
 * Componente que sincroniza o token JWT da sessão NextAuth
 * com o apiClient para uso em hooks SWR client-side
 *
 * Deve ser incluído nos Providers para garantir que todas
 * as requisições client-side usem o JWT correto
 */
export function AuthTokenSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.accessToken) {
      // Atualizar token do apiClient com JWT da sessão (contém id_empresa)
      setAuthToken(session.user.accessToken);
      console.log("[AUTH_TOKEN_SYNC] Token atualizado para:", session.user.email);
    } else if (status === "unauthenticated") {
      // Limpar token quando não autenticado
      setAuthToken(null);
      console.log("[AUTH_TOKEN_SYNC] Token limpo (sem sessão)");
    }
  }, [session, status]);

  // Componente não renderiza nada (apenas efeito colateral)
  return null;
}
