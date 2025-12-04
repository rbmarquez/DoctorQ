/**
 * Página de E-books - Universidade da Beleza
 * Dados reais da API com funcionalidades completas
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, BookOpen, Download, Eye, Filter, Search, Star } from 'lucide-react';
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// API URL
const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

// Fetcher para SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Ebook {
  id_ebook: string;
  titulo: string;
  descricao: string;
  autor: string;
  categoria: string;
  paginas: number;
  downloads: number;
  avaliacao_media: number;
  total_avaliacoes: number;
  formato: string;
  tamanho_mb: number;
  idioma: string;
  thumbnail_url: string;
  pdf_url: string;
  preview_url?: string;
  tags: string[];
  fg_gratuito: boolean;
  preco: number;
  dt_publicacao: string;
}

export default function EbooksPage() {
  const [categoria, setCategoria] = useState<string>('');
  const [search, setSearch] = useState('');

  // Buscar ebooks da API
  const { data: ebooks = [], error, isLoading } = useSWR<Ebook[]>(
    `${UNIV_API_URL}/ebooks/`,
    fetcher
  );

  // Handler para baixar ebook
  const handleDownload = async (ebook: Ebook) => {
    try {
      const response = await fetch(`${UNIV_API_URL}/ebooks/${ebook.id_ebook}/download/`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erro ao baixar e-book');

      const data = await response.json();

      // Abrir PDF em nova aba
      window.open(data.pdf_url, '_blank');

      alert(`Download iniciado! E-book "${ebook.titulo}" está sendo baixado.`);
    } catch (error) {
      alert('Não foi possível baixar o e-book. Tente novamente.');
    }
  };

  // Handler para preview
  const handlePreview = (ebook: Ebook) => {
    if (!ebook.preview_url) {
      alert('Preview indisponível para este e-book.');
      return;
    }

    // Abrir preview em nova aba
    window.open(ebook.preview_url, '_blank');
  };

  // Handler para "Ver" (abre detalhes do ebook)
  const handleVer = (ebook: Ebook) => {
    // Por enquanto, abre o preview ou PDF
    if (ebook.preview_url) {
      window.open(ebook.preview_url, '_blank');
    } else {
      window.open(ebook.pdf_url, '_blank');
    }
  };

  // Filtro local
  const ebooksFiltrados = ebooks.filter((ebook) => {
    const matchCategoria = !categoria || categoria === 'all' || ebook.categoria === categoria;
    const matchSearch =
      !search ||
      ebook.titulo.toLowerCase().includes(search.toLowerCase()) ||
      ebook.descricao.toLowerCase().includes(search.toLowerCase()) ||
      ebook.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    return matchCategoria && matchSearch;
  });

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
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Biblioteca de E-books</h1>
              <p className="text-muted-foreground">
                Material de apoio completo para aprofundar seus conhecimentos em estética
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
              placeholder="Buscar e-books..."
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
        {!isLoading && ebooks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{ebooks.length}</div>
                <div className="text-sm text-muted-foreground">E-books disponíveis</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {ebooks.reduce((sum, e) => sum + e.downloads, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Downloads totais</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {(ebooks.reduce((sum, e) => sum + e.avaliacao_media, 0) / ebooks.length).toFixed(1)}⭐
                </div>
                <div className="text-sm text-muted-foreground">Avaliação média</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">Grátis</div>
                <div className="text-sm text-muted-foreground">Para assinantes</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando e-books...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Erro ao carregar e-books. Tente novamente.</p>
          </div>
        )}

        {/* Resultados */}
        {!isLoading && ebooksFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum e-book encontrado.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ebooksFiltrados.map((ebook) => (
            <Card key={ebook.id_ebook} className="group hover:shadow-lg transition-shadow flex flex-col">
              {/* Thumbnail */}
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

                {/* Preview overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleVer(ebook)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>

                {/* Badge formato */}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">{ebook.formato}</Badge>
                </div>
              </div>

              <CardHeader className="flex-1">
                <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                  {ebook.titulo}
                </CardTitle>
                <div className="text-sm text-muted-foreground">{ebook.autor}</div>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {ebook.descricao}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{ebook.paginas}p</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{ebook.downloads}</span>
                  </div>
                  {ebook.avaliacao_media > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{ebook.avaliacao_media.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <div>Tamanho: {ebook.tamanho_mb} MB</div>
                  <div>Idioma: {ebook.idioma}</div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {ebook.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => handleDownload(ebook)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar E-book
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(ebook)}
                  disabled={!ebook.preview_url}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Pré-visualizar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
