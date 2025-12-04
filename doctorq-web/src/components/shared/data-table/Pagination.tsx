/**
 * Componente de paginação genérico
 *
 * Características:
 * - Navegação por botões (primeira, anterior, próxima, última)
 * - Indicador de página atual e total
 * - Seletor de itens por página
 * - Informação de total de registros
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Metadados de paginação
 */
export interface PaginationMeta {
  /** Página atual (1-indexed) */
  currentPage: number;
  /** Total de páginas */
  totalPages: number;
  /** Total de itens */
  totalItems: number;
  /** Itens por página */
  pageSize: number;
}

/**
 * Props do Pagination
 */
export interface PaginationProps {
  /** Metadados de paginação */
  meta: PaginationMeta;
  /** Callback ao mudar de página */
  onPageChange: (page: number) => void;
  /** Callback ao mudar tamanho de página */
  onPageSizeChange: (pageSize: number) => void;
  /** Opções de tamanho de página disponíveis */
  pageSizeOptions?: number[];
  /** Classe CSS customizada */
  className?: string;
}

/**
 * Componente de paginação genérico
 *
 * @example
 * ```tsx
 * const { meta } = useEmpresas({ page, size });
 *
 * <Pagination
 *   meta={meta}
 *   onPageChange={setPage}
 *   onPageSizeChange={setSize}
 *   pageSizeOptions={[10, 25, 50, 100]}
 * />
 * ```
 */
export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}: PaginationProps) {
  const { currentPage, totalPages, totalItems, pageSize } = meta;

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Info de itens exibidos */}
      <div className="flex-1 text-sm text-muted-foreground">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span> de{' '}
        <span className="font-medium">{totalItems}</span> resultados
      </div>

      {/* Controles */}
      <div className="flex items-center gap-6">
        {/* Seletor de tamanho de página */}
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground whitespace-nowrap">Itens por página</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
              // Resetar para página 1 ao mudar tamanho
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Info de página */}
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Página {currentPage} de {totalPages || 1}
        </div>

        {/* Botões de navegação */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            aria-label="Primeira página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            aria-label="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
