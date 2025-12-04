/**
 * Sistema de cores para identificação de profissionais em agendamentos
 * Gera cores consistentes baseadas no ID do profissional
 */

// Palette de cores para profissionais (10 cores distintas)
const COLOR_PALETTE = [
  {
    light: "bg-blue-100 border-blue-400 text-blue-800",
    medium: "bg-blue-500",
    dark: "bg-blue-600",
    name: "Azul",
  },
  {
    light: "bg-purple-100 border-purple-400 text-purple-800",
    medium: "bg-purple-500",
    dark: "bg-purple-600",
    name: "Roxo",
  },
  {
    light: "bg-pink-100 border-pink-400 text-pink-800",
    medium: "bg-pink-500",
    dark: "bg-pink-600",
    name: "Rosa",
  },
  {
    light: "bg-green-100 border-green-400 text-green-800",
    medium: "bg-green-500",
    dark: "bg-green-600",
    name: "Verde",
  },
  {
    light: "bg-yellow-100 border-yellow-400 text-yellow-800",
    medium: "bg-yellow-500",
    dark: "bg-yellow-600",
    name: "Amarelo",
  },
  {
    light: "bg-orange-100 border-orange-400 text-orange-800",
    medium: "bg-orange-500",
    dark: "bg-orange-600",
    name: "Laranja",
  },
  {
    light: "bg-red-100 border-red-400 text-red-800",
    medium: "bg-red-500",
    dark: "bg-red-600",
    name: "Vermelho",
  },
  {
    light: "bg-indigo-100 border-indigo-400 text-indigo-800",
    medium: "bg-indigo-500",
    dark: "bg-indigo-600",
    name: "Índigo",
  },
  {
    light: "bg-cyan-100 border-cyan-400 text-cyan-800",
    medium: "bg-cyan-500",
    dark: "bg-cyan-600",
    name: "Ciano",
  },
  {
    light: "bg-teal-100 border-teal-400 text-teal-800",
    medium: "bg-teal-500",
    dark: "bg-teal-600",
    name: "Verde-água",
  },
];

/**
 * Gera um hash numérico a partir de uma string (ID do profissional)
 */
function hashString(str: string | undefined | null): number {
  // Se string inválida, retorna hash padrão (0)
  if (!str || typeof str !== 'string') {
    return 0;
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Retorna a cor atribuída a um profissional baseada em seu ID
 */
export function getProfessionalColor(
  professionalId: string | undefined | null,
  variant: "light" | "medium" | "dark" = "light"
) {
  const index = hashString(professionalId) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index][variant];
}

/**
 * Retorna o nome da cor do profissional
 */
export function getProfessionalColorName(professionalId: string | undefined | null): string {
  const index = hashString(professionalId) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index].name;
}

/**
 * Gera legenda de cores para múltiplos profissionais
 */
export function generateColorLegend(professionals: Array<{ id_profissional: string; nm_profissional: string }>) {
  return professionals.map((prof) => ({
    id: prof.id_profissional,
    name: prof.nm_profissional,
    color: getProfessionalColor(prof.id_profissional, "medium"),
    colorName: getProfessionalColorName(prof.id_profissional),
  }));
}

/**
 * Retorna classe CSS para o card de agendamento combinando status e profissional
 */
export function getAgendamentoCardClasses(
  professionalId: string | undefined | null,
  status: string,
  useProfessionalColor: boolean = false
): string {
  // Se não usar cores de profissional, usa as cores de status padrão
  if (!useProfessionalColor) {
    const STATUS_COLORS: Record<string, string> = {
      agendado: "bg-blue-100 border-blue-300 text-blue-700",
      confirmado: "bg-green-100 border-green-300 text-green-700",
      em_atendimento: "bg-yellow-100 border-yellow-300 text-yellow-700",
      concluido: "bg-gray-100 border-gray-300 text-gray-700",
      cancelado: "bg-red-100 border-red-300 text-red-700",
      nao_compareceu: "bg-orange-100 border-orange-300 text-orange-700",
    };
    return STATUS_COLORS[status] || STATUS_COLORS.agendado;
  }

  // Usa cor do profissional
  return getProfessionalColor(professionalId, "light");
}

/**
 * Retorna cor de badge/pill para o status (pequena pastilha)
 */
export function getStatusBadgeColor(status: string): string {
  const STATUS_BADGE_COLORS: Record<string, string> = {
    agendado: "bg-blue-500",
    confirmado: "bg-green-500",
    em_atendimento: "bg-yellow-500",
    concluido: "bg-gray-500",
    cancelado: "bg-red-500",
    nao_compareceu: "bg-orange-500",
  };
  return STATUS_BADGE_COLORS[status] || STATUS_BADGE_COLORS.agendado;
}
