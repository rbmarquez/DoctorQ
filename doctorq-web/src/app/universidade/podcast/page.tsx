/**
 * Página de Podcasts - Universidade da Beleza
 * Dados reais da API com funcionalidades completas
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Filter, Headphones, Play, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// API URL
const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

// Fetcher para SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Podcast {
  id_podcast: string;
  titulo: string;
  descricao: string;
  categoria: string;
  episodio: number;
  duracao_minutos: number;
  dt_publicacao: string;
  autor: string;
  thumbnail_url: string;
  audio_url: string;
  plays: number;
  tags: string[];
  transcricao?: string;
}

export default function PodcastPage() {
  const [categoria, setCategoria] = useState<string>('');
  const [search, setSearch] = useState('');

  // Buscar podcasts da API
  const { data: podcasts = [], error, isLoading } = useSWR<Podcast[]>(
    `${UNIV_API_URL}/podcasts/`,
    fetcher
  );

  // Handler para reproduzir podcast
  const handlePlay = async (podcast: Podcast) => {
    try {
      const response = await fetch(`${UNIV_API_URL}/podcasts/${podcast.id_podcast}/play/`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erro ao reproduzir podcast');

      const data = await response.json();

      // Abrir áudio em nova aba
      window.open(data.audio_url, '_blank');

      alert(`Reproduzindo "${podcast.titulo}"`);
    } catch (error) {
      alert('Não foi possível reproduzir o podcast. Tente novamente.');
    }
  };

  // Filtro local
  const podcastsFiltrados = podcasts.filter((podcast) => {
    const matchCategoria = !categoria || categoria === 'all' || podcast.categoria === categoria;
    const matchSearch =
      !search ||
      podcast.titulo.toLowerCase().includes(search.toLowerCase()) ||
      podcast.descricao.toLowerCase().includes(search.toLowerCase()) ||
      podcast.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    return matchCategoria && matchSearch;
  });

  // Formatar data
  const formatarData = (dt: string) => {
    const data = new Date(dt);
    return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Formatar duração
  const formatarDuracao = (minutos: number) => {
    return `${minutos}min`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/universidade">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Podcasts DoctorQ</h1>
              <p className="text-muted-foreground">
                Episódios semanais com especialistas discutindo tendências, técnicas e casos práticos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar podcasts..."
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
        </div>

        {/* Estatísticas */}
        {!isLoading && podcasts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{podcasts.length}</div>
                <div className="text-sm text-muted-foreground">Episódios disponíveis</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {podcasts.reduce((sum, p) => sum + p.plays, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total de plays</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(podcasts.reduce((sum, p) => sum + p.duracao_minutos, 0) / podcasts.length)}min
                </div>
                <div className="text-sm text-muted-foreground">Duração média</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">Semanal</div>
                <div className="text-sm text-muted-foreground">Novos episódios</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando podcasts...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Erro ao carregar podcasts. Tente novamente.</p>
          </div>
        )}

        {/* Resultados */}
        {!isLoading && podcastsFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum podcast encontrado.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcastsFiltrados.map((podcast) => (
            <Card key={podcast.id_podcast} className="group hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
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

                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="lg"
                    className="rounded-full"
                    variant="secondary"
                    onClick={() => handlePlay(podcast)}
                  >
                    <Play className="h-6 w-6 mr-2" />
                    Ouvir
                  </Button>
                </div>

                {/* Badge no topo */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary">Episódio #{podcast.episodio}</Badge>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {podcast.titulo}
                </CardTitle>
                <CardDescription>
                  {podcast.autor} • {formatarData(podcast.dt_publicacao)}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {podcast.descricao}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Headphones className="h-4 w-4" />
                    <span>{formatarDuracao(podcast.duracao_minutos)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Play className="h-4 w-4" />
                    <span>{podcast.plays} plays</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {podcast.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handlePlay(podcast)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Ouvir Agora
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
