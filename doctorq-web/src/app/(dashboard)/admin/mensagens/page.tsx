"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { apiClient } from "@/lib/api/client";
import useSWR from "swr";
import {
  MessageSquare,
  User,
  Flag,
  CheckCircle2,
  Search,
  Eye,
  Archive,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// ============================================================================
// TIPOS
// ============================================================================
interface Conversa {
  id_conversa: string;
  id_user_1: string;
  id_user_2: string;
  ds_tipo?: string;
  st_arquivada: boolean;
  st_ativa: boolean;
  dt_ultima_mensagem?: string;
  dt_criacao: string;
  nm_user_1?: string;
  nm_user_2?: string;
  total_mensagens: number;
  mensagens_nao_lidas: number;
  st_reportada?: boolean;
}

interface ConversasResponse {
  items: Conversa[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export default function MensagensPage() {
  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const { data, error, isLoading, mutate: revalidate } = useSWR<ConversasResponse>(
    ["/conversas", page, statusFiltro],
    () =>
      apiClient.get("/conversas", {
        params: {
          page,
          size: 12,
          ...(statusFiltro === "ativa" && { st_ativa: true }),
          ...(statusFiltro === "arquivada" && { st_arquivada: true }),
          ...(statusFiltro === "reportada" && { st_reportada: true }),
        },
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // 30 segundos
    }
  );

  const conversas = data?.items || [];
  const meta = data?.meta;

  // ============================================================================
  // STATS CALCULADOS
  // ============================================================================
  const stats = [
    {
      label: "Total de Conversas",
      value: meta?.totalItems || 0,
      icon: MessageSquare,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Conversas Ativas",
      value: conversas.filter((c) => c.st_ativa && !c.st_arquivada).length,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Mensagens Não Lidas",
      value: conversas.reduce((acc, c) => acc + c.mensagens_nao_lidas, 0),
      icon: Flag,
      color: "from-red-500 to-blue-600",
    },
    {
      label: "Conversas Arquivadas",
      value: conversas.filter((c) => c.st_arquivada).length,
      icon: Archive,
      color: "from-gray-500 to-slate-600",
    },
  ];

  // ============================================================================
  // HELPERS
  // ============================================================================
  const getStatusBadge = (conversa: Conversa) => {
    if (conversa.st_reportada) {
      return <Badge className="bg-red-100 text-red-800">Reportada</Badge>;
    } else if (conversa.st_arquivada) {
      return <Badge className="bg-gray-100 text-gray-800">Arquivada</Badge>;
    } else if (conversa.st_ativa) {
      return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>;
    }
  };

  const getTipoBadge = (tipo?: string) => {
    if (!tipo) return null;

    const tipos: Record<string, { label: string; className: string }> = {
      "cliente-profissional": {
        label: "Cliente-Profissional",
        className: "bg-blue-100 text-blue-800",
      },
      "cliente-fornecedor": {
        label: "Cliente-Fornecedor",
        className: "bg-purple-100 text-purple-800",
      },
      "profissional-fornecedor": {
        label: "Profissional-Fornecedor",
        className: "bg-green-100 text-green-800",
      },
    };

    const tipoInfo = tipos[tipo] || { label: tipo, className: "bg-gray-100 text-gray-800" };

    return <Badge className={tipoInfo.className}>{tipoInfo.label}</Badge>;
  };

  const getStatusIcon = (conversa: Conversa) => {
    if (conversa.st_reportada) {
      return <Flag className="h-5 w-5 text-red-600" />;
    } else if (conversa.st_ativa) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else {
      return <MessageSquare className="h-5 w-5 text-gray-600" />;
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleArquivar = async (conversa: Conversa) => {
    setIsUpdating(conversa.id_conversa);
    try {
      await apiClient.post(`/conversas/${conversa.id_conversa}/arquivar`);
      toast.success("Conversa arquivada!");
      await revalidate();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao arquivar conversa");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleVerConversa = (conversaId: string) => {
    // TODO: Implementar visualização detalhada da conversa
    toast.info(`Ver conversa: ${conversaId}`);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  const renderConversas = (filtroStatus?: string) => {
    let conversasFiltradas = conversas;

    // Filtrar por status
    if (filtroStatus === "ativa") {
      conversasFiltradas = conversasFiltradas.filter((c) => c.st_ativa && !c.st_arquivada);
    } else if (filtroStatus === "reportada") {
      conversasFiltradas = conversasFiltradas.filter((c) => c.st_reportada);
    } else if (filtroStatus === "arquivada") {
      conversasFiltradas = conversasFiltradas.filter((c) => c.st_arquivada);
    }

    // Filtrar por busca
    if (busca) {
      conversasFiltradas = conversasFiltradas.filter(
        (c) =>
          c.nm_user_1?.toLowerCase().includes(busca.toLowerCase()) ||
          c.nm_user_2?.toLowerCase().includes(busca.toLowerCase()) ||
          c.id_conversa.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (conversasFiltradas.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma conversa encontrada</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {conversasFiltradas.map((conv) => (
          <Card key={conv.id_conversa} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(conv)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {conv.nm_user_1 && conv.nm_user_2
                          ? `${conv.nm_user_1} ↔ ${conv.nm_user_2}`
                          : `Conversa #${conv.id_conversa.slice(0, 8)}`}
                      </h3>
                      {conv.mensagens_nao_lidas > 0 && (
                        <Badge className="bg-red-500 text-white">
                          {conv.mensagens_nao_lidas}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {getTipoBadge(conv.ds_tipo)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getStatusBadge(conv)}
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total de Mensagens</p>
                    <p className="font-bold text-gray-900">{conv.total_mensagens}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Última Mensagem</p>
                    <p className="font-bold text-gray-900">
                      {conv.dt_ultima_mensagem
                        ? new Date(conv.dt_ultima_mensagem).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Sem mensagens"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Criada em:{" "}
                  {new Date(conv.dt_criacao).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleVerConversa(conv.id_conversa)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Conversa
                </Button>
                {!conv.st_arquivada && (
                  <Button
                    variant="outline"
                    onClick={() => handleArquivar(conv)}
                    disabled={isUpdating === conv.id_conversa}
                    className="text-gray-600"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {isUpdating === conv.id_conversa ? "Arquivando..." : "Arquivar"}
                  </Button>
                )}
                {conv.st_reportada && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Revisar
                  </Button>
                )}
              </div>
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
            <MessageSquare className="h-8 w-8 text-red-500" />
            Mensagens
          </h1>
          <p className="text-gray-600 mt-1">
            Monitore todas as conversas da plataforma
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
                  placeholder="Buscar por participante ou ID da conversa..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABS COM CONVERSAS */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando conversas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Erro ao carregar conversas</p>
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
              <TabsTrigger value="ativa">Ativas</TabsTrigger>
              <TabsTrigger value="reportada">Reportadas</TabsTrigger>
              <TabsTrigger value="arquivada">Arquivadas</TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-6">
              {renderConversas()}
            </TabsContent>
            <TabsContent value="ativa" className="mt-6">
              {renderConversas("ativa")}
            </TabsContent>
            <TabsContent value="reportada" className="mt-6">
              {renderConversas("reportada")}
            </TabsContent>
            <TabsContent value="arquivada" className="mt-6">
              {renderConversas("arquivada")}
            </TabsContent>
          </Tabs>
        )}

        {/* PAGINAÇÃO */}
        {meta && meta.totalPages > 1 && (
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
