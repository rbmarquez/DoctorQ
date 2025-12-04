// app/contexts/AuthContext.tsx

"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { logger } from "@/lib/logger";
import { storage } from "@/utils/storage";

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, callbackUrl?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// REMOVER SessionProvider daqui - já está no Providers
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isLoginInProgress, setIsLoginInProgress] = useState(false);
  const loginAttemptRef = useRef(false); // Previne múltiplas tentativas


  const login = useCallback(async (email: string, password: string, callbackUrl?: string) => {
    if (loginAttemptRef.current || isLoginInProgress) {
      return;
    }

    loginAttemptRef.current = true;
    setIsLoginInProgress(true);

    let finalCallbackUrl = callbackUrl;
    if (callbackUrl === "/login" || callbackUrl?.includes("/login")) {
      finalCallbackUrl = "/new";
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: finalCallbackUrl || "/new",
      });

      if (!result) {
        throw new Error("Nao foi possivel processar o login.");
      }

      if (result.error) {
        const message =
          result.error === "CredentialsSignin"
            ? "Credenciais invalidas."
            : result.error;

        logger.warn("Tentativa de login sem sucesso", {
          email,
          message,
        });
        throw new Error(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Erro ao realizar login", {
        email,
        error: message,
      });
      throw error instanceof Error ? error : new Error(message);
    } finally {
      loginAttemptRef.current = false;
      setIsLoginInProgress(false);
    }
  }, [isLoginInProgress]);

  // Reset login attempt quando a sessão muda
  useEffect(() => {
    if (status !== "loading") {
      loginAttemptRef.current = false;
      setIsLoginInProgress(false);
    }
  }, [status]);

  const logout = useCallback(() => {
    // Log de logout
    logger.info("User logout", {
      userId: session?.user?.email,
      timestamp: new Date().toISOString()
    });

    // Limpar localStorage
    storage.clear();

    // Limpar todos os cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    });

    signOut({ callbackUrl: "/login" });
  }, [session?.user?.email]);

  // Memoizar o valor do contexto para evitar re-renders
  const value = useMemo(
    () => ({
      user: session?.user || null,
      isLoading: status === "loading" || isLoginInProgress,
      isAuthenticated: status === "authenticated" && !!session,
      login,
      logout,
    }),
    [session, status, isLoginInProgress, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
