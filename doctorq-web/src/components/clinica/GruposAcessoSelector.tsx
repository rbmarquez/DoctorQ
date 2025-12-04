/**
 * Componente para seleção de grupos de acesso de um perfil
 *
 * Permite selecionar quais seções do sistema (grupos) o perfil pode acessar:
 * - admin: Administração geral
 * - clinica: Gestão de clínica
 * - profissional: Área do profissional
 * - paciente: Área do paciente
 * - fornecedor: Área de fornecedores
 *
 * @author Claude
 * @date 2025-11-05
 */

'use client';

import { Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

// Definição dos grupos de acesso disponíveis
export const GRUPOS_ACESSO = [
  {
    value: 'admin',
    label: 'Administração',
    description: 'Acesso completo à administração do sistema',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    value: 'clinica',
    label: 'Clínica',
    description: 'Gestão de clínica, agendamentos, pacientes',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    value: 'profissional',
    label: 'Profissional',
    description: 'Área do profissional de saúde',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    value: 'paciente',
    label: 'Paciente',
    description: 'Área do paciente/cliente',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    value: 'fornecedor',
    label: 'Fornecedor',
    description: 'Área de fornecedores e parceiros',
    icon: Shield,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
] as const;

export type GrupoAcesso = typeof GRUPOS_ACESSO[number]['value'];

interface GruposAcessoSelectorProps {
  value: string[]; // Lista de grupos selecionados
  onChange: (grupos: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function GruposAcessoSelector({
  value = [],
  onChange,
  disabled = false,
  className,
}: GruposAcessoSelectorProps) {
  const toggleGrupo = (grupoValue: string) => {
    if (disabled) return;

    if (value.includes(grupoValue)) {
      // Remover grupo
      onChange(value.filter((g) => g !== grupoValue));
    } else {
      // Adicionar grupo
      onChange([...value, grupoValue]);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-700">
          Grupos de Acesso
        </h4>
        <span className="text-xs text-gray-500">
          ({value.length} selecionado{value.length !== 1 ? 's' : ''})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GRUPOS_ACESSO.map((grupo) => {
          const isSelected = value.includes(grupo.value);
          const Icon = grupo.icon;

          return (
            <button
              key={grupo.value}
              type="button"
              onClick={() => toggleGrupo(grupo.value)}
              disabled={disabled}
              className={cn(
                'relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? cn(
                      grupo.bgColor,
                      grupo.borderColor,
                      'shadow-sm'
                    )
                  : 'bg-white border-gray-200 hover:border-gray-300',
                !disabled && 'cursor-pointer'
              )}
            >
              {/* Checkbox visual */}
              <div
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center',
                  'transition-colors',
                  isSelected
                    ? cn(grupo.color, 'border-current bg-current')
                    : 'border-gray-300 bg-white'
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>

              {/* Conteúdo do grupo */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isSelected ? grupo.color : 'text-gray-400'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium text-sm',
                      isSelected ? grupo.color : 'text-gray-700'
                    )}
                  >
                    {grupo.label}
                  </span>
                </div>
                <p
                  className={cn(
                    'text-xs',
                    isSelected ? 'text-gray-700' : 'text-gray-500'
                  )}
                >
                  {grupo.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <span className="font-semibold">⚠️ Atenção:</span>
          <span>
            Selecione pelo menos um grupo de acesso para que o perfil tenha
            permissões.
          </span>
        </p>
      )}
    </div>
  );
}
