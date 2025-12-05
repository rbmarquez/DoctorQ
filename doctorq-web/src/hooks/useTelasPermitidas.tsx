"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";

/**
 * Interface para resposta de telas permitidas
 */
interface TelasPermitidasResponse {
  telas_permitidas: string[];
  id_service: string | null;
  nm_plano: string | null;
}

/**
 * Interface do contexto de telas permitidas
 */
interface TelasPermitidasContextData {
  /**
   * Lista de códigos de telas permitidas para o usuário
   * Se vazia, significa que não há restrições (todas as telas são permitidas)
   */
  telasPermitidas: string[];

  /**
   * ID do plano/service associado ao usuário
   */
  idService: string | null;

  /**
   * Nome do plano do usuário
   */
  nmPlano: string | null;

  /**
   * Indica se está carregando as telas permitidas
   */
  isLoading: boolean;

  /**
   * Erro ao carregar telas permitidas
   */
  error: string | null;

  /**
   * Verifica se uma tela específica está permitida
   * @param cdTela - Código da tela (ex: "profissional/dashboard")
   * @returns true se permitida, false se não
   */
  isTelaPermitida: (cdTela: string) => boolean;

  /**
   * Recarrega as telas permitidas
   */
  refresh: () => Promise<void>;
}

const TelasPermitidasContext = createContext<TelasPermitidasContextData | undefined>(undefined);

interface TelasPermitidasProviderProps {
  children: ReactNode;
}

/**
 * Provider que gerencia as telas permitidas para o usuário logado.
 *
 * Fluxo:
 * 1. Quando o usuário loga, busca as telas permitidas do backend
 * 2. Se a lista estiver vazia, significa que não há restrições
 * 3. Se a lista tiver itens, apenas essas telas são permitidas
 * 4. Os sidebars usam `isTelaPermitida()` para filtrar itens de menu
 */
export function TelasPermitidasProvider({ children }: TelasPermitidasProviderProps) {
  const { data: session, status } = useSession();
  const [telasPermitidas, setTelasPermitidas] = useState<string[]>([]);
  const [idService, setIdService] = useState<string | null>(null);
  const [nmPlano, setNmPlano] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  /**
   * Busca as telas permitidas do backend
   */
  const fetchTelasPermitidas = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/me/telas-permitidas", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar telas permitidas");
      }

      const data: TelasPermitidasResponse = await response.json();

      console.log("[useTelasPermitidas] Telas carregadas:", data);

      setTelasPermitidas(data.telas_permitidas || []);
      setIdService(data.id_service);
      setNmPlano(data.nm_plano);
      setHasFetched(true);
    } catch (err) {
      console.error("[useTelasPermitidas] Erro:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      // Em caso de erro, não restringe nenhuma tela
      setTelasPermitidas([]);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  // Buscar telas quando o usuário logar
  useEffect(() => {
    if (status === "authenticated" && session?.user && !hasFetched) {
      fetchTelasPermitidas();
    } else if (status === "unauthenticated") {
      setTelasPermitidas([]);
      setIdService(null);
      setNmPlano(null);
      setIsLoading(false);
      setHasFetched(false);
    }
  }, [status, session, hasFetched, fetchTelasPermitidas]);

  /**
   * Verifica se uma tela específica está permitida.
   *
   * Lógica:
   * - Se `telasPermitidas` estiver vazia, todas as telas são permitidas
   * - Se `telasPermitidas` tiver itens, verifica se a tela está na lista
   *
   * Conversão de formatos:
   * - URLs do sidebar usam barras: /profissional/dashboard
   * - Códigos no banco usam underscore: profissional_dashboard
   */
  const isTelaPermitida = useCallback((cdTela: string): boolean => {
    // Se ainda está carregando, permite tudo temporariamente
    if (isLoading) return true;

    // Se não há restrições (lista vazia), tudo é permitido
    if (telasPermitidas.length === 0) return true;

    // Normaliza o código da tela (converte / para _ para comparar com banco)
    // Ex: /profissional/dashboard -> profissional_dashboard
    const cdTelaNormalizado = cdTela
      .toLowerCase()
      .replace(/^\//, "")    // Remove barra inicial
      .replace(/\//g, "_");  // Converte barras em underscores

    // Verifica se a tela está na lista de permitidas
    return telasPermitidas.some((tela) => {
      const telaNormalizada = tela
        .toLowerCase()
        .replace(/^\//, "")
        .replace(/\//g, "_");

      return cdTelaNormalizado === telaNormalizada ||
             cdTelaNormalizado.startsWith(telaNormalizada + "_");
    });
  }, [telasPermitidas, isLoading]);

  const refresh = useCallback(async () => {
    setHasFetched(false);
    await fetchTelasPermitidas();
  }, [fetchTelasPermitidas]);

  return (
    <TelasPermitidasContext.Provider
      value={{
        telasPermitidas,
        idService,
        nmPlano,
        isLoading,
        error,
        isTelaPermitida,
        refresh,
      }}
    >
      {children}
    </TelasPermitidasContext.Provider>
  );
}

/**
 * Hook para acessar as telas permitidas do usuário.
 *
 * @example
 * ```tsx
 * const { isTelaPermitida, telasPermitidas, isLoading } = useTelasPermitidas();
 *
 * // Filtrar itens de menu
 * const menuFiltrado = menuItems.filter(item => isTelaPermitida(item.href));
 * ```
 */
export function useTelasPermitidas() {
  const context = useContext(TelasPermitidasContext);
  if (!context) {
    throw new Error("useTelasPermitidas must be used within a TelasPermitidasProvider");
  }
  return context;
}

/**
 * Hook simplificado que só retorna a função de verificação.
 * Útil quando você só precisa verificar permissões sem os outros dados.
 */
export function useIsTelaPermitida() {
  const { isTelaPermitida } = useTelasPermitidas();
  return isTelaPermitida;
}
