"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Eye,
  Clock
} from "lucide-react";
import { useAnamneses } from "@/lib/api/hooks/useAnamneses";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PacienteAnamnesesPage() {
  const [page, setPage] = useState(1);

  // Hook busca apenas anamneses do paciente atual (backend filtra automaticamente)
  const { data, error, isLoading } = useAnamneses({
    apenas_ativos: true,
    page,
    size: 20,
  });

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar suas anamneses. Tente novamente.
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Minhas Anamneses
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize seus questionários médicos pré-atendimento
        </p>
      </div>

      {/* Info Banner */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>O que é uma Anamnese?</strong>
          <br />
          É um questionário médico que deve ser preenchido antes de qualquer procedimento estético.
          Ele ajuda o profissional a conhecer seu histórico de saúde e garantir sua segurança durante o tratamento.
        </AlertDescription>
      </Alert>

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
              Questionários registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes Assinatura</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {anamneses.filter(a => !a.dt_assinatura_paciente).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando sua confirmação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {anamneses.filter(a => a.dt_assinatura_paciente && a.dt_assinatura_profissional).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Validadas por profissional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && anamneses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Você ainda não possui anamneses
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Quando um profissional criar uma anamnese para você, ela aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Anamneses List */}
      {!isLoading && anamneses.length > 0 && (
        <div className="space-y-4">
          {anamneses.map((anamnese) => (
            <Card
              key={anamnese.id_anamnese}
              className={anamnese.fg_alertas_criticos ? "border-2 border-orange-500" : ""}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">
                        Anamnese #{anamnese.id_anamnese.substring(0, 8)}
                      </h3>

                      {/* Status Badges */}
                      {anamnese.fg_alertas_criticos && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Atenção Necessária
                        </Badge>
                      )}

                      {!anamnese.dt_assinatura_paciente && (
                        <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800">
                          <Clock className="h-3 w-3" />
                          Pendente Sua Assinatura
                        </Badge>
                      )}

                      {anamnese.dt_assinatura_paciente && !anamnese.dt_assinatura_profissional && (
                        <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3" />
                          Aguardando Profissional
                        </Badge>
                      )}

                      {anamnese.dt_assinatura_profissional && (
                        <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Concluída
                        </Badge>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Data de Criação</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(anamnese.dt_criacao), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Sua Assinatura</p>
                        <p className="font-medium">
                          {anamnese.dt_assinatura_paciente
                            ? format(new Date(anamnese.dt_assinatura_paciente), "dd/MM/yyyy", { locale: ptBR })
                            : "Pendente"}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Assinatura Profissional</p>
                        <p className="font-medium">
                          {anamnese.dt_assinatura_profissional
                            ? format(new Date(anamnese.dt_assinatura_profissional), "dd/MM/yyyy", { locale: ptBR })
                            : "Pendente"}
                        </p>
                      </div>
                    </div>

                    {/* Alertas */}
                    {anamnese.fg_alertas_criticos && anamnese.ds_alertas && anamnese.ds_alertas.length > 0 && (
                      <Alert variant="default" className="bg-orange-50 border-orange-200">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription>
                          <strong className="text-orange-800">Informações Importantes Identificadas:</strong>
                          <p className="text-sm mt-1 text-orange-700">
                            Foram identificados {anamnese.ds_alertas.length} ponto(s) que requerem atenção especial do profissional.
                            Consulte os detalhes para mais informações.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Observações */}
                    {anamnese.ds_observacoes && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Observações do Profissional:
                        </p>
                        <p className="text-sm">{anamnese.ds_observacoes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link href={`/paciente/anamneses/${anamnese.id_anamnese}`}>
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
