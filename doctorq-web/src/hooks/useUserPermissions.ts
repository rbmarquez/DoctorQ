/**
 * Hook para buscar permissões do perfil do usuário logado
 *
 * Usa o formato plano de permissões (ex: "dashboard_visualizar": true)
 * que é configurado na matriz de permissões
 */

import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX';

interface Perfil {
  id_perfil: string;
  nm_perfil: string;
  ds_permissoes: Record<string, boolean>;
  ds_grupos_acesso?: string[];
  st_ativo: string;
}

interface MeResponse {
  id_user: string;
  nm_email: string;
  nm_completo: string;
  nm_papel: string;
  id_perfil?: string;
  perfil?: Perfil;
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook para obter permissões do usuário logado
 *
 * @returns Objeto com permissões e helpers
 *
 * @example
 * ```tsx
 * const { hasPermission, permissions, isLoading } = useUserPermissions();
 *
 * if (hasPermission('central_atendimento_visualizar')) {
 *   // Mostrar menu Central de Atendimento
 * }
 * ```
 */
export function useUserPermissions() {
  const { data: session } = useSession();

  // Obter id_perfil da sessão (agora incluído no auth.ts)
  const userId = session?.user?.id;
  const perfilId = session?.user?.id_perfil;

  // Buscar perfil diretamente se tiver o ID
  // NOTA: A rota /perfis/{id} NÃO usa trailing slash (causa redirect 307)
  const { data: perfil, isLoading: loadingPerfil } = useSWR<Perfil>(
    perfilId ? `/perfis/${perfilId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache 1 minuto
    }
  );

  // Buscar dados do usuário se não tiver id_perfil na sessão
  const { data: userData, isLoading: loadingUser } = useSWR<MeResponse>(
    !perfilId && userId ? `/users/me` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Buscar perfil do usuário se encontrado via /me
  const { data: userPerfil } = useSWR<Perfil>(
    userData?.id_perfil && !perfilId ? `/perfis/${userData.id_perfil}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Permissões finais (do perfil direto ou via userData)
  const finalPerfil = perfil || userPerfil;
  const permissions = finalPerfil?.ds_permissoes || {};

  // DEBUG: Verificar dados (remover depois)
  console.log('[useUserPermissions] Session:', { userId, perfilId, role: session?.user?.role });
  console.log('[useUserPermissions] Perfil:', finalPerfil?.nm_perfil);
  console.log('[useUserPermissions] Permissions keys:', Object.keys(permissions).slice(0, 5));

  // Role do usuário (para fallback)
  const role = session?.user?.role;
  const isAdmin = role === 'admin' || role === 'administrador';

  /**
   * Verifica se o usuário tem uma permissão específica
   *
   * @param permission - Nome da permissão (ex: 'central_atendimento_visualizar')
   * @returns true se tem permissão ou é admin
   */
  const hasPermission = (permission: string): boolean => {
    // Admin tem todas as permissões
    if (isAdmin && !finalPerfil) return true;

    // Normalizar para lowercase
    const normalizedPerm = permission.toLowerCase();

    // Verificar permissão
    return permissions[normalizedPerm] === true;
  };

  /**
   * Verifica se o usuário tem QUALQUER uma das permissões
   */
  const hasAnyPermission = (perms: string[]): boolean => {
    if (isAdmin && !finalPerfil) return true;
    return perms.some(p => hasPermission(p));
  };

  /**
   * Verifica se o usuário tem TODAS as permissões
   */
  const hasAllPermissions = (perms: string[]): boolean => {
    if (isAdmin && !finalPerfil) return true;
    return perms.every(p => hasPermission(p));
  };

  return {
    permissions,
    isLoading: loadingPerfil || loadingUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    perfilName: finalPerfil?.nm_perfil,
    perfilId: finalPerfil?.id_perfil,
    isAdmin,
    role,
  };
}

export default useUserPermissions;
