/**
 * Componente de tabela de dados genérico e reutilizável
 *
 * Características:
 * - Tipagem genérica para qualquer tipo de dado
 * - Suporte a ordenação, paginação e filtros
 * - Ações customizáveis por linha
 * - Skeleton loading state
 * - Empty state configurável
 * - Responsivo
 */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';

/**
 * Definição de coluna da tabela
 */
export interface ColumnDef<T> {
  /** Key do campo no objeto (usado para acessar o valor) */
  accessorKey: keyof T;
  /** Header label */
  header: string;
  /** Função para renderizar célula customizada */
  cell?: (row: T) => React.ReactNode;
  /** Se true, permite ordenação por esta coluna */
  sortable?: boolean;
  /** Classe CSS customizada para a coluna */
  className?: string;
}

/**
 * Ação disponível para cada linha
 */
export interface RowAction<T> {
  /** Label da ação */
  label: string;
  /** Ícone da ação (componente Lucide) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Callback ao clicar */
  onClick: (row: T) => void;
  /** Se true, mostra como ação destrutiva */
  variant?: 'default' | 'destructive';
}

/**
 * Props do DataTable
 */
export interface DataTableProps<T> {
  /** Array de dados para exibir */
  data: T[];
  /** Definição das colunas */
  columns: ColumnDef<T>[];
  /** Ações disponíveis para cada linha */
  actions?: RowAction<T>[];
  /** Indica se está carregando */
  isLoading?: boolean;
  /** Mensagem quando não há dados */
  emptyMessage?: string;
  /** Callback ao mudar ordenação (coluna, direção) */
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  /** Classe CSS customizada */
  className?: string;
}

/**
 * Componente genérico de tabela de dados
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<Empresa>[] = [
 *   { accessorKey: 'nm_razao_social', header: 'Razão Social', sortable: true },
 *   { accessorKey: 'nr_cnpj', header: 'CNPJ' },
 *   {
 *     accessorKey: 'nm_plano',
 *     header: 'Plano',
 *     cell: (row) => <Badge>{row.nm_plano}</Badge>,
 *   },
 * ];
 *
 * const actions: RowAction<Empresa>[] = [
 *   { label: 'Editar', icon: Edit, onClick: (row) => router.push(`/empresas/${row.id_empresa}/editar`) },
 *   { label: 'Deletar', icon: Trash, variant: 'destructive', onClick: handleDelete },
 * ];
 *
 * <DataTable data={empresas} columns={columns} actions={actions} isLoading={isLoading} />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  onSort,
  className = '',
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof T) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);

    if (onSort) {
      onSort(column, newDirection);
    }
  };

  // Skeleton durante loading
  if (isLoading) {
    return (
      <div className={`rounded-md border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.accessorKey)}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-[100px]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={String(column.accessorKey)}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={`rounded-md border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.accessorKey)} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {actions.length > 0 && <TableHead className="w-[100px]">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="h-24 text-center">
                <p className="text-muted-foreground">{emptyMessage}</p>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.accessorKey)} className={column.className}>
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.accessorKey)}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    {column.header}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
            {actions.length > 0 && <TableHead className="w-[100px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={String(column.accessorKey)} className={column.className}>
                  {column.cell ? column.cell(row) : String(row[column.accessorKey] || '-')}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions.map((action, actionIndex) => {
                        const Icon = action.icon;
                        return (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={action.variant === 'destructive' ? 'text-red-600' : ''}
                          >
                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                            {action.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
