/**
 * Página de Aula - Universidade da Beleza
 * Player de vídeo integrado com sistema de notas
 */
'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/universidade/VideoPlayer';
import { VideoPlayerHLS } from '@/components/universidade/VideoPlayerHLS';
import { NotasPanel } from '@/components/universidade/NotasPanel';
import { useCursoById, useAula, useMinhasNotas } from '@/lib/api/hooks/useUniversidade';

interface PageProps {
  params: Promise<{
    id_curso: string;
    id_aula: string;
  }>;
}

export default function AulaPage({ params }: PageProps) {
  const { id_curso, id_aula } = use(params);
  const router = useRouter();

  const { data: curso, isLoading: cursoLoading } = useCursoById(id_curso);
  const { data: aula, isLoading: aulaLoading } = useAula(id_aula);
  const { data: notas } = useMinhasNotas({ id_aula });

  const [progresso, setProgresso] = useState(0);
  const [aulaCompleta, setAulaCompleta] = useState(false);

  const handleProgress = async (segundos: number, percentual: number) => {
    setProgresso(percentual);

    // Salva progresso no backend
    try {
      await fetch(`/api/universidade/progresso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aula,
          tempo_assistido_segundos: segundos,
          ultima_posicao_segundos: segundos
        })
      });
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  const handleComplete = async () => {
    setAulaCompleta(true);

    // Marca aula como completa
    try {
      await fetch(`/api/universidade/aula/${id_aula}/completar`, {
        method: 'POST'
      });

      // Atualiza missões
      await fetch(`/api/universidade/missoes/progresso?tipo_evento=aula_assistida`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Erro ao completar aula:', error);
    }
  };

  if (cursoLoading || aulaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!aula || !curso) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Aula não encontrada</h1>
          <Button onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/universidade/curso/${id_curso}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Curso
            </Button>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{curso.titulo}</p>
              <h1 className="text-xl font-bold">{aula.titulo}</h1>
            </div>
            {aulaCompleta && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Aula Completa!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player - 2/3 */}
          <div className="lg:col-span-2">
            {aula.video_provider === 'hls' && aula.video_id ? (
              <VideoPlayerHLS
                videoId={aula.video_id}
                titulo={aula.titulo}
                onProgress={handleProgress}
                onComplete={handleComplete}
              />
            ) : (
              <VideoPlayer
                videoUrl={aula.conteudo_url || ''}
                titulo={aula.titulo}
                duracao={aula.duracao_minutos}
                onProgress={handleProgress}
                onComplete={handleComplete}
                onAddNote={(timestamp) => {
                  // Abre painel de notas com timestamp
                  console.log('Adicionar nota em:', timestamp);
                }}
              />
            )}

            {/* Descrição da Aula */}
            {aula.descricao && (
              <div className="mt-6 p-6 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Sobre esta aula</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {aula.descricao}
                </p>
              </div>
            )}

            {/* Recursos Adicionais */}
            {aula.recursos && (
              <div className="mt-6 p-6 bg-white rounded-lg border">
                <h2 className="text-lg font-semibold mb-4">Materiais Complementares</h2>
                {/* Lista de PDFs, links, etc */}
              </div>
            )}
          </div>

          {/* Notas Panel - 1/3 */}
          <div className="lg:col-span-1">
            <NotasPanel
              id_aula={id_aula}
              notas={notas || []}
              onNotaAdded={() => {
                // Refresh notas
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
