"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMinhasCandidaturas,
  desistirCandidatura,
} from "@/lib/api/hooks/useCandidaturas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  MapPin,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  ArrowLeft,
  Eye,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export default function MinhasCandidaturasPage() {
  const router = useRouter();
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>();
  const [candidaturaSelecionada, setCandidaturaSelecionada] = useState<any | null>(null);
  const [mostrarModalDetalhes, setMostrarModalDetalhes] = useState(false);
  const [mostrarModalDesistir, setMostrarModalDesistir] = useState(false);

  const { candidaturas, isLoading, error, mutate } = useMinhasCandidaturas({
    ds_status: filtroStatus,
  });

  // Estatísticas
  const totalCandidaturas = candidaturas.length;
  const emProcesso = candidaturas.filter((c) =>
    c.ds_status === "enviada" || c.ds_status === "em_analise"
  ).length;
  const entrevistasAgendadas = candidaturas.filter((c) =>
    c.ds_status === "entrevista_agendada"
  ).length;
  const aprovados = candidaturas.filter((c) => c.ds_status === "aprovado").length;
  const taxaSucesso = totalCandidaturas > 0
    ? ((aprovados / totalCandidaturas) * 100).toFixed(0)
    : "0";

  // Mapear cores dos status
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    enviada: { label: "Enviada", color: "text-blue-700", bgColor: "bg-blue-100" },
    em_analise: { label: "Em Análise", color: "text-yellow-700", bgColor: "bg-yellow-100" },
    entrevista_agendada: { label: "Entrevista Agendada", color: "text-purple-700", bgColor: "bg-purple-100" },
    aprovado: { label: "Aprovado", color: "text-green-700", bgColor: "bg-green-100" },
    reprovado: { label: "Reprovado", color: "text-red-700", bgColor: "bg-red-100" },
    desistiu: { label: "Desistiu", color: "text-gray-700", bgColor: "bg-gray-100" },
  };

  // Mapear cor do match score
  const getMatchScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-gray-500";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleVerDetalhes = (candidatura: any) => {
    setCandidaturaSelecionada(candidatura);
    setMostrarModalDetalhes(true);
  };

  const handleAbrirModalDesistir = (candidatura: any) => {
    setCandidaturaSelecionada(candidatura);
    setMostrarModalDesistir(true);
  };

  const handleDesistir = async () => {
    if (!candidaturaSelecionada) return;

    try {
      await desistirCandidatura(candidaturaSelecionada.id_candidatura);
      toast.success("Você desistiu da candidatura com sucesso!");
      mutate();
      setMostrarModalDesistir(false);
      setCandidaturaSelecionada(null);
    } catch (error: any) {
      console.error("Erro ao desistir da candidatura:", error);
      toast.error(error.response?.data?.detail || "Erro ao desistir da candidatura");
    }
  };

  const formatarData = (data: string | null | undefined) => {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas candidaturas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao Carregar</CardTitle>
            <CardDescription>
              Não foi possível carregar suas candidaturas.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => mutate()} variant="outline" className="w-full">
              Tentar Novamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/carreiras/vagas")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Minhas Candidaturas
                </h1>
                <p className="text-gray-600 mt-1">
                  Acompanhe o status de todas as suas candidaturas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Total
                </CardTitle>
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{totalCandidaturas}</div>
              <p className="text-xs text-blue-600 mt-1">candidaturas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-yellow-700">
                  Em Processo
                </CardTitle>
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{emProcesso}</div>
              <p className="text-xs text-yellow-600 mt-1">aguardando retorno</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700">
                  Entrevistas
                </CardTitle>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{entrevistasAgendadas}</div>
              <p className="text-xs text-purple-600 mt-1">agendadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700">
                  Aprovados
                </CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{aprovados}</div>
              <p className="text-xs text-green-600 mt-1">aprovações</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-rose-700">
                  Taxa de Sucesso
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">{taxaSucesso}%</div>
              <p className="text-xs text-rose-600 mt-1">aprovações/total</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtrar Candidaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select
                value={filtroStatus || "todos"}
                onValueChange={(value) => setFiltroStatus(value === "todos" ? undefined : value)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="entrevista_agendada">Entrevista Agendada</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="desistiu">Desistiu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Candidaturas */}
        {candidaturas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma candidatura encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {filtroStatus
                  ? "Não há candidaturas com este status."
                  : "Você ainda não se candidatou a nenhuma vaga."}
              </p>
              <Button
                onClick={() => router.push("/carreiras/vagas")}
                className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
              >
                Explorar Vagas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {candidaturas.map((candidatura) => (
              <Card
                key={candidatura.id_candidatura}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">
                          {candidatura.nm_cargo}
                        </CardTitle>
                        <Badge
                          className={`${statusMap[candidatura.ds_status]?.bgColor} ${statusMap[candidatura.ds_status]?.color}`}
                        >
                          {statusMap[candidatura.ds_status]?.label}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-base">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {candidatura.nm_empresa}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {candidatura.nm_cidade}, {candidatura.nm_estado}
                        </span>
                      </CardDescription>
                    </div>
                    {candidatura.nr_match_score && (
                      <div className="text-center">
                        <div
                          className={`text-3xl font-bold ${getMatchScoreColor(candidatura.nr_match_score)}`}
                        >
                          {candidatura.nr_match_score}%
                        </div>
                        <p className="text-xs text-gray-500">Match</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Candidatura Enviada</p>
                      <p className="font-medium">{formatarData(candidatura.dt_candidatura)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Última Atualização</p>
                      <p className="font-medium">
                        {formatarData(candidatura.dt_ultima_atualizacao)}
                      </p>
                    </div>
                    {candidatura.dt_entrevista && (
                      <div>
                        <p className="text-sm text-gray-500">Data da Entrevista</p>
                        <p className="font-medium text-purple-600">
                          {formatarData(candidatura.dt_entrevista)}
                        </p>
                      </div>
                    )}
                    {candidatura.ds_feedback_empresa && (
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Feedback da Empresa
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          Disponível
                        </p>
                      </div>
                    )}
                  </div>

                  {candidatura.ds_feedback_empresa && (
                    <>
                      <Separator className="my-4" />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          Feedback da Empresa:
                        </p>
                        <p className="text-sm text-blue-700">
                          {candidatura.ds_feedback_empresa}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleVerDetalhes(candidatura)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {(candidatura.ds_status === "enviada" ||
                    candidatura.ds_status === "em_analise") && (
                    <Button
                      variant="destructive"
                      onClick={() => handleAbrirModalDesistir(candidatura)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Desistir
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={mostrarModalDetalhes} onOpenChange={setMostrarModalDetalhes}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Candidatura</DialogTitle>
            <DialogDescription>
              Informações completas sobre sua candidatura
            </DialogDescription>
          </DialogHeader>
          {candidaturaSelecionada && (
            <div className="space-y-6">
              {/* Vaga */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Vaga</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-medium">Cargo:</span>{" "}
                    {candidaturaSelecionada.nm_cargo}
                  </p>
                  <p>
                    <span className="font-medium">Empresa:</span>{" "}
                    {candidaturaSelecionada.nm_empresa}
                  </p>
                  <p>
                    <span className="font-medium">Localização:</span>{" "}
                    {candidaturaSelecionada.nm_cidade}, {candidaturaSelecionada.nm_estado}
                  </p>
                  <p>
                    <span className="font-medium">Tipo:</span>{" "}
                    {candidaturaSelecionada.nm_tipo_contrato} - {candidaturaSelecionada.nm_regime_trabalho}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Status da Candidatura</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Badge
                    className={`${statusMap[candidaturaSelecionada.ds_status]?.bgColor} ${statusMap[candidaturaSelecionada.ds_status]?.color} text-base px-4 py-2`}
                  >
                    {statusMap[candidaturaSelecionada.ds_status]?.label}
                  </Badge>
                  {candidaturaSelecionada.nr_match_score && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Score de Compatibilidade</p>
                      <div
                        className={`text-4xl font-bold ${getMatchScoreColor(candidaturaSelecionada.nr_match_score)}`}
                      >
                        {candidaturaSelecionada.nr_match_score}%
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Carta de Apresentação */}
              {candidaturaSelecionada.ds_carta_apresentacao && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Carta de Apresentação</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {candidaturaSelecionada.ds_carta_apresentacao}
                    </p>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {candidaturaSelecionada.ds_feedback_empresa && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Feedback da Empresa</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm">{candidaturaSelecionada.ds_feedback_empresa}</p>
                  </div>
                </div>
              )}

              {/* Datas */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Cronologia</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-medium">Candidatura enviada:</span>{" "}
                    {formatarData(candidaturaSelecionada.dt_candidatura)}
                  </p>
                  <p>
                    <span className="font-medium">Última atualização:</span>{" "}
                    {formatarData(candidaturaSelecionada.dt_ultima_atualizacao)}
                  </p>
                  {candidaturaSelecionada.dt_entrevista && (
                    <p>
                      <span className="font-medium">Entrevista agendada:</span>{" "}
                      <span className="text-purple-600 font-semibold">
                        {formatarData(candidaturaSelecionada.dt_entrevista)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarModalDetalhes(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Desistir */}
      <Dialog open={mostrarModalDesistir} onOpenChange={setMostrarModalDesistir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Confirmar Desistência
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desistir desta candidatura? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {candidaturaSelecionada && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium">{candidaturaSelecionada.nm_cargo}</p>
              <p className="text-sm text-gray-600">{candidaturaSelecionada.nm_empresa}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarModalDesistir(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDesistir}>
              <Trash2 className="w-4 h-4 mr-2" />
              Sim, Desistir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
