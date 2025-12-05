"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Heart,
  Star,
  User,
  ShoppingCart,
  Package,
  MessageSquare,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Image as ImageIcon,
  Wallet,
  Search,
} from "lucide-react";
import { useUserType } from "@/contexts/UserTypeContext";
import { useTelasPermitidas } from "@/hooks/useTelasPermitidas";
import type { UserType } from "@/types/auth";
import { useMemo } from "react";

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

interface ClienteSidebarProps {
  fallbackUser?: SidebarUser | null;
  onSignOut?: () => void;
}

// Definir menus FORA do componente para evitar re-criação a cada render
const BASE_MENU_ITEMS: MenuItem[] = [
  { label: "Dashboard", href: "/paciente/dashboard", icon: LayoutDashboard },
  { label: "Busca Inteligente", href: "/paciente/busca-inteligente", icon: Search },
  { label: "Procedimentos", href: "/paciente/procedimentos", icon: Sparkles },
  { label: "Meus Agendamentos", href: "/paciente/agendamentos", icon: Calendar, badge: 2 },
  { label: "Minhas Avaliações", href: "/paciente/avaliacoes", icon: Star },
  { label: "Galeria de Fotos", href: "/paciente/fotos", icon: ImageIcon },
  { label: "Favoritos", href: "/paciente/favoritos", icon: Heart },
  { label: "Carrinho", href: "/marketplace/carrinho", icon: ShoppingCart },
  { label: "Meus Pedidos", href: "/paciente/pedidos", icon: Package },
  { label: "Financeiro", href: "/paciente/financeiro", icon: Wallet },
  { label: "Atendimento Humano", href: "/paciente/atendimento", icon: MessageSquare, badge: 3 },
  { label: "Pagamentos", href: "/paciente/pagamentos", icon: CreditCard },
  { label: "Notificações", href: "/paciente/notificacoes", icon: Bell },
];

const BOTTOM_MENU_ITEMS: MenuItem[] = [
  { label: "Meu Perfil", href: "/paciente/perfil", icon: User },
  { label: "Configurações", href: "/paciente/configuracoes", icon: Settings },
];

export function ClienteSidebar({ fallbackUser, onSignOut }: ClienteSidebarProps = {}) {
  const pathname = usePathname();
  const { user, logout } = useUserType();
  const { isTelaPermitida, telasPermitidas } = useTelasPermitidas();
  const resolvedUser = (user as SidebarUser | null) ?? fallbackUser ?? null;
  const handleLogout = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      logout();
    }
  };

  // Filtrar itens de menu baseado nas permissões do plano
  const menuItems = useMemo(() => {
    if (telasPermitidas.length === 0) return BASE_MENU_ITEMS;
    return BASE_MENU_ITEMS.filter((item) => isTelaPermitida(item.href));
  }, [telasPermitidas, isTelaPermitida]);

  const bottomMenuItems = useMemo(() => {
    if (telasPermitidas.length === 0) return BOTTOM_MENU_ITEMS;
    return BOTTOM_MENU_ITEMS.filter((item) => isTelaPermitida(item.href));
  }, [telasPermitidas, isTelaPermitida]);

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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-lg font-bold text-white">
              {resolvedUser?.nm_completo.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {resolvedUser?.nm_completo}
            </p>
            <p className="text-xs text-gray-500">Cliente</p>
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
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
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
                      active ? "bg-white text-blue-600" : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
          <div className="mb-2 flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Ação rápida</h3>
          </div>
          <p className="mb-3 text-xs text-gray-600">Encontre procedimentos e profissionais</p>
          <div className="space-y-2">
            <Link
              href="/procedimentos"
              className="block w-full rounded-lg border border-blue-300 px-3 py-2 text-center text-xs font-medium transition-colors hover:bg-blue-50"
            >
              Buscar procedimentos
            </Link>
            <Link
              href="/profissionais"
              className="block w-full rounded-lg border border-purple-300 px-3 py-2 text-center text-xs font-medium transition-colors hover:bg-purple-50"
            >
              Buscar profissionais
            </Link>
          </div>
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
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
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
