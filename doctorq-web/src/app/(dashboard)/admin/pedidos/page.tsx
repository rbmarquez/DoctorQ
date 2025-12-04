"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  usePedidos,
  usePedido,
  useRastreio,
  atualizarStatusPedido,
} from "@/lib/api/hooks/usePedidos";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Truck,
  Edit,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { PedidoListItem } from "@/lib/api/hooks/usePedidos";

export default function PedidosPage() {
  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulário de atualização
  const [updateData, setUpdateData] = useState({
    ds_status: "",
    ds_rastreio: "",
    ds_codigo_rastreio: "",
    ds_numero_nota_fiscal: "",
    ds_observacoes: "",
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const { pedidos, meta, isLoading, error } = usePedidos({
    page,
    size: 12,
    ds_status: statusFiltro || undefined,
  });

  const { pedido: pedidoDetalhes } = usePedido(selectedPedidoId);
  const { rastreio } = useRastreio(selectedPedidoId);

  // ============================================================================
  // STATS CALCULADOS
  // ============================================================================
  const stats = [
    {
      label: "Total de Pedidos",
      value: meta?.totalItems || 0,
      icon: ShoppingCart,
      color: "from-blue-500 to-indigo-600",
      status: "",
    },
    {
      label: "Entregues",
      value: pedidos.filter((p) => p.ds_status === "entregue").length,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-600",
      status: "entregue",
    },
    {
      label: "Em Trânsito",
      value: pedidos.filter((p) => p.ds_status === "em_transito").length,
      icon: Truck,
      color: "from-blue-500 to-cyan-600",
      status: "em_transito",
    },
    {
      label: "Processando",
      value: pedidos.filter((p) => p.ds_status === "processando").length,
      icon: Clock,
      color: "from-yellow-500 to-orange-600",
      status: "processando",
    },
    {
      label: "Cancelados",
      value: pedidos.filter((p) => p.ds_status === "cancelado").length,
      icon: XCircle,
      color: "from-red-500 to-blue-600",
      status: "cancelado",
    },
  ];

  // ============================================================================
  // HELPERS
  // ============================================================================
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "entregue":
        return <Badge className="bg-green-100 text-green-800">Entregue</Badge>;
      case "em_transito":
        return <Badge className="bg-blue-100 text-blue-800">Em Trânsito</Badge>;
      case "processando":
        return <Badge className="bg-yellow-100 text-yellow-800">Processando</Badge>;
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      case "aguardando_pagamento":
        return <Badge className="bg-orange-100 text-orange-800">Aguardando Pagamento</Badge>;
      case "pago":
        return <Badge className="bg-purple-100 text-purple-800">Pago</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "entregue":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "em_transito":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "processando":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "cancelado":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleViewDetails = (pedidoId: string) => {
    setSelectedPedidoId(pedidoId);
    setShowDetailsDialog(true);
  };

  const handleUpdateStatus = (pedido: PedidoListItem) => {
    setSelectedPedidoId(pedido.id_pedido);
    setUpdateData({
      ds_status: pedido.ds_status,
      ds_rastreio: "",
      ds_codigo_rastreio: "",
      ds_numero_nota_fiscal: "",
      ds_observacoes: "",
    });
    setShowUpdateDialog(true);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedPedidoId) return;
    setIsSubmitting(true);
    try {
      // Remover campos vazios
      const payload: any = {};
      if (updateData.ds_status) payload.ds_status = updateData.ds_status;
      if (updateData.ds_rastreio) payload.ds_rastreio = updateData.ds_rastreio;
      if (updateData.ds_codigo_rastreio)
        payload.ds_codigo_rastreio = updateData.ds_codigo_rastreio;
      if (updateData.ds_numero_nota_fiscal)
        payload.ds_numero_nota_fiscal = updateData.ds_numero_nota_fiscal;
      if (updateData.ds_observacoes) payload.ds_observacoes = updateData.ds_observacoes;

      await atualizarStatusPedido(selectedPedidoId, payload);
      toast.success("Pedido atualizado com sucesso!");
      setShowUpdateDialog(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  const renderPedidos = (filtroStatus?: string) => {
    let pedidosFiltrados = pedidos;

    // Filtrar por status
    if (filtroStatus) {
      pedidosFiltrados = pedidosFiltrados.filter((p) => p.ds_status === filtroStatus);
    }

    // Filtrar por busca (número do pedido)
    if (search) {
      pedidosFiltrados = pedidosFiltrados.filter((p) =>
        p.nr_pedido.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (pedidosFiltrados.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum pedido encontrado</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pedidosFiltrados.map((pedido) => (
          <Card key={pedido.id_pedido} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(pedido.ds_status)}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      Pedido #{pedido.nr_pedido}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.dt_pedido).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {pedido.fornecedor_nome && (
                      <p className="text-sm text-gray-600">
                        Fornecedor: {pedido.fornecedor_nome}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(pedido.ds_status)}
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {pedido.vl_total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">{pedido.qt_itens} item(ns)</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(pedido.id_pedido)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Ver Detalhes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(pedido)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Atualizar Status
                </Button>
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
            <ShoppingCart className="h-8 w-8 text-red-500" />
            Pedidos
          </h1>
          <p className="text-gray-600 mt-1">Gerencie todos os pedidos da plataforma</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setStatusFiltro(stat.status)}
              >
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
                  placeholder="Buscar por número do pedido..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABS COM PEDIDOS */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Erro ao carregar pedidos</p>
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
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="processando">Processando</TabsTrigger>
              <TabsTrigger value="em_transito">Em Trânsito</TabsTrigger>
              <TabsTrigger value="entregue">Entregues</TabsTrigger>
              <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
              <TabsTrigger value="aguardando_pagamento">Aguardando Pag.</TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-6">
              {renderPedidos()}
            </TabsContent>
            <TabsContent value="processando" className="mt-6">
              {renderPedidos("processando")}
            </TabsContent>
            <TabsContent value="em_transito" className="mt-6">
              {renderPedidos("em_transito")}
            </TabsContent>
            <TabsContent value="entregue" className="mt-6">
              {renderPedidos("entregue")}
            </TabsContent>
            <TabsContent value="cancelado" className="mt-6">
              {renderPedidos("cancelado")}
            </TabsContent>
            <TabsContent value="aguardando_pagamento" className="mt-6">
              {renderPedidos("aguardando_pagamento")}
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

      {/* DIALOG DETALHES */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              {pedidoDetalhes && `Pedido #${pedidoDetalhes.nr_pedido}`}
            </DialogDescription>
          </DialogHeader>
          {pedidoDetalhes ? (
            <div className="space-y-6">
              {/* Status e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(pedidoDetalhes.ds_status)}</div>
                </div>
                <div>
                  <Label>Data do Pedido</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(pedidoDetalhes.dt_pedido).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Endereço de Entrega */}
              {pedidoDetalhes.ds_endereco_entrega && (
                <div>
                  <Label>Endereço de Entrega</Label>
                  <div className="text-sm text-gray-900 mt-1 space-y-1">
                    <p>{pedidoDetalhes.ds_endereco_entrega.nm_destinatario}</p>
                    <p>
                      {pedidoDetalhes.ds_endereco_entrega.ds_logradouro},{" "}
                      {pedidoDetalhes.ds_endereco_entrega.nr_numero}
                    </p>
                    {pedidoDetalhes.ds_endereco_entrega.ds_complemento && (
                      <p>{pedidoDetalhes.ds_endereco_entrega.ds_complemento}</p>
                    )}
                    <p>
                      {pedidoDetalhes.ds_endereco_entrega.ds_bairro} -{" "}
                      {pedidoDetalhes.ds_endereco_entrega.ds_cidade}/
                      {pedidoDetalhes.ds_endereco_entrega.ds_estado}
                    </p>
                    <p>CEP: {pedidoDetalhes.ds_endereco_entrega.nr_cep}</p>
                  </div>
                </div>
              )}

              {/* Itens do Pedido */}
              {pedidoDetalhes.itens && pedidoDetalhes.itens.length > 0 && (
                <div>
                  <Label>Itens do Pedido</Label>
                  <div className="border rounded-lg mt-2 divide-y">
                    {pedidoDetalhes.itens.map((item, idx) => (
                      <div key={idx} className="p-4 flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{item.nm_item}</p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {item.qt_quantidade} x{" "}
                            {item.vl_unitario.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </p>
                        </div>
                        <p className="font-bold text-gray-900">
                          {item.vl_subtotal.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo Financeiro */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      {pedidoDetalhes.vl_subtotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  {pedidoDetalhes.vl_desconto > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Desconto</span>
                      <span className="text-green-600">
                        -
                        {pedidoDetalhes.vl_desconto.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  )}
                  {pedidoDetalhes.vl_frete > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className="text-gray-900">
                        {pedidoDetalhes.vl_frete.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-green-600">
                      {pedidoDetalhes.vl_total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rastreamento */}
              {rastreio && rastreio.eventos && rastreio.eventos.length > 0 && (
                <div>
                  <Label>Rastreamento</Label>
                  {rastreio.ds_codigo_rastreio && (
                    <p className="text-sm text-gray-600 mt-1">
                      Código: {rastreio.ds_codigo_rastreio}
                    </p>
                  )}
                  <div className="border rounded-lg mt-2 divide-y max-h-60 overflow-y-auto">
                    {rastreio.eventos.map((evento, idx) => (
                      <div key={idx} className="p-3">
                        <p className="font-medium text-sm text-gray-900">
                          {evento.ds_descricao}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(evento.dt_evento).toLocaleDateString("pt-BR")} -{" "}
                          {evento.ds_local}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Carregando detalhes...</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG ATUALIZAR STATUS */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atualizar Status do Pedido</DialogTitle>
            <DialogDescription>
              Atualize as informações do pedido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ds_status">Status *</Label>
              <Select
                value={updateData.ds_status}
                onValueChange={(value) => setUpdateData({ ...updateData, ds_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="em_transito">Em Trânsito</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ds_rastreio">Transportadora</Label>
              <Input
                id="ds_rastreio"
                value={updateData.ds_rastreio}
                onChange={(e) =>
                  setUpdateData({ ...updateData, ds_rastreio: e.target.value })
                }
                placeholder="Ex: Correios, Jadlog, Total Express..."
              />
            </div>
            <div>
              <Label htmlFor="ds_codigo_rastreio">Código de Rastreio</Label>
              <Input
                id="ds_codigo_rastreio"
                value={updateData.ds_codigo_rastreio}
                onChange={(e) =>
                  setUpdateData({ ...updateData, ds_codigo_rastreio: e.target.value })
                }
                placeholder="Ex: BR123456789BR"
              />
            </div>
            <div>
              <Label htmlFor="ds_numero_nota_fiscal">Número da Nota Fiscal</Label>
              <Input
                id="ds_numero_nota_fiscal"
                value={updateData.ds_numero_nota_fiscal}
                onChange={(e) =>
                  setUpdateData({ ...updateData, ds_numero_nota_fiscal: e.target.value })
                }
                placeholder="Ex: 12345"
              />
            </div>
            <div>
              <Label htmlFor="ds_observacoes">Observações</Label>
              <Textarea
                id="ds_observacoes"
                value={updateData.ds_observacoes}
                onChange={(e) =>
                  setUpdateData({ ...updateData, ds_observacoes: e.target.value })
                }
                placeholder="Informações adicionais sobre a atualização..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitUpdate}
              disabled={isSubmitting || !updateData.ds_status}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Atualizando..." : "Atualizar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
