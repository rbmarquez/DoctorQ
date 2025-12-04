// src/app/layout/MinimalLayout.tsx
"use client";

import UserLayout from "./UserLayout";
import MainLayout from "./MainLayout";
import { useAuth } from "@/hooks/useAuth";
import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface MinimalLayoutProps {
  children: ReactNode;
}

const MinimalLayout: React.FC<MinimalLayoutProps> = ({ children }) => {
  const { role, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const normalizedRole = role?.toString().toLowerCase();

  const PUBLIC_ROUTES = new Set<string>([
    "/",
    "/login",
    "/cadastro",
    "/registro",
    "/sobre",
    "/contato",
    "/busca",
    "/profissionais",
    "/procedimentos",
    "/marketplace",
    "/produtos",
    "/redefinir-senha",
    "/esqueci-senha",
    "/ajuda",
    "/blog",
    "/legal",
  ]);

  // Verificar se a rota atual é pública ou começa com um prefixo público
  const isPublicRoute = PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith("/carreiras") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/produtos") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/busca") ||
    pathname.startsWith("/profissionais") ||
    pathname.startsWith("/procedimentos");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se usuário tem role "usuario", usar UserLayout
  if (isAuthenticated && role === "usuario") {
    return <UserLayout>{children}</UserLayout>;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const isAdminRole = ["admin", "administrador", "administrator", "superadmin"].includes(
    normalizedRole ?? ""
  );

  if (isAdminRole) {
    return <>{children}</>;
  }

  // Para outras roles (admin, etc) ou não autenticados, usar MainLayout
  return <MainLayout>{children}</MainLayout>;
};

export default MinimalLayout;
