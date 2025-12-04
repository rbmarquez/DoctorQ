/**
 * Hooks para API da Universidade da Beleza
 */
import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../client';

// Base URL da API da Universidade
const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

// ============================================
// TYPES
// ============================================

export interface Curso {
  id_curso: string;
  titulo: string;
  slug: string;
  descricao: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'expert';
  categoria: string;
  duracao_horas: number;
  preco: number;
  preco_assinante: number;
  thumbnail_url?: string;
  video_intro_url?: string;
  instrutor_id?: string;
  instrutor_nome?: string;
  instrutor_bio?: string;
  certificacao_tipo?: 'bronze' | 'prata' | 'ouro' | 'diamante';
  fg_ativo: boolean;
  total_inscricoes: number;
  total_aulas?: number;
  avaliacao_media: number;
  total_avaliacoes: number;
  tags?: string[];
  objetivos?: string[];
  requisitos?: string[];
  dt_criacao: string;
}

export interface Modulo {
  id_modulo: string;
  id_curso: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  aulas?: Aula[];
}

export interface Aula {
  id_aula: string;
  id_modulo: string;
  titulo: string;
  descricao?: string;
  tipo?: string;
  conteudo_url?: string;
  duracao_minutos?: number;
  recursos?: any;
  ordem: number;
}

export interface Inscricao {
  id_inscricao: string;
  id_usuario: string;
  id_curso: string;
  dt_inscricao: string;
  progresso_percentual: number;
  status: 'nao_iniciado' | 'cursando' | 'concluido' | 'cancelado';
  tempo_total_minutos: number;
  total_aulas_assistidas?: number;
  curso?: Curso;
  progresso_aulas?: ProgressoAula[];
}

export interface ProgressoAula {
  id_progresso: string;
  id_inscricao: string;
  id_aula: string;
  concluida: boolean;
  tempo_assistido_minutos: number;
  dt_ultima_visualizacao?: string;
}

export interface UserXP {
  id_usuario: string;
  xp_total: number;
  nivel: number;
  xp_proximo_nivel: number;
}

export interface UserTokens {
  id_usuario: string;
  saldo: number;
  total_ganho: number;
  total_gasto: number;
}

export interface UserBadge {
  id_badge: string;
  id_usuario: string;
  dt_conquista: string;
  badge_info?: {
    nome: string;
    descricao: string;
    icone: string;
  };
}

export interface Evento {
  id_evento: string;
  titulo: string;
  descricao?: string;
  tipo: 'webinar' | 'workshop' | 'congresso' | 'imersao';
  dt_inicio: string;
  dt_fim: string;
  status: 'agendado' | 'ao_vivo' | 'finalizado';
  preco: number;
  total_inscritos: number;
}

export interface Certificado {
  id_certificado: string;
  codigo_verificacao: string;
  id_usuario: string;
  id_curso: string;
  tipo_certificacao?: string;
  dt_emissao: string;
  nota_final: number;
  carga_horaria: number;
  pdf_url?: string;
}

export interface Avaliacao {
  id_avaliacao: string;
  id_usuario: string;
  id_curso: string;
  avaliacao: number; // 1-5 estrelas
  comentario?: string;
  dt_criacao: string;
  dt_atualizacao?: string;
  nm_usuario?: string; // Nome do usuário (pode vir do JOIN)
}

// ============================================
// HOOKS - CURSOS
// ============================================

export function useCursos(params?: {
  categoria?: string;
  nivel?: string;
  page?: number;
  size?: number;
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v !== undefined) as [string, string][]
  ).toString();

  const { data, error, mutate } = useSWR<Curso[]>(
    `${UNIV_API_URL}/cursos/?${queryString}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar cursos');
      return res.json();
    }
  );

  return {
    cursos: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useCursoById(id_curso?: string) {
  const { data, error, mutate } = useSWR<Curso>(
    id_curso ? `${UNIV_API_URL}/cursos/${id_curso}/` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar curso');
      return res.json();
    }
  );

  return {
    data,
    isLoading: !error && !data,
    error,
    mutate,
  };
}

export function useCursoBySlug(slug?: string, incluir_modulos: boolean = false) {
  const { data, error, mutate } = useSWR<Curso>(
    slug ? `${UNIV_API_URL}/cursos/slug/${slug}/?incluir_modulos=${incluir_modulos}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar curso');
      return res.json();
    }
  );

  return {
    data,
    isLoading: !error && !data,
    error,
    mutate,
  };
}

// ============================================
// HOOKS - AVALIAÇÕES
// ============================================

export function useAvaliacoesCurso(id_curso?: string) {
  const { data, error, mutate } = useSWR<Avaliacao[]>(
    id_curso ? `${UNIV_API_URL}/avaliacoes/curso/${id_curso}/` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) {
        // Se não houver avaliações, retorna array vazio em vez de erro
        if (res.status === 404) return [];
        throw new Error('Erro ao buscar avaliações');
      }
      return res.json();
    }
  );

  return {
    data,
    isLoading: !error && !data,
    error,
    mutate,
  };
}

// ============================================
// HOOKS - MÓDULOS E AULAS
// ============================================

export function useModulosByCurso(id_curso?: string) {
  // Busca o curso completo com módulos incluídos (incluir_modulos=true)
  const { data, error, mutate } = useSWR<any>(
    id_curso ? `${UNIV_API_URL}/cursos/${id_curso}/?incluir_modulos=true` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) {
        // Se não houver módulos, retorna array vazio em vez de erro
        if (res.status === 404) return { modulos: [] };
        throw new Error('Erro ao buscar módulos');
      }
      return res.json();
    }
  );

  return {
    data: data?.modulos || [],
    isLoading: !error && !data,
    error,
    mutate,
  };
}

// ============================================
// HOOKS - INSCRIÇÕES
// ============================================

export function useMinhasInscricoes() {
  // TODO: Endpoint /inscricoes/minhas/ não existe - API tem /inscricoes/usuario/{id}/
  // Desabilitado temporariamente para evitar erros 404
  const { data, error, mutate } = useSWR<Inscricao[]>(
    null, // Desabilitado - rota não existe na API
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar inscrições');
      return res.json();
    }
  );

  return {
    data: data || [], // Retorna array vazio enquanto endpoint não existe
    isLoading: false,
    error: null,
    mutate,
  };
}

export function useInscricaoByCurso(id_curso?: string) {
  // TODO: Endpoint /inscricoes/curso/{id}/ não implementado na API
  // Desabilitado temporariamente para evitar erros 404
  const { data, error, mutate } = useSWR<Inscricao>(
    null, // Desabilitado - rota não existe na API
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar inscrição');
      return res.json();
    }
  );

  return {
    data: undefined,
    isLoading: false,
    error: null,
    mutate,
  };
}

export function useInscreverCurso() {
  const [isInscrevendo, setIsInscrevendo] = useState(false);

  const inscrever = async (id_curso: string) => {
    setIsInscrevendo(true);
    try {
      const res = await fetch(`${UNIV_API_URL}/inscricoes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_curso }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Erro ao criar inscrição');
      }

      return res.json();
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      throw error;
    } finally {
      setIsInscrevendo(false);
    }
  };

  return {
    inscrever,
    isInscrevendo,
  };
}

// ============================================
// HOOKS - GAMIFICAÇÃO
// ============================================

export function useMeuProgresso() {
  // TODO: Endpoint /gamificacao/progresso/meu/ não existe - API tem /gamificacao/xp/{id_usuario}/
  // Desabilitado temporariamente para evitar erros 404
  const { data, error, mutate } = useSWR<UserXP>(
    null, // Desabilitado - rota não existe na API
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar progresso');
      return res.json();
    }
  );

  return {
    data: undefined,
    isLoading: false,
    error: null,
    mutate,
  };
}

export function useMeusBadges() {
  // TODO: Endpoint /gamificacao/badges/meus/ não implementado na API
  // Desabilitado temporariamente para evitar erros 404
  const { data, error, mutate } = useSWR<UserBadge[]>(
    null, // Desabilitado - rota não existe na API
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar badges');
      return res.json();
    }
  );

  return {
    data: data || [], // Retorna array vazio enquanto endpoint não existe
    isLoading: false,
    error: null,
    mutate,
  };
}

export function useMeusTokens() {
  // TODO: Endpoint /gamificacao/tokens/meus/ não existe - API tem /gamificacao/tokens/{id_usuario}/
  // Desabilitado temporariamente para evitar erros 404
  const { data, error, mutate } = useSWR<UserTokens>(
    null, // Desabilitado - rota não existe na API
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar tokens');
      return res.json();
    }
  );

  return {
    data: undefined,
    isLoading: false,
    error: null,
    mutate,
  };
}

export function useMarcarAulaComoAssistida() {
  // TODO: Endpoint /gamificacao/marcar-aula/ não implementado na API
  // Desabilitado temporariamente para evitar erros 404
  const marcarAssistida = async (id_aula: string) => {
    console.warn('useMarcarAulaComoAssistida: Endpoint não implementado na API (porta 8081)');
    // Retorna um objeto vazio para não quebrar a UI
    return { success: false, message: 'Endpoint não implementado' };
  };

  return {
    marcarAssistida,
    isMarcando: false,
  };
}

// ============================================
// HOOKS - EVENTOS
// ============================================

export function useEventos(params?: {
  tipo?: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v !== undefined) as [string, string][]
  ).toString();

  const { data, error, mutate } = useSWR<Evento[]>(
    `${UNIV_API_URL}/eventos/?${queryString}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar eventos');
      return res.json();
    }
  );

  return {
    eventos: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

// ============================================
// HOOKS - CERTIFICADOS
// ============================================

export function useCertificadosUsuario(id_usuario?: string) {
  const { data, error, mutate } = useSWR<Certificado[]>(
    id_usuario ? `${UNIV_API_URL}/certificados/usuario/${id_usuario}/` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar certificados');
      return res.json();
    }
  );

  return {
    certificados: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

// ============================================
// HELPERS
// ============================================

export function getNivelLabel(nivel: string) {
  const labels: Record<string, string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
    expert: 'Expert',
  };
  return labels[nivel] || nivel;
}

export function getCertificacaoLabel(tipo: string) {
  const labels: Record<string, string> = {
    bronze: '🥉 Bronze',
    prata: '🥈 Prata',
    ouro: '🥇 Ouro',
    diamante: '💎 Diamante',
  };
  return labels[tipo] || tipo;
}

export function formatDuracao(horas: number) {
  if (horas < 1) return `${horas * 60}min`;
  return `${horas}h`;
}

export function formatPreco(preco: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco);
}

// ============================================
// ALIASES PARA COMPATIBILIDADE
// ============================================

/**
 * Alias para useCursoById - mantém compatibilidade com código existente
 */
export const useCurso = useCursoById;

/**
 * Hook para buscar uma aula específica
 * @param id_aula - ID da aula
 * TODO: Implementar endpoint /aulas/{id}/ na API (porta 8081)
 */
export function useAula(id_aula?: string) {
  // TODO: Endpoint /aulas/{id}/ ainda não implementado na API (porta 8081)
  // Desabilitado temporariamente para evitar erros 404 repetidos no console
  const { data, error, mutate } = useSWR<Aula>(
    null, // Desabilitado - rota não existe na API
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar aula');
      return res.json();
    }
  );

  return {
    data: undefined, // Retorna undefined enquanto endpoint não existe
    isLoading: false, // Não está carregando pois está desabilitado
    error: null, // Não retorna erro para não quebrar a UI
    mutate,
  };
}

/**
 * Hook para buscar notas do usuário
 * Corrigido para usar endpoint /notas/ que existe na API
 */
export function useMinhasNotas() {
  const { data, error, mutate } = useSWR<any[]>(
    `${UNIV_API_URL}/notas/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar notas');
      return res.json();
    }
  );

  return {
    data: data || [],
    isLoading: !error && !data,
    error,
    mutate,
  };
}
