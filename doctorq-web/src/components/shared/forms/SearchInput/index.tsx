"use client";

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface SearchInputProps {
  /**
   * Valor da busca
   */
  value: string;

  /**
   * Callback quando valor muda
   */
  onChange: (value: string) => void;

  /**
   * Placeholder
   */
  placeholder?: string;

  /**
   * Debounce em ms
   */
  debounce?: number;

  /**
   * Se true, mostra loading
   */
  isLoading?: boolean;
}

/**
 * Input de busca com ícone e clear button
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Buscar empresas..."
 * />
 * ```
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  isLoading,
}: SearchInputProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />

      {value && !isLoading && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
