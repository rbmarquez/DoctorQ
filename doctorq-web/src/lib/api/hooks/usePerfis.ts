/**
 * Hook SWR para gerenciamento de perfis (roles/permissions)
 */

import useSWR from 'swr';
import { apiClient } from '../client';

// ====================================================================
// TYPES
// ====================================================================

export interface PermissoesRecurso {
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  visualizar: boolean;
  executar?: boolean;
  upload?: boolean;
  exportar?: boolean;
}

export interface PermissoesCompletas {
  usuarios: PermissoesRecurso;
  agentes: PermissoesRecurso;
  conversas: PermissoesRecurso;
  document_stores: PermissoesRecurso;
  credenciais: PermissoesRecurso;
  variaveis: PermissoesRecurso;
  tools: PermissoesRecurso;
  empresa: PermissoesRecurso;
  perfis: PermissoesRecurso;
  relatorios: PermissoesRecurso;
  admin: boolean;
}

export interface Perfil {
  id_perfil: string;
  id_empresa: string | null;
  nm_perfil: string;
  ds_perfil: string | null;
  nm_tipo: 'system' | 'custom';
  ds_permissoes: Record<string, any> | PermissoesCompletas;
  ds_grupos_acesso: string[];
  ds_permissoes_detalhadas: Record<string, Record<string, Record<string, boolean>>>;
  ds_rotas_permitidas?: string[];
  fg_template?: boolean;
  st_ativo: 'S' | 'N';
  dt_criacao: string;
  dt_atualizacao: string;
  nr_usuarios_com_perfil?: number;
  nm_empresa?: string | null;
}

export interface PerfisResponse {
  items: Perfil[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface PerfisFiltros {
  search?: string;
  tipo?: 'system' | 'custom';
  ativo?: 'S' | 'N';
  id_empresa?: string;
  page?: number;
  size?: number;
}

export interface CriarPerfilData {
  nm_perfil: string;
  ds_perfil?: string;
  id_empresa?: string | null;
  ds_permissoes: PermissoesCompletas | Record<string, any>;
  nm_tipo?: 'system' | 'custom';
  st_ativo?: 'S' | 'N';
}

export interface AtualizarPerfilData {
  nm_perfil?: string;
  ds_perfil?: string;
  ds_permissoes?: PermissoesCompletas | Record<string, any>;
  ds_grupos_acesso?: string[];
  ds_permissoes_detalhadas?: Record<string, Record<string, Record<string, boolean>>>;
  ds_rotas_permitidas?: string[];
  st_ativo?: 'S' | 'N';
}

// ====================================================================
// HOOKS
// ====================================================================

/**
 * Hook para listar perfis (roles)
 *
 * @param filtros - Filtros de busca (search, tipo, ativo, empresa, page, size)
 * @returns Lista de perfis com metadata de paginação
 *
 * @example
 * ```tsx
 * const { perfis, meta, isLoading, error, mutate } = usePerfis({
 *   search: 'admin',
 *   tipo: 'system',
 *   page: 1,
 *   size: 10
 * });
 * ```
 */
export function usePerfis(filtros: PerfisFiltros = {}) {
  const { search, tipo, ativo, id_empresa, page = 1, size = 10 } = filtros;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (tipo) params.append('tipo', tipo);
  if (ativo) params.append('ativo', ativo);
  if (id_empresa) params.append('id_empresa', id_empresa);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const key = `/perfis/?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<PerfisResponse>(
    key,
    async () => {
      const response = await apiClient.get<PerfisResponse>(key);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  return {
    perfis: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para obter perfis disponíveis (ativos)
 *
 * @param empresaId - ID da empresa (opcional)
 * @returns Lista de perfis disponíveis
 *
 * @example
 * ```tsx
 * const { perfis, isLoading } = usePerfisDisponiveis();
 * ```
 */
export function usePerfisDisponiveis(empresaId?: string) {
  const params = new URLSearchParams();
  if (empresaId) params.append('id_empresa', empresaId);

  const key = `/perfis/disponiveis?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<Perfil[]>(
    key,
    async () => {
      const response = await apiClient.get<Perfil[]>(key);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    perfis: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para obter um perfil específico por ID
 *
 * @param perfilId - ID do perfil
 * @returns Dados do perfil
 *
 * @example
 * ```tsx
 * const { perfil, isLoading, error } = usePerfil(perfilId);
 * ```
 */
export function usePerfil(perfilId: string | null) {
  const shouldFetch = Boolean(perfilId);

  const { data, error, isLoading, mutate } = useSWR<Perfil>(
    shouldFetch ? `/perfis/${perfilId}` : null,
    async () => {
      const response = await apiClient.get<Perfil>(`/perfis/${perfilId}`);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    perfil: data,
    isLoading,
    error,
    mutate,
  };
}

// ====================================================================
// MUTATIONS
// ====================================================================

/**
 * Cria um novo perfil
 *
 * @param data - Dados do perfil
 * @returns Perfil criado
 *
 * @example
 * ```tsx
 * const novoPerfil = await criarPerfil({
 *   nm_perfil: 'Gerente de Vendas',
 *   ds_perfil: 'Responsável pela equipe de vendas',
 *   ds_permissoes: {
 *     usuarios: { visualizar: true, criar: true },
 *     relatorios: { visualizar: true, exportar: true }
 *   },
 *   nm_tipo: 'custom',
 *   st_ativo: 'S'
 * });
 * ```
 */
export async function criarPerfil(data: CriarPerfilData): Promise<Perfil> {
  const response = await apiClient.post<Perfil>('/perfis/', data);
  return response;
}

/**
 * Atualiza um perfil existente
 *
 * @param perfilId - ID do perfil
 * @param data - Dados para atualizar
 * @returns Perfil atualizado
 *
 * @example
 * ```tsx
 * const perfilAtualizado = await atualizarPerfil(perfilId, {
 *   ds_perfil: 'Nova descrição',
 *   ds_permissoes: { ... }
 * });
 * ```
 */
export async function atualizarPerfil(
  perfilId: string,
  data: AtualizarPerfilData
): Promise<Perfil> {
  const response = await apiClient.put<Perfil>(`/perfis/${perfilId}`, data);
  return response;
}

/**
 * Deleta um perfil
 *
 * @param perfilId - ID do perfil
 * @returns Mensagem de sucesso
 *
 * @example
 * ```tsx
 * await deletarPerfil(perfilId);
 * toast.success('Perfil deletado com sucesso');
 * ```
 */
export async function deletarPerfil(perfilId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(`/perfis/${perfilId}`);
  return response;
}

/**
 * Ativa ou desativa um perfil
 *
 * @param perfilId - ID do perfil
 * @param ativo - Status desejado ('S' ou 'N')
 * @returns Perfil atualizado
 *
 * @example
 * ```tsx
 * await togglePerfilStatus(perfilId, 'N');
 * ```
 */
export async function togglePerfilStatus(
  perfilId: string,
  ativo: 'S' | 'N'
): Promise<Perfil> {
  return atualizarPerfil(perfilId, { st_ativo: ativo });
}

// ====================================================================
// CACHE REVALIDATION
// ====================================================================

/**
 * Revalida o cache de todos os perfis
 */
export async function revalidarPerfis(): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.startsWith('/perfis/?'));
}

/**
 * Revalida o cache de um perfil específico
 */
export async function revalidarPerfil(perfilId: string): Promise<void> {
  const { mutate } = await import('swr');
  await mutate(`/perfis/${perfilId}`);
}

/**
 * Revalida o cache de perfis disponíveis
 */
export async function revalidarPerfisDisponiveis(): Promise<void> {
  const { mutate } = await import('swr');
  await mutate((key) => typeof key === 'string' && key.startsWith('/perfis/disponiveis'));
}

// ====================================================================
// HELPERS
// ====================================================================

/**
 * Verifica se um perfil é do tipo system
 */
export function isPerfilSystem(perfil: Perfil): boolean {
  return perfil.nm_tipo === 'system';
}

/**
 * Verifica se um perfil está ativo
 */
export function isPerfilAtivo(perfil: Perfil): boolean {
  return perfil.st_ativo === 'S';
}

/**
 * Obtém badge de tipo do perfil
 */
export function getBadgeTipo(tipo: 'system' | 'custom'): {
  label: string;
  color: string;
} {
  const badges = {
    system: { label: 'Sistema', color: 'blue' },
    custom: { label: 'Personalizado', color: 'purple' },
  };

  return badges[tipo];
}

/**
 * Formata permissões para exibição
 */
export function formatarPermissoes(permissoes: Record<string, any>): string[] {
  const lista: string[] = [];

  Object.entries(permissoes).forEach(([recurso, perms]) => {
    if (typeof perms === 'object' && perms !== null) {
      Object.entries(perms).forEach(([acao, valor]) => {
        if (valor === true) {
          lista.push(`${recurso}.${acao}`);
        }
      });
    } else if (perms === true) {
      lista.push(recurso);
    }
  });

  return lista;
}

/**
 * Verifica se um perfil tem uma permissão específica
 */
export function temPermissao(
  perfil: Perfil,
  recurso: string,
  acao: string
): boolean {
  const perms = perfil.ds_permissoes as any;

  if (!perms || typeof perms !== 'object') {
    return false;
  }

  // Verifica permissão de admin (acesso total)
  if (perms.admin === true) {
    return true;
  }

  // Verifica permissão específica
  if (perms[recurso] && typeof perms[recurso] === 'object') {
    return perms[recurso][acao] === true;
  }

  return false;
}

/**
 * Cria um objeto de permissões padrão vazio
 */
export function criarPermissoesVazias(): PermissoesCompletas {
  const permissaoVazia: PermissoesRecurso = {
    criar: false,
    editar: false,
    excluir: false,
    visualizar: false,
  };

  return {
    usuarios: { ...permissaoVazia },
    agentes: { ...permissaoVazia },
    conversas: { ...permissaoVazia },
    document_stores: { ...permissaoVazia },
    credenciais: { ...permissaoVazia },
    variaveis: { ...permissaoVazia },
    tools: { ...permissaoVazia },
    empresa: { ...permissaoVazia },
    perfis: { ...permissaoVazia },
    relatorios: { ...permissaoVazia },
    admin: false,
  };
}

/**
 * Cria um objeto de permissões com acesso total
 */
export function criarPermissoesAdmin(): PermissoesCompletas {
  const permissaoCompleta: PermissoesRecurso = {
    criar: true,
    editar: true,
    excluir: true,
    visualizar: true,
    executar: true,
    upload: true,
    exportar: true,
  };

  return {
    usuarios: { ...permissaoCompleta },
    agentes: { ...permissaoCompleta },
    conversas: { ...permissaoCompleta },
    document_stores: { ...permissaoCompleta },
    credenciais: { ...permissaoCompleta },
    variaveis: { ...permissaoCompleta },
    tools: { ...permissaoCompleta },
    empresa: { ...permissaoCompleta },
    perfis: { ...permissaoCompleta },
    relatorios: { ...permissaoCompleta },
    admin: true,
  };
}
