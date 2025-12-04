"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToolsCustom } from "@/hooks/useToolsCustom";
import {
  Tool,
  ToolType,
  TOOL_TYPE_LABELS,
  getToolTypeName,
  getToolStatusName,
} from "@/types/tools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ToolFormComplete } from "./ToolFormComplete";

export function ToolsListComplete() {
  const {
    tools,
    loading,
    totalPages,
    totalItems,
    currentPage,
    pageSize,
    fetchTools,
    deleteTool,
  } = useToolsCustom();

  // Estados locais
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<ToolType | "all">("all");
  const [ativoFilter, setAtivoFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTools(page, search, tipoFilter === "all" ? undefined : tipoFilter, ativoFilter === "all" ? undefined : ativoFilter === "true", size);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, tipoFilter, ativoFilter, page, size]);

  // Handlers
  const handleCreate = () => {
    setEditingTool(null);
    setShowForm(true);
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await deleteTool(deletingId);
      toast.success("Tool excluída com sucesso");
      setShowDeleteConfirm(false);
      setDeletingId(null);
      fetchTools(page, search, tipoFilter === "all" ? undefined : tipoFilter, ativoFilter === "all" ? undefined : ativoFilter === "true", size);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir tool");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTool(null);
    fetchTools(page, search, tipoFilter === "all" ? undefined : tipoFilter, ativoFilter === "all" ? undefined : ativoFilter === "true", size);
  };

  const handleClearFilters = () => {
    setSearch("");
    setTipoFilter("all");
    setAtivoFilter("all");
    setPage(1);
  };

  const hasActiveFilters = search || tipoFilter !== "all" || ativoFilter !== "all";

  // Renderizar paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
          {Math.min(currentPage * pageSize, totalItems)} de {totalItems} itens
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            Anterior
          </Button>
          {pages.map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
              disabled={loading}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Próxima
          </Button>
        </div>
        <Select value={size.toString()} onValueChange={(v) => setSize(Number(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 / página</SelectItem>
            <SelectItem value="10">10 / página</SelectItem>
            <SelectItem value="20">20 / página</SelectItem>
            <SelectItem value="50">50 / página</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Loading inicial
  if (loading && tools.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ferramentas (Tools)</CardTitle>
              <CardDescription>
                Gerencie as ferramentas disponíveis para os agentes
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tool
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de tool" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(TOOL_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ativoFilter} onValueChange={(v) => setAtivoFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Tabela */}
          {tools.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {hasActiveFilters ? "Nenhuma tool encontrada" : "Nenhuma tool cadastrada"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando sua primeira ferramenta"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Tool
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools.map((tool) => (
                      <TableRow key={tool.id_tool} className={loading ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{tool.nm_tool}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {tool.ds_tool || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <Settings className="h-3 w-3" />
                            {TOOL_TYPE_LABELS[tool.tp_tool] || tool.tp_tool}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tool.fg_ativo ? "default" : "outline"} className="gap-1">
                            {tool.fg_ativo ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {getToolStatusName(tool.fg_ativo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(tool.dt_criacao).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(tool)}
                              title="Editar tool"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(tool.id_tool)}
                              title="Excluir tool"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Formulário */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ToolFormComplete
            tool={editingTool}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta tool? Esta ação não pode ser desfeita e a tool será removida de todos os agentes que a utilizam.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
