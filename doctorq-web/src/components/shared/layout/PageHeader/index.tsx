"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  icon?: React.ReactNode;
}

export interface PageHeaderProps {
  /**
   * Título da página
   */
  title: string;

  /**
   * Descrição opcional
   */
  description?: string;

  /**
   * Link de voltar
   */
  backHref?: string;

  /**
   * Ação principal (botão)
   */
  action?: PageHeaderAction;

  /**
   * Ações secundárias
   */
  secondaryActions?: PageHeaderAction[];

  /**
   * Conteúdo customizado adicional
   */
  children?: React.ReactNode;
}

/**
 * Cabeçalho padrão de páginas com título, descrição e ações
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Empresas"
 *   description="Gerencie empresas cadastradas"
 *   backHref="/admin/dashboard"
 *   action={{
 *     label: "Nova Empresa",
 *     href: "/admin/gestao/empresas/nova"
 *   }}
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  backHref,
  action,
  secondaryActions,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {(action || secondaryActions) && (
          <div className="flex items-center gap-2">
            {secondaryActions?.map((secAction, index) => (
              <ActionButton key={index} {...secAction} />
            ))}
            {action && <ActionButton {...action} primary />}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

function ActionButton({
  label,
  href,
  onClick,
  variant = 'default',
  icon,
  primary,
}: PageHeaderAction & { primary?: boolean }) {
  const buttonContent = (
    <>
      {icon}
      {label}
    </>
  );

  const buttonVariant = primary ? 'default' : variant;

  if (href) {
    return (
      <Link href={href}>
        <Button variant={buttonVariant}>{buttonContent}</Button>
      </Link>
    );
  }

  return (
    <Button variant={buttonVariant} onClick={onClick}>
      {buttonContent}
    </Button>
  );
}
