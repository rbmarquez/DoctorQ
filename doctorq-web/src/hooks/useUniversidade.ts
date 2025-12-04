/**
 * Custom SWR Hooks para Universidade da Beleza
 * Hooks reutilizáveis para todas as funcionalidades da plataforma
 */
import useSWR, { type SWRConfiguration } from 'swr';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao carregar dados');
  return res.json();
};

// ============================================
// HOOKS DE CURSOS E INSCRIÇÕES
// ============================================

export interface Curso {
  id_curso: string;
  nm_titulo: string;
  ds_descricao: string;
  nm_categoria: string;
  nm_nivel: string;
  nr_duracao_total: number;
  ds_thumbnail: string;
  vl_avaliacao_media: number;
  nr_total_alunos: number;
  fg_ativo: boolean;
}

export function useCursos(config?: SWRConfiguration) {
  return useSWR<Curso[]>(`${UNIV_API_URL}/cursos/`, fetcher, config);
}

export function useCurso(idCurso: string, config?: SWRConfiguration) {
  return useSWR<Curso>(
    idCurso ? `${UNIV_API_URL}/cursos/${idCurso}/` : null,
    fetcher,
    config
  );
}

export interface Inscricao {
  id_inscricao: string;
  id_usuario: string;
  id_curso: string;
  percentual_concluido: number;
  dt_inscricao: string;
  dt_conclusao: string | null;
  curso?: Curso;
}

export function useMinhasInscricoes(idUsuario: string, config?: SWRConfiguration) {
  return useSWR<Inscricao[]>(
    idUsuario ? `${UNIV_API_URL}/inscricoes/usuario/${idUsuario}/` : null,
    fetcher,
    config
  );
}

// ============================================
// HOOKS DE MISSÕES
// ============================================

export interface Missao {
  id_user_missao: string;
  tipo_missao: string;
  titulo: string;
  descricao: string;
  icone: string;
  meta: number;
  progresso_atual: number;
  xp_recompensa: number;
  tokens_recompensa: number;
  fg_concluida: boolean;
  dt_criacao: string;
  dt_conclusao: string | null;
  dt_expiracao: string;
}

export interface DashboardMissoes {
  missoes_ativas: Missao[];
  missoes_concluidas_hoje: Missao[];
  estatisticas: {
    total_ativas: number;
    total_concluidas_hoje: number;
    xp_ganho_hoje: number;
    tokens_ganhos_hoje: number;
    sequencia_dias: number;
  };
}

export function useMissoesDashboard(idUsuario: string, config?: SWRConfiguration) {
  return useSWR<DashboardMissoes>(
    idUsuario ? `${UNIV_API_URL}/missoes/${idUsuario}/dashboard/` : null,
    fetcher,
    { refreshInterval: 30000, ...config } // Atualiza a cada 30s
  );
}

export function useMissoesAtivas(idUsuario: string, config?: SWRConfiguration) {
  return useSWR<Missao[]>(
    idUsuario ? `${UNIV_API_URL}/missoes/${idUsuario}/ativas/` : null,
    fetcher,
    { refreshInterval: 30000, ...config }
  );
}

// ============================================
// HOOKS DE GAMIFICAÇÃO (XP, Tokens, Badges)
// ============================================

export interface UserXP {
  id_usuario: string;
  xp_total: number;
  nivel: number;
  xp_proximo_nivel: number;
}

export function useUserXP(idUsuario: string, config?: SWRConfiguration) {
  return useSWR<UserXP>(
    idUsuario ? `${UNIV_API_URL}/gamificacao/${idUsuario}/xp/` : null,
    fetcher,
    config
  );
}

export interface UserTokens {
  id_usuario: string;
  saldo: number;
  total_ganho: number;
  total_gasto: number;
}

export function useUserTokens(idUsuario: string, config?: SWRConfiguration) {
  return useSWR<UserTokens>(
    idUsuario ? `${UNIV_API_URL}/gamificacao/${idUsuario}/tokens/` : null,
    fetcher,
    config
  );
}

export interface Badge {
  id_badge: string;
  nm_nome: string;
  ds_descricao: string;
  ds_icone: string;
  ds_criterio: string;
  tx_raridade: string;
  tx_categoria: string;
  nr_valor_criterio: number;
}

export interface BadgeUsuario {
  id_badge_usuario: string;
  badge: Badge;
  nr_progresso: number;
  fg_conquistado: boolean;
  dt_conquista: string | null;
}

export interface ConquistasData {
  badges_conquistados: BadgeUsuario[];
  badges_em_progresso: BadgeUsuario[];
  badges_bloqueados: BadgeUsuario[];
  estatisticas: {
    total_conquistados: number;
    total_badges: number;
    percentual_completo: number;
    badges_por_raridade: {
      comum: number;
      rara: number;
      epica: number;
      lendaria: number;
    };
  };
}

export function useBadges(idUsuario: string, config?: SWRConfiguration) {
  return useSWR<ConquistasData>(
    idUsuario ? `${UNIV_API_URL}/gamificacao/${idUsuario}/badges/` : null,
    fetcher,
    config
  );
}

// ============================================
// HOOKS DE NOTAS
// ============================================

export interface Nota {
  id_nota: string;
  id_usuario: string;
  id_aula: string;
  conteudo: string;
  timestamp_video: number | null;
  fg_publica: boolean;
  dt_criacao: string;
  dt_atualizacao: string | null;
  aula_titulo?: string;
  curso_titulo?: string;
  curso_id?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export function useNotasAula(idUsuario: string, idAula: string, config?: SWRConfiguration) {
  return useSWR<Nota[]>(
    idUsuario && idAula ? `${UNIV_API_URL}/notas/aula/${idAula}/` : null,
    fetcher,
    config
  );
}

export function useTodasNotas(
  idUsuario: string,
  params?: { page?: number; size?: number; busca?: string; id_curso?: string },
  config?: SWRConfiguration
) {
  const queryParams = new URLSearchParams({
    page: String(params?.page || 1),
    size: String(params?.size || 20),
    ...(params?.busca && { busca: params.busca }),
    ...(params?.id_curso && { id_curso: params.id_curso }),
  });

  return useSWR<PaginatedResponse<Nota>>(
    idUsuario ? `${UNIV_API_URL}/notas/?${queryParams}` : null,
    fetcher,
    config
  );
}

// ============================================
// HOOKS DE FAVORITOS
// ============================================

export interface Favorito {
  id_favorito: string;
  tipo: 'curso' | 'aula' | 'instrutor';
  id_referencia: string;
  observacao: string | null;
  dt_criacao: string;
  detalhes: {
    titulo: string;
    descricao?: string;
    categoria?: string;
    nivel?: string;
    duracao?: number;
    total_aulas?: number;
    total_alunos?: number;
    avaliacao_media?: number;
    thumbnail?: string;
  };
}

export function useFavoritos(
  idUsuario: string,
  params?: { page?: number; size?: number; tipo?: string },
  config?: SWRConfiguration
) {
  const queryParams = new URLSearchParams({
    page: String(params?.page || 1),
    size: String(params?.size || 12),
    ...(params?.tipo && params.tipo !== 'all' && { tipo: params.tipo }),
  });

  return useSWR<PaginatedResponse<Favorito>>(
    idUsuario ? `${UNIV_API_URL}/notas/favoritos/?${queryParams}` : null,
    fetcher,
    config
  );
}

export function useIsFavorito(
  idUsuario: string,
  tipo: string,
  idReferencia: string,
  config?: SWRConfiguration
) {
  const queryParams = new URLSearchParams({ tipo, id_referencia: idReferencia });

  return useSWR<{ is_favorito: boolean }>(
    idUsuario && tipo && idReferencia
      ? `${UNIV_API_URL}/notas/favoritos/verificar/?${queryParams}`
      : null,
    fetcher,
    config
  );
}

// ============================================
// HOOKS DE ANALYTICS
// ============================================

export interface AnalyticsInsights {
  tempo_medio_estudo_diario: number;
  melhor_horario_estudo: string;
  categoria_favorita: string;
  taxa_conclusao: number;
  sequencia_dias_atual: number;
  melhor_sequencia: number;
  cursos_iniciados: number;
  cursos_concluidos: number;
  aulas_assistidas: number;
  tempo_total_estudo_minutos: number;
  nivel_engajamento: string;
  sugestoes: string[];
}

export function useAnalyticsInsights(
  idUsuario: string,
  periodo: string = '30d',
  config?: SWRConfiguration
) {
  return useSWR<AnalyticsInsights>(
    idUsuario ? `${UNIV_API_URL}/analytics/${idUsuario}/insights/?periodo=${periodo}` : null,
    fetcher,
    config
  );
}

export interface DashboardData {
  progresso_geral: {
    cursos_iniciados: number;
    cursos_concluidos: number;
    aulas_assistidas: number;
    total_minutos_estudo: number;
    sequencia_dias: number;
    ultimo_acesso: string;
  };
  gamificacao: {
    xp_total: number;
    nivel: number;
    xp_proximo_nivel: number;
    tokens: number;
    badges_conquistados: number;
    posicao_ranking: number | null;
  };
  missoes_hoje: Missao[];
  cursos_em_andamento: Array<{
    id_inscricao: string;
    curso: Curso;
    percentual_concluido: number;
    aulas_concluidas: number;
    total_aulas: number;
    ultima_aula: {
      id_aula: string;
      nm_titulo: string;
    } | null;
  }>;
  recomendacoes: Curso[];
  ranking_semanal: Array<{
    posicao: number;
    id_usuario: string;
    nm_nome: string;
    pontuacao: number;
    is_current_user: boolean;
  }>;
}

export function useDashboard(idUsuario: string, config?: SWRConfiguration) {
  return useSWR<DashboardData>(
    idUsuario ? `${UNIV_API_URL}/analytics/${idUsuario}/dashboard/` : null,
    fetcher,
    { refreshInterval: 60000, ...config } // Atualiza a cada 1 minuto
  );
}

// ============================================
// HOOKS DE RANKING
// ============================================

export interface RankingItem {
  posicao: number;
  id_usuario: string;
  nm_nome: string;
  pontuacao: number;
  is_current_user?: boolean;
}

export function useRanking(
  periodo: 'diario' | 'semanal' | 'mensal' = 'semanal',
  config?: SWRConfiguration
) {
  return useSWR<RankingItem[]>(`${UNIV_API_URL}/gamificacao/ranking/?periodo=${periodo}`, fetcher, config);
}

// ============================================
// HOOKS DE RECOMENDAÇÕES
// ============================================

export interface Recomendacao {
  id_curso: string;
  nm_titulo: string;
  ds_descricao: string;
  nm_categoria: string;
  score_recomendacao: number;
  motivo_recomendacao: string;
  curso?: Curso;
}

export function useRecomendacoes(idUsuario: string, limit: number = 10, config?: SWRConfiguration) {
  return useSWR<Recomendacao[]>(
    idUsuario ? `${UNIV_API_URL}/recomendacoes/${idUsuario}/?limit=${limit}` : null,
    fetcher,
    config
  );
}

// ============================================
// MUTAÇÃO HELPERS
// ============================================

export async function adicionarFavorito(
  idUsuario: string,
  tipo: 'curso' | 'aula' | 'instrutor',
  idReferencia: string,
  observacao?: string
) {
  const res = await fetch(`${UNIV_API_URL}/notas/favoritos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_usuario: idUsuario, tipo, id_referencia: idReferencia, observacao }),
  });
  if (!res.ok) throw new Error('Erro ao adicionar favorito');
  return res.json();
}

export async function removerFavorito(idFavorito: string) {
  const res = await fetch(`${UNIV_API_URL}/notas/favoritos/${idFavorito}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao remover favorito');
  return true;
}

export async function criarNota(
  idUsuario: string,
  idAula: string,
  conteudo: string,
  timestampVideo?: number,
  fgPublica: boolean = false
) {
  const res = await fetch(`${UNIV_API_URL}/notas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_usuario: idUsuario,
      id_aula: idAula,
      conteudo,
      timestamp_video: timestampVideo,
      fg_publica: fgPublica,
    }),
  });
  if (!res.ok) throw new Error('Erro ao criar nota');
  return res.json();
}

export async function editarNota(idNota: string, conteudo: string, fgPublica: boolean) {
  const res = await fetch(`${UNIV_API_URL}/notas/${idNota}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conteudo, fg_publica: fgPublica }),
  });
  if (!res.ok) throw new Error('Erro ao editar nota');
  return res.json();
}

export async function deletarNota(idNota: string) {
  const res = await fetch(`${UNIV_API_URL}/notas/${idNota}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao deletar nota');
  return true;
}

export async function resgatarRecompensaMissao(idMissao: string) {
  const res = await fetch(`${UNIV_API_URL}/missoes/${idMissao}/resgatar/`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Erro ao resgatar recompensa');
  return res.json();
}

export async function registrarProgressoAula(
  idInscricao: string,
  idAula: string,
  segundosAssistidos: number,
  percentualConcluido: number
) {
  const res = await fetch(`${UNIV_API_URL}/inscricoes/${idInscricao}/progresso/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_aula: idAula,
      segundos_assistidos: segundosAssistidos,
      percentual_concluido: percentualConcluido,
    }),
  });
  if (!res.ok) throw new Error('Erro ao registrar progresso');
  return res.json();
}
