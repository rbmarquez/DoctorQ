/**
 * Página de Favoritos
 * Exibe cursos, aulas e instrutores favoritados pelo usuário
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Heart, BookOpen, Play, User, Calendar, Star, Trash2, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

interface Favorito {
  id_favorito: string;
  tipo: 'curso' | 'aula' | 'instrutor';
  id_referencia: string;
  observacao: string | null;
  dt_criacao: string;
  detalhes: {
    titulo: string;
    descricao?: string;
    categoria?: string;
    nivel?: string;
    duracao?: number;
    total_aulas?: number;
    total_alunos?: number;
    avaliacao_media?: number;
    thumbnail?: string;
  };
}

interface FavoritosData {
  items: Favorito[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export function FavoritosPage() {
  const [idUsuario] = useState(() => {
    // TODO: Get from auth context
    return '65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4'; // Placeholder
  });
  const [tipo, setTipo] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch favoritos
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: '12',
    ...(tipo !== 'all' && { tipo }),
  });

  const { data: favoritos, isLoading, mutate } = useSWR<FavoritosData>(
    `${UNIV_API_URL}/notas/favoritos/?${queryParams}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    }
  );

  const handleRemoverFavorito = async (idFavorito: string) => {
    if (!confirm('Tem certeza que deseja remover dos favoritos?')) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/notas/favoritos/${idFavorito}/`, {
        method: 'DELETE',
      });

      if (res.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
    }
  };

  const renderCursoCard = (favorito: Favorito) => (
    <Card key={favorito.id_favorito} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <Badge variant="secondary" className="text-xs">
                {favorito.detalhes.categoria || 'Curso'}
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2">
              {favorito.detalhes.titulo}
            </CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">
              {favorito.detalhes.descricao}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            onClick={() => handleRemoverFavorito(favorito.id_favorito)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {favorito.detalhes.nivel && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {favorito.detalhes.nivel}
              </Badge>
            </div>
          )}
          {favorito.detalhes.total_aulas && (
            <div className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              <span>{favorito.detalhes.total_aulas} aulas</span>
            </div>
          )}
        </div>

        {favorito.detalhes.avaliacao_media && (
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium">{favorito.detalhes.avaliacao_media.toFixed(1)}</span>
            {favorito.detalhes.total_alunos && (
              <span className="text-muted-foreground ml-2">
                ({favorito.detalhes.total_alunos} alunos)
              </span>
            )}
          </div>
        )}

        {favorito.observacao && (
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
            💭 {favorito.observacao}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Link href={`/universidade/curso/${favorito.id_referencia}`} className="flex-1">
            <Button className="w-full" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Curso
            </Button>
          </Link>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
          <Heart className="h-3 w-3 fill-current text-red-500" />
          Adicionado em{' '}
          {new Date(favorito.dt_criacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderAulaCard = (favorito: Favorito) => (
    <Card key={favorito.id_favorito} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 text-primary" />
              <Badge variant="secondary" className="text-xs">
                Aula
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2">
              {favorito.detalhes.titulo}
            </CardTitle>
            {favorito.detalhes.descricao && (
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {favorito.detalhes.descricao}
              </CardDescription>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            onClick={() => handleRemoverFavorito(favorito.id_favorito)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {favorito.detalhes.duracao && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{Math.floor(favorito.detalhes.duracao / 60)} minutos</span>
          </div>
        )}

        {favorito.observacao && (
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
            💭 {favorito.observacao}
          </p>
        )}

        <Link href={`/universidade/aula/${favorito.id_referencia}`}>
          <Button className="w-full" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Assistir Aula
          </Button>
        </Link>

        <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
          <Heart className="h-3 w-3 fill-current text-red-500" />
          Adicionado em{' '}
          {new Date(favorito.dt_criacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderInstrutorCard = (favorito: Favorito) => (
    <Card key={favorito.id_favorito} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <Badge variant="secondary" className="text-xs">
                Instrutor
              </Badge>
            </div>
            <CardTitle className="text-lg">{favorito.detalhes.titulo}</CardTitle>
            {favorito.detalhes.descricao && (
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {favorito.detalhes.descricao}
              </CardDescription>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            onClick={() => handleRemoverFavorito(favorito.id_favorito)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {favorito.detalhes.total_aulas && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{favorito.detalhes.total_aulas} cursos</span>
            </div>
          )}
          {favorito.detalhes.total_alunos && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{favorito.detalhes.total_alunos} alunos</span>
            </div>
          )}
        </div>

        {favorito.detalhes.avaliacao_media && (
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium">{favorito.detalhes.avaliacao_media.toFixed(1)}</span>
          </div>
        )}

        {favorito.observacao && (
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
            💭 {favorito.observacao}
          </p>
        )}

        <Link href={`/universidade/instrutor/${favorito.id_referencia}`}>
          <Button className="w-full" size="sm">
            <User className="h-4 w-4 mr-2" />
            Ver Perfil
          </Button>
        </Link>

        <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
          <Heart className="h-3 w-3 fill-current text-red-500" />
          Adicionado em{' '}
          {new Date(favorito.dt_criacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-16 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cursos = favoritos?.items.filter((f) => f.tipo === 'curso') || [];
  const aulas = favoritos?.items.filter((f) => f.tipo === 'aula') || [];
  const instrutores = favoritos?.items.filter((f) => f.tipo === 'instrutor') || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            Meus Favoritos
          </h1>
          <p className="text-muted-foreground mt-2">
            {favoritos?.total || 0} {favoritos?.total === 1 ? 'item favoritado' : 'itens favoritados'}
          </p>
        </div>

        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="curso">Apenas Cursos</SelectItem>
            <SelectItem value="aula">Apenas Aulas</SelectItem>
            <SelectItem value="instrutor">Apenas Instrutores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="all">
            Todos ({favoritos?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="cursos">Cursos ({cursos.length})</TabsTrigger>
          <TabsTrigger value="aulas">Aulas ({aulas.length})</TabsTrigger>
          <TabsTrigger value="instrutores">Instrutores ({instrutores.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {favoritos && favoritos.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoritos.items.map((favorito) => {
                if (favorito.tipo === 'curso') return renderCursoCard(favorito);
                if (favorito.tipo === 'aula') return renderAulaCard(favorito);
                if (favorito.tipo === 'instrutor') return renderInstrutorCard(favorito);
                return null;
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum favorito ainda
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Explore cursos, aulas e instrutores e adicione seus favoritos!
                </p>
                <Link href="/universidade/cursos">
                  <Button className="mt-4">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Explorar Cursos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cursos" className="mt-6">
          {cursos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cursos.map(renderCursoCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum curso favoritado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="aulas" className="mt-6">
          {aulas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aulas.map(renderAulaCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma aula favoritada
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="instrutores" className="mt-6">
          {instrutores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instrutores.map(renderInstrutorCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum instrutor favoritado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {favoritos && favoritos.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: favoritos.total_pages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                onClick={() => setPage(p)}
                className="w-10"
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(favoritos.total_pages, p + 1))}
            disabled={page === favoritos.total_pages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
