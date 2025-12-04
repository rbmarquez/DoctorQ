"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Bot,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAgentes } from "@/hooks/useAgentes";
import type { Agente } from "@/types/agentes";
import { useSession } from "next-auth/react";


export function AgentesList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [agenteToDelete, setAgenteToDelete] = useState<Agente | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deployFilter, setDeployFilter] = useState<string>("all");
  const [isFiltered, setIsFiltered] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    agentes,
    loading,
    totalPages,
    totalItems,
    fetchAgentes,
    deleteAgente,
  } = useAgentes();

  const loadAgentes = (page: number = currentPage, term: string = searchTerm) => {
    fetchAgentes(page, term, "dt_criacao", true, pageSize);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      // Só carregar se estiver autenticado
      if (status === "authenticated") {
        try {
          await fetchAgentes(1, "", "dt_criacao", true, 5);
        } catch (error) {
          console.error("Erro ao carregar agentes:", error);
        } finally {
          setIsInitialLoad(false);
        }
      }
    };

    loadInitialData();
  }, [fetchAgentes, status]);

  useEffect(() => {
    if (isInitialLoad) return;

    const timer = setTimeout(() => {
      loadAgentes(1, searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isInitialLoad) return;

    loadAgentes(1);
    setCurrentPage(1);
  }, [statusFilter, deployFilter, pageSize]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDeployFilter("all");
  };

  const handleRefresh = () => {
    loadAgentes();
  };

  const handlePageChange = (page: number) => {
    loadAgentes(page);
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    const newPageSize = Number(value);
    setPageSize(newPageSize);
  };

  const handleNewAgente = () => {
    router.push("/agentes/novo");
  };

  const handleEditAgente = (agente: Agente) => {
    router.push(`/agentes/${agente.id_agente}`);
  };

  const handleDeleteAgente = (agente: Agente) => {
    setAgenteToDelete(agente);
    setShowDeleteDialog(true);
  };



  const confirmDelete = async () => {
    if (!agenteToDelete) return;
    try {
      await deleteAgente(agenteToDelete.id_agente);
      setShowDeleteDialog(false);
      setAgenteToDelete(null);
      handleRefresh();
    } catch (error) {
      console.error("Erro ao excluir agente:", error);
    }
  };


  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    setIsFiltered(
      searchTerm !== "" ||
      (statusFilter !== "all" && statusFilter !== "") ||
      (deployFilter !== "all" && deployFilter !== "")
    );
  }, [searchTerm, statusFilter, deployFilter]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Agentes do Sistema</h2>
          </div>
          <p className="text-muted-foreground">
            Gerencie os agentes de IA do sistema
          </p>
        </div>
        <Button onClick={handleNewAgente} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>


          <div className="flex gap-2">
            {isFiltered && (
              <Button onClick={handleClearFilters} variant="outline" size="sm" className="gap-2">
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {!isInitialLoad && loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        <Card className={`transition-opacity duration-200 ${!isInitialLoad && loading ? 'opacity-70' : 'opacity-100'
          }`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead >Ferramentas</TableHead>
                <TableHead className="text-center  w-[160px]">Modificada</TableHead>
                <TableHead className="text-center w-[130px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialLoad && loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      Carregando agentes...
                    </div>
                  </TableCell>
                </TableRow>
              ) : agentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="space-y-2">
                      <Bot className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">
                        {isFiltered ? "Nenhum agente encontrado" : "Nenhum agente cadastrado"}
                      </p>
                      {!isFiltered && (
                        <Button onClick={handleNewAgente} variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Criar primeiro agente
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                agentes.map((agente) => (
                  <TableRow key={agente.id_agente}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{agente.nm_agente}</span>   {agente.st_principal && (
                          <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {agente.tools.length}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {formatDate(agente.dt_atualizacao || "Nunca")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleEditAgente(agente)}
                          className="h-8 w-8 p-0 rounded-full"
                          title="Editar Agente"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAgente(agente)}
                          className="h-8 w-8 p-0 rounded-full"
                          title="Excluir Agente"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalItems)} a {Math.min(currentPage * pageSize, totalItems)} de {totalItems} itens
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className="w-10"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="items-per-page" className="text-sm whitespace-nowrap">
                  Itens por página:
                </Label>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>


      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o agente &#34;{agenteToDelete?.nm_agente}&#34;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
