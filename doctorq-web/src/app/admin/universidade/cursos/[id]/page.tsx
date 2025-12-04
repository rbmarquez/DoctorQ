/**
 * Página de Detalhes e Gerenciamento de Módulos/Aulas do Curso
 */
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Users, Star, Edit, Plus } from 'lucide-react';
import {
  useCursoById,
  useModulosByCurso,
  formatPreco,
  getNivelLabel,
  getCertificacaoLabel,
  type Modulo,
  type Aula,
} from '@/lib/api/hooks/useUniversidade';
import { ModuloManager } from '@/components/admin/universidade/ModuloManager';
import { toast } from 'sonner';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

export default function CursoDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id_curso = params.id as string;

  // Buscar dados do curso
  const { data: curso, isLoading: loadingCurso, mutate: mutateCurso } = useCursoById(id_curso);
  const { data: modulos, isLoading: loadingModulos, mutate: mutateModulos } = useModulosByCurso(id_curso);

  // Adicionar módulo
  const handleAddModulo = async (modulo: Omit<Modulo, 'id_modulo' | 'dt_criacao'>) => {
    try {
      const res = await fetch(`${UNIV_API_URL}/modulos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modulo),
      });

      if (!res.ok) throw new Error('Erro ao criar módulo');

      toast.success('Módulo criado!', {
        description: 'O módulo foi adicionado ao curso.',
      });

      mutateModulos();
    } catch (error: any) {
      toast.error('Erro ao criar módulo', {
        description: error.message,
      });
    }
  };

  // Atualizar módulo
  const handleUpdateModulo = async (id_modulo: string, modulo: Partial<Modulo>) => {
    try {
      const res = await fetch(`${UNIV_API_URL}/modulos/${id_modulo}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modulo),
      });

      if (!res.ok) throw new Error('Erro ao atualizar módulo');

      toast.success('Módulo atualizado!', {
        description: 'As alterações foram salvas.',
      });

      mutateModulos();
    } catch (error: any) {
      toast.error('Erro ao atualizar módulo', {
        description: error.message,
      });
    }
  };

  // Deletar módulo
  const handleDeleteModulo = async (id_modulo: string) => {
    if (!confirm('Tem certeza que deseja deletar este módulo e todas as suas aulas?')) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/modulos/${id_modulo}/`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao deletar módulo');

      toast.success('Módulo deletado', {
        description: 'O módulo foi removido com sucesso.',
      });

      mutateModulos();
    } catch (error: any) {
      toast.error('Erro ao deletar módulo', {
        description: error.message,
      });
    }
  };

  // Adicionar aula
  const handleAddAula = async (id_modulo: string, aula: Omit<Aula, 'id_aula' | 'dt_criacao'>) => {
    try {
      const res = await fetch(`${UNIV_API_URL}/aulas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aula),
      });

      if (!res.ok) throw new Error('Erro ao criar aula');

      toast.success('Aula criada!', {
        description: 'A aula foi adicionada ao módulo.',
      });

      mutateModulos();
    } catch (error: any) {
      toast.error('Erro ao criar aula', {
        description: error.message,
      });
    }
  };

  // Atualizar aula
  const handleUpdateAula = async (id_aula: string, aula: Partial<Aula>) => {
    try {
      const res = await fetch(`${UNIV_API_URL}/aulas/${id_aula}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aula),
      });

      if (!res.ok) throw new Error('Erro ao atualizar aula');

      toast.success('Aula atualizada!', {
        description: 'As alterações foram salvas.',
      });

      mutateModulos();
    } catch (error: any) {
      toast.error('Erro ao atualizar aula', {
        description: error.message,
      });
    }
  };

  // Deletar aula
  const handleDeleteAula = async (id_aula: string) => {
    if (!confirm('Tem certeza que deseja deletar esta aula?')) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/aulas/${id_aula}/`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao deletar aula');

      toast.success('Aula deletada', {
        description: 'A aula foi removida com sucesso.',
      });

      mutateModulos();
    } catch (error: any) {
      toast.error('Erro ao deletar aula', {
        description: error.message,
      });
    }
  };

  if (loadingCurso) {
    return (
      <div className="container mx-auto p-6 text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando curso...</p>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container mx-auto p-6 text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Curso não encontrado</h3>
        <Button onClick={() => router.push('/admin/universidade/cursos')}>
          Voltar para Cursos
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/universidade/cursos')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Cursos
          </Button>
          <h1 className="text-3xl font-bold">{curso.titulo}</h1>
          <p className="text-muted-foreground">{curso.slug}</p>
        </div>
        <Button onClick={() => router.push(`/admin/universidade/cursos?edit=${id_curso}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Curso
        </Button>
      </div>

      {/* Info do Curso */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thumbnail */}
            {curso.thumbnail_url && (
              <div>
                <img
                  src={curso.thumbnail_url}
                  alt={curso.titulo}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Dados */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm">{curso.descricao || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">{curso.categoria || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nível</p>
                  <p className="font-medium">{getNivelLabel(curso.nivel)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {curso.duracao_horas}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="font-medium">{formatPreco(curso.preco)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inscritos</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {curso.total_inscricoes}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avaliação</p>
                  <p className="font-medium flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {curso.avaliacao_media.toFixed(1)} ({curso.total_avaliacoes})
                  </p>
                </div>
              </div>

              {curso.instrutor_nome && (
                <div>
                  <p className="text-sm text-muted-foreground">Instrutor</p>
                  <p className="font-medium">{curso.instrutor_nome}</p>
                </div>
              )}

              {curso.certificacao_tipo && (
                <div>
                  <p className="text-sm text-muted-foreground">Certificação</p>
                  <p className="font-medium">{getCertificacaoLabel(curso.certificacao_tipo)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulos e Aulas */}
      <ModuloManager
        modulos={modulos || []}
        onAddModulo={handleAddModulo}
        onUpdateModulo={handleUpdateModulo}
        onDeleteModulo={handleDeleteModulo}
        onAddAula={handleAddAula}
        onUpdateAula={handleUpdateAula}
        onDeleteAula={handleDeleteAula}
        isLoading={loadingModulos}
      />
    </div>
  );
}
