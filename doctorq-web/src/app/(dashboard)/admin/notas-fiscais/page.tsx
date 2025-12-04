"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Filter,
  Eye,
  Download,
  Calendar
} from "lucide-react";
import { useNotasFiscais, useNotasFiscaisEstatisticas } from "@/lib/api/hooks/useNotasFiscais";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NotasFiscaisPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dtInicio, setDtInicio] = useState<string>("");
  const [dtFim, setDtFim] = useState<string>("");

  const { data, error, isLoading, mutate } = useNotasFiscais({
    status_nota: statusFilter === "all" ? undefined : (statusFilter as any),
    dt_inicio: dtInicio || undefined,
    dt_fim: dtFim || undefined,
    page,
    size: 20,
  });

  const { data: stats } = useNotasFiscaisEstatisticas({
    dt_inicio: dtInicio || undefined,
    dt_fim: dtFim || undefined,
  });

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar notas fiscais. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const notas = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / data.size) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "emitida":
        return <Badge variant="default" className="gap-1 bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3" />Emitida</Badge>;
      case "cancelada":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Cancelada</Badge>;
      case "pendente":
        return <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" />Pendente</Badge>;
      case "erro":
        return <Badge variant="destructive" className="gap-1 bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Notas Fiscais Eletrônicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie emissão e controle de NFSe
          </p>
        </div>
        <Link href="/admin/notas-fiscais/emitir">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Emitir Nota Fiscal
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emitidas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.total_emitidas}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.total_emitidas / stats.total_notas) * 100 || 0).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.vl_total_faturado)}</div>
              <p className="text-xs text-muted-foreground">
                ISS: {formatCurrency(stats.vl_total_iss)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.total_pendentes}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando processamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Erro</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.total_erro}</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="emitida">Emitidas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                  <SelectItem value="erro">Com Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={dtInicio}
                onChange={(e) => setDtInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={dtFim}
                onChange={(e) => setDtFim(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setDtInicio("");
                  setDtFim("");
                  setPage(1);
                  mutate();
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma nota fiscal encontrada
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Emita a primeira nota fiscal eletrônica
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notas List */}
      {!isLoading && notas.length > 0 && (
        <div className="space-y-4">
          {notas.map((nota) => (
            <Card key={nota.id_nota_fiscal}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">
                        {nota.nr_nota ? `NF nº ${nota.nr_nota}` : `RPS nº ${nota.nr_rps}`}
                      </h3>
                      {getStatusBadge(nota.st_nota)}
                      {nota.fg_cancelada && (
                        <Badge variant="destructive">Cancelada</Badge>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tomador</p>
                        <p className="font-medium">{nota.ds_tomador_razao_social}</p>
                        <p className="text-xs text-muted-foreground">{nota.ds_tomador_cnpj_cpf}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-medium text-lg">{formatCurrency(nota.vl_servicos)}</p>
                        <p className="text-xs text-muted-foreground">Líquido: {formatCurrency(nota.vl_liquido)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ISS</p>
                        <p className="font-medium">{formatCurrency(nota.vl_iss || 0)}</p>
                        <p className="text-xs text-muted-foreground">{nota.pc_aliquota_iss}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {nota.dt_emissao
                            ? format(new Date(nota.dt_emissao), "dd/MM/yyyy", { locale: ptBR })
                            : format(new Date(nota.dt_criacao), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {/* Discriminação */}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Discriminação:</p>
                      <p className="text-sm">{nota.ds_discriminacao}</p>
                    </div>

                    {/* Status Message */}
                    {nota.ds_status_mensagem && (
                      <Alert variant={nota.st_nota === "erro" ? "destructive" : "default"}>
                        <AlertDescription className="text-sm">
                          {nota.ds_status_mensagem}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Cancelamento Info */}
                    {nota.fg_cancelada && nota.dt_cancelamento && (
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Cancelada em:</strong> {format(new Date(nota.dt_cancelamento), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          {nota.ds_motivo_cancelamento && (
                            <><br /><strong>Motivo:</strong> {nota.ds_motivo_cancelamento}</>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Link href={`/admin/notas-fiscais/${nota.id_nota_fiscal}`}>
                      <Button variant="outline" size="sm" className="gap-2 w-full">
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </Link>

                    {nota.ds_url_pdf && (
                      <a href={nota.ds_url_pdf} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2 w-full">
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
