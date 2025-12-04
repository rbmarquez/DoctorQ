/**
 * Widget de Recomendações Personalizadas
 * Exibe cursos recomendados com IA
 */
'use client';

import { Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';
import type { Curso } from '@/lib/api/hooks/useUniversidade';
import { formatPreco, getNivelLabel } from '@/lib/api/hooks/useUniversidade';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

export function RecomendacoesWidget() {
  const { data: cursos, isLoading } = useSWR<Curso[]>(
    `${UNIV_API_URL}/recomendacoes/cursos/?limite=3`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Recomendados para Você</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cursos || cursos.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <CardTitle>Recomendados para Você</CardTitle>
        </div>
        <CardDescription>
          Baseado no seu perfil e histórico de aprendizado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cursos.map((curso) => (
            <Link
              key={curso.id_curso}
              href={`/universidade/cursos/${curso.slug}`}
              className="block group"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {curso.titulo}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getNivelLabel(curso.nivel)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {curso.duracao_horas}h
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-primary mt-1">
                    {formatPreco(curso.preco_assinante || curso.preco)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Button asChild className="w-full mt-4" variant="outline">
          <Link href="/universidade/cursos">
            Ver Mais Recomendações
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
