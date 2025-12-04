/**
 * Componente de Tabela de Cursos
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  BookOpen,
  Users,
  Star,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Curso } from '@/lib/api/hooks/useUniversidade';
import { formatPreco, getNivelLabel, getCertificacaoLabel } from '@/lib/api/hooks/useUniversidade';

interface CursosTableProps {
  cursos: Curso[];
  isLoading: boolean;
  onEdit: (curso: Curso) => void;
  onDelete: (id: string) => void;
  onView: (curso: Curso) => void;
}

export function CursosTable({ cursos, isLoading, onEdit, onDelete, onView }: CursosTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando cursos...</p>
      </div>
    );
  }

  if (!cursos || cursos.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Comece criando seu primeiro curso educacional
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Curso</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Certificação</TableHead>
            <TableHead>Inscritos</TableHead>
            <TableHead>Avaliação</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cursos.map((curso) => (
            <TableRow key={curso.id_curso}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
              <TableCell>
                <div className="flex items-start gap-3">
                  {curso.thumbnail_url && (
                    <img
                      src={curso.thumbnail_url}
                      alt={curso.titulo}
                      className="w-16 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{curso.titulo}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {curso.instrutor_nome || 'Sem instrutor'}
                    </p>
                    {curso.total_aulas !== undefined && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <BookOpen className="h-3 w-3" />
                        {curso.total_aulas} aulas
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline">{curso.categoria || 'Geral'}</Badge>
              </TableCell>

              <TableCell>
                <Badge variant="secondary">{getNivelLabel(curso.nivel)}</Badge>
              </TableCell>

              <TableCell>
                {curso.certificacao_tipo ? (
                  <span className="text-sm">{getCertificacaoLabel(curso.certificacao_tipo)}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {curso.total_inscricoes}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  {curso.avaliacao_media.toFixed(1)}
                  <span className="text-muted-foreground">({curso.total_avaliacoes})</span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {curso.duracao_horas}h
                </div>
              </TableCell>

              <TableCell>
                <div className="text-sm">
                  <p className="font-medium">{formatPreco(curso.preco)}</p>
                  {curso.preco_assinante > 0 && (
                    <p className="text-xs text-green-600">
                      {formatPreco(curso.preco_assinante)} (assinante)
                    </p>
                  )}
                </div>
              </TableCell>

              <TableCell>
                {curso.fg_ativo ? (
                  <Badge variant="default" className="bg-green-600">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(curso)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(curso)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/universidade/cursos/${curso.id_curso}/modulos`)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Gerenciar Módulos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(curso.id_curso)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
