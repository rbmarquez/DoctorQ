/**
 * Página de Gerenciamento de Cursos da Universidade
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, GraduationCap, Plus, Search, Filter } from 'lucide-react';
import { useCursos, type Curso } from '@/lib/api/hooks/useUniversidade';
import { CursosTable } from '@/components/admin/universidade/CursosTable';
import { CursoForm } from '@/components/admin/universidade/CursoForm';
import { toast } from 'sonner';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

export default function CursosPage() {
  const router = useRouter();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [nivelFilter, setNivelFilter] = useState<string>('all');

  // Buscar cursos
  const { cursos, isLoading, mutate } = useCursos({
    categoria: categoriaFilter && categoriaFilter !== 'all' ? categoriaFilter : undefined,
    nivel: nivelFilter && nivelFilter !== 'all' ? nivelFilter : undefined,
  });

  // Filtrar por termo de busca localmente
  const filteredCursos = cursos?.filter((curso) =>
    searchTerm
      ? curso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        curso.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  // Criar curso
  const handleCreateCurso = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${UNIV_API_URL}/cursos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Erro ao criar curso');
      }

      const curso = await res.json();

      toast.success('Curso criado!', {
        description: `O curso "${curso.titulo}" foi criado com sucesso.`,
      });

      setShowCreateDialog(false);
      mutate(); // Recarregar lista
    } catch (error: any) {
      toast.error('Erro ao criar curso', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar curso
  const handleEditCurso = async (data: any) => {
    if (!editingCurso) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${UNIV_API_URL}/cursos/${editingCurso.id_curso}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Erro ao atualizar curso');
      }

      toast.success('Curso atualizado!', {
        description: 'As alterações foram salvas com sucesso.',
      });

      setShowEditDialog(false);
      setEditingCurso(null);
      mutate(); // Recarregar lista
    } catch (error: any) {
      toast.error('Erro ao atualizar curso', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deletar curso
  const handleDeleteCurso = async (id_curso: string) => {
    if (!confirm('Tem certeza que deseja deletar este curso?')) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/cursos/${id_curso}/`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao deletar curso');
      }

      toast.success('Curso deletado', {
        description: 'O curso foi removido com sucesso.',
      });

      mutate(); // Recarregar lista
    } catch (error: any) {
      toast.error('Erro ao deletar curso', {
        description: error.message,
      });
    }
  };

  // Ver detalhes do curso
  const handleViewCurso = (curso: Curso) => {
    router.push(`/admin/universidade/cursos/${curso.id_curso}`);
  };

  // Abrir dialog de edição
  const handleOpenEditDialog = (curso: Curso) => {
    setEditingCurso(curso);
    setShowEditDialog(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Gerenciamento de Cursos</h1>
          <p className="text-muted-foreground">
            Crie e gerencie cursos da Universidade DoctorQ
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Cursos</CardDescription>
            <CardTitle className="text-3xl">{cursos?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cursos Ativos</CardDescription>
            <CardTitle className="text-3xl">
              {cursos?.filter((c) => c.fg_ativo).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Inscrições</CardDescription>
            <CardTitle className="text-3xl">
              {cursos?.reduce((acc, c) => acc + c.total_inscricoes, 0) || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avaliação Média</CardDescription>
            <CardTitle className="text-3xl">
              {cursos && cursos.length > 0
                ? (
                    cursos.reduce((acc, c) => acc + c.avaliacao_media, 0) / cursos.length
                  ).toFixed(1)
                : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="injetaveis">Injetáveis</SelectItem>
                <SelectItem value="facial">Facial</SelectItem>
                <SelectItem value="corporal">Corporal</SelectItem>
                <SelectItem value="fios">Fios</SelectItem>
                <SelectItem value="peelings">Peelings</SelectItem>
                <SelectItem value="lasers">Lasers</SelectItem>
                <SelectItem value="negocios">Negócios</SelectItem>
                <SelectItem value="gestao">Gestão</SelectItem>
              </SelectContent>
            </Select>

            <Select value={nivelFilter} onValueChange={setNivelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Níveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Níveis</SelectItem>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Cursos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Cursos ({filteredCursos?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CursosTable
            cursos={filteredCursos || []}
            isLoading={isLoading}
            onEdit={handleOpenEditDialog}
            onDelete={handleDeleteCurso}
            onView={handleViewCurso}
          />
        </CardContent>
      </Card>

      {/* Dialog de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo curso da universidade
            </DialogDescription>
          </DialogHeader>
          <CursoForm
            onSubmit={handleCreateCurso}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>
              Atualize os dados do curso
            </DialogDescription>
          </DialogHeader>
          <CursoForm
            curso={editingCurso || undefined}
            onSubmit={handleEditCurso}
            onCancel={() => {
              setShowEditDialog(false);
              setEditingCurso(null);
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
