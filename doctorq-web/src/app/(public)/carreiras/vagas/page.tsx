"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, Briefcase, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VagaCard } from "@/components/carreiras/VagaCard";
import { useVagasPublic } from "@/lib/api/hooks/useVagasPublic";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/landing/Footer";
import type { VagasFiltros } from "@/types/carreiras";

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const AREAS = [
  "Estética Facial",
  "Estética Corporal",
  "Harmonização",
  "Skincare",
  "Depilação",
  "Administrativa",
  "Recepção",
  "Marketing",
  "Gestão",
];

export default function VagasPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState<VagasFiltros>({
    page: 1,
    size: 9,
    ds_status: "aberta",
  });

  const { vagas, meta, isLoading, error } = useVagasPublic(filtros);

  // DEBUG: Log para verificar estado
  console.log('[VagasPage] Estado:', { vagas: vagas.length, meta, isLoading, error });

  const handleSearch = (termo: string) => {
    setFiltros({ ...filtros, nm_cargo: termo, page: 1 });
  };

  const handleChangeFiltro = (key: keyof VagasFiltros, value: any) => {
    setFiltros({ ...filtros, [key]: value, page: 1 });
  };

  const limparFiltros = () => {
    setFiltros({ page: 1, size: 9, ds_status: "aberta" });
  };

  const totalFiltrosAtivos = Object.keys(filtros).filter(
    (key) => key !== "page" && key !== "size" && key !== "ds_status" && filtros[key as keyof VagasFiltros]
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Public Navigation */}
      <PublicNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white py-16 mt-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Encontre Sua Vaga Ideal
            </h1>
            <p className="text-lg text-white/90 mb-8">
              {meta?.totalItems || 0} vagas disponíveis em {AREAS.length} áreas da estética
            </p>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar por cargo, habilidade ou empresa..."
                  className="pl-12 h-14 text-lg bg-white"
                  defaultValue={filtros.nm_cargo}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(e.currentTarget.value);
                    }
                  }}
                />
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="h-14 gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filtros
                {totalFiltrosAtivos > 0 && (
                  <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {totalFiltrosAtivos}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-12 mx-auto max-w-7xl">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          {showFilters && (
            <aside className="w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
                  {totalFiltrosAtivos > 0 && (
                    <button
                      onClick={limparFiltros}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Área */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Área
                    </label>
                    <Select
                      value={filtros.nm_area || ""}
                      onValueChange={(value) => handleChangeFiltro("nm_area", value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as áreas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as áreas</SelectItem>
                        {AREAS.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Localização */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Localização
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Cidade"
                        value={filtros.nm_cidade || ""}
                        onChange={(e) => handleChangeFiltro("nm_cidade", e.target.value || undefined)}
                      />
                      <Select
                        value={filtros.nm_estado || ""}
                        onValueChange={(value) => handleChangeFiltro("nm_estado", value || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {ESTADOS_BRASIL.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Nível */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Nível
                    </label>
                    <Select
                      value={filtros.nm_nivel || ""}
                      onValueChange={(value) => handleChangeFiltro("nm_nivel", value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os níveis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os níveis</SelectItem>
                        <SelectItem value="estagiario">Estagiário</SelectItem>
                        <SelectItem value="junior">Júnior</SelectItem>
                        <SelectItem value="pleno">Pleno</SelectItem>
                        <SelectItem value="senior">Sênior</SelectItem>
                        <SelectItem value="especialista">Especialista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de Contrato */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Tipo de Contrato
                    </label>
                    <Select
                      value={filtros.nm_tipo_contrato || ""}
                      onValueChange={(value) => handleChangeFiltro("nm_tipo_contrato", value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="clt">CLT</SelectItem>
                        <SelectItem value="pj">PJ</SelectItem>
                        <SelectItem value="estagio">Estágio</SelectItem>
                        <SelectItem value="temporario">Temporário</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Regime */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Regime de Trabalho
                    </label>
                    <Select
                      value={filtros.nm_regime_trabalho || ""}
                      onValueChange={(value) => handleChangeFiltro("nm_regime_trabalho", value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="remoto">Remoto</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aceita Remoto */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtros.fg_aceita_remoto || false}
                        onChange={(e) => handleChangeFiltro("fg_aceita_remoto", e.target.checked ? true : undefined)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Apenas vagas remotas</span>
                    </label>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isLoading ? "Carregando..." : `${meta?.totalItems || 0} vagas encontradas`}
                </h2>
                {totalFiltrosAtivos > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {totalFiltrosAtivos} filtro{totalFiltrosAtivos !== 1 ? "s" : ""} ativo{totalFiltrosAtivos !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <Select
                defaultValue="recentes"
                onValueChange={(value) => {
                  // TODO: Implementar ordenação
                  console.log("Ordenar por:", value);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais recentes</SelectItem>
                  <SelectItem value="salario">Maior salário</SelectItem>
                  <SelectItem value="candidatos">Mais candidatos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vagas Grid */}
            {error ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Erro ao carregar vagas
                </h3>
                <p className="text-gray-600 mb-6">
                  {error?.message || "Ocorreu um erro ao buscar as vagas. Tente novamente."}
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Recarregar Página
                </Button>
              </div>
            ) : isLoading ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-2xl h-80 animate-pulse"
                  />
                ))}
              </div>
            ) : vagas.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nenhuma vaga encontrada
                </h3>
                <p className="text-gray-600 mb-6">
                  Tente ajustar os filtros para encontrar mais resultados
                </p>
                <Button onClick={limparFiltros} variant="outline">
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {vagas.map((vaga) => (
                    <VagaCard key={vaga.id_vaga} vaga={vaga} />
                  ))}
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={filtros.page === 1}
                      onClick={() => handleChangeFiltro("page", (filtros.page || 1) - 1)}
                    >
                      Anterior
                    </Button>

                    <span className="text-sm text-gray-600 px-4">
                      Página {filtros.page} de {meta.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      disabled={filtros.page === meta.totalPages}
                      onClick={() => handleChangeFiltro("page", (filtros.page || 1) + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
