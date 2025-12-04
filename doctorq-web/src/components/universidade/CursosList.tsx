/**
 * Lista de Cursos com filtros
 */
'use client';

import { useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCursos } from '@/lib/api/hooks/useUniversidade';
import { CursoCard } from './CursoCard';

interface CursosListProps {
  onInscrever?: (id_curso: string) => void;
  showInscreverButton?: boolean;
}

export function CursosList({ onInscrever, showInscreverButton }: CursosListProps) {
  const [categoria, setCategoria] = useState<string>('');
  const [nivel, setNivel] = useState<string>('');
  const [search, setSearch] = useState('');

  const { cursos, isLoading, isError } = useCursos({
    categoria: categoria || undefined,
    nivel: nivel || undefined,
    page: 1,
    size: 20,
  });

  // Filtro local por busca
  const cursosFiltrados = cursos?.filter((curso) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      curso.titulo.toLowerCase().includes(searchLower) ||
      curso.descricao?.toLowerCase().includes(searchLower) ||
      curso.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="injetaveis">Injetáveis</SelectItem>
            <SelectItem value="facial">Facial</SelectItem>
            <SelectItem value="corporal">Corporal</SelectItem>
            <SelectItem value="negocios">Negócios</SelectItem>
            <SelectItem value="tecnologias">Tecnologias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={nivel} onValueChange={setNivel}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="iniciante">Iniciante</SelectItem>
            <SelectItem value="intermediario">Intermediário</SelectItem>
            <SelectItem value="avancado">Avançado</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resultados */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-destructive">Erro ao carregar cursos. Tente novamente.</p>
        </div>
      )}

      {cursosFiltrados && cursosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum curso encontrado.</p>
        </div>
      )}

      {cursosFiltrados && cursosFiltrados.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {cursosFiltrados.length} {cursosFiltrados.length === 1 ? 'curso' : 'cursos'} encontrados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursosFiltrados.map((curso) => (
              <CursoCard
                key={curso.id_curso}
                curso={curso}
                onInscrever={onInscrever}
                showInscreverButton={showInscreverButton}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
