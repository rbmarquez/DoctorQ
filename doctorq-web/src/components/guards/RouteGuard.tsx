"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTelasPermitidas } from "@/hooks/useTelasPermitidas";
import { useSession } from "next-auth/react";

interface RouteGuardProps {
  children: React.ReactNode;
  /** URL para redirecionar se não tiver permissão (default: dashboard do usuário) */
  fallbackUrl?: string;
}

/**
 * Rotas de sistema que SEMPRE são permitidas, independente do plano.
 * Inclui: onboarding, login, configurações essenciais, etc.
 */
const ALWAYS_ALLOWED_ROUTES = [
  "/login",
  "/registro",
  "/logout",
  "/oauth-callback",
  "/onboarding",
  "/profissional/onboarding",
  "/clinica/onboarding",
  "/paciente/onboarding",
  "/fornecedor/onboarding",
  "/admin/onboarding",
  "/perfil",
  "/configuracoes",
  "/profissional/perfil",
  "/profissional/configuracoes",
  "/clinica/perfil",
  "/clinica/configuracoes",
  "/paciente/perfil",
  "/paciente/configuracoes",
  "/fornecedor/perfil",
  "/fornecedor/configuracoes",
];

/**
 * Verifica se uma rota é sempre permitida (rotas de sistema)
 */
function isAlwaysAllowedRoute(pathname: string): boolean {
  return ALWAYS_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

/**
 * Componente que protege rotas baseado nas telas permitidas pelo plano.
 *
 * Uso: Envolva páginas ou layouts que precisam de proteção por plano.
 *
 * Fluxo:
 * 1. Verifica se o usuário está autenticado
 * 2. Verifica se a rota é uma rota de sistema (sempre permitida)
 * 3. Verifica se a rota atual está nas telas permitidas
 * 4. Se não estiver, redireciona para o fallbackUrl ou dashboard padrão
 *
 * @example
 * ```tsx
 * // Em um layout.tsx
 * export default function ProfissionalLayout({ children }) {
 *   return (
 *     <RouteGuard fallbackUrl="/profissional/dashboard">
 *       {children}
 *     </RouteGuard>
 *   );
 * }
 * ```
 */
export function RouteGuard({ children, fallbackUrl }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { isTelaPermitida, telasPermitidas, isLoading } = useTelasPermitidas();

  useEffect(() => {
    // Aguardar carregamento
    if (isLoading || status === "loading") return;

    // Se não autenticado, o middleware já cuida do redirect
    if (status !== "authenticated") return;

    // Rotas de sistema são SEMPRE permitidas (onboarding, perfil, etc.)
    if (isAlwaysAllowedRoute(pathname)) {
      console.log("[RouteGuard] Rota de sistema sempre permitida:", pathname);
      return;
    }

    // Se não há restrições (lista vazia), permite tudo
    if (telasPermitidas.length === 0) return;

    // Verificar se a tela atual está permitida
    if (!isTelaPermitida(pathname)) {
      console.log("[RouteGuard] Acesso negado à tela:", pathname);
      console.log("[RouteGuard] Telas permitidas:", telasPermitidas);

      // Determinar URL de fallback
      const redirectUrl = fallbackUrl || getDashboardForPath(pathname);

      // Evitar loop infinito - só redireciona se o destino for diferente E permitido
      if (redirectUrl !== pathname && isTelaPermitida(redirectUrl)) {
        router.replace(redirectUrl);
      } else {
        console.log("[RouteGuard] Redirect evitado para prevenir loop:", redirectUrl);
      }
    }
  }, [pathname, isTelaPermitida, telasPermitidas, isLoading, status, router, fallbackUrl]);

  // Mostrar loading enquanto verifica
  if (isLoading || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  // Rotas de sistema são sempre renderizadas
  if (isAlwaysAllowedRoute(pathname)) {
    return <>{children}</>;
  }

  // Se não tem permissão, não renderizar (vai redirecionar)
  if (status === "authenticated" && telasPermitidas.length > 0 && !isTelaPermitida(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Determina o dashboard padrão baseado no path atual
 */
function getDashboardForPath(pathname: string): string {
  if (pathname.startsWith("/profissional")) {
    return "/profissional/dashboard";
  }
  if (pathname.startsWith("/clinica")) {
    return "/clinica/dashboard";
  }
  if (pathname.startsWith("/paciente")) {
    return "/paciente/dashboard";
  }
  if (pathname.startsWith("/fornecedor")) {
    return "/fornecedor/dashboard";
  }
  if (pathname.startsWith("/admin")) {
    return "/admin/dashboard";
  }
  // Fallback genérico
  return "/";
}

export default RouteGuard;
