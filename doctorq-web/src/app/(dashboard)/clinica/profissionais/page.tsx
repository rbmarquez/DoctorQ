"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Plus,
  Star,
  CheckCircle,
  XCircle,
  Filter,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfissionais, Profissional } from "@/lib/api/hooks/useProfissionais";
import {
  ProfissionalModal,
  ProfissionalCard,
  ProfissionalStatsModal,
} from "@/components/profissionais";

export default function ProfissionaisPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ativo" | "inativo">("all");
  const [aceitaPacientesFilter, setAceitaPacientesFilter] = useState<"all" | "sim" | "nao">(
    "all"
  );
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { user } = useAuth();

  // Buscar ID da empresa do usuário
  const empresaId = user?.id_empresa || null;

  // Construir filtros para API
  const filtros = useMemo(() => {
    const f: any = {
      page: currentPage,
      size: pageSize,
    };

    if (empresaId) {
      f.id_empresa = empresaId;
    }

    if (statusFilter !== "all") {
      f.st_ativo = statusFilter === "ativo";
    }

    if (aceitaPacientesFilter !== "all") {
      f.st_aceita_novos_pacientes = aceitaPacientesFilter === "sim";
    }

    if (searchTerm.trim()) {
      f.busca = searchTerm.trim();
    }

    return f;
  }, [empresaId, statusFilter, aceitaPacientesFilter, searchTerm, currentPage]);

  // Buscar profissionais da empresa
  const { profissionais, meta, isLoading, isError } = useProfissionais(filtros);

  const handleAddProfissional = () => {
    setSelectedProfissional(undefined);
    setShowModal(true);
  };

  const handleEditProfissional = (profissional: Profissional) => {
    setSelectedProfissional(profissional);
    setShowModal(true);
  };

  const handleViewStats = (profissional: Profissional) => {
    setSelectedProfissional(profissional);
    setShowStatsModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProfissional(undefined);
  };

  const handleCloseStatsModal = () => {
    setShowStatsModal(false);
    setSelectedProfissional(undefined);
  };

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    return {
      total: meta?.totalItems || 0,
      ativos: profissionais.filter((p) => p.st_ativo).length,
      inativos: profissionais.filter((p) => !p.st_ativo).length,
      aceitandoPacientes: profissionais.filter((p) => p.st_aceita_novos_pacientes).length,
      avaliacaoMedia:
        profissionais.length > 0
          ? (
              profissionais.reduce((acc, p) => acc + (p.vl_avaliacao_media || 0), 0) /
              profissionais.length
            ).toFixed(1)
          : "N/A",
    };
  }, [profissionais, meta]);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao carregar profissionais</h3>
            <p className="text-muted-foreground text-center">
              Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais de saúde da sua clínica
          </p>
        </div>
        <Button onClick={handleAddProfissional} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Profissional
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Profissionais cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground">Disponíveis para atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inativos}</div>
            <p className="text-xs text-muted-foreground">Temporariamente indisponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Pacientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.aceitandoPacientes}</div>
            <p className="text-xs text-muted-foreground">Aceitando agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avaliacaoMedia}</div>
            <p className="text-xs text-muted-foreground">De 5.0 estrelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
          <CardDescription>
            Encontre profissionais por nome, especialidade ou utilize os filtros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Busca */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou especialidade..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Filtro Status */}
            <Select
              value={statusFilter}
              onValueChange={(value: any) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Apenas Ativos</SelectItem>
                <SelectItem value="inativo">Apenas Inativos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Aceita Pacientes */}
            <Select
              value={aceitaPacientesFilter}
              onValueChange={(value: any) => {
                setAceitaPacientesFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aceita Novos Pacientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sim">Aceitando Pacientes</SelectItem>
                <SelectItem value="nao">Não Aceitando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando profissionais...</p>
          </div>
        </div>
      )}

      {/* Profissionais Grid */}
      {!isLoading && profissionais.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profissionais.map((profissional) => (
              <ProfissionalCard
                key={profissional.id_profissional}
                profissional={profissional}
                onEdit={handleEditProfissional}
                onViewStats={handleViewStats}
              />
            ))}
          </div>

          {/* Paginação */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={currentPage === meta.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && profissionais.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum profissional encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== "all" || aceitaPacientesFilter !== "all"
                ? "Tente ajustar os filtros ou faça uma nova busca."
                : "Comece adicionando o primeiro profissional da sua clínica."}
            </p>
            {!searchTerm && statusFilter === "all" && aceitaPacientesFilter === "all" && (
              <Button onClick={handleAddProfissional} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Profissional
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <ProfissionalModal
        isOpen={showModal}
        onClose={handleCloseModal}
        profissional={selectedProfissional}
        idEmpresa={empresaId || undefined}
        usuarios={[]}
      />

      {selectedProfissional && (
        <ProfissionalStatsModal
          isOpen={showStatsModal}
          onClose={handleCloseStatsModal}
          profissional={selectedProfissional}
        />
      )}
    </div>
  );
}
