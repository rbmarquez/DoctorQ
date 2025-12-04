"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Calendar,
  User,
  Eye
} from "lucide-react";
import { useAnamneses } from "@/lib/api/hooks/useAnamneses";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfissionalAnamnesesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [apenasComAlertas, setApenasComAlertas] = useState(false);

  const { data, error, isLoading, mutate } = useAnamneses({
    apenas_com_alertas: apenasComAlertas,
    page,
    size: 20,
  });

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar anamneses. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const anamneses = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / data.size) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Anamneses
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie questionários pré-atendimento de pacientes
          </p>
        </div>
        <Link href="/profissional/anamneses/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Anamnese
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Anamneses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registros no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {anamneses.filter(a => a.fg_alertas_criticos).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção especial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes Assinatura</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {anamneses.filter(a => !a.dt_assinatura_profissional).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando revisão profissional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Paciente</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do paciente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={apenasComAlertas ? "alertas" : "todos"}
                onValueChange={(value) => setApenasComAlertas(value === "alertas")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="alertas">Apenas com Alertas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setApenasComAlertas(false);
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

      {/* Anamneses List */}
      {!isLoading && anamneses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma anamnese encontrada
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Crie a primeira anamnese para um paciente
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && anamneses.length > 0 && (
        <div className="space-y-4">
          {anamneses.map((anamnese) => (
            <Card
              key={anamnese.id_anamnese}
              className={anamnese.fg_alertas_criticos ? "border-2 border-destructive" : ""}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">
                        Paciente: {anamnese.id_paciente}
                      </h3>
                      {anamnese.fg_alertas_criticos && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Alerta Crítico
                        </Badge>
                      )}
                      {anamnese.dt_assinatura_paciente && !anamnese.dt_assinatura_profissional && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Aguardando Revisão
                        </Badge>
                      )}
                      {anamnese.dt_assinatura_profissional && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Concluída
                        </Badge>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Data</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(anamnese.dt_criacao), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assinatura Paciente</p>
                        <p className="font-medium">
                          {anamnese.dt_assinatura_paciente
                            ? format(new Date(anamnese.dt_assinatura_paciente), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "Pendente"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assinatura Profissional</p>
                        <p className="font-medium">
                          {anamnese.dt_assinatura_profissional
                            ? format(new Date(anamnese.dt_assinatura_profissional), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "Pendente"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Respostas</p>
                        <p className="font-medium">{anamnese.ds_respostas?.length || 0} perguntas</p>
                      </div>
                    </div>

                    {/* Alertas */}
                    {anamnese.fg_alertas_criticos && anamnese.ds_alertas && anamnese.ds_alertas.length > 0 && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Alertas Identificados:</strong>
                          <ul className="list-disc list-inside mt-2">
                            {anamnese.ds_alertas.map((alerta: any, idx: number) => (
                              <li key={idx} className="text-sm">
                                <strong>{alerta.nm_alerta}:</strong> {alerta.ds_alerta}
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Observações */}
                    {anamnese.ds_observacoes && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Observações:</p>
                        <p className="text-sm">{anamnese.ds_observacoes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link href={`/profissional/anamneses/${anamnese.id_anamnese}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </Link>
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
