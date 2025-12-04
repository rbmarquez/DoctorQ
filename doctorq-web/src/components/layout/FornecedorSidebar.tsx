"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  ClipboardList,
  Truck,
  BarChart3,
  Wallet,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  ShoppingCart,
  Users,
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

interface FornecedorSidebarProps {
  fallbackUser?: SidebarUser | null;
  onSignOut?: () => void;
}

export function FornecedorSidebar({ fallbackUser, onSignOut }: FornecedorSidebarProps = {}) {
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
    { label: "Dashboard", href: "/fornecedor/dashboard", icon: LayoutDashboard },
    { label: "Catálogo de Produtos", href: "/fornecedor/produtos", icon: PackageSearch },
    { label: "Pedidos", href: "/fornecedor/pedidos", icon: ClipboardList, badge: 4 },
    { label: "Logística", href: "/fornecedor/logistica", icon: Truck },
    { label: "Financeiro", href: "/fornecedor/financeiro", icon: Wallet },
    { label: "Relatórios", href: "/fornecedor/relatorios", icon: BarChart3 },
    { label: "Atendimento Humano", href: "/fornecedor/atendimento", icon: MessageCircle, badge: 2 },
    { label: "Notificações", href: "/fornecedor/notificacoes", icon: Bell },
    { label: "Clientes", href: "/fornecedor/clientes", icon: Users },
    { label: "Marketplace", href: "/marketplace/produtos", icon: ShoppingCart },
  ];

  const bottomMenuItems: MenuItem[] = [
    { label: "Perfil da Empresa", href: "/fornecedor/perfil", icon: Settings },
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-lg font-bold text-white">
              {resolvedUser?.nm_completo.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {resolvedUser?.nm_completo}
            </p>
            <p className="text-xs text-gray-500">Fornecedor DoctorQ</p>
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
                    ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md"
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
                      active ? "bg-white text-emerald-600" : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
          <div className="mb-2 flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-900">Insights de vendas</h3>
          </div>
          <p className="mb-3 text-xs text-gray-600">
            Analise o desempenho dos seus produtos na plataforma DoctorQ.
          </p>
          <Link
            href="/fornecedor/relatorios"
            className="block w-full rounded-lg border border-emerald-300 px-3 py-2 text-center text-xs font-medium transition-colors hover:bg-emerald-50"
          >
            Ver insights
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
                    ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md"
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
