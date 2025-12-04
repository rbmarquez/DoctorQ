"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { usePerfis, useCreatePerfil, useUpdatePerfil, useDeletePerfil, type Perfil } from "@/lib/api/hooks/gestao";

/**
 * Componente de Lista de Perfis (CRUD)
 * Layout baseado no PerfilComponent do Maua
 *
 * Features:
 * - Listagem com tabela paginada
 * - Pesquisa por nome
 * - Filtro de ativos/inativos
 * - CRUD completo (criar, editar, ativar/desativar, excluir)
 */
export function PerfilList() {
  // Estados de filtro e paginação
  const [search, setSearch] = useState("");
  const [showInativos, setShowInativos] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Estados de modal
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [selectedPerfil, setSelectedPerfil] = useState<Perfil | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    nm_perfil: "",
    ds_perfil: "",
    st_ativo: "S" as "S" | "N",
  });

  // Hooks de dados - factory retorna { data (array), meta, isLoading, ... }
  const { data: perfis, meta, isLoading, mutate } = usePerfis({
    search: search || undefined,
    ativo: showInativos ? undefined : "S",
    page,
    size: pageSize,
  });

  const { trigger: createPerfil, isMutating: isCreating } = useCreatePerfil();
  const { trigger: updatePerfil, isMutating: isUpdating } = useUpdatePerfil(selectedPerfil?.id_perfil || "");
  const { trigger: deletePerfil, isMutating: isDeleting } = useDeletePerfil(selectedPerfil?.id_perfil || "");

  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || 0;

  // Abre modal para novo perfil
  const handleNovo = () => {
    setSelectedPerfil(null);
    setFormData({
      nm_perfil: "",
      ds_perfil: "",
      st_ativo: "S",
    });
    setModalOpen(true);
  };

  // Abre modal para editar perfil
  const handleEditar = (perfil: Perfil) => {
    setSelectedPerfil(perfil);
    setFormData({
      nm_perfil: perfil.nm_perfil,
      ds_perfil: perfil.ds_perfil || "",
      st_ativo: perfil.st_ativo,
    });
    setModalOpen(true);
  };

  // Abre modal de confirmação para excluir
  const handleExcluir = (perfil: Perfil) => {
    setSelectedPerfil(perfil);
    setDeleteModalOpen(true);
  };

  // Abre modal de confirmação para ativar/desativar
  const handleToggleStatus = (perfil: Perfil) => {
    setSelectedPerfil(perfil);
    setToggleModalOpen(true);
  };

  // Salva perfil (criar ou atualizar)
  const handleSalvar = async () => {
    if (!formData.nm_perfil.trim()) {
      toast.error("Nome do perfil é obrigatório");
      return;
    }

    try {
      if (selectedPerfil) {
        await updatePerfil({
          nm_perfil: formData.nm_perfil.trim(),
          ds_perfil: formData.ds_perfil.trim() || undefined,
          st_ativo: formData.st_ativo,
        });
        toast.success("Perfil atualizado com sucesso");
      } else {
        await createPerfil({
          nm_perfil: formData.nm_perfil.trim(),
          ds_perfil: formData.ds_perfil.trim() || undefined,
          st_ativo: formData.st_ativo,
        });
        toast.success("Perfil criado com sucesso");
      }
      setModalOpen(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar perfil");
    }
  };

  // Confirma exclusão
  const handleConfirmDelete = async () => {
    if (!selectedPerfil) return;

    try {
      await deletePerfil({});
      toast.success("Perfil excluído com sucesso");
      setDeleteModalOpen(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir perfil");
    }
  };

  // Confirma ativar/desativar
  const handleConfirmToggle = async () => {
    if (!selectedPerfil) return;

    try {
      await updatePerfil({
        st_ativo: selectedPerfil.st_ativo === "S" ? "N" : "S",
      });
      toast.success(
        selectedPerfil.st_ativo === "S"
          ? "Perfil desativado com sucesso"
          : "Perfil ativado com sucesso"
      );
      setToggleModalOpen(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status do perfil");
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Perfil</h2>
        </div>
        <Button onClick={handleNovo}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar novo
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-12 gap-4">
        {/* Pesquisa */}
        <div className="col-span-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar pelo nome"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Mostrar Inativos */}
        <div className="col-span-4 flex items-center gap-2">
          <Checkbox
            id="showInativos"
            checked={showInativos}
            onCheckedChange={(checked) => {
              setShowInativos(checked as boolean);
              setPage(1);
            }}
          />
          <Label htmlFor="showInativos" className="text-sm cursor-pointer">
            Mostrar Inativos
          </Label>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[30%]">Perfil</TableHead>
              <TableHead className="w-[40%]">Descrição</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[15%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : perfis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum perfil encontrado
                </TableCell>
              </TableRow>
            ) : (
              perfis.map((perfil) => (
                <TableRow key={perfil.id_perfil}>
                  <TableCell className="font-medium">{perfil.nm_perfil}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {perfil.ds_perfil || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={perfil.st_ativo === "S" ? "default" : "secondary"}
                      className={
                        perfil.st_ativo === "S"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {perfil.st_ativo === "S" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Editar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditar(perfil)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Ativar/Desativar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(perfil)}
                        title={perfil.st_ativo === "S" ? "Desativar" : "Ativar"}
                      >
                        {perfil.st_ativo === "S" ? (
                          <Ban className="h-4 w-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>

                      {/* Excluir */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExcluir(perfil)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Exibindo {(page - 1) * pageSize + 1} a{" "}
            {Math.min(page * pageSize, totalItems)} de {totalItems} registros
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPerfil ? "Editar Perfil" : "Novo Perfil"}
            </DialogTitle>
            <DialogDescription>
              {selectedPerfil
                ? "Atualize os dados do perfil"
                : "Preencha os dados para criar um novo perfil"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nm_perfil">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nm_perfil"
                placeholder="Nome do perfil"
                value={formData.nm_perfil}
                onChange={(e) =>
                  setFormData({ ...formData, nm_perfil: e.target.value })
                }
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds_perfil">Descrição</Label>
              <Textarea
                id="ds_perfil"
                placeholder="Descrição do perfil"
                value={formData.ds_perfil}
                onChange={(e) =>
                  setFormData({ ...formData, ds_perfil: e.target.value })
                }
                disabled={isSaving}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="st_ativo">Status</Label>
              <Select
                value={formData.st_ativo}
                onValueChange={(value: "S" | "N") =>
                  setFormData({ ...formData, st_ativo: value })
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Ativo</SelectItem>
                  <SelectItem value="N">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedPerfil ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação - Excluir */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o perfil "{selectedPerfil?.nm_perfil}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação - Ativar/Desativar */}
      <AlertDialog open={toggleModalOpen} onOpenChange={setToggleModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedPerfil?.st_ativo === "S" ? "Desativar" : "Ativar"} Perfil
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja{" "}
              {selectedPerfil?.st_ativo === "S" ? "desativar" : "ativar"} o perfil "
              {selectedPerfil?.nm_perfil}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
