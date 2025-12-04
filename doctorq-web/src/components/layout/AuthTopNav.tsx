"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X, ChevronDown, LogOut } from "lucide-react";
import type { UserType } from "@/types/auth";

type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

const generalNavigation: NavItem[] = [
  { label: "Procedimentos", href: "/#procedimentos" },
  { label: "Clínicas", href: "/#clinicas" },
  { label: "Profissionais", href: "/#profissionais" },
  { label: "Produtos & Equipamentos", href: "/#produtos" },
  { label: "Seja Parceiro", href: "/parceiros" },
];

const areaLinksByType: Record<UserType, NavItem[]> = {
  cliente: [
    { label: "Dashboard", href: "/paciente/dashboard" },
    { label: "Agendamentos", href: "/paciente/agendamentos" },
    { label: "Favoritos", href: "/paciente/favoritos" },
    { label: "Atendimento Humano", href: "/paciente/atendimento" },
    { label: "Perfil", href: "/paciente/perfil" },
  ],
  profissional: [
    { label: "Dashboard", href: "/profissional/dashboard" },
    { label: "Agenda", href: "/profissional/agenda" },
    { label: "Pacientes", href: "/profissional/pacientes" },
    { label: "Atendimento Humano", href: "/profissional/atendimento" },
    { label: "Financeiro", href: "/profissional/financeiro" },
  ],
  fornecedor: [
    { label: "Dashboard", href: "/fornecedor/dashboard" },
    { label: "Produtos", href: "/fornecedor/produtos" },
    { label: "Pedidos", href: "/fornecedor/pedidos" },
    { label: "Atendimento Humano", href: "/fornecedor/atendimento" },
    { label: "Promoções", href: "/fornecedor/promocoes" },
  ],
  administrador: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Usuários", href: "/admin/usuarios" },
    { label: "Clínicas", href: "/admin/clinicas" },
    { label: "Procedimentos", href: "/admin/procedimentos" },
    { label: "Configurações", href: "/admin/configuracoes" },
  ],
};

type AuthTopNavProps = {
  userName?: string;
  userType: UserType;
  onLogout: () => void;
};

export function AuthTopNav({ userName = "Usuário", userType, onLogout }: AuthTopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const projectName = process.env.NEXT_PUBLIC_APP_NAME || "Projeto DoctorQ";
  const areaLinks = areaLinksByType[userType] ?? areaLinksByType.cliente;

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-blue-500 transition-colors group-hover:text-blue-600" />
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl group-hover:bg-blue-600/30" />
            </div>
            <span className="text-lg font-semibold text-gray-900">{projectName}</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 md:flex">
          {generalNavigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-blue-400 hover:text-blue-600"
            >
              <span className="hidden sm:inline">{userName}</span>
              <span className="inline sm:hidden">{userName.split(" ")[0]}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-blue-100 bg-white p-3 shadow-lg">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-blue-400">
                  Área autenticada
                </p>
                <div className="mt-2 space-y-1.5">
                  {areaLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-xl px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-3 border-t border-blue-100 pt-3">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={toggleMobile}
          className="rounded-lg p-2 transition-colors hover:bg-blue-50 md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-blue-100 bg-white/95 px-4 py-4 text-sm text-gray-700 shadow-lg md:hidden">
          <div className="space-y-2">
            {generalNavigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={toggleMobile}
                className="block rounded-xl px-3 py-2 transition-colors hover:bg-blue-50 hover:text-blue-600"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-blue-400">
              Área autenticada
            </p>
            <div className="mt-2 space-y-2">
              {areaLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={toggleMobile}
                  className="block rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-blue-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                toggleMobile();
                onLogout();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
