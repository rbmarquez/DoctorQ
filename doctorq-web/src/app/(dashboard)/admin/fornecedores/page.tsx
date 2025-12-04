"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  useFornecedores,
  criarFornecedor,
  atualizarFornecedor,
  deletarFornecedor,
} from "@/lib/api/hooks/useFornecedores";
import { Package, ShoppingBag, Star, Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Fornecedor } from "@/lib/api/hooks/useFornecedores";

export default function FornecedoresPage() {
  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    nm_fornecedor: "",
    ds_fornecedor: "",
    nm_email: "",
    ds_telefone: "",
    nr_cnpj: "",
    ds_endereco: "",
    ds_cidade: "",
    ds_estado: "",
    nr_cep: "",
    fl_ativo: true,
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const { fornecedores, meta, isLoading, error } = useFornecedores({
    page,
    size: 12,
    search: search || undefined,
  });

  // ============================================================================
  // STATS CALCULADOS
  // ============================================================================
  const stats = [
    {
      label: "Total de Fornecedores",
      value: meta?.totalItems || 0,
      icon: Package,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Fornecedores Ativos",
      value: fornecedores.filter((f) => f.fl_ativo).length,
      icon: ShoppingBag,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Total de Produtos",
      value: fornecedores.reduce((acc, f) => acc + (f.qt_produtos || 0), 0),
      icon: Package,
      color: "from-purple-500 to-blue-600",
    },
    {
      label: "Média de Avaliação",
      value:
        fornecedores.length > 0
          ? (
              fornecedores.reduce((acc, f) => acc + (f.vl_nota_media || 0), 0) /
              fornecedores.length
            ).toFixed(1)
          : "0.0",
      icon: Star,
      color: "from-yellow-500 to-orange-600",
    },
  ];

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleCreate = () => {
    setFormData({
      nm_fornecedor: "",
      ds_fornecedor: "",
      nm_email: "",
      ds_telefone: "",
      nr_cnpj: "",
      ds_endereco: "",
      ds_cidade: "",
      ds_estado: "",
      nr_cep: "",
      fl_ativo: true,
    });
    setShowCreateDialog(true);
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setFormData({
      nm_fornecedor: fornecedor.nm_fornecedor,
      ds_fornecedor: fornecedor.ds_fornecedor || "",
      nm_email: fornecedor.nm_email || "",
      ds_telefone: fornecedor.ds_telefone || "",
      nr_cnpj: fornecedor.nr_cnpj || "",
      ds_endereco: fornecedor.ds_endereco || "",
      ds_cidade: fornecedor.ds_cidade || "",
      ds_estado: fornecedor.ds_estado || "",
      nr_cep: fornecedor.nr_cep || "",
      fl_ativo: fornecedor.fl_ativo,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setShowDeleteDialog(true);
  };

  const handleSubmitCreate = async () => {
    setIsSubmitting(true);
    try {
      await criarFornecedor(formData);
      toast.success("Fornecedor criado com sucesso!");
      setShowCreateDialog(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar fornecedor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedFornecedor) return;
    setIsSubmitting(true);
    try {
      await atualizarFornecedor(selectedFornecedor.id_fornecedor, formData);
      toast.success("Fornecedor atualizado com sucesso!");
      setShowEditDialog(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar fornecedor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedFornecedor) return;
    setIsSubmitting(true);
    try {
      await deletarFornecedor(selectedFornecedor.id_fornecedor);
      toast.success("Fornecedor excluído com sucesso!");
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao excluir fornecedor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
              <Package className="h-8 w-8 text-red-500" />
              Fornecedores
            </h1>
            <p className="text-gray-600 mt-1">Gerencie os fornecedores da plataforma</p>
          </div>
          <Button onClick={handleCreate} className="bg-red-600 hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  placeholder="Buscar fornecedores..."
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

        {/* LISTA DE FORNECEDORES */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando fornecedores...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Erro ao carregar fornecedores</p>
          </div>
        ) : fornecedores.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum fornecedor encontrado</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fornecedores.map((forn) => (
                <Card
                  key={forn.id_fornecedor}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        {forn.ds_logo_url ? (
                          <AvatarImage src={forn.ds_logo_url} alt={forn.nm_fornecedor} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-xl">
                            {forn.nm_fornecedor.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">
                          {forn.nm_fornecedor}
                        </h3>
                        {forn.nr_cnpj && (
                          <p className="text-sm text-gray-600">CNPJ: {forn.nr_cnpj}</p>
                        )}
                        {forn.nm_email && (
                          <p className="text-sm text-gray-600">{forn.nm_email}</p>
                        )}
                        <Badge
                          className={
                            forn.fl_ativo
                              ? "bg-green-100 text-green-800 mt-1"
                              : "bg-gray-100 text-gray-800 mt-1"
                          }
                        >
                          {forn.fl_ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>

                    {forn.ds_fornecedor && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {forn.ds_fornecedor}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Produtos</p>
                        <p className="text-lg font-bold text-gray-900">
                          {forn.qt_produtos || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vendas</p>
                        <p className="text-lg font-bold text-gray-900">
                          {forn.qt_vendas || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Nota
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {forn.vl_nota_media?.toFixed(1) || "0.0"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(forn)}
                        className="flex-1"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(forn)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* PAGINAÇÃO */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
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
          </>
        )}
      </div>

      {/* DIALOG CRIAR */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo fornecedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nm_fornecedor">Nome do Fornecedor *</Label>
              <Input
                id="nm_fornecedor"
                value={formData.nm_fornecedor}
                onChange={(e) =>
                  setFormData({ ...formData, nm_fornecedor: e.target.value })
                }
                placeholder="Ex: Beauty Supply Ltda"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nr_cnpj">CNPJ</Label>
                <Input
                  id="nr_cnpj"
                  value={formData.nr_cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, nr_cnpj: e.target.value })
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="nm_email">E-mail</Label>
                <Input
                  id="nm_email"
                  type="email"
                  value={formData.nm_email}
                  onChange={(e) =>
                    setFormData({ ...formData, nm_email: e.target.value })
                  }
                  placeholder="contato@fornecedor.com.br"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ds_telefone">Telefone</Label>
              <Input
                id="ds_telefone"
                value={formData.ds_telefone}
                onChange={(e) =>
                  setFormData({ ...formData, ds_telefone: e.target.value })
                }
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="ds_fornecedor">Descrição</Label>
              <Textarea
                id="ds_fornecedor"
                value={formData.ds_fornecedor}
                onChange={(e) =>
                  setFormData({ ...formData, ds_fornecedor: e.target.value })
                }
                placeholder="Breve descrição sobre o fornecedor"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="ds_endereco">Endereço</Label>
              <Input
                id="ds_endereco"
                value={formData.ds_endereco}
                onChange={(e) =>
                  setFormData({ ...formData, ds_endereco: e.target.value })
                }
                placeholder="Rua, Número, Complemento"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ds_cidade">Cidade</Label>
                <Input
                  id="ds_cidade"
                  value={formData.ds_cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, ds_cidade: e.target.value })
                  }
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="ds_estado">Estado</Label>
                <Input
                  id="ds_estado"
                  value={formData.ds_estado}
                  onChange={(e) =>
                    setFormData({ ...formData, ds_estado: e.target.value })
                  }
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="nr_cep">CEP</Label>
                <Input
                  id="nr_cep"
                  value={formData.nr_cep}
                  onChange={(e) =>
                    setFormData({ ...formData, nr_cep: e.target.value })
                  }
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={isSubmitting || !formData.nm_fornecedor}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Criando..." : "Criar Fornecedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDITAR */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>Atualize os dados do fornecedor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_nm_fornecedor">Nome do Fornecedor *</Label>
              <Input
                id="edit_nm_fornecedor"
                value={formData.nm_fornecedor}
                onChange={(e) =>
                  setFormData({ ...formData, nm_fornecedor: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_nr_cnpj">CNPJ</Label>
                <Input
                  id="edit_nr_cnpj"
                  value={formData.nr_cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, nr_cnpj: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_nm_email">E-mail</Label>
                <Input
                  id="edit_nm_email"
                  type="email"
                  value={formData.nm_email}
                  onChange={(e) =>
                    setFormData({ ...formData, nm_email: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_ds_telefone">Telefone</Label>
              <Input
                id="edit_ds_telefone"
                value={formData.ds_telefone}
                onChange={(e) =>
                  setFormData({ ...formData, ds_telefone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_ds_fornecedor">Descrição</Label>
              <Textarea
                id="edit_ds_fornecedor"
                value={formData.ds_fornecedor}
                onChange={(e) =>
                  setFormData({ ...formData, ds_fornecedor: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit_ds_endereco">Endereço</Label>
              <Input
                id="edit_ds_endereco"
                value={formData.ds_endereco}
                onChange={(e) =>
                  setFormData({ ...formData, ds_endereco: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_ds_cidade">Cidade</Label>
                <Input
                  id="edit_ds_cidade"
                  value={formData.ds_cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, ds_cidade: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_ds_estado">Estado</Label>
                <Input
                  id="edit_ds_estado"
                  value={formData.ds_estado}
                  onChange={(e) =>
                    setFormData({ ...formData, ds_estado: e.target.value })
                  }
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="edit_nr_cep">CEP</Label>
                <Input
                  id="edit_nr_cep"
                  value={formData.nr_cep}
                  onChange={(e) =>
                    setFormData({ ...formData, nr_cep: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_fl_ativo"
                checked={formData.fl_ativo}
                onChange={(e) =>
                  setFormData({ ...formData, fl_ativo: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="edit_fl_ativo">Fornecedor Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={isSubmitting || !formData.nm_fornecedor}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DELETAR */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor{" "}
              <strong>{selectedFornecedor?.nm_fornecedor}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
}
