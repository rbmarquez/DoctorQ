"use client";

// Este componente foi substituído pelo AppSidebar principal
// Mantido apenas para retrocompatibilidade com AuthenticatedLayout

import { AppSidebar } from "@/components/sidebar";

interface AdministradorSidebarProps {
  fallbackUser?: any;
  onSignOut?: () => void;
}

export function AdministradorSidebar({
  fallbackUser,
  onSignOut,
}: AdministradorSidebarProps = {}) {
  // O novo AppSidebar gerencia sua própria lógica de autenticação e logout
  return <AppSidebar />;
}
