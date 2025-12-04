'use client';

/**
 * BulkActions Component
 *
 * Adiciona funcionalidade de ações em massa ao DataTable:
 * - Multi-select com checkboxes
 * - Barra de ações flutuante
 * - Confirmação para ações destrutivas
 * - Contador de itens selecionados
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Trash2, Download, Check, X } from 'lucide-react';

export interface BulkAction<T> {
  /** Label da ação */
  label: string;

  /** Ícone da ação */
  icon?: React.ReactNode;

  /** Callback ao executar */
  onClick: (selectedItems: T[]) => void | Promise<void>;

  /** Variante do botão */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

  /** Requer confirmação? */
  requireConfirm?: boolean;

  /** Mensagem de confirmação customizada */
  confirmMessage?: string;

  /** Desabilitado? */
  disabled?: boolean;
}

export interface BulkActionsBarProps<T> {
  /** Itens selecionados */
  selectedItems: T[];

  /** Total de itens disponíveis */
  totalItems: number;

  /** Ações disponíveis */
  actions: BulkAction<T>[];

  /** Callback ao limpar seleção */
  onClear: () => void;

  /** Classe customizada */
  className?: string;
}

/**
 * Barra de ações em massa (aparece quando há itens selecionados)
 */
export function BulkActionsBar<T>({
  selectedItems,
  totalItems,
  actions,
  onClear,
  className,
}: BulkActionsBarProps<T>) {
  const [confirmAction, setConfirmAction] = useState<BulkAction<T> | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  if (selectedItems.length === 0) return null;

  const handleAction = async (action: BulkAction<T>) => {
    if (action.requireConfirm) {
      setConfirmAction(action);
      return;
    }

    await executeAction(action);
  };

  const executeAction = async (action: BulkAction<T>) => {
    setIsExecuting(true);
    try {
      await action.onClick(selectedItems);
      onClear();
    } finally {
      setIsExecuting(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-4 px-6 py-3',
          'bg-primary text-primary-foreground rounded-lg shadow-lg',
          'animate-in slide-in-from-bottom-5',
          className
        )}
      >
        {/* Counter */}
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span className="font-medium">
            {selectedItems.length} de {totalItems} selecionados
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-primary-foreground/20" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={action.disabled || isExecuting}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Clear button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isExecuting}
          className="ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmMessage ||
                `Tem certeza que deseja executar esta ação em ${selectedItems.length} ${
                  selectedItems.length === 1 ? 'item' : 'itens'
                }? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && executeAction(confirmAction)}
              className={
                confirmAction?.variant === 'destructive' ? 'bg-destructive' : undefined
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Hook para gerenciar seleção em massa
 */
export function useBulkSelect<T>(items: T[], getItemId: (item: T) => string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = items.filter(item => selectedIds.has(getItemId(item)));

  const isSelected = (item: T) => selectedIds.has(getItemId(item));

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < items.length;

  const toggleItem = (item: T) => {
    const id = getItemId(item);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(getItemId)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return {
    selectedItems,
    selectedIds,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleItem,
    toggleAll,
    clearSelection,
  };
}

/**
 * Componente de checkbox para header (selecionar todos)
 */
export function SelectAllCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Checkbox
      checked={checked}
      // @ts-expect-error - indeterminate is valid para o componente Checkbox
      indeterminate={indeterminate}
      onCheckedChange={onCheckedChange}
      aria-label="Selecionar todos"
    />
  );
}

/**
 * Componente de checkbox para row
 */
export function SelectRowCheckbox({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel || 'Selecionar linha'}
      onClick={(e) => e.stopPropagation()} // Não propagar para row click
    />
  );
}

/**
 * Ações comuns pré-definidas
 */
export const commonBulkActions = {
  delete: <T,>(onDelete: (items: T[]) => Promise<void>): BulkAction<T> => ({
    label: 'Deletar',
    icon: <Trash2 className="h-4 w-4 mr-2" />,
    variant: 'destructive',
    requireConfirm: true,
    confirmMessage: 'Tem certeza que deseja deletar os itens selecionados?',
    onClick: onDelete,
  }),

  export: <T,>(
    onExport: (items: T[]) => void,
    format: 'csv' | 'excel' | 'json' = 'csv'
  ): BulkAction<T> => ({
    label: `Exportar ${format.toUpperCase()}`,
    icon: <Download className="h-4 w-4 mr-2" />,
    variant: 'secondary',
    onClick: onExport,
  }),
};

/**
 * Exemplo de uso com DataTable:
 *
 * ```tsx
 * function MyTable() {
 *   const { data } = useEmpresas();
 *   const bulk = useBulkSelect(data, (item) => item.id);
 *
 *   const handleDelete = async (items: Empresa[]) => {
 *     await Promise.all(items.map(item => deleteEmpresa(item.id)));
 *     mutate(); // Revalidar
 *   };
 *
 *   const bulkActions: BulkAction<Empresa>[] = [
 *     commonBulkActions.delete(handleDelete),
 *     commonBulkActions.export((items) => exportToCSV(items, 'empresas.csv')),
 *   ];
 *
 *   return (
 *     <>
 *       <DataTable
 *         data={data}
 *         columns={columns}
 *         bulkSelect={bulk}
 *       />
 *
 *       <BulkActionsBar
 *         selectedItems={bulk.selectedItems}
 *         totalItems={data.length}
 *         actions={bulkActions}
 *         onClear={bulk.clearSelection}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
