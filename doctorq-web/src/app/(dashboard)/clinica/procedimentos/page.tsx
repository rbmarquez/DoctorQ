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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  LayoutGrid,
} from "lucide-react";

interface Procedimento {
  id_procedimento: string;
  id_clinica?: string;
  nm_procedimento: string;
  ds_procedimento?: string;
  ds_categoria?: string;
  vl_preco?: number;
  nr_duracao_minutos: number;
  st_ativo?: boolean;
  dt_criacao?: string;
  dt_atualizacao?: string;
}

const CATEGORIAS = [
  "Facial",
  "Corporal",
  "Capilar",
  "Estética Avançada",
  "Procedimentos Injetáveis",
  "Depilação",
  "Massoterapia",
  "Outros",
];

// Dados de fallback para testes
const PROCEDIMENTOS_FALLBACK: Procedimento[] = [
  {
    id_procedimento: "1",
    nm_procedimento: "Limpeza de Pele Profunda",
    ds_procedimento: "Limpeza completa com extração de cravos e hidratação",
    ds_categoria: "Facial",
    vl_preco: 150.00,
    nr_duracao_minutos: 60,
    st_ativo: true,
  },
  {
    id_procedimento: "2",
    nm_procedimento: "Peeling Químico",
    ds_procedimento: "Renovação celular com ácidos específicos",
    ds_categoria: "Facial",
    vl_preco: 250.00,
    nr_duracao_minutos: 45,
    st_ativo: true,
  },
  {
    id_procedimento: "3",
    nm_procedimento: "Drenagem Linfática",
    ds_procedimento: "Massagem drenante para redução de inchaço",
    ds_categoria: "Corporal",
    vl_preco: 120.00,
    nr_duracao_minutos: 90,
    st_ativo: true,
  },
  {
    id_procedimento: "4",
    nm_procedimento: "Depilação a Laser - Pernas Completas",
    ds_procedimento: "Remoção de pelos com laser de diodo",
    ds_categoria: "Depilação",
    vl_preco: 350.00,
    nr_duracao_minutos: 120,
    st_ativo: true,
  },
  {
    id_procedimento: "5",
    nm_procedimento: "Botox - Testa",
    ds_procedimento: "Aplicação de toxina botulínica na região frontal",
    ds_categoria: "Procedimentos Injetáveis",
    vl_preco: 800.00,
    nr_duracao_minutos: 30,
    st_ativo: false,
  },
  {
    id_procedimento: "6",
    nm_procedimento: "Hidratação Facial",
    ds_procedimento: "Tratamento intensivo de hidratação",
    ds_categoria: "Facial",
    vl_preco: 180.00,
    nr_duracao_minutos: 50,
    st_ativo: true,
  },
  {
    id_procedimento: "7",
    nm_procedimento: "Massagem Relaxante",
    ds_procedimento: "Massagem corporal para relaxamento muscular",
    ds_categoria: "Massoterapia",
    vl_preco: 140.00,
    nr_duracao_minutos: 60,
    st_ativo: true,
  },
  {
    id_procedimento: "8",
    nm_procedimento: "Tratamento Capilar",
    ds_procedimento: "Reconstrução capilar profunda",
    ds_categoria: "Capilar",
    vl_preco: 200.00,
    nr_duracao_minutos: 90,
    st_ativo: true,
  },
];

export default function ProcedimentosPage() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>(PROCEDIMENTOS_FALLBACK);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProcedimento, setSelectedProcedimento] = useState<Procedimento | null>(null);
  const [formData, setFormData] = useState<Partial<Procedimento>>({
    nm_procedimento: "",
    ds_procedimento: "",
    ds_categoria: "",
    vl_preco: 0,
    nr_duracao_minutos: 30,
    st_ativo: true,
  });

  // Filtrar procedimentos
  const filteredProcedimentos = useMemo(() => {
    return procedimentos.filter((proc) => {
      const matchesSearch =
        proc.nm_procedimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.ds_procedimento?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategoria =
        categoriaFilter === "all" || proc.ds_categoria === categoriaFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && proc.st_ativo) ||
        (statusFilter === "inactive" && !proc.st_ativo);

      return matchesSearch && matchesCategoria && matchesStatus;
    });
  }, [procedimentos, searchTerm, categoriaFilter, statusFilter]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const ativos = procedimentos.filter((p) => p.st_ativo);
    const precoMedio =
      ativos.length > 0
        ? ativos.reduce((acc, p) => acc + (p.vl_preco || 0), 0) / ativos.length
        : 0;
    const duracaoMedia =
      ativos.length > 0
        ? ativos.reduce((acc, p) => acc + p.nr_duracao_minutos, 0) / ativos.length
        : 0;

    return {
      total: procedimentos.length,
      ativos: ativos.length,
      inativos: procedimentos.filter((p) => !p.st_ativo).length,
      categorias: new Set(procedimentos.map((p) => p.ds_categoria).filter(Boolean)).size,
      precoMedio: precoMedio.toFixed(2),
      duracaoMedia: Math.round(duracaoMedia),
    };
  }, [procedimentos]);

  // Handlers
  const handleCreate = () => {
    const newProcedimento: Procedimento = {
      id_procedimento: Date.now().toString(),
      nm_procedimento: formData.nm_procedimento || "",
      ds_procedimento: formData.ds_procedimento,
      ds_categoria: formData.ds_categoria,
      vl_preco: formData.vl_preco,
      nr_duracao_minutos: formData.nr_duracao_minutos || 30,
      st_ativo: formData.st_ativo ?? true,
      dt_criacao: new Date().toISOString(),
    };

    setProcedimentos([...procedimentos, newProcedimento]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedProcedimento) return;

    setProcedimentos(
      procedimentos.map((proc) =>
        proc.id_procedimento === selectedProcedimento.id_procedimento
          ? {
              ...proc,
              ...formData,
              dt_atualizacao: new Date().toISOString(),
            }
          : proc
      )
    );
    setIsEditDialogOpen(false);
    setSelectedProcedimento(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedProcedimento) return;

    setProcedimentos(
      procedimentos.filter(
        (proc) => proc.id_procedimento !== selectedProcedimento.id_procedimento
      )
    );
    setIsDeleteDialogOpen(false);
    setSelectedProcedimento(null);
  };

  const openEditDialog = (procedimento: Procedimento) => {
    setSelectedProcedimento(procedimento);
    setFormData({
      nm_procedimento: procedimento.nm_procedimento,
      ds_procedimento: procedimento.ds_procedimento,
      ds_categoria: procedimento.ds_categoria,
      vl_preco: procedimento.vl_preco,
      nr_duracao_minutos: procedimento.nr_duracao_minutos,
      st_ativo: procedimento.st_ativo,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (procedimento: Procedimento) => {
    setSelectedProcedimento(procedimento);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nm_procedimento: "",
      ds_procedimento: "",
      ds_categoria: "",
      vl_preco: 0,
      nr_duracao_minutos: 30,
      st_ativo: true,
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procedimentos</h1>
          <p className="text-muted-foreground">
            Gerencie os procedimentos oferecidos pela clínica
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Procedimento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Procedimentos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground">Disponíveis para agendamento</p>
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
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <LayoutGrid className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.categorias}</div>
            <p className="text-xs text-muted-foreground">Tipos diferentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">R$ {stats.precoMedio}</div>
            <p className="text-xs text-muted-foreground">Valor médio por sessão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.duracaoMedia} min</div>
            <p className="text-xs text-muted-foreground">Tempo médio de atendimento</p>
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
            Encontre procedimentos por nome ou utilize os filtros por categoria e status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Busca */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar procedimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro Categoria */}
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Apenas Ativos</SelectItem>
                <SelectItem value="inactive">Apenas Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Procedimentos Grid */}
      {filteredProcedimentos.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProcedimentos.map((procedimento) => (
            <Card
              key={procedimento.id_procedimento}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{procedimento.nm_procedimento}</CardTitle>
                    {procedimento.ds_categoria && (
                      <Badge variant="outline" className="mt-2">
                        {procedimento.ds_categoria}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={procedimento.st_ativo ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {procedimento.st_ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {procedimento.ds_procedimento && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {procedimento.ds_procedimento}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {procedimento.vl_preco
                          ? `R$ ${procedimento.vl_preco.toFixed(2)}`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{procedimento.nr_duracao_minutos} min</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(procedimento)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(procedimento)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredProcedimentos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum procedimento encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || categoriaFilter !== "all" || statusFilter !== "all"
                ? "Tente ajustar os filtros ou faça uma nova busca."
                : "Comece adicionando o primeiro procedimento da sua clínica."}
            </p>
            {!searchTerm && categoriaFilter === "all" && statusFilter === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Procedimento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? "Novo Procedimento" : "Editar Procedimento"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do procedimento abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nm_procedimento">Nome *</Label>
              <Input
                id="nm_procedimento"
                value={formData.nm_procedimento}
                onChange={(e) =>
                  setFormData({ ...formData, nm_procedimento: e.target.value })
                }
                placeholder="Ex: Limpeza de Pele Profunda"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ds_procedimento">Descrição</Label>
              <Textarea
                id="ds_procedimento"
                value={formData.ds_procedimento}
                onChange={(e) =>
                  setFormData({ ...formData, ds_procedimento: e.target.value })
                }
                placeholder="Descreva o procedimento..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ds_categoria">Categoria</Label>
                <Select
                  value={formData.ds_categoria}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ds_categoria: value })
                  }
                >
                  <SelectTrigger id="ds_categoria">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="st_ativo">Status</Label>
                <Select
                  value={formData.st_ativo ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, st_ativo: value === "active" })
                  }
                >
                  <SelectTrigger id="st_ativo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vl_preco">Preço (R$)</Label>
                <Input
                  id="vl_preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.vl_preco}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vl_preco: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nr_duracao_minutos">Duração (minutos)</Label>
                <Input
                  id="nr_duracao_minutos"
                  type="number"
                  min="15"
                  step="15"
                  value={formData.nr_duracao_minutos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nr_duracao_minutos: parseInt(e.target.value),
                    })
                  }
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={isCreateDialogOpen ? handleCreate : handleEdit}
              disabled={!formData.nm_procedimento}
            >
              {isCreateDialogOpen ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o procedimento{" "}
              <strong>{selectedProcedimento?.nm_procedimento}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProcedimento(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
