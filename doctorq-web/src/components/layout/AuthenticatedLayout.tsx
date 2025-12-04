"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";

import { useUserType } from "@/contexts/UserTypeContext";
import type { UserType } from "@/types/auth";

import { ClienteSidebar } from "./ClienteSidebar";
import { ProfissionalSidebar } from "./ProfissionalSidebar";
import { FornecedorSidebar } from "./FornecedorSidebar";
import { AppSidebar } from "@/components/sidebar";
import { MarketplaceHighlights } from "@/components/marketplace/MarketplaceHighlights";
import { PatientTopNav } from "./PatientTopNav";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { data: session, status } = useSession();
  const { user, isAuthenticated, isLoading, logout } = useUserType();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Escutar mudanças no estado do sidebar via localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    };

    // Verificar estado inicial
    checkSidebarState();

    // Escutar mudanças no storage
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sidebar-collapsed") {
        checkSidebarState();
      }
    };

    window.addEventListener("storage", handleStorage);

    // Escutar mudanças no mesmo tab via custom event
    const handleCustomStorage = () => checkSidebarState();
    window.addEventListener("sidebar-change", handleCustomStorage);

    // Polling para detectar mudanças (fallback)
    const interval = setInterval(checkSidebarState, 100);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("sidebar-change", handleCustomStorage);
      clearInterval(interval);
    };
  }, []);

  const sessionUserType = (session?.user?.role || "")
    .toString()
    .toLowerCase() as UserType;

  const fallbackUser =
    session && session.user
      ? {
          id_user: (session.user.id as string) || "session-user",
          nm_completo:
            session.user.name || session.user.email || "Usuário DoctorQ",
          nm_email: session.user.email || "",
          ds_tipo_usuario: ([
            "cliente",
            "profissional",
            "fornecedor",
            "administrador",
            "admin",
          ].includes(sessionUserType)
            ? sessionUserType === "admin"
              ? "administrador"
              : sessionUserType
            : "cliente") as UserType,
          st_ativo: true,
          dt_criacao: new Date().toISOString(),
          dt_ultimo_acesso: new Date().toISOString(),
          ds_foto_url: (session.user as any)?.image ?? undefined,
        }
      : null;

  const resolvedUser = user ?? fallbackUser;
  const resolvedUserType = resolvedUser?.ds_tipo_usuario ?? "cliente";
  const authLoading = isLoading || status === "loading";
  const isSessionAuthenticated = status === "authenticated";
  const effectiveAuthenticated =
    isAuthenticated || (!!resolvedUser && isSessionAuthenticated);

  // Verificar se é admin
  const isAdmin = resolvedUserType === "administrador" || sessionUserType === "admin";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!effectiveAuthenticated || !resolvedUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Acesso restrito
          </h2>
          <p className="mb-6 text-center text-gray-600">
            Você precisa estar autenticado para acessar esta página.
          </p>
          <a
            href="/login"
            className="block w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-center font-medium text-white transition-all hover:from-blue-700 hover:to-cyan-700"
          >
            Fazer login
          </a>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    if (user) {
      logout();
    }
    if (isSessionAuthenticated) {
      signOut({ callbackUrl: "/login" });
    }
  };

  const renderSidebar = () => {
    switch (resolvedUserType) {
      case "cliente":
        return (
          <ClienteSidebar
            onSignOut={handleLogout}
            fallbackUser={resolvedUser}
          />
        );
      case "profissional":
        return (
          <ProfissionalSidebar
            onSignOut={handleLogout}
            fallbackUser={resolvedUser}
          />
        );
      case "fornecedor":
        return (
          <FornecedorSidebar
            onSignOut={handleLogout}
            fallbackUser={resolvedUser}
          />
        );
      case "administrador":
        // Admin usa o novo AppSidebar que é fixo e gerencia seu próprio estado
        return null;
      default:
        return (
          <ClienteSidebar
            onSignOut={handleLogout}
            fallbackUser={resolvedUser}
          />
        );
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  // Layout específico para administrador com novo sidebar fixo
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar fixo */}
        <AppSidebar />

        {/* Conteúdo principal com margem dinâmica */}
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            marginLeft: sidebarCollapsed ? "5rem" : "18rem",
          }}
        >
          {/* Header mobile */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 lg:hidden">
            <button
              onClick={toggleMobileSidebar}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <h1 className="text-lg font-bold text-gray-900">DoctorQ</h1>
            <span className="w-10" />
          </div>

          {/* Conteúdo */}
          <main className="min-h-screen p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Layout para outros tipos de usuário (cliente, profissional, fornecedor)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="flex h-screen overflow-hidden">
        <div className="hidden w-80 flex-shrink-0 lg:block">{renderSidebar()}</div>

        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-80 lg:hidden">
              {renderSidebar()}
            </div>
          </>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          {resolvedUserType === "cliente" ? (
            <PatientTopNav
              userName={resolvedUser.nm_completo}
              onLogout={handleLogout}
              onToggleSidebar={toggleMobileSidebar}
              isSidebarOpen={isMobileMenuOpen}
            />
          ) : (
            <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 lg:hidden">
              <button
                onClick={toggleMobileSidebar}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <h1 className="text-lg font-bold text-gray-900">DoctorQ</h1>
              <span className="w-10" />
            </div>
          )}

          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
            {resolvedUserType === "cliente" ? (
              <div className="px-4 pb-8 pt-6 sm:px-6 lg:px-8">{children}</div>
            ) : (
              children
            )}
            {resolvedUserType === "profissional" && (
              <div className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">
                <MarketplaceHighlights />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
