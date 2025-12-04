import { UserType } from "@/types/auth";

/**
 * Retorna a rota do dashboard baseada no tipo de usuário
 */
export function getDashboardRoute(userType: UserType): string {
  const routes: Record<UserType, string> = {
    cliente: "/paciente/dashboard",
    profissional: "/profissional/dashboard",
    fornecedor: "/fornecedor/dashboard",
    administrador: "/admin/dashboard",
    gestor_clinica: "/clinica/dashboard",
  };

  return routes[userType] || "/paciente/dashboard"; // Fallback para cliente
}

/**
 * Retorna o nome amigável do tipo de usuário
 */
export function getUserTypeLabel(userType: UserType): string {
  const labels: Record<UserType, string> = {
    cliente: "Cliente",
    profissional: "Profissional",
    fornecedor: "Fornecedor",
    administrador: "Administrador",
    gestor_clinica: "Gestor de Clínica",
  };

  return labels[userType] || "Cliente";
}

/**
 * Retorna o tema de cores baseado no tipo de usuário
 */
export function getUserTypeTheme(userType: UserType): {
  gradient: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  const themes: Record<
    UserType,
    { gradient: string; bgColor: string; textColor: string; borderColor: string }
  > = {
    cliente: {
      gradient: "from-pink-500 to-purple-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-700",
      borderColor: "border-pink-200",
    },
    profissional: {
      gradient: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    fornecedor: {
      gradient: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    administrador: {
      gradient: "from-red-500 to-orange-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
    gestor_clinica: {
      gradient: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      borderColor: "border-purple-200",
    },
  };

  return themes[userType] || themes.cliente;
}
