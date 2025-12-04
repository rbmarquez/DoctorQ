"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Pause,
  Play,
  X,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMinhasVagas, alterarStatusVaga, deletarVaga } from "@/lib/api/hooks/useVagas";
import type { Vaga } from "@/types/carreiras";
import { toast } from "sonner";

type DialogType = "pausar" | "reabrir" | "fechar" | "deletar" | null;

export default function MinhasVagasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname?.split("/").filter(Boolean) ?? [];
  const basePath = `/${pathSegments[0] ?? "clinica"}`;
  const [statusFilter, setStatusFilter] = useState<string>("aberta");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [dialogOpen, setDialogOpen] = useState<DialogType>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { vagas, meta, isLoading, mutate } = useMinhasVagas({
    ds_status: statusFilter === "todos" ? undefined : statusFilter || undefined,
    page,
    size: 20,
  });

  const openDialog = (vaga: Vaga, type: DialogType) => {
    setSelectedVaga(vaga);
    setDialogOpen(type);
  };

  const closeDialog = () => {
    setSelectedVaga(null);
    setDialogOpen(null);
    setIsProcessing(false);
  };

  const handleAlterarStatus = async (novoStatus: "aberta" | "pausada" | "fechada" | "cancelada") => {
    if (!selectedVaga) return;

    setIsProcessing(true);
    try {
      await alterarStatusVaga(selectedVaga.id_vaga, novoStatus);
      toast.success("Status da vaga atualizado!");
      mutate();
      closeDialog();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
      setIsProcessing(false);
    }
  };

  const handleDeletar = async () => {
    if (!selectedVaga) return;

    setIsProcessing(true);
    try {
      await deletarVaga(selectedVaga.id_vaga);
      toast.success("Vaga deletada com sucesso!");
      mutate();
      closeDialog();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar vaga");
      setIsProcessing(false);
    }
  };

  const getDialogContent = () => {
    if (!selectedVaga) return null;

    switch (dialogOpen) {
      case "pausar":
        return {
          title: "Pausar Vaga",
          description: `Tem certeza que deseja pausar a vaga "${selectedVaga.nm_cargo}"? A vaga não aparecerá mais nas buscas públicas até ser reaberta.`,
          icon: <Pause className="w-12 h-12 text-yellow-600 mx-auto mb-4" />,
          confirmText: "Pausar Vaga",
          confirmClass: "bg-yellow-600 hover:bg-yellow-700",
          onConfirm: () => handleAlterarStatus("pausada"),
        };
      case "reabrir":
        return {
          title: "Reabrir Vaga",
          description: `Deseja reabrir a vaga "${selectedVaga.nm_cargo}"? Ela voltará a aparecer nas buscas públicas e receberá candidaturas.`,
          icon: <Play className="w-12 h-12 text-green-600 mx-auto mb-4" />,
          confirmText: "Reabrir Vaga",
          confirmClass: "bg-green-600 hover:bg-green-700",
          onConfirm: () => handleAlterarStatus("aberta"),
        };
      case "fechar":
        return {
          title: "Fechar Vaga",
          description: `Tem certeza que deseja fechar a vaga "${selectedVaga.nm_cargo}"? Esta ação indica que a vaga foi preenchida. Você poderá reabri-la posteriormente se necessário.`,
          icon: <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />,
          confirmText: "Fechar Vaga",
          confirmClass: "bg-gray-600 hover:bg-gray-700",
          onConfirm: () => handleAlterarStatus("fechada"),
        };
      case "deletar":
        return {
          title: "Deletar Vaga",
          description: `⚠️ ATENÇÃO: Você está prestes a deletar permanentemente a vaga "${selectedVaga.nm_cargo}". Todas as candidaturas associadas também serão removidas. Esta ação NÃO pode ser desfeita!`,
          icon: <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />,
          confirmText: "Sim, Deletar Permanentemente",
          confirmClass: "bg-red-600 hover:bg-red-700",
          onConfirm: handleDeletar,
        };
      default:
        return null;
    }
  };

  const filteredVagas = vagas.filter((vaga) =>
    vaga.nm_cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = {
    aberta: "bg-green-100 text-green-700",
    pausada: "bg-yellow-100 text-yellow-700",
    fechada: "bg-gray-100 text-gray-700",
    expirada: "bg-red-100 text-red-700",
  };

  const statusLabel = {
    aberta: "Aberta",
    pausada: "Pausada",
    fechada: "Fechada",
    expirada: "Expirada",
  };

  // Estatísticas
  const totalVagas = meta?.totalItems || 0;
  const vagasAbertas = vagas.filter((v) => v.ds_status === "aberta").length;
  const totalCandidatos = vagas.reduce((acc, v) => acc + (v.nr_candidatos || 0), 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Minhas Vagas</h1>
              <p className="text-gray-600 mt-1">Gerencie suas vagas de emprego</p>
            </div>

            <Button
              onClick={() => router.push(`${basePath}/vagas/nova`)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Nova Vaga
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">{totalVagas}</span>
              </div>
              <p className="text-sm opacity-90">Total de Vagas</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">{vagasAbertas}</span>
              </div>
              <p className="text-sm opacity-90">Vagas Abertas</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">{totalCandidatos}</span>
              </div>
              <p className="text-sm opacity-90">Total Candidatos</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">
                  {totalCandidatos > 0 ? (totalCandidatos / Math.max(vagasAbertas, 1)).toFixed(1) : 0}
                </span>
              </div>
              <p className="text-sm opacity-90">Média por Vaga</p>
            </div>
          </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar por cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aberta">Abertas</SelectItem>
                <SelectItem value="pausada">Pausadas</SelectItem>
                <SelectItem value="fechada">Fechadas</SelectItem>
                <SelectItem value="expirada">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vagas Table */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando vagas...</p>
          </div>
        ) : filteredVagas.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm ? "Nenhuma vaga encontrada" : "Nenhuma vaga cadastrada"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Tente ajustar os filtros de busca"
                : "Comece criando sua primeira vaga de emprego"}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => router.push(`${basePath}/vagas/nova`)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Vaga
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cargo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Área</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Candidatos</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Publicada</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVagas.map((vaga) => (
                    <tr key={vaga.id_vaga} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{vaga.nm_cargo}</p>
                          <p className="text-sm text-gray-600">
                            {vaga.nm_cidade}, {vaga.nm_estado}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                          {vaga.nm_area}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            statusBadge[vaga.ds_status as keyof typeof statusBadge]
                          }`}
                        >
                          {statusLabel[vaga.ds_status as keyof typeof statusLabel]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{vaga.nr_candidatos || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(vaga.dt_criacao).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {basePath === "/clinica" && (
                              <DropdownMenuItem
                                onClick={() => router.push(`${basePath}/vagas/${vaga.id_vaga}/candidatos`)}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Ver Candidatos
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => router.push(`/carreiras/vagas/${vaga.id_vaga}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>

                            {vaga.ds_status === "aberta" && (
                              <DropdownMenuItem onClick={() => openDialog(vaga, "pausar")}>
                                <Pause className="w-4 h-4 mr-2" />
                                Pausar Vaga
                              </DropdownMenuItem>
                            )}

                            {vaga.ds_status === "pausada" && (
                              <DropdownMenuItem onClick={() => openDialog(vaga, "reabrir")}>
                                <Play className="w-4 h-4 mr-2" />
                                Reabrir Vaga
                              </DropdownMenuItem>
                            )}

                            {vaga.ds_status !== "fechada" && (
                              <DropdownMenuItem onClick={() => openDialog(vaga, "fechar")}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Fechar Vaga
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => openDialog(vaga, "deletar")}
                              className="text-red-600"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>

                <span className="text-sm text-gray-600 px-4">
                  Página {page} de {meta.totalPages}
                </span>

                <Button
                  variant="outline"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog Modal para Ações */}
      <Dialog open={dialogOpen !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          {(() => {
            const content = getDialogContent();
            if (!content) return null;

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center">{content.title}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {content.icon}
                  <DialogDescription className="text-center text-base">
                    {content.description}
                  </DialogDescription>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={content.onConfirm}
                    disabled={isProcessing}
                    className={`w-full sm:w-auto text-white ${content.confirmClass}`}
                  >
                    {isProcessing ? "Processando..." : content.confirmText}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
