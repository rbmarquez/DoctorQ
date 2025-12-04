/**
 * Card de Curso - Universidade da Beleza
 * Com preview expandido ao hover (inspirado em Udemy)
 */
'use client';

import { useState } from 'react';
import { Clock, Star, Users, CheckCircle2, PlayCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Curso } from '@/lib/api/hooks/useUniversidade';
import { formatDuracao, formatPreco, getCertificacaoLabel, getNivelLabel } from '@/lib/api/hooks/useUniversidade';

interface CursoCardProps {
  curso: Curso;
  onInscrever?: (id_curso: string) => void;
  showInscreverButton?: boolean;
}

export function CursoCard({ curso, onInscrever, showInscreverButton = true }: CursoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="group hover:shadow-xl transition-all duration-300 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {curso.thumbnail_url ? (
          <img
            src={curso.thumbnail_url}
            alt={curso.titulo}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl opacity-20">🎓</span>
          </div>
        )}

        {/* Overlay de preview ao hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300">
            <div className="text-center text-white px-4">
              <PlayCircle className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm font-medium">Ver prévia do curso</p>
            </div>
          </div>
        )}

        {/* Badges no topo */}
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge variant="secondary">{getNivelLabel(curso.nivel)}</Badge>
          {curso.certificacao_tipo && (
            <Badge variant="default">{getCertificacaoLabel(curso.certificacao_tipo)}</Badge>
          )}
        </div>

        {/* Badge de destaque se tiver alta avaliação */}
        {curso.avaliacao_media >= 4.5 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1 fill-white" />
              Mais Vendido
            </Badge>
          </div>
        )}
      </div>

      {/* Preview expandido ao hover */}
      {isHovered && curso.objetivos && curso.objetivos.length > 0 && (
        <div className="absolute top-48 left-0 right-0 bg-background border-x border-b rounded-b-lg shadow-xl z-10 p-4 animate-in slide-in-from-top-2 duration-300">
          <h4 className="font-semibold text-sm mb-2">O que você vai aprender:</h4>
          <ul className="space-y-1">
            {curso.objetivos.slice(0, 3).map((objetivo, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">{objetivo}</span>
              </li>
            ))}
          </ul>
          {curso.objetivos.length > 3 && (
            <p className="text-xs text-muted-foreground mt-2">
              + {curso.objetivos.length - 3} objetivos
            </p>
          )}
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
              <Link href={`/universidade/cursos/${curso.slug}`}>
                {curso.titulo}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">
              {curso.instrutor_nome && `Prof. ${curso.instrutor_nome}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {curso.descricao}
        </p>

        {/* Instructor */}
        {curso.instrutor_nome && (
          <div className="text-xs text-muted-foreground">
            Por: <span className="font-medium text-foreground">{curso.instrutor_nome}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuracao(curso.duracao_horas)}</span>
          </div>

          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{curso.total_inscricoes.toLocaleString()}</span>
          </div>

          {curso.avaliacao_media > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{curso.avaliacao_media.toFixed(1)}</span>
              <span className="text-xs">({curso.total_avaliacoes})</span>
            </div>
          )}
        </div>

        {/* Indicador de atualização recente */}
        {curso.dt_atualizacao && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>
              Atualizado em {new Date(curso.dt_atualizacao).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Tags */}
        {curso.tags && curso.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {curso.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">
            {formatPreco(curso.preco_assinante || curso.preco)}
          </span>
          {curso.preco_assinante && curso.preco_assinante < curso.preco && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPreco(curso.preco)}
            </span>
          )}
        </div>

        {showInscreverButton && onInscrever && (
          <Button onClick={() => onInscrever(curso.id_curso)}>
            Inscrever-se
          </Button>
        )}

        {!showInscreverButton && (
          <Button asChild variant="outline">
            <Link href={`/universidade/cursos/${curso.slug}`}>
              Ver Detalhes
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
