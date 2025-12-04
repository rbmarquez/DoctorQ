"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react';

export interface StatCardProps {
  /**
   * Título do card
   */
  title: string;

  /**
   * Valor principal
   */
  value: string | number;

  /**
   * Ícone
   */
  icon?: LucideIcon;

  /**
   * Mudança percentual
   */
  change?: number;

  /**
   * Descrição da mudança
   */
  changeLabel?: string;

  /**
   * Se true, inverte cores de positivo/negativo
   */
  invertColors?: boolean;
}

/**
 * Card de estatística com ícone e tendência
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total de Empresas"
 *   value={42}
 *   icon={Building}
 *   change={12.5}
 *   changeLabel="vs mês anterior"
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  invertColors = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  const trendColor = invertColors
    ? isPositive
      ? 'text-red-600'
      : isNegative
      ? 'text-green-600'
      : 'text-muted-foreground'
    : isPositive
    ? 'text-green-600'
    : isNegative
    ? 'text-red-600'
    : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trendColor} mt-1`}>
            {isPositive && <ArrowUp className="h-3 w-3" />}
            {isNegative && <ArrowDown className="h-3 w-3" />}
            <span className="font-medium">
              {Math.abs(change)}%
            </span>
            {changeLabel && (
              <span className="text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
