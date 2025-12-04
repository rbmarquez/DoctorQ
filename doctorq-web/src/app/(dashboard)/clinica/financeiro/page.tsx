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
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Transacao {
  id_transacao: string;
  ds_tipo: "receita" | "despesa";
  nm_descricao: string;
  vl_valor: number;
  dt_transacao: string;
  ds_categoria: string;
  ds_status: "pago" | "pendente" | "atrasado" | "cancelado";
  ds_forma_pagamento?: string;
  ds_observacoes?: string;
}

const CATEGORIAS_RECEITA = [
  "Procedimentos",
  "Produtos",
  "Consultas",
  "Pacotes",
  "Outros",
];

const CATEGORIAS_DESPESA = [
  "Salários",
  "Aluguel",
  "Fornecedores",
  "Equipamentos",
  "Marketing",
  "Manutenção",
  "Impostos",
  "Outros",
];

const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "PIX",
  "Transferência",
  "Boleto",
];

// Dados de fallback para testes
const TRANSACOES_FALLBACK: Transacao[] = [
  {
    id_transacao: "1",
    ds_tipo: "receita",
    nm_descricao: "Limpeza de Pele - Maria Silva",
    vl_valor: 150.00,
    dt_transacao: "2025-01-08",
    ds_categoria: "Procedimentos",
    ds_status: "pago",
    ds_forma_pagamento: "PIX",
  },
  {
    id_transacao: "2",
    ds_tipo: "receita",
    nm_descricao: "Peeling Químico - João Santos",
    vl_valor: 250.00,
    dt_transacao: "2025-01-08",
    ds_categoria: "Procedimentos",
    ds_status: "pago",
    ds_forma_pagamento: "Cartão de Crédito",
  },
  {
    id_transacao: "3",
    ds_tipo: "despesa",
    nm_descricao: "Aluguel Janeiro 2025",
    vl_valor: 3500.00,
    dt_transacao: "2025-01-05",
    ds_categoria: "Aluguel",
    ds_status: "pago",
    ds_forma_pagamento: "Transferência",
  },
  {
    id_transacao: "4",
    ds_tipo: "receita",
    nm_descricao: "Depilação a Laser - Ana Costa",
    vl_valor: 350.00,
    dt_transacao: "2025-01-07",
    ds_categoria: "Procedimentos",
    ds_status: "pendente",
    ds_forma_pagamento: "Boleto",
  },
  {
    id_transacao: "5",
    ds_tipo: "despesa",
    nm_descricao: "Compra de Produtos - Fornecedor ABC",
    vl_valor: 1200.00,
    dt_transacao: "2025-01-06",
    ds_categoria: "Fornecedores",
    ds_status: "pago",
    ds_forma_pagamento: "PIX",
  },
  {
    id_transacao: "6",
    ds_tipo: "receita",
    nm_descricao: "Botox - Carla Mendes",
    vl_valor: 800.00,
    dt_transacao: "2025-01-04",
    ds_categoria: "Procedimentos",
    ds_status: "pago",
    ds_forma_pagamento: "Cartão de Crédito",
  },
  {
    id_transacao: "7",
    ds_tipo: "despesa",
    nm_descricao: "Manutenção Equipamentos",
    vl_valor: 450.00,
    dt_transacao: "2025-01-03",
    ds_categoria: "Manutenção",
    ds_status: "pago",
    ds_forma_pagamento: "PIX",
  },
  {
    id_transacao: "8",
    ds_tipo: "receita",
    nm_descricao: "Pacote 10 Sessões - Pedro Lima",
    vl_valor: 1500.00,
    dt_transacao: "2025-01-02",
    ds_categoria: "Pacotes",
    ds_status: "pago",
    ds_forma_pagamento: "Cartão de Crédito",
  },
];

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>(TRANSACOES_FALLBACK);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null);
  const [formData, setFormData] = useState<Partial<Transacao>>({
    ds_tipo: "receita",
    nm_descricao: "",
    vl_valor: 0,
    dt_transacao: new Date().toISOString().split("T")[0],
    ds_categoria: "",
    ds_status: "pendente",
    ds_forma_pagamento: "",
    ds_observacoes: "",
  });

  // Filtrar transações
  const filteredTransacoes = useMemo(() => {
    return transacoes.filter((trans) => {
      const matchesSearch =
        trans.nm_descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trans.ds_categoria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = tipoFilter === "all" || trans.ds_tipo === tipoFilter;
      const matchesStatus = statusFilter === "all" || trans.ds_status === statusFilter;
      const matchesCategoria =
        categoriaFilter === "all" || trans.ds_categoria === categoriaFilter;

      return matchesSearch && matchesTipo && matchesStatus && matchesCategoria;
    });
  }, [transacoes, searchTerm, tipoFilter, statusFilter, categoriaFilter]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const receitas = transacoes.filter((t) => t.ds_tipo === "receita" && t.ds_status === "pago");
    const despesas = transacoes.filter((t) => t.ds_tipo === "despesa" && t.ds_status === "pago");
    const receitaTotal = receitas.reduce((acc, t) => acc + t.vl_valor, 0);
    const despesaTotal = despesas.reduce((acc, t) => acc + t.vl_valor, 0);
    const aReceber = transacoes
      .filter((t) => t.ds_tipo === "receita" && t.ds_status === "pendente")
      .reduce((acc, t) => acc + t.vl_valor, 0);
    const aPagar = transacoes
      .filter((t) => t.ds_tipo === "despesa" && t.ds_status === "pendente")
      .reduce((acc, t) => acc + t.vl_valor, 0);
    const atrasados = transacoes.filter((t) => t.ds_status === "atrasado").length;

    return {
      receitaTotal,
      despesaTotal,
      saldo: receitaTotal - despesaTotal,
      aReceber,
      aPagar,
      atrasados,
    };
  }, [transacoes]);

  // Handlers
  const handleCreate = () => {
    const newTransacao: Transacao = {
      id_transacao: Date.now().toString(),
      ds_tipo: formData.ds_tipo || "receita",
      nm_descricao: formData.nm_descricao || "",
      vl_valor: formData.vl_valor || 0,
      dt_transacao: formData.dt_transacao || new Date().toISOString().split("T")[0],
      ds_categoria: formData.ds_categoria || "",
      ds_status: formData.ds_status || "pendente",
      ds_forma_pagamento: formData.ds_forma_pagamento,
      ds_observacoes: formData.ds_observacoes,
    };

    setTransacoes([newTransacao, ...transacoes]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedTransacao) return;

    setTransacoes(
      transacoes.map((trans) =>
        trans.id_transacao === selectedTransacao.id_transacao
          ? { ...trans, ...formData }
          : trans
      )
    );
    setIsEditDialogOpen(false);
    setSelectedTransacao(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedTransacao) return;

    setTransacoes(
      transacoes.filter((trans) => trans.id_transacao !== selectedTransacao.id_transacao)
    );
    setIsDeleteDialogOpen(false);
    setSelectedTransacao(null);
  };

  const openEditDialog = (transacao: Transacao) => {
    setSelectedTransacao(transacao);
    setFormData(transacao);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (transacao: Transacao) => {
    setSelectedTransacao(transacao);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      ds_tipo: "receita",
      nm_descricao: "",
      vl_valor: 0,
      dt_transacao: new Date().toISOString().split("T")[0],
      ds_categoria: "",
      ds_status: "pendente",
      ds_forma_pagamento: "",
      ds_observacoes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pago: { variant: "default", label: "Pago" },
      pendente: { variant: "outline", label: "Pendente" },
      atrasado: { variant: "destructive", label: "Atrasado" },
      cancelado: { variant: "secondary", label: "Cancelado" },
    };
    const config = variants[status] || variants.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie as finanças da clínica com controle completo
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.receitaTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total de entradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.despesaTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total de saídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.saldo >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              R$ {stats.saldo.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {stats.aReceber.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Receitas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {stats.aPagar.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Despesas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.atrasados}</div>
            <p className="text-xs text-muted-foreground">Pagamentos em atraso</p>
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
            Encontre transações por descrição ou utilize os filtros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {[...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transações Grid */}
      {filteredTransacoes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTransacoes.map((transacao) => (
            <Card
              key={transacao.id_transacao}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {transacao.ds_tipo === "receita" ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                      {transacao.nm_descricao}
                    </CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {transacao.ds_categoria}
                    </Badge>
                  </div>
                  {getStatusBadge(transacao.ds_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={`text-2xl font-bold ${
                          transacao.ds_tipo === "receita"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        R$ {transacao.vl_valor.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(transacao.dt_transacao).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {transacao.ds_forma_pagamento && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CreditCard className="h-3 w-3" />
                        <span>{transacao.ds_forma_pagamento}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(transacao)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(transacao)}
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
      {filteredTransacoes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || tipoFilter !== "all" || statusFilter !== "all"
                ? "Tente ajustar os filtros ou faça uma nova busca."
                : "Comece registrando a primeira transação financeira."}
            </p>
            {!searchTerm && tipoFilter === "all" && statusFilter === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeira Transação
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
              {isCreateDialogOpen ? "Nova Transação" : "Editar Transação"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da transação financeira
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ds_tipo">Tipo *</Label>
                <Select
                  value={formData.ds_tipo}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, ds_tipo: value, ds_categoria: "" })
                  }
                >
                  <SelectTrigger id="ds_tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ds_status">Status *</Label>
                <Select
                  value={formData.ds_status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, ds_status: value })
                  }
                >
                  <SelectTrigger id="ds_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nm_descricao">Descrição *</Label>
              <Input
                id="nm_descricao"
                value={formData.nm_descricao}
                onChange={(e) =>
                  setFormData({ ...formData, nm_descricao: e.target.value })
                }
                placeholder="Ex: Pagamento de procedimento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vl_valor">Valor (R$) *</Label>
                <Input
                  id="vl_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.vl_valor}
                  onChange={(e) =>
                    setFormData({ ...formData, vl_valor: parseFloat(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dt_transacao">Data *</Label>
                <Input
                  id="dt_transacao"
                  type="date"
                  value={formData.dt_transacao}
                  onChange={(e) =>
                    setFormData({ ...formData, dt_transacao: e.target.value })
                  }
                />
              </div>
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
                    {(formData.ds_tipo === "receita"
                      ? CATEGORIAS_RECEITA
                      : CATEGORIAS_DESPESA
                    ).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ds_forma_pagamento">Forma de Pagamento</Label>
                <Select
                  value={formData.ds_forma_pagamento}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ds_forma_pagamento: value })
                  }
                >
                  <SelectTrigger id="ds_forma_pagamento">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((forma) => (
                      <SelectItem key={forma} value={forma}>
                        {forma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ds_observacoes">Observações</Label>
              <Textarea
                id="ds_observacoes"
                value={formData.ds_observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, ds_observacoes: e.target.value })
                }
                placeholder="Informações adicionais..."
                rows={3}
              />
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
              disabled={!formData.nm_descricao || !formData.vl_valor}
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
              Tem certeza que deseja excluir a transação{" "}
              <strong>{selectedTransacao?.nm_descricao}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransacao(null)}>
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
