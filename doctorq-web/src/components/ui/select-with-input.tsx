"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SelectWithInputOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectWithInputProps {
  options: SelectWithInputOption[]
  value?: string
  onValueChange?: (value: string) => void
  onSelect?: (value: string, option: SelectWithInputOption) => void
  onSearch?: (searchTerm: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function SelectWithInput({
  options,
  value,
  onValueChange,
  onSelect,
  onSearch,
  placeholder = "Selecione uma opção...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhuma opção encontrada.",
  disabled = false,
  className,
  loading = false,
  hasMore = false,
  onLoadMore,
}: SelectWithInputProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  // Filtrar opções baseado na busca
  // Se há callback onSearch, sempre usar as options diretamente (API faz a filtragem)
  // Se não há callback, filtrar localmente
  const filteredOptions = React.useMemo(() => {
    if (onSearch) {
      // API faz a filtragem, usar options diretamente
      return options
    }
    // Filtrar localmente apenas se não há callback de busca
    if (!searchValue) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue, onSearch])

  // Função para lidar com mudanças na busca
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValue = e.target.value
    setSearchValue(newSearchValue)

    // Chamar callback de busca se fornecido
    if (onSearch) {
      onSearch(newSearchValue)
    }
  }

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue
    const selectedOption = options.find(option => option.value === selectedValue)

    // Chamar onValueChange para atualizar o valor
    onValueChange?.(newValue)

    // Chamar onSelect para fazer pesquisa na API
    if (selectedOption && onSelect) {
      onSelect(newValue, selectedOption)
    }

    setOpen(false)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            disabled={disabled}
            className="flex h-8 w-full rounded-md bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    option.disabled && "pointer-events-none opacity-50",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))}

              {hasMore && onLoadMore && (
                <div className="p-2 border-t">
                  <button
                    onClick={onLoadMore}
                    disabled={loading}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {loading ? "Carregando..." : "Carregar mais"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
