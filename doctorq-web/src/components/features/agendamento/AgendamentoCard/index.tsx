"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Agendamento {
  id_agendamento: string;
  dt_agendamento: string;
  hr_agendamento: string;
  nm_status: string;
  paciente?: {
    nm_completo: string;
  };
  profissional?: {
    nm_completo: string;
  };
  procedimento?: {
    nm_procedimento: string;
  };
  clinica?: {
    nm_fantasia: string;
  };
}

export interface AgendamentoCardProps {
  agendamento: Agendamento;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onConfirm?: (id: string) => void;
  variant?: 'default' | 'compact';
}

/**
 * Card de agendamento com informações e ações
 *
 * @example
 * ```tsx
 * <AgendamentoCard
 *   agendamento={agendamento}
 *   onCancel={handleCancel}
 *   onConfirm={handleConfirm}
 * />
 * ```
 */
export function AgendamentoCard({
  agendamento,
  onCancel,
  onReschedule,
  onConfirm,
  variant = 'default',
}: AgendamentoCardProps) {
  const {
    id_agendamento,
    dt_agendamento,
    hr_agendamento,
    nm_status,
    paciente,
    profissional,
    procedimento,
    clinica,
  } = agendamento;

  const statusVariant = getStatusVariant(nm_status);

  const formattedDate = dt_agendamento
    ? format(new Date(dt_agendamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  return (
    <Card data-variant={variant}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {paciente && (
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {paciente.nm_completo}
              </h3>
            )}
            {procedimento && (
              <p className="text-sm text-muted-foreground">
                {procedimento.nm_procedimento}
              </p>
            )}
          </div>
          <Badge variant={statusVariant}>{nm_status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{hr_agendamento}</span>
          </div>

          {profissional && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{profissional.nm_completo}</span>
            </div>
          )}

          {clinica && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{clinica.nm_fantasia}</span>
            </div>
          )}
        </div>

        {(onConfirm || onReschedule || onCancel) && (
          <div className="flex gap-2 pt-2">
            {onConfirm && nm_status === 'pendente' && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => onConfirm(id_agendamento)}
              >
                Confirmar
              </Button>
            )}

            {onReschedule && nm_status !== 'cancelado' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onReschedule(id_agendamento)}
              >
                Reagendar
              </Button>
            )}

            {onCancel && nm_status !== 'cancelado' && (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onCancel(id_agendamento)}
              >
                Cancelar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusVariant(status: string): any {
  const variants: Record<string, any> = {
    confirmado: 'default',
    pendente: 'secondary',
    cancelado: 'destructive',
    concluido: 'outline',
  };
  return variants[status.toLowerCase()] || 'secondary';
}
