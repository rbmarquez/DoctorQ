/**
 * Página de Catálogo de Cursos - Universidade da Beleza
 * Design moderno inspirado em Udemy e plataformas de e-learning
 */
'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Grid3x3,
  List,
  Star,
  Clock,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  Play,
  BookOpen,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PremiumNav } from '@/components/landing/PremiumNav';
import { CursoCard } from '@/components/universidade/CursoCard';
import { useCursos } from '@/lib/api/hooks/useUniversidade';

export default function CursosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const { cursos, isLoading } = useCursos({
    page: 1,
    size: 100, // Buscar mais cursos para filtros locais
  });

  // Filtrar cursos localmente
  const filteredCursos = cursos?.filter((curso) => {
    // Busca por texto
    if (search && !curso.titulo.toLowerCase().includes(search.toLowerCase()) &&
        !curso.descricao?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Filtro de categorias
    if (selectedCategories.length > 0 && !selectedCategories.includes(curso.categoria || '')) {
      return false;
    }

    // Filtro de níveis
    if (selectedLevels.length > 0 && !selectedLevels.includes(curso.nivel)) {
      return false;
    }

    // Filtro de preço
    const preco = curso.preco_assinante || curso.preco || 0;
    if (preco < priceRange[0] || preco > priceRange[1]) {
      return false;
    }

    // Filtro de avaliação
    if (curso.avaliacao_media < minRating) {
      return false;
    }

    return true;
  });

  // Ordenar cursos
  const sortedCursos = filteredCursos?.sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.total_inscricoes - a.total_inscricoes;
      case 'rating':
        return b.avaliacao_media - a.avaliacao_media;
      case 'newest':
        return new Date(b.dt_criacao).getTime() - new Date(a.dt_criacao).getTime();
      case 'price-low':
        return (a.preco_assinante || a.preco) - (b.preco_assinante || b.preco);
      case 'price-high':
        return (b.preco_assinante || b.preco) - (a.preco_assinante || a.preco);
      default:
        return 0;
    }
  });

  // Estatísticas
  const totalCursos = filteredCursos?.length || 0;
  const totalHoras = filteredCursos?.reduce((acc, curso) => acc + (curso.duracao_horas || 0), 0) || 0;
  const avgRating = filteredCursos?.reduce((acc, curso) => acc + curso.avaliacao_media, 0) / (totalCursos || 1) || 0;

  // Cursos especiais (antes dos filtros)
  const cursosNovos = cursos?.sort((a, b) =>
    new Date(b.dt_criacao).getTime() - new Date(a.dt_criacao).getTime()
  ).slice(0, 4) || [];

  const cursosEmAlta = cursos?.sort((a, b) =>
    b.total_inscricoes - a.total_inscricoes
  ).slice(0, 4) || [];

  // Paginação
  const totalPages = Math.ceil((sortedCursos?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCursos = sortedCursos?.slice(startIndex, endIndex);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategories, selectedLevels, priceRange, minRating, sortBy]);

  const categorias = [
    { value: 'injetaveis', label: 'Injetáveis', icon: '💉' },
    { value: 'facial', label: 'Facial', icon: '✨' },
    { value: 'corporal', label: 'Corporal', icon: '💪' },
    { value: 'negocios', label: 'Negócios', icon: '💼' },
    { value: 'tecnologias', label: 'Tecnologias', icon: '🔬' },
  ];

  const niveis = [
    { value: 'iniciante', label: 'Iniciante' },
    { value: 'intermediario', label: 'Intermediário' },
    { value: 'avancado', label: 'Avançado' },
    { value: 'expert', label: 'Expert' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Premium Navigation */}
      <PremiumNav />

      {/* Hero Section com Busca */}
      <div className="relative bg-gradient-to-r from-purple-600 via-rose-500 to-orange-500 pt-16 pb-12">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              +{totalCursos} cursos disponíveis
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Universidade da Beleza
            </h1>

            <p className="text-base text-white/90 max-w-2xl mx-auto">
              Aprenda com os melhores profissionais da estética. Cursos práticos, certificados e sempre atualizados.
            </p>

            {/* Busca em destaque */}
            <div className="max-w-2xl mx-auto pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por curso, instrutor ou técnica..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 h-11 text-base bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-lg"
                />
              </div>

              {/* Tags populares */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 cursor-pointer text-xs px-2 py-0.5">
                  Toxina Botulínica
                </Badge>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 cursor-pointer text-xs px-2 py-0.5">
                  Preenchimento
                </Badge>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 cursor-pointer text-xs px-2 py-0.5">
                  Bioestimuladores
                </Badge>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 cursor-pointer text-xs px-2 py-0.5">
                  Gestão de Clínicas
                </Badge>
              </div>

              {/* Filtros Horizontais */}
              <div className="flex flex-wrap items-center gap-2 justify-center mt-4">
                {/* Categorias */}
                <Select
                  value={selectedCategories[0] || 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedCategories([]);
                    } else {
                      setSelectedCategories([value]);
                    }
                  }}
                >
                  <SelectTrigger className="w-[160px] h-9 bg-white/95 border-0 shadow-md text-sm">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Níveis */}
                <Select
                  value={selectedLevels[0] || 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedLevels([]);
                    } else {
                      setSelectedLevels([value]);
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 bg-white/95 border-0 shadow-md text-sm">
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Níveis</SelectItem>
                    {niveis.map((nivel) => (
                      <SelectItem key={nivel.value} value={nivel.value}>
                        {nivel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Avaliação */}
                <Select
                  value={minRating > 0 ? minRating.toString() : 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setMinRating(0);
                    } else {
                      setMinRating(parseFloat(value));
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 bg-white/95 border-0 shadow-md text-sm">
                    <SelectValue placeholder="Avaliação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer nota</SelectItem>
                    <SelectItem value="4.5">⭐ 4.5+</SelectItem>
                    <SelectItem value="4">⭐ 4.0+</SelectItem>
                    <SelectItem value="3.5">⭐ 3.5+</SelectItem>
                    <SelectItem value="3">⭐ 3.0+</SelectItem>
                  </SelectContent>
                </Select>

                {/* Preço */}
                <Select
                  value={priceRange[1] === 1000 && priceRange[0] === 0 ? 'all' : 'custom'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setPriceRange([0, 1000]);
                    } else if (value === 'free') {
                      setPriceRange([0, 0]);
                    } else if (value === 'low') {
                      setPriceRange([0, 200]);
                    } else if (value === 'mid') {
                      setPriceRange([200, 500]);
                    } else if (value === 'high') {
                      setPriceRange([500, 1000]);
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 bg-white/95 border-0 shadow-md text-sm">
                    <SelectValue placeholder="Preço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer preço</SelectItem>
                    <SelectItem value="free">Gratuitos</SelectItem>
                    <SelectItem value="low">Até R$ 200</SelectItem>
                    <SelectItem value="mid">R$ 200 - R$ 500</SelectItem>
                    <SelectItem value="high">R$ 500+</SelectItem>
                  </SelectContent>
                </Select>

                {/* Limpar Filtros */}
                {(selectedCategories.length > 0 || selectedLevels.length > 0 || minRating > 0 || priceRange[0] !== 0 || priceRange[1] !== 1000) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedLevels([]);
                      setPriceRange([0, 1000]);
                      setMinRating(0);
                    }}
                    className="h-9 bg-white/80 hover:bg-white text-gray-700 shadow-md text-sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalCursos}</div>
                <div className="text-white/80 text-xs mt-0.5">Cursos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(totalHoras)}h</div>
                <div className="text-white/80 text-xs mt-0.5">Conteúdo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  {avgRating.toFixed(1)} <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="text-white/80 text-xs mt-0.5">Avaliação Média</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Promocional */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5">
        <div className="container">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <p className="text-sm">
                <span className="font-bold">Assinatura Premium:</span> Acesso ilimitado a todos os cursos + Certificados reconhecidos
              </p>
            </div>
            <Button variant="secondary" size="sm" className="bg-white text-indigo-600 hover:bg-gray-100 h-8">
              Assinar Agora
            </Button>
          </div>
        </div>
      </div>

      {/* Seções Especiais - Cursos Novos e Em Alta */}
      {!search && selectedCategories.length === 0 && selectedLevels.length === 0 && minRating === 0 && (
        <div className="container py-8 space-y-8">
          {/* Cursos Novos */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h2 className="text-2xl font-bold">Cursos Novos</h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cursosNovos.map((curso) => (
                <CursoCard
                  key={curso.id_curso}
                  curso={curso}
                  showInscreverButton={false}
                />
              ))}
            </div>
          </div>

          {/* Cursos Em Alta */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                <h2 className="text-2xl font-bold">Em Alta</h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cursosEmAlta.map((curso) => (
                <CursoCard
                  key={curso.id_curso}
                  curso={curso}
                  showInscreverButton={false}
                />
              ))}
            </div>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm font-medium text-gray-500">Todos os Cursos</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="container py-6">
          {/* Conteúdo Principal */}
          <main className="w-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">{sortedCursos?.length || 0}</span> cursos encontrados
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Ordenação */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Mais Populares</SelectItem>
                    <SelectItem value="rating">Melhor Avaliados</SelectItem>
                    <SelectItem value="newest">Mais Recentes</SelectItem>
                    <SelectItem value="price-low">Menor Preço</SelectItem>
                    <SelectItem value="price-high">Maior Preço</SelectItem>
                  </SelectContent>
                </Select>

                {/* Toggle View Mode */}
                <div className="hidden sm:flex items-center gap-1 border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filtros Ativos */}
            {(selectedCategories.length > 0 || selectedLevels.length > 0 || minRating > 0) && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedCategories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-2">
                    {categorias.find((c) => c.value === cat)?.label}
                    <button
                      onClick={() =>
                        setSelectedCategories(selectedCategories.filter((c) => c !== cat))
                      }
                      className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedLevels.map((nivel) => (
                  <Badge key={nivel} variant="secondary" className="gap-2">
                    {niveis.find((n) => n.value === nivel)?.label}
                    <button
                      onClick={() => setSelectedLevels(selectedLevels.filter((n) => n !== nivel))}
                      className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {minRating > 0 && (
                  <Badge variant="secondary" className="gap-2">
                    {minRating}+ estrelas
                    <button
                      onClick={() => setMinRating(0)}
                      className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Grid de Cursos */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : paginatedCursos && paginatedCursos.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'space-y-3'
                  }
                >
                  {paginatedCursos.map((curso) => (
                    <CursoCard
                      key={curso.id_curso}
                      curso={curso}
                      showInscreverButton={false}
                    />
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Mostrar apenas algumas páginas ao redor da atual
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-9"
                            >
                              {page}
                            </Button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum curso encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  Tente ajustar seus filtros ou fazer uma nova busca
                </p>
                <Button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategories([]);
                    setSelectedLevels([]);
                    setPriceRange([0, 1000]);
                    setMinRating(0);
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </main>
      </div>
    </div>
  );
}
