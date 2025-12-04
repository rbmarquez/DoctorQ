/**
 * Hook para gerenciar permissões de usuário com sistema de dois níveis
 *
 * Nível 1 (Grupos): Controla acesso às áreas do sistema (admin, clinica, profissional, paciente, fornecedor)
 * Nível 2 (Funcionalidades): Controla ações específicas dentro de cada área (visualizar, criar, editar, excluir, etc.)
 *
 * @author Claude
 * @date 2025-11-05
 */

import useSWR from 'swr';
import { useAuth } from './useAuth';
import type {
  UserPermissions,
  GrupoAcesso,
  AcaoPermissao,
} from '@/types/permissions';

// Base URL da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || process.env.API_DOCTORQ_API_KEY;

/**
 * Fetcher para SWR com autenticação
 */
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar permissões: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook principal para gerenciar permissões do usuário
 *
 * @returns Objeto com métodos e dados de permissões
 *
 * @example
 * ```tsx
 * const { hasGroupAccess, hasPermission, isAdmin } = usePermissions();
 *
 * // Verificar acesso ao grupo
 * if (hasGroupAccess('admin')) {
 *   // Mostrar menu admin
 * }
 *
 * // Verificar permissão específica
 * if (hasPermission('clinica', 'agenda', 'criar')) {
 *   // Mostrar botão "Novo Agendamento"
 * }
 * ```
 */
export function usePermissions() {
  const { user } = useAuth();
  const userId = user?.id_user;

  // Buscar permissões completas do usuário
  const {
    data: permissions,
    error,
    mutate,
    isLoading,
  } = useSWR<UserPermissions>(
    userId ? `/permissions/users/${userId}/permissions` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache por 1 minuto
    }
  );

  /**
   * Verifica se o usuário tem acesso a um grupo específico (Nível 1)
   *
   * @param grupo - Nome do grupo (admin, clinica, profissional, paciente, fornecedor)
   * @returns true se tem acesso, false caso contrário
   */
  const hasGroupAccess = (grupo: GrupoAcesso): boolean => {
    if (!permissions) return false;
    return permissions.grupos_acesso.includes(grupo);
  };

  /**
   * Verifica se o usuário tem permissão para uma ação específica (Nível 2)
   *
   * @param grupo - Nome do grupo
   * @param recurso - Nome do recurso (agenda, pacientes, usuarios, etc.)
   * @param acao - Ação a ser verificada (visualizar, criar, editar, excluir, etc.)
   * @returns true se tem permissão, false caso contrário
   */
  const hasPermission = (
    grupo: GrupoAcesso,
    recurso: string,
    acao: AcaoPermissao
  ): boolean => {
    if (!permissions) return false;

    // Verificar primeiro se tem acesso ao grupo
    if (!hasGroupAccess(grupo)) return false;

    // Admin tem acesso a tudo no grupo admin
    if (permissions.is_admin && grupo === 'admin') return true;

    // Verificar permissão específica
    const recursoPerms = permissions.permissoes_detalhadas[grupo]?.[recurso];
    return recursoPerms?.[acao] ?? false;
  };

  /**
   * Retorna a lista de grupos que o usuário pode acessar
   *
   * @returns Array de grupos acessíveis
   */
  const getAccessibleGroups = (): GrupoAcesso[] => {
    if (!permissions) return [];
    return permissions.grupos_acesso;
  };

  /**
   * Retorna a lista de recursos que o usuário pode acessar em um grupo específico
   *
   * @param grupo - Nome do grupo
   * @returns Array de recursos acessíveis
   */
  const getGroupResources = (grupo: GrupoAcesso): string[] => {
    if (!permissions || !permissions.permissoes_detalhadas[grupo]) return [];
    return Object.keys(permissions.permissoes_detalhadas[grupo]);
  };

  /**
   * Retorna a lista de ações permitidas para um recurso específico
   *
   * @param grupo - Nome do grupo
   * @param recurso - Nome do recurso
   * @returns Array de ações permitidas
   */
  const getResourceActions = (grupo: GrupoAcesso, recurso: string): AcaoPermissao[] => {
    if (!permissions || !permissions.permissoes_detalhadas[grupo]?.[recurso]) {
      return [];
    }

    const recursoPerms = permissions.permissoes_detalhadas[grupo][recurso];
    return Object.entries(recursoPerms)
      .filter(([_, permitido]) => permitido)
      .map(([acao]) => acao as AcaoPermissao);
  };

  /**
   * Verifica se o usuário é administrador total do sistema
   *
   * @returns true se é admin, false caso contrário
   */
  const isAdmin = (): boolean => {
    if (!permissions) return false;
    return permissions.is_admin;
  };

  /**
   * Verifica se o usuário tem pelo menos uma das permissões fornecidas
   *
   * @param checks - Array de [grupo, recurso, acao]
   * @returns true se tem alguma das permissões
   */
  const hasAnyPermission = (
    checks: Array<[GrupoAcesso, string, AcaoPermissao]>
  ): boolean => {
    return checks.some(([grupo, recurso, acao]) =>
      hasPermission(grupo, recurso, acao)
    );
  };

  /**
   * Verifica se o usuário tem todas as permissões fornecidas
   *
   * @param checks - Array de [grupo, recurso, acao]
   * @returns true se tem todas as permissões
   */
  const hasAllPermissions = (
    checks: Array<[GrupoAcesso, string, AcaoPermissao]>
  ): boolean => {
    return checks.every(([grupo, recurso, acao]) =>
      hasPermission(grupo, recurso, acao)
    );
  };

  /**
   * Força revalidação das permissões
   */
  const reloadPermissions = async () => {
    await mutate();
  };

  return {
    // Dados
    permissions,
    isLoading,
    error,

    // Nível 1: Acesso a grupos
    hasGroupAccess,
    getAccessibleGroups,

    // Nível 2: Permissões de funcionalidades
    hasPermission,
    getGroupResources,
    getResourceActions,

    // Admin
    isAdmin,

    // Informações do perfil
    perfilName: permissions?.nm_perfil,
    perfilId: permissions?.id_perfil,

    // Avançado
    hasAnyPermission,
    hasAllPermissions,
    reloadPermissions,
  };
}

/**
 * Hook simplificado para verificar acesso a um grupo específico
 *
 * @param grupo - Nome do grupo a verificar
 * @returns true se tem acesso, false caso contrário
 *
 * @example
 * ```tsx
 * const hasAdminAccess = useGroupAccess('admin');
 * if (hasAdminAccess) {
 *   return <AdminDashboard />;
 * }
 * ```
 */
export function useGroupAccess(grupo: GrupoAcesso): boolean {
  const { hasGroupAccess } = usePermissions();
  return hasGroupAccess(grupo);
}

/**
 * Hook simplificado para verificar uma permissão específica
 *
 * @param grupo - Nome do grupo
 * @param recurso - Nome do recurso
 * @param acao - Ação a verificar
 * @returns true se tem permissão, false caso contrário
 *
 * @example
 * ```tsx
 * const canCreateAppointment = usePermission('clinica', 'agenda', 'criar');
 *
 * return (
 *   <Button disabled={!canCreateAppointment}>
 *     Novo Agendamento
 *   </Button>
 * );
 * ```
 */
export function usePermission(
  grupo: GrupoAcesso,
  recurso: string,
  acao: AcaoPermissao
): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(grupo, recurso, acao);
}
