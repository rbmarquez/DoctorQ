"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Perfil {
  id_perfil: string;
  nm_perfil: string;
  ds_perfil?: string;
  nr_usuarios_com_perfil?: number;
}

interface PerfilComboboxProps {
  perfis: Perfil[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PerfilCombobox({
  perfis,
  value,
  onValueChange,
  placeholder = "Selecione um perfil...",
  emptyMessage = "Nenhum perfil encontrado.",
  isLoading = false,
  disabled = false,
}: PerfilComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedPerfil = perfis.find((perfil) => perfil.id_perfil === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="text-muted-foreground">Carregando perfis...</span>
          ) : selectedPerfil ? (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="truncate">{selectedPerfil.nm_perfil}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar perfil..." />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {perfis.map((perfil) => (
                <CommandItem
                  key={perfil.id_perfil}
                  value={perfil.nm_perfil}
                  onSelect={() => {
                    onValueChange(perfil.id_perfil);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === perfil.id_perfil ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{perfil.nm_perfil}</span>
                    </div>
                    {perfil.ds_perfil && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {perfil.ds_perfil}
                      </span>
                    )}
                  </div>
                  {perfil.nr_usuarios_com_perfil !== undefined && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {perfil.nr_usuarios_com_perfil}{" "}
                      {perfil.nr_usuarios_com_perfil === 1 ? "usuário" : "usuários"}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
