"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { useAvaliacoes } from "@/lib/api/hooks/useAvaliacoes";
import { apiClient } from "@/lib/api/client";
import { Star, ThumbsUp, Flag, User, Briefcase, Search, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Avaliacao } from "@/lib/api/hooks/useAvaliacoes";

export default function AvaliacoesPage() {
  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const {
    avaliacoes,
    meta,
    isLoading,
    error,
    mutate: revalidate,
  } = useAvaliacoes({
    page,
    size: 12,
    busca: search || undefined,
    st_aprovada: statusFiltro === "aprovado" ? true : statusFiltro === "pendente" ? false : undefined,
  });

  // ============================================================================
  // STATS CALCULADOS
  // ============================================================================
  const stats = [
    {
      label: "Total de Avaliações",
      value: meta?.totalItems || 0,
      icon: Star,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Aprovadas",
      value: avaliacoes.filter((a) => a.st_aprovada).length,
      icon: ThumbsUp,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Pendentes",
      value: avaliacoes.filter((a) => !a.st_aprovada && a.st_visivel).length,
      icon: Flag,
      color: "from-yellow-500 to-orange-600",
    },
    {
      label: "Média Geral",
      value:
        avaliacoes.length > 0
          ? (
              avaliacoes.reduce((acc, a) => acc + a.nr_nota, 0) / avaliacoes.length
            ).toFixed(1)
          : "0.0",
      icon: Star,
      color: "from-yellow-500 to-orange-600",
    },
  ];

  // ============================================================================
  // HELPERS
  // ============================================================================
  const renderStars = (nota: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < nota ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getStatusBadge = (avaliacao: Avaliacao) => {
    if (avaliacao.st_aprovada) {
      return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    } else if (!avaliacao.st_visivel) {
      return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  const getTipoBadge = (avaliacao: Avaliacao) => {
    if (avaliacao.id_profissional) {
      return <Badge className="bg-blue-100 text-blue-800">Profissional</Badge>;
    } else if (avaliacao.id_procedimento) {
      return <Badge className="bg-purple-100 text-purple-800">Procedimento</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Outro</Badge>;
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleAprovar = async (avaliacao: Avaliacao) => {
    setIsUpdating(avaliacao.id_avaliacao);
    try {
      await apiClient.put(`/avaliacoes/${avaliacao.id_avaliacao}`, {
        st_aprovada: true,
        st_visivel: true,
      });
      toast.success("Avaliação aprovada!");
      await revalidate();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao aprovar avaliação");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRejeitar = async (avaliacao: Avaliacao) => {
    setIsUpdating(avaliacao.id_avaliacao);
    try {
      await apiClient.put(`/avaliacoes/${avaliacao.id_avaliacao}`, {
        st_aprovada: false,
        st_visivel: false,
      });
      toast.success("Avaliação rejeitada!");
      await revalidate();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao rejeitar avaliação");
    } finally {
      setIsUpdating(null);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  const renderAvaliacoes = (filtroStatus?: string) => {
    let avaliacoesFiltradas = avaliacoes;

    // Filtrar por status
    if (filtroStatus === "pendente") {
      avaliacoesFiltradas = avaliacoesFiltradas.filter((a) => !a.st_aprovada && a.st_visivel);
    } else if (filtroStatus === "aprovado") {
      avaliacoesFiltradas = avaliacoesFiltradas.filter((a) => a.st_aprovada);
    } else if (filtroStatus === "rejeitado") {
      avaliacoesFiltradas = avaliacoesFiltradas.filter((a) => !a.st_visivel);
    }

    // Filtrar por busca
    if (search) {
      avaliacoesFiltradas = avaliacoesFiltradas.filter(
        (a) =>
          a.ds_comentario.toLowerCase().includes(search.toLowerCase()) ||
          a.nm_paciente?.toLowerCase().includes(search.toLowerCase()) ||
          a.nm_profissional?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (avaliacoesFiltradas.length === 0) {
      return (
        <div className="text-center py-12">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma avaliação encontrada</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {avaliacoesFiltradas.map((av) => (
          <Card key={av.id_avaliacao} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                      {av.nm_paciente?.charAt(0) || av.nm_user?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(av.nr_nota)}
                    </div>
                    <p className="text-sm text-gray-600">
                      <User className="h-3 w-3 inline mr-1" />
                      {av.nm_paciente || av.nm_user || "Anônimo"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(av.dt_criacao).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getStatusBadge(av)}
                  {getTipoBadge(av)}
                  {av.st_verificada && (
                    <Badge className="bg-blue-100 text-blue-800">Verificada</Badge>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {av.id_profissional ? (
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Package className="h-4 w-4 text-purple-600" />
                  )}
                  <h3 className="font-bold text-gray-900">
                    {av.nm_profissional || av.nm_procedimento || "N/A"}
                  </h3>
                </div>
                {av.nm_procedimento && av.id_profissional && (
                  <p className="text-sm text-gray-600 mb-2">
                    Procedimento: {av.nm_procedimento}
                  </p>
                )}
                {av.nm_clinica && (
                  <p className="text-sm text-gray-600 mb-2">Clínica: {av.nm_clinica}</p>
                )}
                <p className="text-gray-700">{av.ds_comentario}</p>
              </div>

              {/* Notas Detalhadas */}
              {(av.nr_atendimento || av.nr_instalacoes || av.nr_pontualidade || av.nr_resultado) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 border-t pt-4">
                  {av.nr_atendimento && (
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Atendimento</p>
                      <p className="font-bold text-gray-900">{av.nr_atendimento.toFixed(1)}</p>
                    </div>
                  )}
                  {av.nr_instalacoes && (
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Instalações</p>
                      <p className="font-bold text-gray-900">{av.nr_instalacoes.toFixed(1)}</p>
                    </div>
                  )}
                  {av.nr_pontualidade && (
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Pontualidade</p>
                      <p className="font-bold text-gray-900">{av.nr_pontualidade.toFixed(1)}</p>
                    </div>
                  )}
                  {av.nr_resultado && (
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Resultado</p>
                      <p className="font-bold text-gray-900">{av.nr_resultado.toFixed(1)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resposta do Profissional */}
              {av.ds_resposta && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Resposta do Profissional:
                  </p>
                  <p className="text-sm text-blue-800">{av.ds_resposta}</p>
                  {av.dt_resposta && (
                    <p className="text-xs text-blue-600 mt-1">
                      {new Date(av.dt_resposta).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              )}

              {/* Ações de Moderação */}
              {!av.st_aprovada && av.st_visivel && (
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    onClick={() => handleAprovar(av)}
                    disabled={isUpdating === av.id_avaliacao}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {isUpdating === av.id_avaliacao ? "Aprovando..." : "Aprovar"}
                  </Button>
                  <Button
                    onClick={() => handleRejeitar(av)}
                    disabled={isUpdating === av.id_avaliacao}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    {isUpdating === av.id_avaliacao ? "Rejeitando..." : "Rejeitar"}
                  </Button>
                </div>
              )}

              {/* Restaurar Avaliação Rejeitada */}
              {!av.st_visivel && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <Flag className="h-4 w-4" />
                    <span className="font-semibold text-sm">
                      Esta avaliação foi rejeitada
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAprovar(av)}
                      disabled={isUpdating === av.id_avaliacao}
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      {isUpdating === av.id_avaliacao ? "Restaurando..." : "Restaurar"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Estatísticas de Engajamento */}
              {(av.nr_likes > 0 || av.nr_nao_util > 0) && (
                <div className="flex gap-4 text-sm text-gray-600 border-t pt-4">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <span>{av.nr_likes} úteis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flag className="h-4 w-4 text-gray-400" />
                    <span>{av.nr_nao_util} não úteis</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
            <Star className="h-8 w-8 text-red-500" />
            Avaliações
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie todas as avaliações da plataforma
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} w-fit mb-4`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FILTROS */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar avaliações por nome ou comentário..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABS COM AVALIAÇÕES */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando avaliações...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Erro ao carregar avaliações</p>
          </div>
        ) : (
          <Tabs
            value={statusFiltro || "todos"}
            onValueChange={(value) => {
              setStatusFiltro(value === "todos" ? "" : value);
              setPage(1);
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="todos">Todas</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="aprovado">Aprovadas</TabsTrigger>
              <TabsTrigger value="rejeitado">Rejeitadas</TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-6">
              {renderAvaliacoes()}
            </TabsContent>
            <TabsContent value="pendente" className="mt-6">
              {renderAvaliacoes("pendente")}
            </TabsContent>
            <TabsContent value="aprovado" className="mt-6">
              {renderAvaliacoes("aprovado")}
            </TabsContent>
            <TabsContent value="rejeitado" className="mt-6">
              {renderAvaliacoes("rejeitado")}
            </TabsContent>
          </Tabs>
        )}

        {/* PAGINAÇÃO */}
        {meta && meta.totalPages && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <div className="flex items-center gap-2 px-4">
              <span className="text-sm text-gray-600">
                Página {page} de {meta.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              disabled={page === meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
