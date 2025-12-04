"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LogOut,
  Menu,
  PanelsTopLeft,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type PatientTopNavProps = {
  userName?: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
};

export function PatientTopNav({
  userName,
  onLogout,
  onToggleSidebar,
  isSidebarOpen,
}: PatientTopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Dr. Q AI";

  const firstName =
    (userName && (userName.split(" ")[0] || userName)) || "Paciente";

  const handleToggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleSidebarToggle = () => {
    onToggleSidebar();
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-blue-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSidebarToggle}
            className="rounded-lg p-2 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden"
            aria-label={isSidebarOpen ? "Fechar menu principal" : "Abrir menu principal"}
          >
            <PanelsTopLeft className="h-6 w-6 text-gray-700" />
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-blue-500 transition-colors group-hover:text-blue-600" />
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl transition-all group-hover:bg-blue-600/30" />
            </div>
            <span className="text-lg font-semibold text-gray-900 sm:text-xl">
              {appName}
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <span className="text-sm text-gray-600">
            Olá,&nbsp;
            <span className="font-semibold text-gray-900">{firstName}</span>
          </span>

          <Link href="/paciente/perfil">
            <Button
              variant="outline"
              className="border-blue-200 text-gray-700 hover:border-blue-400 hover:text-blue-600"
            >
              Meu Perfil
            </Button>
          </Link>

          <Button
            onClick={handleLogout}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 transition-colors hover:from-blue-600 hover:to-cyan-700"
          >
            Sair
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/paciente/perfil"
            className="rounded-full p-2 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Ir para o perfil"
          >
            <User className="h-5 w-5 text-gray-700" />
          </Link>
          <button
            type="button"
            onClick={handleToggleMobileMenu}
            className="rounded-lg p-2 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={mobileMenuOpen ? "Fechar navegação" : "Abrir navegação"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-blue-100 bg-white/95 px-4 py-4 text-sm text-gray-700 shadow-lg md:hidden">
          <div className="space-y-3">
            <span className="block text-sm text-gray-600">
              Olá,&nbsp;
              <span className="font-semibold text-gray-900">{firstName}</span>
            </span>
            <Link
              href="/paciente/perfil"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg border border-blue-200 px-3 py-2 text-center transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              Meu Perfil
            </Link>
            <Button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-cyan-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
