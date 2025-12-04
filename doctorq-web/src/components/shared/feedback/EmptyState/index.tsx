"use client";

import React from 'react';
import { FileX, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  /**
   * Título
   */
  title: string;

  /**
   * Descrição
   */
  description?: string;

  /**
   * Ícone customizado
   */
  icon?: React.ReactNode;

  /**
   * Ação principal
   */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

/**
 * Componente de estado vazio
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="Nenhuma empresa encontrada"
 *   description="Crie sua primeira empresa para começar"
 *   action={{
 *     label: "Nova Empresa",
 *     href: "/admin/gestao/empresas/nova"
 *   }}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="mb-4 text-muted-foreground">
          {icon || <FileX className="h-12 w-12" />}
        </div>

        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        {description && (
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
        )}

        {action && (
          <Button onClick={action.onClick}>
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
