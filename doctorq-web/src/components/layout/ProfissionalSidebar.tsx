"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  FileText,
  BarChart3,
  Wallet,
  Settings,
  MessageCircle,
  Bell,
  LogOut,
  ClipboardCheck,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useUserType } from "@/contexts/UserTypeContext";
import type { UserType } from "@/types/auth";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

type SidebarUser = {
  nm_completo: string;
  nm_email: string;
  ds_tipo_usuario: UserType;
  ds_foto_url?: string;
};

interface ProfissionalSidebarProps {
  fallbackUser?: SidebarUser | null;
  onSignOut?: () => void;
}

export function ProfissionalSidebar({ fallbackUser, onSignOut }: ProfissionalSidebarProps = {}) {
  const pathname = usePathname();
  const { user, logout } = useUserType();
  const resolvedUser = (user as SidebarUser | null) ?? fallbackUser ?? null;
  const handleLogout = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      logout();
    }
  };

  const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/profissional/dashboard", icon: LayoutDashboard },
    { label: "Agenda", href: "/profissional/agenda", icon: CalendarCheck, badge: 5 },
    { label: "Pacientes", href: "/profissional/pacientes", icon: Users },
    { label: "Procedimentos", href: "/profissional/procedimentos", icon: Sparkles },
    { label: "Prontuários", href: "/profissional/prontuarios", icon: ClipboardCheck },
    { label: "Relatórios", href: "/profissional/relatorios", icon: BarChart3 },
    { label: "Financeiro", href: "/profissional/financeiro", icon: Wallet },
    { label: "Atendimento Humano", href: "/profissional/atendimento", icon: MessageCircle, badge: 4 },
    { label: "Notificações", href: "/profissional/notificacoes", icon: Bell },
    { label: "Loja DoctorQ", href: "/marketplace/produtos", icon: ShoppingBag },
  ];

  const bottomMenuItems: MenuItem[] = [
    { label: "Perfil Profissional", href: "/profissional/perfil", icon: FileText },
    { label: "Configurações", href: "/profissional/configuracoes", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          {resolvedUser?.ds_foto_url ? (
            <img
              src={resolvedUser.ds_foto_url}
              alt={resolvedUser.nm_completo}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-lg font-bold text-white">
              {resolvedUser?.nm_completo.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {resolvedUser?.nm_completo}
            </p>
            <p className="text-xs text-gray-500">Profissional DoctorQ</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-4 py-3 transition-all ${
                  active
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      active ? "bg-white text-purple-600" : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
          <div className="mb-2 flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900">Painel de desempenho</h3>
          </div>
          <p className="mb-3 text-xs text-gray-600">
            Acompanhe os principais indicadores do seu consultório.
          </p>
          <Link
            href="/profissional/relatorios"
            className="block w-full rounded-lg border border-purple-300 px-3 py-2 text-center text-xs font-medium transition-colors hover:bg-purple-50"
          >
            Ver relatórios
          </Link>
        </div>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-2 space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all ${
                  active
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-red-600 transition-all hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
