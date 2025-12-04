/**
 * Componente para proteger ações específicas com base em permissões detalhadas (Nível 2)
 *
 * Controla a visibilidade e estado de botões, links e outros elementos
 * baseado nas permissões do usuário para recursos e ações específicas.
 *
 * @author Claude
 * @date 2025-11-05
 */

'use client';

import { usePermissions } from '@/hooks/usePermissions';
import type { GrupoAcesso, AcaoPermissao } from '@/types/permissions';
import { LockKeyhole } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProtectedActionProps {
  children: React.ReactNode;
  /** Grupo de acesso (admin, clinica, profissional, paciente, fornecedor) */
  grupo: GrupoAcesso;
  /** Recurso a verificar (agenda, pacientes, usuarios, etc.) */
  recurso: string;
  /** Ação a verificar (visualizar, criar, editar, excluir, etc.) */
  acao: AcaoPermissao;
  /** Se true, renderiza elemento desabilitado ao invés de ocultar */
  showDisabled?: boolean;
  /** Mensagem de tooltip quando desabilitado */
  disabledMessage?: string;
  /** Classe CSS adicional quando desabilitado */
  disabledClassName?: string;
  /** Renderiza fallback customizado quando sem permissão */
  fallback?: React.ReactNode;
}

/**
 * Componente que envolve o children com tooltip de permissão negada
 */
function DisabledWithTooltip({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4" />
            <span>{message}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Componente de ação protegida (Nível 2 - Funcionalidades)
 *
 * @example
 * ```tsx
 * // Botão que só aparece se pode criar agendamentos
 * <ProtectedAction grupo="clinica" recurso="agenda" acao="criar">
 *   <Button>Novo Agendamento</Button>
 * </ProtectedAction>
 * ```
 *
 * @example
 * ```tsx
 * // Botão desabilitado ao invés de oculto
 * <ProtectedAction
 *   grupo="clinica"
 *   recurso="pacientes"
 *   acao="excluir"
 *   showDisabled={true}
 *   disabledMessage="Você não tem permissão para excluir pacientes"
 * >
 *   <Button variant="destructive">Excluir</Button>
 * </ProtectedAction>
 * ```
 *
 * @example
 * ```tsx
 * // Múltiplas ações com fallback
 * <ProtectedAction
 *   grupo="admin"
 *   recurso="usuarios"
 *   acao="editar"
 *   fallback={<Button disabled>Editar (Sem permissão)</Button>}
 * >
 *   <Button>Editar Usuário</Button>
 * </ProtectedAction>
 * ```
 */
export function ProtectedAction({
  children,
  grupo,
  recurso,
  acao,
  showDisabled = false,
  disabledMessage = 'Você não tem permissão para esta ação',
  disabledClassName = 'opacity-50 cursor-not-allowed pointer-events-none',
  fallback,
}: ProtectedActionProps) {
  const { hasPermission, isLoading } = usePermissions();

  // Enquanto carrega, não mostrar nada (evita flash de conteúdo)
  if (isLoading) {
    return null;
  }

  // Verificar permissão
  const hasAccess = hasPermission(grupo, recurso, acao);

  // Tem permissão - renderizar normalmente
  if (hasAccess) {
    return <>{children}</>;
  }

  // Não tem permissão - renderizar fallback se fornecido
  if (fallback) {
    return <>{fallback}</>;
  }

  // Não tem permissão - mostrar desabilitado com tooltip
  if (showDisabled) {
    return (
      <DisabledWithTooltip message={disabledMessage} className={disabledClassName}>
        {children}
      </DisabledWithTooltip>
    );
  }

  // Não tem permissão - ocultar completamente
  return null;
}

/**
 * Hook helper para verificar permissão diretamente em componentes
 *
 * @example
 * ```tsx
 * function AgendaActions() {
 *   const canCreate = useActionPermission('clinica', 'agenda', 'criar');
 *   const canEdit = useActionPermission('clinica', 'agenda', 'editar');
 *   const canDelete = useActionPermission('clinica', 'agenda', 'excluir');
 *
 *   return (
 *     <div>
 *       {canCreate && <Button>Criar</Button>}
 *       {canEdit && <Button>Editar</Button>}
 *       {canDelete && <Button variant="destructive">Excluir</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useActionPermission(
  grupo: GrupoAcesso,
  recurso: string,
  acao: AcaoPermissao
): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(grupo, recurso, acao);
}

/**
 * Componente para renderizar condicionalmente baseado em múltiplas permissões
 *
 * @example
 * ```tsx
 * <ProtectedMultipleActions
 *   checks={[
 *     ['clinica', 'agenda', 'criar'],
 *     ['clinica', 'agenda', 'editar'],
 *   ]}
 *   requireAll={false} // Basta ter UMA das permissões
 * >
 *   <AgendaManagement />
 * </ProtectedMultipleActions>
 * ```
 */
interface ProtectedMultipleActionsProps {
  children: React.ReactNode;
  /** Array de checks [grupo, recurso, acao] */
  checks: Array<[GrupoAcesso, string, AcaoPermissao]>;
  /** Se true, exige todas as permissões. Se false, basta uma */
  requireAll?: boolean;
  /** Fallback quando não tem permissão */
  fallback?: React.ReactNode;
}

export function ProtectedMultipleActions({
  children,
  checks,
  requireAll = true,
  fallback,
}: ProtectedMultipleActionsProps) {
  const { hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasAccess = requireAll
    ? hasAllPermissions(checks)
    : hasAnyPermission(checks);

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}
