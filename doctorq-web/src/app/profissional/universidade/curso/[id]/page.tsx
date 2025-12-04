/**
 * Player de Curso - Universidade da Beleza
 * Área autenticada com player de vídeo e acompanhamento de progresso
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, PlayCircle, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  useCursoById,
  useModulosByCurso,
  useMarcarAulaComoAssistida,
  useInscricaoByCurso,
} from '@/lib/api/hooks/useUniversidade';

export default function CursoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id as string;

  const { data: curso, isLoading: cursoLoading } = useCursoById(cursoId);
  const { data: modulos, isLoading: modulosLoading } = useModulosByCurso(cursoId);
  const { data: inscricao } = useInscricaoByCurso(cursoId);
  const { marcarAssistida, isMarcando } = useMarcarAulaComoAssistida();

  const [aulaAtual, setAulaAtual] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(true);

  // Selecionar primeira aula ao carregar
  useEffect(() => {
    if (modulos && modulos.length > 0 && !aulaAtual) {
      const primeiraAula = modulos[0]?.aulas?.[0];
      if (primeiraAula) {
        setAulaAtual(primeiraAula.id_aula);
        setVideoUrl(primeiraAula.video_url || '');
      }
    }
  }, [modulos, aulaAtual]);

  const handleSelecionarAula = (aulaId: string, videoUrl: string) => {
    setAulaAtual(aulaId);
    setVideoUrl(videoUrl);
  };

  const handleMarcarComoAssistida = async () => {
    if (!aulaAtual) return;

    try {
      await marcarAssistida(aulaAtual);
      // Avançar para próxima aula
      const proximaAula = encontrarProximaAula();
      if (proximaAula) {
        setAulaAtual(proximaAula.id_aula);
        setVideoUrl(proximaAula.video_url || '');
      }
    } catch (error) {
      console.error('Erro ao marcar aula:', error);
    }
  };

  const encontrarProximaAula = () => {
    if (!modulos || !aulaAtual) return null;

    for (let i = 0; i < modulos.length; i++) {
      const modulo = modulos[i];
      if (!modulo.aulas) continue;

      const aulaIndex = modulo.aulas.findIndex((a) => a.id_aula === aulaAtual);
      if (aulaIndex !== -1) {
        // Próxima aula no mesmo módulo
        if (aulaIndex < modulo.aulas.length - 1) {
          return modulo.aulas[aulaIndex + 1];
        }
        // Primeira aula do próximo módulo
        if (i < modulos.length - 1 && modulos[i + 1]?.aulas?.[0]) {
          return modulos[i + 1].aulas[0];
        }
      }
    }
    return null;
  };

  const isAulaAssistida = (aulaId: string) => {
    return inscricao?.progresso_aulas?.some((p) => p.id_aula === aulaId && p.concluida) || false;
  };

  const totalAulas = modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0) || 0;
  const aulasAssistidas =
    inscricao?.progresso_aulas?.filter((p) => p.concluida).length || 0;
  const progressoPercentual = totalAulas > 0 ? (aulasAssistidas / totalAulas) * 100 : 0;

  if (cursoLoading || !curso) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando curso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profissional/universidade">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <div>
                <h1 className="font-semibold line-clamp-1">{curso.titulo}</h1>
                <div className="text-xs text-muted-foreground">
                  {aulasAssistidas} de {totalAulas} aulas concluídas
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block w-40">
                <Progress value={progressoPercentual} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Video Player Area */}
        <div className={`flex-1 ${showSidebar ? 'md:pr-96' : ''} transition-all`}>
          <div className="bg-black aspect-video flex items-center justify-center">
            {videoUrl ? (
              <video
                key={videoUrl}
                controls
                className="w-full h-full"
                src={videoUrl}
                autoPlay
              >
                Seu navegador não suporta vídeos HTML5.
              </video>
            ) : (
              <div className="text-white text-center">
                <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecione uma aula para começar</p>
              </div>
            )}
          </div>

          {/* Video Controls */}
          {aulaAtual && (
            <div className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">
                    {modulos
                      ?.flatMap((m) => m.aulas || [])
                      .find((a) => a.id_aula === aulaAtual)?.titulo || 'Aula'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {modulos
                      ?.flatMap((m) => m.aulas || [])
                      .find((a) => a.id_aula === aulaAtual)?.descricao}
                  </p>
                </div>

                {!isAulaAssistida(aulaAtual) && (
                  <Button onClick={handleMarcarComoAssistida} disabled={isMarcando}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Concluída
                  </Button>
                )}

                {isAulaAssistida(aulaAtual) && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Concluída
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar com Conteúdo */}
        {showSidebar && (
          <div className="hidden md:block w-96 border-l bg-white fixed right-0 top-[57px] bottom-0 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Conteúdo do Curso</h3>
                <div className="text-sm text-muted-foreground">
                  {progressoPercentual.toFixed(0)}% concluído
                </div>
                <Progress value={progressoPercentual} className="mt-2" />
              </div>

              {modulosLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : modulos && modulos.length > 0 ? (
                <Accordion type="multiple" defaultValue={modulos.map((m) => m.id_modulo)}>
                  {modulos.map((modulo, idx) => (
                    <AccordionItem key={modulo.id_modulo} value={modulo.id_modulo}>
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-start gap-3 text-left">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{modulo.titulo}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {modulo.aulas?.length || 0} aulas
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {modulo.aulas && modulo.aulas.length > 0 ? (
                          <div className="space-y-1 pl-9">
                            {modulo.aulas.map((aula) => {
                              const assistida = isAulaAssistida(aula.id_aula);
                              const atual = aula.id_aula === aulaAtual;

                              return (
                                <button
                                  key={aula.id_aula}
                                  onClick={() =>
                                    handleSelecionarAula(aula.id_aula, aula.video_url || '')
                                  }
                                  className={`w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                                    atual ? 'bg-primary/10 border border-primary/20' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    {assistida ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    ) : aula.video_url ? (
                                      <PlayCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium line-clamp-2">
                                        {aula.titulo}
                                      </div>
                                      {aula.duracao_minutos && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {aula.duracao_minutos} min
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground pl-9 py-2">
                            Nenhuma aula disponível
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum conteúdo disponível</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
