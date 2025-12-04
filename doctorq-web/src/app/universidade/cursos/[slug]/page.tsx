/**
 * Página de Detalhes do Curso - Universidade da Beleza
 * Layout inspirado em Udemy com preview de conteúdo
 */
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Award, BookOpen, Clock, PlayCircle, Star, Users,
  Download, Globe, Smartphone, Trophy, CheckCircle2, Lock, Eye,
  MessageSquare, TrendingUp, BarChart3, ChevronDown, ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PremiumNav } from '@/components/landing/PremiumNav';
import { useCursoBySlug, useInscreverCurso, useAvaliacoesCurso, type Aula } from '@/lib/api/hooks/useUniversidade';
import { formatDuracao, formatPreco, getCertificacaoLabel, getNivelLabel } from '@/lib/api/hooks/useUniversidade';

export default function CursoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: curso, isLoading: cursoLoading } = useCursoBySlug(slug, true);
  const { data: avaliacoes, isLoading: avaliacoesLoading } = useAvaliacoesCurso(curso?.id_curso || '');
  const { inscrever, isInscrevendo } = useInscreverCurso();

  const [descricaoExpandida, setDescricaoExpandida] = useState(false);
  const [filtroAvaliacao, setFiltroAvaliacao] = useState<number | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);

  const handleInscrever = async () => {
    if (!curso) return;

    try {
      await inscrever(curso.id_curso);
      router.push('/profissional/universidade');
    } catch (error) {
      console.error('Erro ao inscrever:', error);
    }
  };

  const handlePreviewClick = (aula: Aula) => {
    setSelectedAula(aula);
    setPreviewModalOpen(true);
  };

  const getVideoEmbedData = (url: string): { provider: string; embedUrl: string } | null => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return {
        provider: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`
      };
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      return {
        provider: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`
      };
    }

    // Bunny CDN
    if (url.includes('bunnycdn.com') || url.includes('b-cdn.net')) {
      return {
        provider: 'bunny',
        embedUrl: url
      };
    }

    // Direct video files (MP4, WebM, etc)
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        provider: 'custom',
        embedUrl: url
      };
    }

    return null;
  };

  // Filtrar avaliações por estrelas
  const avaliacoesFiltradas = avaliacoes?.filter(
    (av) => !filtroAvaliacao || av.avaliacao === filtroAvaliacao
  );

  // Estatísticas de avaliações
  const estatisticasAvaliacoes = avaliacoes
    ? [5, 4, 3, 2, 1].map((estrelas) => ({
        estrelas,
        quantidade: avaliacoes.filter((av) => av.avaliacao === estrelas).length,
        percentual: (avaliacoes.filter((av) => av.avaliacao === estrelas).length / avaliacoes.length) * 100,
      }))
    : [];

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
      {/* Premium Navigation */}
      <PremiumNav />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/universidade/cursos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Cursos
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Course Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">{getNivelLabel(curso.nivel)}</Badge>
                {curso.certificacao_tipo && (
                  <Badge variant="default" className="text-xs">{getCertificacaoLabel(curso.certificacao_tipo)}</Badge>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold">{curso.titulo}</h1>

              <p className="text-base text-muted-foreground">
                {curso.descricao}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuracao(curso.duracao_horas)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{curso.total_inscricoes} alunos</span>
                </div>

                {curso.avaliacao_media > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{curso.avaliacao_media.toFixed(1)}</span>
                    <span className="text-muted-foreground">({curso.total_avaliacoes})</span>
                  </div>
                )}

                {curso.total_aulas > 0 && (
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{curso.total_aulas} aulas</span>
                  </div>
                )}
              </div>

              {/* Instrutor */}
              {curso.instrutor_nome && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {curso.instrutor_nome.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Instrutor</div>
                    <div className="font-semibold text-sm">{curso.instrutor_nome}</div>
                    {curso.instrutor_bio && (
                      <div className="text-xs text-muted-foreground mt-0.5">{curso.instrutor_bio}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                {/* Thumbnail */}
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                  {curso.thumbnail_url ? (
                    <img
                      src={curso.thumbnail_url}
                      alt={curso.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-4xl opacity-20">🎓</span>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">
                      {formatPreco(curso.preco_assinante || curso.preco)}
                    </div>
                    {curso.preco_assinante && curso.preco_assinante < curso.preco && (
                      <div className="text-xs text-muted-foreground line-through">
                        {formatPreco(curso.preco)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleInscrever}
                    disabled={isInscrevendo}
                  >
                    {isInscrevendo ? 'Inscrevendo...' : 'Inscrever-se Agora'}
                  </Button>

                  <div className="text-center text-xs text-muted-foreground">
                    Garantia de 30 dias
                  </div>

                  <div className="border-t pt-3">
                    <h3 className="font-semibold mb-2 text-xs">Este curso inclui:</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{formatDuracao(curso.duracao_horas)} de vídeo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Materiais complementares</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Acesso mobile</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Acesso vitalício</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Certificado {getCertificacaoLabel(curso.certificacao_tipo || 'bronze')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Mentoria IA 24/7</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <Button variant="outline" className="w-full" size="sm">
                      Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Modules */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Conteúdo do Curso</h2>

            {cursoLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando módulos...</p>
              </div>
            ) : curso?.modulos && curso.modulos.length > 0 ? (
              <div className="space-y-3">
                {/* Estatísticas do conteúdo */}
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-bold text-primary">{curso.modulos.length}</div>
                        <div className="text-xs text-muted-foreground">Módulos</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-primary">
                          {curso.modulos.reduce((acc, m) => acc + (m.aulas?.length || 0), 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Aulas</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-primary">
                          {Math.floor(curso.duracao_horas)}h {Math.round((curso.duracao_horas % 1) * 60)}min
                        </div>
                        <div className="text-xs text-muted-foreground">Duração</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Accordion type="single" collapsible className="space-y-2">
                  {curso.modulos.map((modulo, idx) => {
                    const totalAulas = modulo.aulas?.length || 0;
                    const duracaoTotal = modulo.aulas?.reduce((acc, a) => acc + (a.duracao_minutos || 0), 0) || 0;

                    return (
                      <AccordionItem key={modulo.id_modulo} value={modulo.id_modulo} className="border rounded-lg px-3">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-start gap-3 text-left w-full">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{modulo.titulo}</div>
                              {modulo.descricao && (
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {modulo.descricao}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>{totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'}</span>
                                {duracaoTotal > 0 && <span>• {duracaoTotal} min</span>}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {modulo.aulas && modulo.aulas.length > 0 ? (
                            <div className="space-y-1 pl-11 pb-3">
                              {modulo.aulas.map((aula, aulaIdx) => {
                                // Primeira aula de cada módulo é preview grátis
                                const isPreview = aulaIdx === 0;

                                return (
                                  <div
                                    key={aula.id_aula}
                                    onClick={() => isPreview && handlePreviewClick(aula)}
                                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors group ${
                                      isPreview
                                        ? 'hover:bg-primary/5 cursor-pointer'
                                        : 'hover:bg-muted/50'
                                    }`}
                                  >
                                    {isPreview ? (
                                      <Eye className="h-3 w-3 text-primary flex-shrink-0" />
                                    ) : (
                                      <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <div className="text-xs font-medium truncate">{aula.titulo}</div>
                                        {isPreview && (
                                          <Badge variant="secondary" className="text-xs px-1 py-0">
                                            Preview
                                          </Badge>
                                        )}
                                      </div>
                                      {aula.duracao_minutos && (
                                        <div className="text-xs text-muted-foreground">
                                          {aula.duracao_minutos} min
                                        </div>
                                      )}
                                    </div>
                                    {isPreview && (
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlayCircle className="h-4 w-4 text-primary" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground pl-11 pb-3">
                              Nenhuma aula cadastrada
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Additional Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* O que você vai aprender */}
            {curso.objetivos && curso.objetivos.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">O que você vai aprender</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {curso.objetivos.map((objetivo, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{objetivo}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requisitos */}
            {curso.requisitos && curso.requisitos.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {curso.requisitos.map((requisito, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{requisito}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {curso.tags && curso.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {curso.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Seção de Avaliações */}
        {avaliacoes && avaliacoes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Avaliações dos Alunos</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Estatísticas de Avaliações */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {curso.avaliacao_media.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(curso.avaliacao_media)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Média do curso
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {estatisticasAvaliacoes.map((stat) => (
                        <button
                          key={stat.estrelas}
                          onClick={() =>
                            setFiltroAvaliacao(
                              filtroAvaliacao === stat.estrelas ? null : stat.estrelas
                            )
                          }
                          className={`w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors ${
                            filtroAvaliacao === stat.estrelas ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-center gap-0.5 text-xs">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < stat.estrelas
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <Progress value={stat.percentual} className="flex-1 h-1.5" />
                          <div className="text-xs text-muted-foreground w-10 text-right">
                            {stat.percentual.toFixed(0)}%
                          </div>
                        </button>
                      ))}
                    </div>

                    {filtroAvaliacao && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => setFiltroAvaliacao(null)}
                      >
                        Limpar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Avaliações */}
              <div className="lg:col-span-2">
                <div className="space-y-3">
                  {avaliacoesFiltradas && avaliacoesFiltradas.length > 0 ? (
                    avaliacoesFiltradas.slice(0, 5).map((avaliacao) => (
                      <Card key={avaliacao.id_avaliacao}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {avaliacao.nm_usuario?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <div>
                                  <div className="font-semibold text-sm">
                                    {avaliacao.nm_usuario || 'Aluno'}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3 w-3 ${
                                            i < avaliacao.avaliacao
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-muted-foreground'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(avaliacao.dt_criacao).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {avaliacao.comentario && (
                                <p className="text-xs text-muted-foreground mt-1.5">
                                  {avaliacao.comentario}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {filtroAvaliacao
                            ? `Nenhuma avaliação com ${filtroAvaliacao} estrelas`
                            : 'Nenhuma avaliação ainda'}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {avaliacoesFiltradas && avaliacoesFiltradas.length > 5 && (
                    <Button variant="outline" className="w-full">
                      Ver todas as {avaliacoesFiltradas.length} avaliações
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedAula?.titulo}</DialogTitle>
            <DialogDescription>
              {selectedAula?.duracao_minutos && (
                <span className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" />
                  {selectedAula.duracao_minutos} minutos
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video Player */}
            {selectedAula?.conteudo_url && (() => {
              const videoData = getVideoEmbedData(selectedAula.conteudo_url);

              if (!videoData) {
                return (
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                    <div className="text-center space-y-2">
                      <p className="text-lg">Formato de vídeo não suportado</p>
                      <p className="text-sm text-gray-400">URL: {selectedAula.conteudo_url}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="relative">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {(videoData.provider === 'youtube' || videoData.provider === 'vimeo' || videoData.provider === 'bunny') && (
                      <iframe
                        src={videoData.embedUrl}
                        title={selectedAula.titulo}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    )}

                    {videoData.provider === 'custom' && (
                      <video
                        src={videoData.embedUrl}
                        className="w-full h-full"
                        controls
                        preload="metadata"
                      >
                        Seu navegador não suporta reprodução de vídeo.
                      </video>
                    )}
                  </div>

                  {/* Provider Badge */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-black/60 text-white border-0 shadow-lg">
                      {videoData.provider === 'youtube' && '📺 YouTube'}
                      {videoData.provider === 'vimeo' && '🎬 Vimeo'}
                      {videoData.provider === 'bunny' && '🐰 Bunny'}
                      {videoData.provider === 'custom' && '▶️ Direct'}
                    </Badge>
                  </div>
                </div>
              );
            })()}

            {/* Lesson Description */}
            {selectedAula?.descricao && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Sobre esta aula
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedAula.descricao}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Complementary Materials */}
            {selectedAula &&
             typeof selectedAula.recursos === 'object' &&
             selectedAula.recursos !== null &&
             'materiais_complementares' in selectedAula.recursos &&
             Array.isArray((selectedAula.recursos as any).materiais_complementares) &&
             (selectedAula.recursos as any).materiais_complementares.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Materiais Complementares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {((selectedAula.recursos as any).materiais_complementares as Array<{tipo: string, titulo: string, url: string}>).map((material, idx) => (
                      <a
                        key={idx}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          {material.tipo === 'pdf' ? '📄' : '📎'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {material.titulo}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {material.tipo.toUpperCase()}
                          </div>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Call to Action */}
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="py-6">
                <div className="text-center space-y-3">
                  <h3 className="text-lg font-semibold">Gostou do preview?</h3>
                  <p className="text-sm text-muted-foreground">
                    Inscreva-se no curso para acessar todas as {curso?.modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0)} aulas e obter seu certificado
                  </p>
                  <Button onClick={handleInscrever} disabled={isInscrevendo} size="lg" className="w-full sm:w-auto">
                    {isInscrevendo ? 'Inscrevendo...' : 'Inscrever-se no Curso'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
