/**
 * Página de Todas as Notas
 * Visualização centralizada de todas as notas do usuário com busca e filtros
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  MessageSquare,
  Search,
  Clock,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  BookOpen,
  Play,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

interface Nota {
  id_nota: string;
  id_usuario: string;
  id_aula: string;
  conteudo: string;
  timestamp_video: number | null;
  fg_publica: boolean;
  dt_criacao: string;
  dt_atualizacao: string | null;
  aula_titulo?: string;
  curso_titulo?: string;
  curso_id?: string;
}

interface NotasData {
  items: Nota[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export function NotasPage() {
  const [idUsuario] = useState(() => {
    // TODO: Get from auth context
    return '65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4'; // Placeholder
  });
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [idCurso, setIdCurso] = useState<string>('all');
  const [editingNota, setEditingNota] = useState<Nota | null>(null);
  const [novoConteudo, setNovoConteudo] = useState('');
  const [isPublica, setIsPublica] = useState(false);

  // Debounce search
  useState(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  });

  // Fetch notas
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: '20',
    ...(buscaDebounced && { busca: buscaDebounced }),
    ...(idCurso !== 'all' && { id_curso: idCurso }),
  });

  const { data: notas, isLoading, mutate } = useSWR<NotasData>(
    `${UNIV_API_URL}/notas/?${queryParams}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    }
  );

  const handleEditarNota = async () => {
    if (!editingNota || !novoConteudo.trim()) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/notas/${editingNota.id_nota}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: novoConteudo,
          fg_publica: isPublica,
        }),
      });

      if (res.ok) {
        setNovoConteudo('');
        setEditingNota(null);
        mutate();
      }
    } catch (error) {
      console.error('Erro ao editar nota:', error);
    }
  };

  const handleDeletarNota = async (idNota: string) => {
    if (!confirm('Tem certeza que deseja deletar esta nota?')) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/notas/${idNota}/`, {
        method: 'DELETE',
      });

      if (res.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
    }
  };

  const openEditDialog = (nota: Nota) => {
    setEditingNota(nota);
    setNovoConteudo(nota.conteudo);
    setIsPublica(nota.fg_publica);
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-24 bg-muted rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          Minhas Notas
        </h1>
        <p className="text-muted-foreground mt-2">
          {notas?.total || 0} {notas?.total === 1 ? 'nota' : 'notas'} em todos os cursos
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nas notas..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={idCurso} onValueChange={setIdCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cursos</SelectItem>
                {/* TODO: Load actual courses from API */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      {notas && notas.items.length > 0 ? (
        <div className="space-y-3">
          {notas.items.map((nota) => (
            <Card key={nota.id_nota} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/universidade/curso/${nota.curso_id}`}
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        {nota.curso_titulo || 'Curso'}
                      </Link>
                      <span className="text-muted-foreground">→</span>
                      <Link
                        href={`/universidade/aula/${nota.id_aula}`}
                        className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        {nota.aula_titulo || 'Aula'}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {nota.timestamp_video !== null && (
                        <Link href={`/universidade/aula/${nota.id_aula}?t=${nota.timestamp_video}`}>
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(nota.timestamp_video)}
                          </Badge>
                        </Link>
                      )}
                      {nota.fg_publica ? (
                        <Badge variant="secondary" className="text-xs">
                          <Unlock className="h-3 w-3 mr-1" />
                          Pública
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Privada
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditDialog(nota)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeletarNota(nota.id_nota)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{nota.conteudo}</p>
                <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between">
                  <span>
                    Criado em{' '}
                    {new Date(nota.dt_criacao).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {nota.dt_atualizacao && (
                    <span className="text-xs text-muted-foreground">
                      Editado em{' '}
                      {new Date(nota.dt_atualizacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {busca || idCurso !== 'all'
                ? 'Nenhuma nota encontrada com os filtros selecionados'
                : 'Nenhuma nota ainda'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {busca || idCurso !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece assistindo aulas e fazendo anotações!'}
            </p>
            {!busca && idCurso === 'all' && (
              <Link href="/universidade/cursos">
                <Button className="mt-4">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Explorar Cursos
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {notas && notas.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(notas.total_pages, 10) }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                onClick={() => setPage(p)}
                className="w-10"
              >
                {p}
              </Button>
            ))}
            {notas.total_pages > 10 && <span className="text-muted-foreground">...</span>}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(notas.total_pages, p + 1))}
            disabled={page === notas.total_pages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingNota} onOpenChange={() => setEditingNota(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nota</DialogTitle>
            <DialogDescription>
              Faça alterações no conteúdo ou visibilidade da sua nota
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Digite sua nota aqui..."
              value={novoConteudo}
              onChange={(e) => setNovoConteudo(e.target.value)}
              rows={8}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublica ? (
                  <Unlock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isPublica ? 'Nota pública (visível para todos)' : 'Nota privada (só você vê)'}
                </span>
              </div>
              <Switch checked={isPublica} onCheckedChange={setIsPublica} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNota(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditarNota}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
