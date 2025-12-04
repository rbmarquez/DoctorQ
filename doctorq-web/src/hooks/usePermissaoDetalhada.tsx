// src/hooks/usePermissaoDetalhada.ts
"use client";

import React, { useMemo } from "react";
import { useSession } from "next-auth/react";

/**
 * Estrutura de permissões detalhadas
 * {
 *   "clinica": {
 *     "agendamentos": { "visualizar": true, "criar": true, "editar": false, "excluir": false },
 *     "pacientes": { "visualizar": true, "criar": false, "editar": false, "excluir": false }
 *   },
 *   "admin": {
 *     "usuarios": { "visualizar": true, "criar": true, "editar": true, "excluir": true }
 *   }
 * }
 */

type PermissoesDetalhadas = {
  [grupo: string]: {
    [recurso: string]: {
      [acao: string]: boolean;
    };
  };
};

type GruposAcesso = string[];

interface PermissoesUsuario {
  grupos_acesso: GruposAcesso;
  permissoes_detalhadas: PermissoesDetalhadas;
}

interface UsePermissaoDetalhadaReturn {
  /**
   * Verifica se usuário tem permissão para executar ação em recurso
   * @param grupo - Grupo de acesso (admin, clinica, profissional, paciente, fornecedor)
   * @param recurso - Recurso a acessar (agendamentos, pacientes, etc.)
   * @param acao - Ação a realizar (visualizar, criar, editar, excluir)
   */
  temPermissao: (grupo: string, recurso: string, acao: string) => boolean;

  /**
   * Verifica se usuário tem acesso a um grupo (Nível 1)
   * @param grupo - Grupo de acesso
   */
  temAcessoGrupo: (grupo: string) => boolean;

  /**
   * Verifica se usuário tem qualquer permissão em um recurso
   * @param grupo - Grupo de acesso
   * @param recurso - Recurso a acessar
   */
  temAcessoRecurso: (grupo: string, recurso: string) => boolean;

  /**
   * Retorna todas as permissões de um recurso
   * @param grupo - Grupo de acesso
   * @param recurso - Recurso
   */
  getPermissoesRecurso: (
    grupo: string,
    recurso: string
  ) => Record<string, boolean> | null;

  /**
   * Verifica se é administrador (bypass de permissões)
   */
  isAdmin: boolean;

  /**
   * Grupos de acesso do usuário
   */
  gruposAcesso: GruposAcesso;

  /**
   * Todas as permissões detalhadas do usuário
   */
  permissoesDetalhadas: PermissoesDetalhadas;

  /**
   * Estado de carregamento
   */
  isLoading: boolean;
}

/**
 * Hook para verificar permissões detalhadas do usuário (Nível 2)
 *
 * Este hook implementa o segundo nível do sistema de permissões hierárquico,
 * permitindo verificar se o usuário tem permissões específicas (visualizar,
 * criar, editar, excluir) para realizar ações em recursos.
 *
 * @example
 * ```tsx
 * const { temPermissao, isAdmin } = usePermissaoDetalhada();
 *
 * // Verificar permissão específica
 * if (temPermissao('clinica', 'agendamentos', 'criar')) {
 *   return <CreateButton />;
 * }
 *
 * // Verificar acesso a grupo
 * if (temAcessoGrupo('admin')) {
 *   return <AdminPanel />;
 * }
 *
 * // Verificar se tem qualquer permissão em recurso
 * if (temAcessoRecurso('clinica', 'pacientes')) {
 *   return <PatientList />;
 * }
 * ```
 */
export function usePermissaoDetalhada(): UsePermissaoDetalhadaReturn {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";

  // Extrair permissões da sessão
  const permissoesUsuario: PermissoesUsuario = useMemo(() => {
    if (!session?.user?.permissions) {
      return {
        grupos_acesso: [],
        permissoes_detalhadas: {},
      };
    }

    const permissions = session.user.permissions as any;

    return {
      grupos_acesso: permissions.grupos_acesso || [],
      permissoes_detalhadas: permissions.permissoes_detalhadas || {},
    };
  }, [session]);

  // Verificar se é administrador
  const isAdmin = useMemo(() => {
    return permissoesUsuario.grupos_acesso.includes("admin");
  }, [permissoesUsuario.grupos_acesso]);

  /**
   * Verifica se usuário tem acesso a um grupo (Nível 1)
   */
  const temAcessoGrupo = (grupo: string): boolean => {
    // Admin tem acesso a todos os grupos
    if (isAdmin) return true;

    return permissoesUsuario.grupos_acesso.includes(grupo);
  };

  /**
   * Verifica se usuário tem permissão para executar ação em recurso (Nível 2)
   */
  const temPermissao = (
    grupo: string,
    recurso: string,
    acao: string
  ): boolean => {
    // Admin tem todas as permissões
    if (isAdmin) return true;

    // Verificar se tem acesso ao grupo
    if (!temAcessoGrupo(grupo)) return false;

    // Navegar na estrutura de permissões
    const grupoPermissoes = permissoesUsuario.permissoes_detalhadas[grupo];
    if (!grupoPermissoes) return false;

    const recursoPermissoes = grupoPermissoes[recurso];
    if (!recursoPermissoes) return false;

    return recursoPermissoes[acao] === true;
  };

  /**
   * Verifica se usuário tem qualquer permissão em um recurso
   */
  const temAcessoRecurso = (grupo: string, recurso: string): boolean => {
    // Admin tem acesso a tudo
    if (isAdmin) return true;

    // Verificar se tem acesso ao grupo
    if (!temAcessoGrupo(grupo)) return false;

    // Verificar se tem alguma permissão no recurso
    const grupoPermissoes = permissoesUsuario.permissoes_detalhadas[grupo];
    if (!grupoPermissoes) return false;

    const recursoPermissoes = grupoPermissoes[recurso];
    if (!recursoPermissoes) return false;

    // Verificar se tem pelo menos uma permissão true
    return Object.values(recursoPermissoes).some((valor) => valor === true);
  };

  /**
   * Retorna todas as permissões de um recurso
   */
  const getPermissoesRecurso = (
    grupo: string,
    recurso: string
  ): Record<string, boolean> | null => {
    // Admin tem todas as permissões
    if (isAdmin) {
      return {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: true,
        executar: true,
        exportar: true,
      };
    }

    const grupoPermissoes = permissoesUsuario.permissoes_detalhadas[grupo];
    if (!grupoPermissoes) return null;

    return grupoPermissoes[recurso] || null;
  };

  return {
    temPermissao,
    temAcessoGrupo,
    temAcessoRecurso,
    getPermissoesRecurso,
    isAdmin,
    gruposAcesso: permissoesUsuario.grupos_acesso,
    permissoesDetalhadas: permissoesUsuario.permissoes_detalhadas,
    isLoading,
  };
}

/**
 * HOC para proteger componentes baseado em permissões
 *
 * @example
 * ```tsx
 * export default withPermission(
 *   MyComponent,
 *   'clinica',
 *   'agendamentos',
 *   'criar'
 * );
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  grupo: string,
  recurso: string,
  acao: string,
  FallbackComponent?: React.ComponentType
) {
  return function ProtectedComponent(props: P) {
    const { temPermissao, isLoading } = usePermissaoDetalhada();

    if (isLoading) {
      return <div>Carregando permissões...</div>;
    }

    if (!temPermissao(grupo, recurso, acao)) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Componente condicional baseado em permissões
 *
 * @example
 * ```tsx
 * <PermissionGuard grupo="clinica" recurso="agendamentos" acao="criar">
 *   <CreateButton />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  grupo,
  recurso,
  acao,
  children,
  fallback = null,
}: {
  grupo: string;
  recurso: string;
  acao: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { temPermissao, isLoading } = usePermissaoDetalhada();

  if (isLoading) return null;

  if (!temPermissao(grupo, recurso, acao)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
