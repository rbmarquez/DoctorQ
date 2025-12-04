/**
 * Server-side API functions for Next.js Server Components
 *
 * These functions are designed to be used in Server Components for:
 * - Initial data loading (SSR)
 * - Parallel data fetching
 * - Avoiding client bundle bloat
 * - Keeping API keys secure
 *
 * @module lib/api/server
 */

import { auth } from '@/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_KEY = process.env.API_DOCTORQ_API_KEY;

if (!API_KEY) {
  console.warn('⚠️  API_DOCTORQ_API_KEY não configurada! Server-side fetching pode falhar.');
}

/**
 * Error específico para operações de API server-side
 */
export class ServerApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'ServerApiError';
  }
}

/**
 * Configuração para requisições server-side
 */
interface ServerFetchOptions {
  /** Cache strategy (Next.js specific) */
  cache?: RequestCache;
  /** Revalidate time in seconds (Next.js ISR) */
  revalidate?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, any>;
}

/**
 * Wrapper para fetch com tratamento de erros e autenticação
 */
export async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const { cache = 'no-store', revalidate, headers: customHeaders = {}, params = {} } = options;

  // Build query string
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

  // Tentar obter JWT do usuário logado (contém id_empresa)
  // Se não houver sessão, usar API Key global como fallback
  const tokensToTry: Array<{ token: string; type: 'jwt' | 'api-key' | 'none'; label: string }> = [];
  try {
    const session = await auth();
    if (session?.user?.accessToken) {
      tokensToTry.push({
        token: session.user.accessToken,
        type: 'jwt',
        label: session.user.email ?? 'sessão',
      });
    }
  } catch (error) {
    console.log('[SERVER_FETCH] Erro ao obter sessão, prosseguindo com fallback:', error);
  }

  if (API_KEY) {
    tokensToTry.push({
      token: API_KEY,
      type: 'api-key',
      label: 'API global',
    });
  }

  if (tokensToTry.length === 0) {
    console.warn('[SERVER_FETCH] Nenhum token disponível (nem sessão nem API key). Tentando requisição sem credenciais.');
    tokensToTry.push({ token: '', type: 'none', label: 'anônimo' });
  }

  try {
    let lastError: ServerApiError | null = null;

    for (const [index, authOption] of tokensToTry.entries()) {
      const isLastAttempt = index === tokensToTry.length - 1;

      const fetchOptions: RequestInit = {
        cache,
        ...(revalidate && { next: { revalidate } }),
        headers: {
          'Content-Type': 'application/json',
          ...(authOption.token && { Authorization: `Bearer ${authOption.token}` }),
          ...customHeaders,
        },
      };

      if (authOption.type === 'jwt') {
        console.log('[SERVER_FETCH] Usando JWT do usuário:', authOption.label);
      } else if (authOption.type === 'api-key' && authOption.token) {
        console.log('[SERVER_FETCH] Usando API Key global como fallback');
      } else if (authOption.type === 'none') {
        console.log('[SERVER_FETCH] Executando requisição sem Authorization header');
      }

      const response = await fetch(url, fetchOptions);

      if (response.ok) {
        const data = await response.json();
        return data as T;
      }

      const errorText = await response.text();
      const apiError = new ServerApiError(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`,
        response.status,
        endpoint
      );

      lastError = apiError;

      const shouldRetryWithFallback =
        response.status === 401 &&
        !isLastAttempt;

      if (shouldRetryWithFallback) {
        console.warn(
          `[SERVER_FETCH] Erro 401 com token ${authOption.type} (${authOption.label}). Tentando próximo fallback...`
        );
        continue;
      }

      throw apiError;
    }

    if (lastError) {
      throw lastError;
    }

    throw new ServerApiError(
      'Nenhum método de autenticação disponível para realizar a requisição.',
      401,
      endpoint
    );
  } catch (error) {
    if (error instanceof ServerApiError) {
      throw error;
    }
    throw new ServerApiError(
      `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      endpoint
    );
  }
}

/**
 * Interface padrão para respostas paginadas
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    size: number;
    pages: number;
  };
}

/**
 * Interface para filtros base
 */
export interface BaseFilters {
  page?: number;
  size?: number;
  busca?: string;
}

// ============================================================================
// GESTÃO - Empresas, Usuários, Perfis
// ============================================================================

export interface Empresa {
  id_empresa: string;
  nm_empresa: string;
  nm_razao_social: string;
  nr_cnpj?: string;
  ds_endereco?: string;
  nr_telefone?: string;
  ds_email?: string;
  ds_website?: string;
  fl_ativo: boolean;
  dt_criacao: string;
}

export interface EmpresaFilters extends BaseFilters {
  status?: 'ativo' | 'inativo';
}

/**
 * Busca empresas cadastradas
 *
 * @example
 * ```tsx
 * // Server Component
 * export default async function EmpresasPage() {
 *   const { items, meta } = await getEmpresas({ page: 1, size: 10 });
 *   return <EmpresasList empresas={items} />
 * }
 * ```
 */
export async function getEmpresas(
  filters: EmpresaFilters = {}
): Promise<PaginatedResponse<Empresa>> {
  return serverFetch<PaginatedResponse<Empresa>>('/empresas/', {
    params: { page: 1, size: 10, ...filters },
    revalidate: 60, // Revalidate every 60 seconds
  });
}

/**
 * Busca uma empresa específica por ID
 */
export async function getEmpresa(id: string): Promise<Empresa> {
  return serverFetch<Empresa>(`/empresas/${id}`, {
    revalidate: 60,
  });
}

export interface Usuario {
  id_user: string;
  nm_email: string;
  nm_completo: string;
  nm_papel: string;
  nr_total_logins: number;
  dt_ultimo_login?: string;
  ds_foto_url?: string;
  fl_ativo: boolean;
  dt_criacao: string;
}

export interface UsuarioFilters extends BaseFilters {
  papel?: string;
  status?: 'ativo' | 'inativo';
}

/**
 * Busca usuários do sistema
 */
export async function getUsuarios(
  filters: UsuarioFilters = {}
): Promise<PaginatedResponse<Usuario>> {
  return serverFetch<PaginatedResponse<Usuario>>('/users/', {
    params: { page: 1, size: 10, ...filters },
    revalidate: 30,
  });
}

/**
 * Busca um usuário específico por ID
 */
export async function getUsuario(id: string): Promise<Usuario> {
  return serverFetch<Usuario>(`/users/${id}`, {
    revalidate: 30,
  });
}

export interface Perfil {
  id_perfil: string;
  nm_perfil: string;
  ds_perfil?: string;
  permissions?: string[];
  fl_ativo: boolean;
  dt_criacao: string;
}

/**
 * Busca perfis de usuário (roles)
 */
export async function getPerfis(
  filters: BaseFilters = {}
): Promise<PaginatedResponse<Perfil>> {
  return serverFetch<PaginatedResponse<Perfil>>('/perfis/', {
    params: { page: 1, size: 50, ...filters },
    revalidate: 120, // Roles change infrequently
  });
}

// ============================================================================
// IA - Agentes, Conversas
// ============================================================================

export interface Agente {
  id_agente: string;
  nm_agente: string;
  ds_prompt: string;
  ds_config: any;
  fl_ativo: boolean;
  dt_criacao: string;
}

export interface AgenteFilters extends BaseFilters {
  status?: 'ativo' | 'inativo';
}

/**
 * Busca agentes de IA configurados
 */
export async function getAgentes(
  filters: AgenteFilters = {}
): Promise<PaginatedResponse<Agente>> {
  return serverFetch<PaginatedResponse<Agente>>('/agentes/', {
    params: { page: 1, size: 10, ...filters },
    revalidate: 60,
  });
}

/**
 * Busca um agente específico por ID
 */
export async function getAgente(id: string): Promise<Agente> {
  return serverFetch<Agente>(`/agentes/${id}`, {
    revalidate: 60,
  });
}

export interface Conversa {
  id_conversa: string;
  nm_titulo?: string;
  id_agente: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface ConversaFilters extends BaseFilters {
  id_agente?: string;
  id_user?: string;
}

/**
 * Busca conversas de um usuário
 */
export async function getConversas(
  filters: ConversaFilters = {}
): Promise<PaginatedResponse<Conversa>> {
  const session = await auth();
  const hasAgentFilter = Boolean(filters.id_agente);
  const idUser = filters.id_user ?? session?.user?.id;

  if (!idUser && !hasAgentFilter) {
    throw new ServerApiError(
      'Sessão inválida: id_user é obrigatório para listar conversas.',
      401,
      '/conversas/'
    );
  }

  const { id_user: _ignoredIdUser, ...restFilters } = filters;

  return serverFetch<PaginatedResponse<Conversa>>('/conversas/', {
    params: {
      page: 1,
      size: 20,
      ...restFilters,
      ...(idUser ? { id_user: idUser } : {}),
    },
    revalidate: 10, // Conversas são mais dinâmicas
  });
}

// ============================================================================
// CLÍNICA - Agendamentos, Pacientes, Procedimentos
// ============================================================================

export interface Agendamento {
  id_agendamento: string;
  dt_agendamento: string;
  hr_agendamento: string;
  nm_status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  paciente?: {
    id_paciente: string;
    nm_completo: string;
  };
  profissional?: {
    id_profissional: string;
    nm_completo: string;
  };
  procedimento?: {
    id_procedimento: string;
    nm_procedimento: string;
    vl_preco: number;
  };
  dt_criacao: string;
}

export interface AgendamentoFilters extends BaseFilters {
  status?: string;
  id_profissional?: string;
  id_paciente?: string;
  dt_inicio?: string;
  dt_fim?: string;
}

/**
 * Busca agendamentos
 */
export async function getAgendamentos(
  filters: AgendamentoFilters = {}
): Promise<PaginatedResponse<Agendamento>> {
  return serverFetch<PaginatedResponse<Agendamento>>('/agendamentos/', {
    params: { page: 1, size: 20, ...filters },
    revalidate: 30, // Agendamentos são dinâmicos mas podem cachear um pouco
  });
}

export interface Profissional {
  id_profissional: string;
  nm_completo: string;
  ds_email: string;
  nr_telefone?: string;
  especialidades?: string[];
  fl_ativo: boolean;
  dt_criacao: string;
}

/**
 * Busca profissionais cadastrados
 */
export async function getProfissionais(
  filters: BaseFilters = {}
): Promise<PaginatedResponse<Profissional>> {
  return serverFetch<PaginatedResponse<Profissional>>('/profissionais/', {
    params: { page: 1, size: 20, ...filters },
    revalidate: 60,
  });
}

// ============================================================================
// MARKETPLACE - Produtos, Fornecedores
// ============================================================================

export interface Produto {
  id_produto: string;
  nm_produto: string;
  ds_produto?: string;
  vl_preco: number;
  vl_preco_promocional?: number;
  nr_estoque: number;
  fl_ativo: boolean;
  dt_criacao: string;
}

export interface ProdutoFilters extends BaseFilters {
  id_categoria?: string;
  vl_preco_min?: number;
  vl_preco_max?: number;
  em_promocao?: boolean;
}

// getProdutos movido para linha 697 com implementação mais completa

// ============================================================================
// ANALYTICS - Dados agregados
// ============================================================================

export interface DashboardStats {
  total_empresas: number;
  total_usuarios: number;
  total_agentes: number;
  total_conversas: number;
  total_agendamentos: number;
  total_profissionais: number;
  receita_mensal?: number;
}

/**
 * Busca estatísticas agregadas para dashboard
 *
 * @example
 * ```tsx
 * export default async function DashboardPage() {
 *   const stats = await getDashboardStats();
 *   return <StatsCards stats={stats} />
 * }
 * ```
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const safeConversasPromise: Promise<PaginatedResponse<Conversa>> = getConversas({
    page: 1,
    size: 1,
  }).catch((error) => {
    if (error instanceof ServerApiError && error.status === 401 && error.endpoint === '/conversas/') {
      return {
        items: [],
        meta: {
          total: 0,
          page: 1,
          size: 1,
          pages: 0,
        },
      };
    }
    throw error;
  });

  // Agentes migrado para estetiQ-service-ai - retornar vazio se falhar
  const safeAgentesPromise: Promise<PaginatedResponse<Agente>> = getAgentes({
    page: 1,
    size: 1,
  }).catch(() => {
    return {
      items: [],
      meta: {
        total: 0,
        page: 1,
        size: 1,
        pages: 0,
      },
    };
  });

  // Fetch paralelo de múltiplos endpoints
  const [empresas, usuarios, agentes, conversas, agendamentos, profissionais] = await Promise.all([
    getEmpresas({ page: 1, size: 1 }),
    getUsuarios({ page: 1, size: 1 }),
    safeAgentesPromise,
    safeConversasPromise,
    getAgendamentos({ page: 1, size: 1 }),
    getProfissionais({ page: 1, size: 1 }),
  ]);

  return {
    total_empresas: empresas?.meta?.total || 0,
    total_usuarios: usuarios?.meta?.total || 0,
    total_agentes: agentes?.meta?.total || 0,
    total_conversas: conversas?.meta?.total || 0,
    total_agendamentos: agendamentos?.meta?.total || 0,
    total_profissionais: profissionais?.meta?.total || 0,
    receita_mensal: 0, // TODO: Implementar quando endpoint estiver disponível
  };
}

/**
 * Helper para construir URLs de imagens
 */
export function getImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

/**
 * Helper para formatar valores monetários
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Helper para formatar datas
 */
export function formatDate(date: string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);

  if (format === 'long') {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(d);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(d);
}

// ============================================================================
// USER AREAS - Paciente & Profissional
// ============================================================================

/**
 * Dashboard stats para área do paciente
 */
export interface PacienteDashboardStats {
  proximos_agendamentos: number;
  procedimentos_realizados: number;
  produtos_favoritos: number;
  avaliacoes_pendentes: number;
}

/**
 * Dashboard stats para área do profissional
 */
export interface ProfissionalDashboardStats {
  atendimentos_hoje: number;
  pacientes_ativos: number;
  faturamento_mes: number;
  satisfacao_media: number;
  taxa_ocupacao: number;
}

/**
 * Estatísticas completas do profissional (resposta do backend)
 */
export interface ProfissionalStatsBackend {
  total_agendamentos: number;
  agendamentos_concluidos: number;
  agendamentos_pendentes: number;
  taxa_conclusao: number;
  avaliacoes_positivas: number;
  avaliacoes_neutras: number;
  avaliacoes_negativas: number;
  avaliacao_media: number;
  total_pacientes: number;
  receita_total: number;
}

/**
 * Busca estatísticas do dashboard do paciente
 */
export async function getPacienteDashboardStats(idPaciente: string): Promise<PacienteDashboardStats> {
  try {
    // Buscar agendamentos futuros do paciente
    const today = new Date().toISOString().split('T')[0];
    const agendamentos = await getAgendamentos({
      id_paciente: idPaciente,
      dt_inicio: today,
      page: 1,
      size: 100,
    });

    // Filtrar agendamentos futuros e não cancelados
    const proximos = agendamentos.items.filter(
      (ag) => ag.ds_status !== 'cancelado' && ag.ds_status !== 'concluido'
    );

    // Buscar procedimentos realizados (agendamentos concluídos)
    const historico = await getAgendamentos({
      id_paciente: idPaciente,
      ds_status: 'concluido',
      page: 1,
      size: 1,
    });

    return {
      proximos_agendamentos: proximos.length,
      procedimentos_realizados: historico.meta.total,
      produtos_favoritos: 0, // TODO: Implementar quando endpoint estiver disponível
      avaliacoes_pendentes: 0, // TODO: Implementar quando endpoint estiver disponível
    };
  } catch (error) {
    console.error('Erro ao buscar stats do paciente:', error);
    // Retornar valores padrão em caso de erro
    return {
      proximos_agendamentos: 0,
      procedimentos_realizados: 0,
      produtos_favoritos: 0,
      avaliacoes_pendentes: 0,
    };
  }
}

/**
 * Busca estatísticas completas do profissional do backend
 */
export async function getProfissionalStats(
  idProfissional: string,
  dtInicio?: string,
  dtFim?: string
): Promise<ProfissionalStatsBackend> {
  return serverFetch<ProfissionalStatsBackend>(`/profissionais/${idProfissional}/stats/`, {
    params: {
      ...(dtInicio && { dt_inicio: dtInicio }),
      ...(dtFim && { dt_fim: dtFim }),
    },
    revalidate: 30, // Cache por 30 segundos
  });
}

/**
 * Busca estatísticas do dashboard do profissional
 */
export async function getProfissionalDashboardStats(idProfissional: string): Promise<ProfissionalDashboardStats> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const mesAtual = new Date().toISOString().slice(0, 7); // YYYY-MM
    const primeiroDiaMes = `${mesAtual}-01`;

    // Buscar estatísticas do mês atual do endpoint real
    const statsMes = await getProfissionalStats(idProfissional, primeiroDiaMes, today);

    // Buscar agendamentos de hoje para calcular atendimentos do dia
    const agendamentosHoje = await getAgendamentos({
      id_profissional: idProfissional,
      dt_agendamento: today,
      page: 1,
      size: 100,
    });

    // Calcular taxa de ocupação baseada nos agendamentos de hoje
    // Assumindo 8 horas de trabalho = 16 slots de 30 min
    const slotsDisponiveis = 16;
    const slotsOcupados = agendamentosHoje.items.filter(
      (ag) => ag.ds_status !== 'cancelado'
    ).length;
    const taxaOcupacao = Math.min(100, Math.round((slotsOcupados / slotsDisponiveis) * 100));

    return {
      atendimentos_hoje: slotsOcupados,
      pacientes_ativos: statsMes.total_pacientes,
      faturamento_mes: statsMes.receita_total,
      satisfacao_media: statsMes.avaliacao_media,
      taxa_ocupacao: taxaOcupacao,
    };
  } catch (error) {
    console.error('Erro ao buscar stats do profissional:', error);
    return {
      atendimentos_hoje: 0,
      pacientes_ativos: 0,
      faturamento_mes: 0,
      satisfacao_media: 0,
      taxa_ocupacao: 0,
    };
  }
}

/**
 * Busca próximos agendamentos do paciente
 */
export async function getProximosAgendamentosPaciente(idPaciente: string, limit = 5) {
  const today = new Date().toISOString().split('T')[0];
  return getAgendamentos({
    id_paciente: idPaciente,
    dt_inicio: today,
    page: 1,
    size: limit,
  });
}

/**
 * Busca agenda do dia para o profissional
 */
export async function getAgendaDia(idProfissional: string, data?: string) {
  const targetDate = data || new Date().toISOString().split('T')[0];
  return getAgendamentos({
    id_profissional: idProfissional,
    dt_agendamento: targetDate,
    page: 1,
    size: 100,
  });
}

/**
 * Busca todos os agendamentos do paciente com paginação
 */
export async function getAgendamentosPaciente(
  idPaciente: string,
  filters: {
    page?: number;
    size?: number;
    status?: string;
  } = {}
) {
  return getAgendamentos({
    id_paciente: idPaciente,
    ...filters,
  });
}

// ============================================================================
// MARKETPLACE - Produtos, Fornecedores, Carrinho
// ============================================================================

export interface Produto {
  id_produto: string;
  nm_produto: string;
  ds_produto?: string;
  vl_preco: number;
  vl_preco_promocional?: number;
  ds_imagem_url?: string;
  id_fornecedor: string;
  id_categoria?: string;
  qt_estoque?: number;
  fl_ativo: boolean;
  dt_criacao: string;
}

export interface Fornecedor {
  id_fornecedor: string;
  nm_fornecedor: string;
  ds_fornecedor?: string;
  ds_logo_url?: string;
  nm_email?: string;
  ds_telefone?: string;
  fl_ativo: boolean;
}

export interface ItemCarrinho {
  id_item: string;
  id_produto: string;
  qt_quantidade: number;
  vl_unitario: number;
  produto?: Produto;
}

export interface Carrinho {
  id_carrinho: string;
  id_paciente: string;
  items: ItemCarrinho[];
  vl_total: number;
  dt_criacao: string;
}

/**
 * Busca produtos do marketplace com filtros
 */
export async function getProdutos(filters: {
  page?: number;
  size?: number;
  busca?: string;
  id_categoria?: string;
  id_fornecedor?: string;
  apenas_promocao?: boolean;
} = {}): Promise<PaginatedResponse<Produto>> {
  return serverFetch<PaginatedResponse<Produto>>('/produtos/', {
    params: {
      page: filters.page || 1,
      size: filters.size || 20,
      ...(filters.busca && { busca: filters.busca }),
      ...(filters.id_categoria && { id_categoria: filters.id_categoria }),
      ...(filters.id_fornecedor && { id_fornecedor: filters.id_fornecedor }),
      ...(filters.apenas_promocao && { apenas_promocao: true }),
    },
    revalidate: 300, // Cache de 5 minutos para produtos
  });
}

/**
 * Busca um produto específico por ID
 */
export async function getProduto(idProduto: string): Promise<Produto> {
  return serverFetch<Produto>(`/produtos/${idProduto}/`, {
    revalidate: 300,
  });
}

/**
 * Busca fornecedores com filtros
 */
export async function getFornecedores(filters: {
  page?: number;
  size?: number;
  busca?: string;
} = {}): Promise<PaginatedResponse<Fornecedor>> {
  return serverFetch<PaginatedResponse<Fornecedor>>('/fornecedores/', {
    params: {
      page: filters.page || 1,
      size: filters.size || 20,
      ...(filters.busca && { busca: filters.busca }),
    },
    revalidate: 600, // Cache de 10 minutos
  });
}

/**
 * Busca carrinho do paciente
 */
export async function getCarrinho(idPaciente: string): Promise<Carrinho> {
  return serverFetch<Carrinho>(`/carrinho/${idPaciente}/`, {
    cache: 'no-store', // Sempre buscar carrinho atualizado
  });
}
