import { ReactNode } from "react";
import { usePermissions, PermissionResource, PermissionAction } from "@/hooks/usePermissions";

interface ProtectedActionProps {
  /**
   * Recurso que será verificado (ex: "agendamentos", "pacientes")
   */
  resource: PermissionResource;

  /**
   * Ação que será verificada (ex: "visualizar", "criar", "editar", "excluir")
   */
  action: PermissionAction;

  /**
   * Conteúdo que será renderizado se o usuário tiver permissão
   */
  children: ReactNode;

  /**
   * Conteúdo alternativo renderizado se NÃO tiver permissão (opcional)
   */
  fallback?: ReactNode;

  /**
   * Se true, renderiza fallback mesmo sem permissão
   * Se false, não renderiza nada quando não tem permissão
   */
  showFallback?: boolean;
}

/**
 * Componente que renderiza children apenas se usuário tiver a permissão específica
 *
 * @example
 * // Renderiza botão apenas se tiver permissão de criar agendamentos
 * <ProtectedAction resource="agendamentos" action="criar">
 *   <Button>Criar Agendamento</Button>
 * </ProtectedAction>
 *
 * @example
 * // Com fallback customizado
 * <ProtectedAction
 *   resource="financeiro"
 *   action="visualizar"
 *   fallback={<Badge variant="outline">Sem acesso</Badge>}
 *   showFallback={true}
 * >
 *   <div>Dados Financeiros</div>
 * </ProtectedAction>
 */
export function ProtectedAction({
  resource,
  action,
  children,
  fallback = null,
  showFallback = false
}: ProtectedActionProps) {
  const { hasPermission } = usePermissions();

  const permitted = hasPermission(resource, action);

  if (permitted) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
}
