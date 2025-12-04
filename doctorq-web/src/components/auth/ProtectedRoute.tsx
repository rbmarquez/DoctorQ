/**
 * Componente para proteger rotas com base em permissões de grupo (Nível 1)
 *
 * Verifica se o usuário tem acesso ao grupo especificado antes de renderizar o conteúdo.
 * Caso não tenha acesso, redireciona ou mostra página de acesso negado.
 *
 * @author Claude
 * @date 2025-11-05
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import type { GrupoAcesso } from '@/types/permissions';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Grupo de acesso necessário (admin, clinica, profissional, paciente, fornecedor) */
  requiredGroup: GrupoAcesso;
  /** URL para redirecionar se não tiver acesso (opcional) */
  redirectTo?: string;
  /** Se true, mostra página de acesso negado ao invés de redirecionar */
  showAccessDenied?: boolean;
}

/**
 * Componente de loading enquanto verifica permissões
 */
function LoadingPermissions() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
        <p className="text-sm text-muted-foreground">Verificando permissões...</p>
      </div>
    </div>
  );
}

/**
 * Componente de acesso negado
 */
function AccessDenied({ grupo }: { grupo: GrupoAcesso }) {
  const router = useRouter();

  const grupoLabels: Record<GrupoAcesso, string> = {
    admin: 'Administração',
    clinica: 'Clínica',
    profissional: 'Profissional',
    paciente: 'Paciente',
    fornecedor: 'Fornecedor',
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Acesso Negado
        </h1>

        <p className="mb-6 text-center text-gray-600">
          Você não tem permissão para acessar a área de{' '}
          <span className="font-semibold">{grupoLabels[grupo]}</span>.
        </p>

        <div className="mb-6 rounded-lg bg-orange-50 border border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Por que estou vendo isso?</p>
              <p>
                Seu perfil não possui permissão para acessar esta área do sistema.
                Entre em contato com o administrador da sua clínica para solicitar acesso.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="w-full rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de rota protegida (Nível 1 - Grupos)
 *
 * @example
 * ```tsx
 * // Proteger toda a área admin
 * export default function AdminLayout({ children }: { children: ReactNode }) {
 *   return (
 *     <ProtectedRoute requiredGroup="admin">
 *       {children}
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Proteger com redirecionamento customizado
 * export default function ClinicaPage() {
 *   return (
 *     <ProtectedRoute
 *       requiredGroup="clinica"
 *       redirectTo="/login"
 *     >
 *       <ClinicaDashboard />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({
  children,
  requiredGroup,
  redirectTo,
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { hasGroupAccess, isLoading: isLoadingPermissions } = usePermissions();

  // Verificar autenticação e permissões
  useEffect(() => {
    // Se ainda está carregando, não fazer nada
    if (isLoadingAuth || isLoadingPermissions) {
      return;
    }

    // Se não está autenticado, redirecionar para login
    if (!user) {
      router.push('/login');
      return;
    }

    // Se não tem acesso ao grupo e deve redirecionar
    if (!hasGroupAccess(requiredGroup) && redirectTo && !showAccessDenied) {
      router.push(redirectTo);
      return;
    }
  }, [
    user,
    isLoadingAuth,
    isLoadingPermissions,
    hasGroupAccess,
    requiredGroup,
    redirectTo,
    showAccessDenied,
    router,
  ]);

  // Loading state
  if (isLoadingAuth || isLoadingPermissions) {
    return <LoadingPermissions />;
  }

  // Não autenticado
  if (!user) {
    return null; // Redirecionamento acontece no useEffect
  }

  // Não tem acesso ao grupo
  if (!hasGroupAccess(requiredGroup)) {
    if (showAccessDenied) {
      return <AccessDenied grupo={requiredGroup} />;
    }
    return null; // Redirecionamento acontece no useEffect
  }

  // Tem acesso - renderizar conteúdo
  return <>{children}</>;
}
