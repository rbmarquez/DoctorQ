"use client";

import { useState } from "react";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Plus,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  Wallet,
  Building,
  Smartphone,
  QrCode,
  AlertCircle,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Pagamento {
  id_pagamento: string;
  nr_referencia: string;
  dt_pagamento: string;
  ds_descricao: string;
  vl_pago: number;
  ds_metodo: "cartao_credito" | "cartao_debito" | "pix" | "boleto" | "dinheiro";
  ds_status: "aprovado" | "pendente" | "recusado" | "estornado";
  nr_parcelas?: number;
  vl_parcela?: number;
  id_nota_fiscal?: string;
}

interface MetodoPagamento {
  id_metodo: string;
  ds_tipo: "cartao_credito" | "cartao_debito" | "pix" | "boleto";
  nm_titular?: string;
  nr_final?: string;
  ds_bandeira?: string;
  dt_validade?: string;
  st_principal: boolean;
  ds_chave_pix?: string;
}

export default function PagamentosPage() {
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dialogAddMetodo, setDialogAddMetodo] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<Pagamento | null>(null);
  const [tipoMetodoNovo, setTipoMetodoNovo] = useState<"cartao" | "pix">("cartao");

  // Mock data - histórico de pagamentos
  const pagamentos: Pagamento[] = [
    {
      id_pagamento: "1",
      nr_referencia: "PAG-2025-001234",
      dt_pagamento: "2025-10-20T14:30:00",
      ds_descricao: "Limpeza de Pele Profunda",
      vl_pago: 180.0,
      ds_metodo: "cartao_credito",
      ds_status: "aprovado",
      nr_parcelas: 1,
      id_nota_fiscal: "NF-2025-001234",
    },
    {
      id_pagamento: "2",
      nr_referencia: "PAG-2025-001256",
      dt_pagamento: "2025-10-20T14:35:00",
      ds_descricao: "Preenchimento Labial",
      vl_pago: 1200.0,
      ds_metodo: "pix",
      ds_status: "aprovado",
      id_nota_fiscal: "NF-2025-001256",
    },
    {
      id_pagamento: "3",
      nr_referencia: "PAG-2025-001278",
      dt_pagamento: "2025-10-22T10:15:00",
      ds_descricao: "Peeling Químico - Parcela 1/3",
      vl_pago: 150.0,
      ds_metodo: "cartao_credito",
      ds_status: "aprovado",
      nr_parcelas: 3,
      vl_parcela: 150.0,
    },
    {
      id_pagamento: "4",
      nr_referencia: "PAG-2025-001290",
      dt_pagamento: "2025-10-23T16:00:00",
      ds_descricao: "Massagem Relaxante",
      vl_pago: 200.0,
      ds_metodo: "boleto",
      ds_status: "pendente",
    },
    {
      id_pagamento: "5",
      nr_referencia: "PAG-2025-001102",
      dt_pagamento: "2025-10-15T11:30:00",
      ds_descricao: "Drenagem Linfática",
      vl_pago: 150.0,
      ds_metodo: "cartao_credito",
      ds_status: "recusado",
    },
  ];

  // Mock data - métodos de pagamento
  const metodosPagamento: MetodoPagamento[] = [
    {
      id_metodo: "1",
      ds_tipo: "cartao_credito",
      nm_titular: "Maria Silva Santos",
      nr_final: "4532",
      ds_bandeira: "Visa",
      dt_validade: "12/2027",
      st_principal: true,
    },
    {
      id_metodo: "2",
      ds_tipo: "cartao_credito",
      nm_titular: "Maria Silva Santos",
      nr_final: "8765",
      ds_bandeira: "Mastercard",
      dt_validade: "08/2026",
      st_principal: false,
    },
    {
      id_metodo: "3",
      ds_tipo: "pix",
      ds_chave_pix: "maria.silva@email.com",
      st_principal: false,
    },
  ];

  const statusConfig = {
    aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: CheckCircle },
    pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    recusado: { label: "Recusado", color: "bg-red-100 text-red-800", icon: XCircle },
    estornado: { label: "Estornado", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
  };

  const metodoConfig = {
    cartao_credito: { label: "Cartão de Crédito", icon: CreditCard },
    cartao_debito: { label: "Cartão de Débito", icon: CreditCard },
    pix: { label: "PIX", icon: QrCode },
    boleto: { label: "Boleto", icon: Receipt },
    dinheiro: { label: "Dinheiro", icon: DollarSign },
  };

  const pagamentosFiltrados = pagamentos.filter(
    (pag) => filtroStatus === "todos" || pag.ds_status === filtroStatus
  );

  const totalPago = pagamentos
    .filter((p) => p.ds_status === "aprovado")
    .reduce((acc, p) => acc + p.vl_pago, 0);

  const handleVisualizarDetalhes = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setDialogDetalhes(true);
  };

  const handleBaixarNF = (idNf: string) => {
    toast.success(`Nota fiscal ${idNf} será baixada`);
  };

  const handleAddMetodo = () => {
    toast.success("Método de pagamento adicionado com sucesso!");
    setDialogAddMetodo(false);
  };

  const handleRemoverMetodo = (id: string) => {
    if (confirm("Tem certeza que deseja remover este método de pagamento?")) {
      toast.success("Método removido com sucesso!");
    }
  };

  const handleDefinirPrincipal = (id: string) => {
    toast.success("Método de pagamento definido como principal!");
  };

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Pagamentos
            </h1>
            <p className="text-gray-600 mt-1">Gerencie seus métodos de pagamento e histórico</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pago</p>
                  <p className="text-3xl font-bold text-green-700">
                    {totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pagamentos Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-700">
                    {pagamentos.filter((p) => p.ds_status === "pendente").length}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-blue-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Métodos Salvos</p>
                  <p className="text-3xl font-bold text-purple-700">{metodosPagamento.length}</p>
                </div>
                <Wallet className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="historico" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="historico">Histórico de Pagamentos</TabsTrigger>
            <TabsTrigger value="metodos">Métodos de Pagamento</TabsTrigger>
          </TabsList>

          {/* Histórico de Pagamentos */}
          <TabsContent value="historico" className="space-y-4 mt-6">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <Button
                    variant={filtroStatus === "todos" ? "default" : "outline"}
                    onClick={() => setFiltroStatus("todos")}
                    size="sm"
                    className={
                      filtroStatus === "todos" ? "bg-gradient-to-r from-blue-500 to-cyan-600" : ""
                    }
                  >
                    Todos
                  </Button>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <Button
                      key={status}
                      variant={filtroStatus === status ? "default" : "outline"}
                      onClick={() => setFiltroStatus(status)}
                      size="sm"
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Pagamentos */}
            <div className="space-y-3">
              {pagamentosFiltrados.map((pagamento) => {
                const config = statusConfig[pagamento.ds_status];
                const metodo = metodoConfig[pagamento.ds_metodo];
                const StatusIcon = config.icon;
                const MetodoIcon = metodo.icon;

                return (
                  <Card key={pagamento.id_pagamento} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                            <MetodoIcon className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h3 className="font-semibold text-gray-900">{pagamento.ds_descricao}</h3>
                                <p className="text-sm text-gray-600">{pagamento.nr_referencia}</p>
                              </div>
                              <Badge className={config.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(pagamento.dt_pagamento).toLocaleDateString("pt-BR")}
                              </span>
                              <span className="flex items-center gap-1">
                                <MetodoIcon className="h-4 w-4" />
                                {metodo.label}
                              </span>
                              {pagamento.nr_parcelas && pagamento.nr_parcelas > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {pagamento.nr_parcelas}x de{" "}
                                  {pagamento.vl_parcela?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-gray-900">
                            {pagamento.vl_pago.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVisualizarDetalhes(pagamento)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            {pagamento.id_nota_fiscal && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBaixarNF(pagamento.id_nota_fiscal!)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {pagamentosFiltrados.length === 0 && (
                <Card className="border-2 border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum pagamento encontrado
                    </h3>
                    <p className="text-gray-600">Não há pagamentos com os filtros selecionados.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Métodos de Pagamento */}
          <TabsContent value="metodos" className="mt-6">
            <div className="p-6 space-y-6">
              {/* Cartões */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cartões de Crédito/Débito</CardTitle>
                      <CardDescription>Gerencie seus cartões salvos</CardDescription>
                    </div>
                    <Dialog open={dialogAddMetodo} onOpenChange={setDialogAddMetodo}>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-gradient-to-r from-blue-500 to-cyan-600"
                          onClick={() => setTipoMetodoNovo("cartao")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Cartão
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Cartão</DialogTitle>
                          <DialogDescription>
                            Adicione um novo cartão de crédito ou débito
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="numero-cartao">Número do Cartão</Label>
                            <Input id="numero-cartao" placeholder="0000 0000 0000 0000" />
                          </div>
                          <div>
                            <Label htmlFor="nome-titular">Nome do Titular</Label>
                            <Input id="nome-titular" placeholder="Como está impresso no cartão" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="validade">Validade</Label>
                              <Input id="validade" placeholder="MM/AA" />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input id="cvv" placeholder="123" type="password" maxLength={3} />
                            </div>
                          </div>
                          <Button
                            onClick={handleAddMetodo}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-600"
                          >
                            Adicionar Cartão
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metodosPagamento
                    .filter((m) => m.ds_tipo === "cartao_credito" || m.ds_tipo === "cartao_debito")
                    .map((metodo) => (
                      <div
                        key={metodo.id_metodo}
                        className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-gray-50 to-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{metodo.ds_bandeira}</p>
                                {metodo.st_principal && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">•••• {metodo.nr_final}</p>
                              <p className="text-xs text-gray-500">
                                {metodo.nm_titular} • Validade: {metodo.dt_validade}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!metodo.st_principal && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDefinirPrincipal(metodo.id_metodo)}
                              >
                                Definir como Principal
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoverMetodo(metodo.id_metodo)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* PIX */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>PIX</CardTitle>
                      <CardDescription>Suas chaves PIX cadastradas</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => setTipoMetodoNovo("pix")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Chave PIX
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Chave PIX</DialogTitle>
                          <DialogDescription>Cadastre uma nova chave PIX</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="tipo-chave">Tipo de Chave</Label>
                            <select id="tipo-chave" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                              <option>CPF</option>
                              <option>E-mail</option>
                              <option>Telefone</option>
                              <option>Chave Aleatória</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="chave-pix">Chave PIX</Label>
                            <Input id="chave-pix" placeholder="Digite sua chave PIX" />
                          </div>
                          <Button
                            onClick={handleAddMetodo}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-600"
                          >
                            Adicionar Chave
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metodosPagamento
                    .filter((m) => m.ds_tipo === "pix")
                    .map((metodo) => (
                      <div
                        key={metodo.id_metodo}
                        className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-green-50 to-emerald-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <QrCode className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">PIX</p>
                              <p className="text-sm text-gray-700">{metodo.ds_chave_pix}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoverMetodo(metodo.id_metodo)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Outras Opções */}
              <Card>
                <CardHeader>
                  <CardTitle>Outros Métodos de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl text-center hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Receipt className="h-8 w-8 text-orange-600" />
                    </div>
                    <h4 className="font-semibold mb-1">Boleto Bancário</h4>
                    <p className="text-sm text-gray-600">Vencimento em até 3 dias úteis</p>
                  </div>
                  <div className="p-4 border rounded-xl text-center hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building className="h-8 w-8 text-gray-600" />
                    </div>
                    <h4 className="font-semibold mb-1">Crédito na Clínica</h4>
                    <p className="text-sm text-gray-600">Use créditos acumulados</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes do Pagamento */}
        <Dialog open={dialogDetalhes} onOpenChange={setDialogDetalhes}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Pagamento</DialogTitle>
            </DialogHeader>
            {pagamentoSelecionado && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Referência</p>
                    <p className="font-semibold">{pagamentoSelecionado.nr_referencia}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={statusConfig[pagamentoSelecionado.ds_status].color}>
                      {statusConfig[pagamentoSelecionado.ds_status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data</p>
                    <p className="font-semibold">
                      {new Date(pagamentoSelecionado.dt_pagamento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Método</p>
                    <p className="font-semibold">{metodoConfig[pagamentoSelecionado.ds_metodo].label}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Descrição</p>
                    <p className="font-semibold">{pagamentoSelecionado.ds_descricao}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Valor Pago</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {pagamentoSelecionado.vl_pago.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  {pagamentoSelecionado.id_nota_fiscal && (
                    <div className="col-span-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleBaixarNF(pagamentoSelecionado.id_nota_fiscal!)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Nota Fiscal
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
