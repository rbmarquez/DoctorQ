// src/components/sidebar.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { cn } from "@/lib/utils";
import {
  Key,
  Table,
  Shield,
  Wrench,
  Bot,
  User,
  Building2,
  MessageSquare,
  CreditCard,
  Receipt,
  Package,
  LayoutDashboard,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  ShoppingBag,
  TrendingUp,
  ClipboardList,
  UserCog,
  Star,
  Ticket,
  Boxes,
  FileSpreadsheet,
  Bell,
  ShieldCheck,
  Zap,
  Activity,
  Film,
  GraduationCap,
  Headphones,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { signOut } from "next-auth/react";

// =============================================================================
// TIPOS
// =============================================================================

interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon: any;
  permission?: string; // Permissão necessária (ex: "central_atendimento_visualizar")
  badge?: number; // Badge opcional (ex: contagem de notificações)
}

interface MenuGroup {
  id: string;
  label: string;
  permission?: string; // Permissão para ver o grupo inteiro
  items: MenuItem[];
}

// =============================================================================
// CONFIGURAÇÃO DO MENU
// Simplificado: baseado APENAS em permissões (ds_permissoes do perfil)
// =============================================================================

const menuConfig: MenuGroup[] = [
  // Dashboard principal (sem grupo)
  {
    id: "main",
    label: "",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        permission: "dashboard_visualizar",
      },
    ],
  },

  // GESTÃO
  {
    id: "gestao",
    label: "Gestão",
    permission: "usuarios_visualizar",
    items: [
      {
        id: "usuarios",
        title: "Usuários",
        href: "/admin/usuarios",
        icon: Users,
        permission: "usuarios_visualizar",
      },
      {
        id: "empresas",
        title: "Empresas",
        href: "/admin/empresas",
        icon: Building2,
        permission: "empresas_visualizar",
      },
      {
        id: "perfis",
        title: "Perfis",
        href: "/admin/perfis",
        icon: Shield,
        permission: "perfis_visualizar",
      },
      {
        id: "clinicas",
        title: "Clínicas",
        href: "/admin/clinicas",
        icon: Stethoscope,
        permission: "clinicas_visualizar",
      },
      {
        id: "profissionais",
        title: "Profissionais",
        href: "/admin/profissionais",
        icon: UserCog,
        permission: "profissionais_visualizar",
      },
      {
        id: "pacientes",
        title: "Pacientes",
        href: "/admin/pacientes",
        icon: User,
        permission: "pacientes_visualizar",
      },
    ],
  },

  // CENTRAL DE ATENDIMENTO
  {
    id: "central-atendimento",
    label: "Central de Atendimento",
    permission: "central_atendimento_visualizar",
    items: [
      {
        id: "ca-conversas",
        title: "Conversas",
        href: "/admin/central-atendimento",
        icon: MessageSquare,
        permission: "central_atendimento_visualizar",
      },
      {
        id: "ca-dashboard",
        title: "Dashboard",
        href: "/admin/central-atendimento/dashboard",
        icon: BarChart3,
        permission: "central_atendimento_visualizar",
      },
      {
        id: "ca-canais",
        title: "Canais",
        href: "/admin/central-atendimento/canais",
        icon: Headphones,
        permission: "central_atendimento_visualizar",
      },
      {
        id: "ca-filas",
        title: "Filas",
        href: "/admin/central-atendimento/filas",
        icon: Users,
        permission: "central_atendimento_visualizar",
      },
      {
        id: "ca-campanhas",
        title: "Campanhas",
        href: "/admin/central-atendimento/campanhas",
        icon: Zap,
        permission: "central_atendimento_visualizar",
      },
      {
        id: "ca-relatorios",
        title: "Relatórios",
        href: "/admin/central-atendimento/relatorios",
        icon: FileSpreadsheet,
        permission: "central_atendimento_visualizar",
      },
      {
        id: "ca-config",
        title: "Configurações",
        href: "/admin/central-atendimento/configuracoes",
        icon: Settings,
        permission: "central_atendimento_visualizar",
      },
    ],
  },

  // INTELIGÊNCIA ARTIFICIAL
  {
    id: "ia",
    label: "Inteligência Artificial",
    permission: "agentes_visualizar",
    items: [
      {
        id: "agentes",
        title: "Agentes",
        href: "/admin/agentes",
        icon: Bot,
        permission: "agentes_visualizar",
      },
      {
        id: "conversas-ia",
        title: "Conversas",
        href: "/admin/conversas",
        icon: MessageSquare,
        permission: "conversas_visualizar",
      },
      {
        id: "knowledge",
        title: "Base de Conhecimento",
        href: "/admin/knowledge",
        icon: BookOpen,
        permission: "agentes_visualizar",
      },
      {
        id: "tools",
        title: "Tools",
        href: "/admin/tools",
        icon: Wrench,
        permission: "agentes_visualizar",
      },
      {
        id: "analytics-ia",
        title: "Analytics IA",
        href: "/admin/ia/analytics",
        icon: BarChart3,
        permission: "agentes_visualizar",
      },
    ],
  },

  // MARKETPLACE
  {
    id: "marketplace",
    label: "Marketplace",
    permission: "marketplace_visualizar",
    items: [
      {
        id: "produtos",
        title: "Produtos",
        href: "/admin/produtos",
        icon: ShoppingBag,
        permission: "marketplace_visualizar",
      },
      {
        id: "fornecedores",
        title: "Fornecedores",
        href: "/admin/fornecedores",
        icon: Boxes,
        permission: "marketplace_visualizar",
      },
      {
        id: "pedidos",
        title: "Pedidos",
        href: "/admin/pedidos",
        icon: ClipboardList,
        permission: "marketplace_visualizar",
      },
      {
        id: "cupons",
        title: "Cupons",
        href: "/admin/marketplace/cupons",
        icon: Ticket,
        permission: "marketplace_gerenciar",
      },
      {
        id: "avaliacoes",
        title: "Avaliações",
        href: "/admin/avaliacoes",
        icon: Star,
        permission: "marketplace_visualizar",
      },
    ],
  },

  // CLÍNICA
  {
    id: "clinica",
    label: "Clínica",
    permission: "agendamentos_visualizar",
    items: [
      {
        id: "agendamentos",
        title: "Agendamentos",
        href: "/admin/clinica/agendamentos",
        icon: Calendar,
        permission: "agendamentos_visualizar",
      },
      {
        id: "procedimentos",
        title: "Procedimentos",
        href: "/admin/procedimentos",
        icon: FileText,
        permission: "agendamentos_visualizar",
      },
      {
        id: "atendimento-humano",
        title: "Atendimento Humano",
        href: "/admin/atendimento",
        icon: MessageSquare,
        permission: "central_atendimento_visualizar",
      },
    ],
  },

  // FINANCEIRO
  {
    id: "financeiro",
    label: "Financeiro",
    permission: "financeiro_visualizar",
    items: [
      {
        id: "billing",
        title: "Billing",
        href: "/admin/billing",
        icon: CreditCard,
        permission: "financeiro_visualizar",
      },
      {
        id: "faturas",
        title: "Faturas",
        href: "/admin/billing/faturas",
        icon: Receipt,
        permission: "financeiro_visualizar",
      },
      {
        id: "relatorios-fin",
        title: "Relatórios",
        href: "/admin/relatorios",
        icon: FileSpreadsheet,
        permission: "relatorios_visualizar",
      },
    ],
  },

  // UNIVERSIDADE
  {
    id: "universidade",
    label: "Universidade",
    permission: "universidade_visualizar",
    items: [
      {
        id: "videos",
        title: "Vídeos",
        href: "/admin/universidade/videos",
        icon: Film,
        permission: "universidade_visualizar",
      },
      {
        id: "cursos",
        title: "Cursos",
        href: "/admin/universidade/cursos",
        icon: GraduationCap,
        permission: "universidade_visualizar",
      },
    ],
  },

  // PROGRAMA DE PARCEIROS
  {
    id: "parceiros",
    label: "Programa de Parceiros",
    permission: "parceiros_visualizar",
    items: [
      {
        id: "leads",
        title: "Leads",
        href: "/admin/partner/leads",
        icon: TrendingUp,
        permission: "parceiros_visualizar",
      },
      {
        id: "perguntas-leads",
        title: "Perguntas de Leads",
        href: "/admin/partner/lead-questions",
        icon: ClipboardList,
        permission: "parceiros_visualizar",
      },
      {
        id: "planos",
        title: "Planos",
        href: "/admin/partner/planos",
        icon: Package,
        permission: "parceiros_visualizar",
      },
      {
        id: "licencas",
        title: "Licenças",
        href: "/admin/licencas",
        icon: ShieldCheck,
        permission: "parceiros_visualizar",
      },
    ],
  },

  // SISTEMA
  {
    id: "sistema",
    label: "Sistema",
    permission: "sistema_visualizar",
    items: [
      {
        id: "apikeys",
        title: "API Keys",
        href: "/admin/apikeys",
        icon: Key,
        permission: "sistema_visualizar",
      },
      {
        id: "credenciais",
        title: "Credenciais",
        href: "/admin/credenciais",
        icon: Key,
        permission: "sistema_visualizar",
      },
      {
        id: "variaveis",
        title: "Variáveis",
        href: "/admin/variaveis",
        icon: Table,
        permission: "sistema_visualizar",
      },
      {
        id: "configuracoes",
        title: "Configurações",
        href: "/admin/configuracoes",
        icon: Settings,
        permission: "configuracoes_visualizar",
      },
      {
        id: "integracoes",
        title: "Integrações",
        href: "/admin/sistema/integracoes",
        icon: Zap,
        permission: "sistema_visualizar",
      },
      {
        id: "logs",
        title: "Logs",
        href: "/admin/sistema/logs",
        icon: Activity,
        permission: "sistema_visualizar",
      },
    ],
  },
];

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface SidebarProps {
  className?: string;
}

export function AppSidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading, perfilName } = useUserPermissions();

  // Estado do sidebar (expandido/colapsado)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Estado dos grupos expandidos
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Carregar estados do localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }

    const savedGroups = localStorage.getItem("sidebar-expanded-groups");
    if (savedGroups) {
      try {
        setExpandedGroups(JSON.parse(savedGroups));
      } catch {
        setExpandedGroups({});
      }
    }
  }, []);

  // Salvar estado do sidebar
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Salvar estado dos grupos
  useEffect(() => {
    localStorage.setItem("sidebar-expanded-groups", JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  // Toggle do sidebar
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Toggle de grupo
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Verificar se grupo está expandido (padrão: true)
  const isGroupExpanded = (groupId: string) => {
    return expandedGroups[groupId] !== false;
  };

  // Filtrar menu baseado em permissões
  const filteredMenu = useMemo(() => {
    // Se ainda está carregando, mostrar estrutura básica
    if (permissionsLoading) {
      return menuConfig;
    }

    return menuConfig
      .map((group) => {
        // Filtrar itens do grupo baseado em permissões
        const filteredItems = group.items.filter((item) => {
          if (!item.permission) return true;
          return hasPermission(item.permission);
        });

        // Se o grupo tem permissão, verificar
        if (group.permission && !hasPermission(group.permission)) {
          return null;
        }

        // Retornar grupo apenas se tiver itens
        if (filteredItems.length === 0) return null;

        return { ...group, items: filteredItems };
      })
      .filter(Boolean) as MenuGroup[];
  }, [hasPermission, permissionsLoading]);

  // Não mostrar sidebar se não autenticado
  if (!isAuthenticated || authLoading) {
    return null;
  }

  // Obter iniciais do usuário
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return "U";
  };

  // Logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      {/* Header do Sidebar */}
      <div className={cn(
        "flex items-center border-b border-gray-200 h-16 px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-sm shadow-lg">
              {getUserInitials()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">
                {user?.name || "Usuário"}
              </span>
              <span className="text-xs text-gray-500 truncate max-w-[140px]">
                {perfilName || "Carregando..."}
              </span>
            </div>
          </div>
        )}

        {/* Botão de colapsar */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-2">
          {filteredMenu.map((group) => (
            <div key={group.id}>
              {/* Header do grupo (se tiver label) */}
              {group.label && !isCollapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 mt-4 mb-1 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </span>
                  {isGroupExpanded(group.id) ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600" />
                  )}
                </button>
              )}

              {/* Separator visual quando colapsado */}
              {group.label && isCollapsed && (
                <div className="my-3 mx-2 border-t border-gray-200" />
              )}

              {/* Itens do grupo */}
              {(isCollapsed || !group.label || isGroupExpanded(group.id)) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                          isActive
                            ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0 transition-transform",
                            !isActive && "group-hover:scale-110"
                          )}
                        />

                        {!isCollapsed && (
                          <>
                            <span className="text-sm font-medium truncate">
                              {item.title}
                            </span>

                            {/* Badge */}
                            {item.badge && item.badge > 0 && (
                              <span className={cn(
                                "ml-auto px-2 py-0.5 text-xs font-bold rounded-full",
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-red-100 text-red-600"
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Tooltip quando colapsado */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                            {item.title}
                          </div>
                        )}

                        {/* Indicador de ativo */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer do Sidebar */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        {/* Notificações */}
        <Link
          href="/admin/notificacoes"
          title={isCollapsed ? "Notificações" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Bell className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm font-medium">Notificações</span>}
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Sair" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-600 hover:bg-red-50",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
