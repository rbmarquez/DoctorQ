/**
 * Página Inicial da Universidade da Beleza (Pública)
 * Com dados reais da API
 */
'use client';

import useSWR from 'swr';
import { ArrowRight, Award, BookOpen, Calendar, Download, Headphones, Play, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// API URL
const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

// Fetcher para SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Interfaces
interface Curso {
  id_curso: string;
  titulo: string;
  descricao: string;
  slug: string;
  categoria: string;
  nivel: string;
  duracao_horas: number;
  total_inscritos: number;
  avaliacao_media: number;
  thumbnail_url: string;
}

interface Ebook {
  id_ebook: string;
  titulo: string;
  descricao: string;
  autor: string;
  categoria: string;
  paginas: number;
  downloads: number;
  avaliacao_media: number;
  thumbnail_url: string;
}

interface Podcast {
  id_podcast: string;
  titulo: string;
  descricao: string;
  episodio: number;
  duracao_minutos: number;
  autor: string;
  plays: number;
  thumbnail_url: string;
}

export default function UniversidadePage() {
  // Buscar cursos, ebooks e podcasts da API
  const { data: cursos = [] } = useSWR<Curso[]>(`${UNIV_API_URL}/cursos/`, fetcher);
  const { data: ebooks = [] } = useSWR<Ebook[]>(`${UNIV_API_URL}/ebooks/`, fetcher);
  const { data: podcasts = [] } = useSWR<Podcast[]>(`${UNIV_API_URL}/podcasts/`, fetcher);

  // Pegar apenas os 3 primeiros de cada
  const cursosDestaque = cursos.slice(0, 3);
  const ebooksDestaque = ebooks.slice(0, 3);
  const podcastsDestaque = podcasts.slice(0, 3);

  // Handler para baixar ebook
  const handleDownloadEbook = async (ebook: Ebook) => {
    try {
      const response = await fetch(`${UNIV_API_URL}/ebooks/${ebook.id_ebook}/download/`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erro ao baixar e-book');

      const data = await response.json();
      window.open(data.pdf_url, '_blank');
      alert(`Download iniciado! E-book "${ebook.titulo}" está sendo baixado.`);
    } catch (error) {
      alert('Não foi possível baixar o e-book. Tente novamente.');
    }
  };

  // Handler para reproduzir podcast
  const handlePlayPodcast = async (podcast: Podcast) => {
    try {
      const response = await fetch(`${UNIV_API_URL}/podcasts/${podcast.id_podcast}/play/`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erro ao reproduzir podcast');

      const data = await response.json();
      window.open(data.audio_url, '_blank');
      alert(`Reproduzindo "${podcast.titulo}"`);
    } catch (error) {
      alert('Não foi possível reproduzir o podcast. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <span>Plataforma de Educação com IA</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Universidade da Beleza
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                A plataforma mais avançada de educação estética do Brasil. Aprenda com IA,
                gamificação, realidade aumentada e certificações blockchain.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/universidade/cursos">
                    Explorar Cursos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/universidade/assinar">Ver Planos</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-6">
                <div>
                  <div className="text-3xl font-bold text-primary">{cursos.length}+</div>
                  <div className="text-sm text-muted-foreground">Cursos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-muted-foreground">Alunos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">4.8⭐</div>
                  <div className="text-sm text-muted-foreground">Avaliação</div>
                </div>
              </div>
            </div>

            {/* Illustration */}
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-9xl">🎓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cursos Online */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Cursos Online</h2>
              <p className="text-muted-foreground">
                Aprenda com os melhores especialistas do Brasil
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/universidade/cursos">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cursosDestaque.map((curso) => (
              <Card key={curso.id_curso} className="group hover:shadow-lg transition-shadow flex flex-col">
                <div className="relative h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 overflow-hidden">
                  {curso.thumbnail_url ? (
                    <img
                      src={curso.thumbnail_url}
                      alt={curso.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">{curso.nivel}</Badge>
                  </div>
                </div>

                <CardHeader className="flex-1">
                  <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors">
                    {curso.titulo}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{curso.descricao}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{curso.total_inscritos}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{curso.avaliacao_media.toFixed(1)}⭐</span>
                    </div>
                    <div>{curso.duracao_horas}h</div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/universidade/cursos/${curso.slug}`}>
                      Inscrever-se
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ebooks Exclusivos */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Ebooks Exclusivos</h2>
              <p className="text-muted-foreground">
                Biblioteca completa de material de apoio
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/universidade/ebooks">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ebooksDestaque.map((ebook) => (
              <Card key={ebook.id_ebook} className="group hover:shadow-lg transition-shadow flex flex-col">
                <div className="relative h-64 bg-gradient-to-br from-blue-500/20 to-blue-500/5 overflow-hidden flex items-center justify-center">
                  {ebook.thumbnail_url ? (
                    <img
                      src={ebook.thumbnail_url}
                      alt={ebook.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-9xl opacity-30">📚</span>
                  )}
                </div>

                <CardHeader className="flex-1">
                  <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors">
                    {ebook.titulo}
                  </CardTitle>
                  <CardDescription>{ebook.autor}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{ebook.paginas}p</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{ebook.downloads}</span>
                    </div>
                    <div>{ebook.avaliacao_media.toFixed(1)}⭐</div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleDownloadEbook(ebook)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Podcast DoctorQ */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Podcast DoctorQ</h2>
              <p className="text-muted-foreground">
                Episódios semanais com especialistas
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/universidade/podcast">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {podcastsDestaque.map((podcast) => (
              <Card key={podcast.id_podcast} className="group hover:shadow-lg transition-shadow flex flex-col">
                <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/5 overflow-hidden flex items-center justify-center">
                  {podcast.thumbnail_url ? (
                    <img
                      src={podcast.thumbnail_url}
                      alt={podcast.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-8xl opacity-50">🎙️</span>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">Episódio #{podcast.episodio}</Badge>
                  </div>
                </div>

                <CardHeader className="flex-1">
                  <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors">
                    {podcast.titulo}
                  </CardTitle>
                  <CardDescription>{podcast.autor}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Headphones className="h-4 w-4" />
                      <span>{podcast.duracao_minutos}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      <span>{podcast.plays} plays</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handlePlayPodcast(podcast)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Ouvir Agora
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Por que escolher a Universidade da Beleza?</h2>
            <p className="text-xl text-muted-foreground">
              A plataforma mais completa e inovadora do mercado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>IA Mentora 24/7</CardTitle>
                <CardDescription>
                  Dra. Sophie, sua assistente de IA, responde dúvidas, analisa casos e recomenda
                  cursos personalizados.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Gamificação e Tokens</CardTitle>
                <CardDescription>
                  Ganhe XP, badges e tokens $ESTQ ao completar cursos. Use para desbloquear
                  conteúdos premium.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Certificação Blockchain</CardTitle>
                <CardDescription>
                  Certificados digitais verificáveis, preparados para NFT. Reconhecidos por SBCP e
                  SBME.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Realidade Aumentada</CardTitle>
                <CardDescription>
                  Pratique procedimentos em AR com feedback em tempo real. Simule aplicações de
                  toxina e preenchedores.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Comunidade Ativa</CardTitle>
                <CardDescription>
                  Fóruns, mentoria entre pares e networking com milhares de profissionais da
                  estética.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Eventos & Masterclasses</CardTitle>
                <CardDescription>
                  Webinars ao vivo, workshops práticos e congressos com os melhores especialistas do
                  Brasil.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Pronto para revolucionar sua carreira?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a milhares de profissionais que já transformaram suas carreiras com a
            Universidade da Beleza.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/universidade/assinar">
                Ver Planos e Preços
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/universidade/eventos">Ver Eventos e Lives</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">O que nossos alunos dizem</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "A plataforma mais completa que já vi. O simulador AR me ajudou muito a praticar
                  antes de aplicar em pacientes reais."
                </p>
                <div className="font-semibold">Dra. Maria Silva</div>
                <div className="text-sm text-muted-foreground">Dermatologista, SP</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Os certificados blockchain são um diferencial. Consegui comprovar minha
                  qualificação internacionalmente."
                </p>
                <div className="font-semibold">Dr. João Santos</div>
                <div className="text-sm text-muted-foreground">Cirurgião Plástico, RJ</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "A gamificação torna o aprendizado divertido. Já ganhei 5 badges e estou no nível
                  12!"
                </p>
                <div className="font-semibold">Ana Costa</div>
                <div className="text-sm text-muted-foreground">Esteticista, MG</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
