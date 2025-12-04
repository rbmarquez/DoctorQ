import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string): string {
  try {
    // Tentar criar a data
    let date: Date;

    // Se timestamp estiver vazio ou undefined, usar data atual
    if (!timestamp || timestamp.trim() === "") {
      date = new Date();
    } else {
      date = new Date(timestamp);
    }

    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      // Se não conseguir fazer parse, tentar usar apenas a hora atual
      const now = new Date();
      return now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Mostrar tempo relativo para mensagens recentes (até 1 hora)
    if (Math.abs(seconds) < 60) {
      return "agora";
    } else if (Math.abs(minutes) < 60) {
      return `${Math.abs(minutes)}min`;
    }

    // Para mensagens do mesmo dia, mostrar hora
    const isToday = date.toDateString() === now.toDateString();
    if (isToday || Math.abs(hours) < 24) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    // Para ontem
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    if (isYesterday) {
      return "ontem";
    }

    // Para dias recentes (até 7 dias)
    if (Math.abs(days) < 7) {
      return `${Math.abs(days)}d`;
    }

    // Para mensagens mais antigas, mostrar data formatada
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  } catch (error) {
    console.warn("Erro ao formatar timestamp:", error);
    // Fallback: retornar hora atual formatada
    const now = new Date();
    return now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}

/**
 * Formata uma data para formato brasileiro
 */
export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      return 'Data inválida';
    }
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (error) {
    console.warn("Erro ao formatar data:", error);
    return 'Data inválida';
  }
}

/**
 * Formata um valor monetário para formato brasileiro (R$)
 */
export function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  } catch (error) {
    console.warn("Erro ao formatar moeda:", error);
    return `R$ ${value.toFixed(2)}`;
  }
}
