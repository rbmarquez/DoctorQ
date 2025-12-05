"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  UserPlus,
  Calendar,
  Briefcase,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  MessageSquare,
  TrendingUp,
  UserSearch,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";
import { useAgendamentos } from "@/lib/api/hooks/useAgendamentos";
import { useTelasPermitidas } from "@/hooks/useTelasPermitidas";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

// Definir menus FORA do componente para evitar re-criação a cada render
const BASE_MENU_ITEMS: Omit<MenuItem, 'badge'>[] = [
  {
    label: "Dashboard",
    href: "/clinica/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Agendamentos",
    href: "/clinica/agendamentos",
    icon: Calendar,
  },
  {
    label: "Equipe",
    href: "/clinica/equipe",
    icon: Users,
  },
  {
    label: "Perfis e Permissões",
    href: "/clinica/perfis",
    icon: Shield,
  },
  {
    label: "Profissionais",
    href: "/clinica/profissionais",
    icon: UserPlus,
  },
  {
    label: "Procedimentos",
    href: "/clinica/procedimentos",
    icon: Briefcase,
  },
  {
    label: "Vagas de Emprego",
    href: "/clinica/vagas",
    icon: UserSearch,
  },
  {
    label: "Atendimento Humano",
    href: "/clinica/atendimento",
    icon: MessageSquare,
  },
  {
    label: "Financeiro",
    href: "/clinica/financeiro",
    icon: DollarSign,
  },
  {
    label: "Relatórios",
    href: "/clinica/relatorios",
    icon: TrendingUp,
  },
];

const BOTTOM_MENU_ITEMS: MenuItem[] = [
  {
    label: "Configurações",
    href: "/clinica/configuracoes",
    icon: Settings,
  },
];

export function ClinicaSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isTelaPermitida, telasPermitidas } = useTelasPermitidas();

  // Buscar agendamentos de hoje para badges
  const hoje = new Date().toISOString().split('T')[0];
  const { agendamentos: agendamentosHoje = [] } = useAgendamentos({
    data_inicio: hoje,
    data_fim: hoje,
  });

  // Calcular badges e stats
  const stats = useMemo(() => {
    const total = agendamentosHoje.length;
    const receitaHoje = agendamentosHoje
      .filter((a) => a.ds_status === 'concluido' && a.vl_valor)
      .reduce((acc, a) => acc + (a.vl_valor || 0), 0);

    return {
      agendamentos: total,
      receita: receitaHoje,
    };
  }, [agendamentosHoje]);

  // Filtrar itens de menu baseado nas permissões do plano
  // E adicionar badges dinamicamente
  const menuItems = useMemo(() => {
    // Adicionar badges aos itens base
    const itemsComBadges: MenuItem[] = BASE_MENU_ITEMS.map((item) => ({
      ...item,
      badge: item.href === "/clinica/agendamentos" ? stats.agendamentos : undefined,
    }));

    // Se não há restrições (lista vazia), mostra todos os itens
    if (telasPermitidas.length === 0) return itemsComBadges;
    return itemsComBadges.filter((item) => isTelaPermitida(item.href));
  }, [telasPermitidas, isTelaPermitida, stats.agendamentos]);

  const bottomMenuItems = useMemo(() => {
    if (telasPermitidas.length === 0) return BOTTOM_MENU_ITEMS;
    return BOTTOM_MENU_ITEMS.filter((item) => isTelaPermitida(item.href));
  }, [telasPermitidas, isTelaPermitida]);

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Usuário"}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || "Usuário"}
            </p>
            <p className="text-xs text-gray-500">Gestão da Clínica</p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
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

        {/* Quick Stats */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Hoje</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600">Agendamentos</p>
              <p className="text-lg font-bold text-gray-900">{stats.agendamentos}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600">Faturamento</p>
              <p className="text-lg font-bold text-gray-900">
                R$ {stats.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-1 mb-2">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}
