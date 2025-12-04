"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { useProdutos, useCategoriasProdutos, criarProduto, atualizarProduto, deletarProduto } from "@/lib/api/hooks/useProdutos";
import { ShoppingBag, Package, TrendingUp, Star, Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Produto } from "@/lib/api/hooks/useProdutos";

export default function ProdutosPage() {
  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    nm_produto: "",
    ds_descricao_curta: "",
    ds_descricao: "",
    ds_marca: "",
    vl_preco: 0,
    vl_preco_promocional: 0,
    qt_estoque: 0,
    id_categoria: "",
    st_ativo: true,
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const { produtos, meta, isLoading, error } = useProdutos({
    page,
    size: 12,
    search: search || undefined,
    id_categoria: categoriaFiltro || undefined,
  });

  const { categorias } = useCategoriasProdutos();

  // ============================================================================
  // STATS CALCULADOS
  // ============================================================================
  const stats = [
    {
      label: "Total de Produtos",
      value: meta?.totalItems || 0,
      icon: ShoppingBag,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Categorias",
      value: categorias.length,
      icon: Package,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Produtos Ativos",
      value: produtos.filter((p) => p.st_ativo).length,
      icon: TrendingUp,
      color: "from-purple-500 to-blue-600",
    },
    {
      label: "Média de Avaliações",
      value:
        produtos.length > 0
          ? (
              produtos.reduce((acc, p) => acc + (p.qt_avaliacoes || 0), 0) /
              produtos.length
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
      nm_produto: "",
      ds_descricao_curta: "",
      ds_descricao: "",
      ds_marca: "",
      vl_preco: 0,
      vl_preco_promocional: 0,
      qt_estoque: 0,
      id_categoria: "",
      st_ativo: true,
    });
    setShowCreateDialog(true);
  };

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    setFormData({
      nm_produto: produto.nm_produto,
      ds_descricao_curta: produto.ds_descricao_curta || "",
      ds_descricao: produto.ds_descricao || "",
      ds_marca: produto.ds_marca || "",
      vl_preco: produto.vl_preco,
      vl_preco_promocional: produto.vl_preco_promocional || 0,
      qt_estoque: produto.qt_estoque || 0,
      id_categoria: produto.id_categoria || "",
      st_ativo: produto.st_ativo,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (produto: Produto) => {
    setSelectedProduto(produto);
    setShowDeleteDialog(true);
  };

  const handleSubmitCreate = async () => {
    setIsSubmitting(true);
    try {
      await criarProduto(formData);
      toast.success("Produto criado com sucesso!");
      setShowCreateDialog(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedProduto) return;
    setIsSubmitting(true);
    try {
      await atualizarProduto(selectedProduto.id_produto, formData);
      toast.success("Produto atualizado com sucesso!");
      setShowEditDialog(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduto) return;
    setIsSubmitting(true);
    try {
      await deletarProduto(selectedProduto.id_produto);
      toast.success("Produto excluído com sucesso!");
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao excluir produto");
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
              <ShoppingBag className="h-8 w-8 text-red-500" />
              Produtos
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os produtos da plataforma
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-red-600 hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={categoriaFiltro}
                onValueChange={(value) => {
                  setCategoriaFiltro(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Todas Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Categorias</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nm_categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* LISTA DE PRODUTOS */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando produtos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Erro ao carregar produtos</p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum produto encontrado</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtos.map((prod) => (
                <Card key={prod.id_produto} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          {prod.nm_produto}
                        </h3>
                        {prod.ds_marca && (
                          <p className="text-sm text-gray-600 mb-2">
                            Marca: {prod.ds_marca}
                          </p>
                        )}
                        <Badge
                          className={
                            prod.st_ativo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {prod.st_ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {prod.vl_preco.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        {prod.vl_preco_promocional &&
                          prod.vl_preco_promocional > 0 && (
                            <p className="text-sm text-gray-500 line-through">
                              {prod.vl_preco_promocional.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          )}
                      </div>
                    </div>

                    {prod.ds_descricao_curta && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {prod.ds_descricao_curta}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Estoque</p>
                          <p className="font-bold text-gray-900">
                            {prod.qt_estoque || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-xs text-gray-600">Avaliações</p>
                          <p className="font-bold text-gray-900">
                            {prod.qt_avaliacoes || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(prod)}
                        className="flex-1"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(prod)}
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
            <DialogTitle>Criar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo produto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nm_produto">Nome do Produto *</Label>
              <Input
                id="nm_produto"
                value={formData.nm_produto}
                onChange={(e) =>
                  setFormData({ ...formData, nm_produto: e.target.value })
                }
                placeholder="Ex: Sérum Facial Anti-Idade"
              />
            </div>
            <div>
              <Label htmlFor="ds_marca">Marca</Label>
              <Input
                id="ds_marca"
                value={formData.ds_marca}
                onChange={(e) =>
                  setFormData({ ...formData, ds_marca: e.target.value })
                }
                placeholder="Ex: La Roche-Posay"
              />
            </div>
            <div>
              <Label htmlFor="id_categoria">Categoria</Label>
              <Select
                value={formData.id_categoria}
                onValueChange={(value) =>
                  setFormData({ ...formData, id_categoria: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nm_categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vl_preco">Preço (R$) *</Label>
                <Input
                  id="vl_preco"
                  type="number"
                  step="0.01"
                  value={formData.vl_preco}
                  onChange={(e) =>
                    setFormData({ ...formData, vl_preco: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="vl_preco_promocional">Preço Promocional (R$)</Label>
                <Input
                  id="vl_preco_promocional"
                  type="number"
                  step="0.01"
                  value={formData.vl_preco_promocional}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vl_preco_promocional: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="qt_estoque">Quantidade em Estoque</Label>
              <Input
                id="qt_estoque"
                type="number"
                value={formData.qt_estoque}
                onChange={(e) =>
                  setFormData({ ...formData, qt_estoque: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="ds_descricao_curta">Descrição Curta</Label>
              <Input
                id="ds_descricao_curta"
                value={formData.ds_descricao_curta}
                onChange={(e) =>
                  setFormData({ ...formData, ds_descricao_curta: e.target.value })
                }
                placeholder="Resumo do produto em uma linha"
              />
            </div>
            <div>
              <Label htmlFor="ds_descricao">Descrição Completa</Label>
              <Textarea
                id="ds_descricao"
                value={formData.ds_descricao}
                onChange={(e) =>
                  setFormData({ ...formData, ds_descricao: e.target.value })
                }
                placeholder="Descrição detalhada do produto"
                rows={4}
              />
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
              disabled={isSubmitting || !formData.nm_produto || !formData.vl_preco}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Criando..." : "Criar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDITAR */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize os dados do produto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_nm_produto">Nome do Produto *</Label>
              <Input
                id="edit_nm_produto"
                value={formData.nm_produto}
                onChange={(e) =>
                  setFormData({ ...formData, nm_produto: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_ds_marca">Marca</Label>
              <Input
                id="edit_ds_marca"
                value={formData.ds_marca}
                onChange={(e) =>
                  setFormData({ ...formData, ds_marca: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_id_categoria">Categoria</Label>
              <Select
                value={formData.id_categoria}
                onValueChange={(value) =>
                  setFormData({ ...formData, id_categoria: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nm_categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_vl_preco">Preço (R$) *</Label>
                <Input
                  id="edit_vl_preco"
                  type="number"
                  step="0.01"
                  value={formData.vl_preco}
                  onChange={(e) =>
                    setFormData({ ...formData, vl_preco: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_vl_preco_promocional">Preço Promocional (R$)</Label>
                <Input
                  id="edit_vl_preco_promocional"
                  type="number"
                  step="0.01"
                  value={formData.vl_preco_promocional}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vl_preco_promocional: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_qt_estoque">Quantidade em Estoque</Label>
              <Input
                id="edit_qt_estoque"
                type="number"
                value={formData.qt_estoque}
                onChange={(e) =>
                  setFormData({ ...formData, qt_estoque: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_ds_descricao_curta">Descrição Curta</Label>
              <Input
                id="edit_ds_descricao_curta"
                value={formData.ds_descricao_curta}
                onChange={(e) =>
                  setFormData({ ...formData, ds_descricao_curta: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_ds_descricao">Descrição Completa</Label>
              <Textarea
                id="edit_ds_descricao"
                value={formData.ds_descricao}
                onChange={(e) =>
                  setFormData({ ...formData, ds_descricao: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_st_ativo"
                checked={formData.st_ativo}
                onChange={(e) =>
                  setFormData({ ...formData, st_ativo: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="edit_st_ativo">Produto Ativo</Label>
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
              disabled={isSubmitting || !formData.nm_produto || !formData.vl_preco}
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
              Tem certeza que deseja excluir o produto{" "}
              <strong>{selectedProduto?.nm_produto}</strong>?
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
