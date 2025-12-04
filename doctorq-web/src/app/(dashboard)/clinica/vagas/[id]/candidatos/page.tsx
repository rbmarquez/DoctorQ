"use client";

import { useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  FileText,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useVaga } from "@/lib/api/hooks/useVagas";
import { useCandidaturasVaga, atualizarCandidatura } from "@/lib/api/hooks/useCandidaturas";
import type { Candidatura } from "@/types/carreiras";
import { toast } from "sonner";

export default function CandidatosVagaPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname?.split("/").filter(Boolean) ?? [];
  const basePath = `/${pathSegments[0] ?? "clinica"}`;
  const id_vaga = params.id as string;

  const { vaga, isLoading: loadingVaga } = useVaga(id_vaga);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { candidaturas, meta, isLoading, mutate } = useCandidaturasVaga(id_vaga);

  const [candidaturaSelecionada, setCandidaturaSelecionada] = useState<Candidatura | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [novoStatus, setNovoStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [dtEntrevista, setDtEntrevista] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  const handleAbrirModal = (candidatura: Candidatura) => {
    setCandidaturaSelecionada(candidatura);
    setNovoStatus(candidatura.ds_status);
    setFeedback(candidatura.ds_feedback_empresa || "");
    setDtEntrevista(candidatura.dt_entrevista || "");
    setShowModal(true);
  };

  const handleAtualizarStatus = async () => {
    if (!candidaturaSelecionada) return;

    if (novoStatus === "entrevista_agendada" && !dtEntrevista) {
      toast.error("Por favor, informe a data e hora da entrevista");
      return;
    }

    setAtualizando(true);

    try {
      await atualizarCandidatura(candidaturaSelecionada.id_candidatura, {
        ds_status: novoStatus,
        ds_feedback_empresa: feedback || undefined,
        dt_entrevista: dtEntrevista ? new Date(dtEntrevista).toISOString() : undefined,
      });

      toast.success("Status atualizado com sucesso!");
      setShowModal(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    } finally {
      setAtualizando(false);
    }
  };

  const filteredCandidaturas = statusFilter
    ? candidaturas.filter((c) => c.ds_status === statusFilter)
    : candidaturas;

  const statusBadge = {
    enviada: { color: "bg-blue-100 text-blue-700", label: "Enviada" },
    em_analise: { color: "bg-yellow-100 text-yellow-700", label: "Em Análise" },
    entrevista_agendada: { color: "bg-purple-100 text-purple-700", label: "Entrevista Agendada" },
    aprovado: { color: "bg-green-100 text-green-700", label: "Aprovado" },
    reprovado: { color: "bg-red-100 text-red-700", label: "Reprovado" },
    desistiu: { color: "bg-gray-100 text-gray-700", label: "Desistiu" },
  };

  const getMatchScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-gray-500";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loadingVaga || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando candidatos...</p>
        </div>
      </div>
    );
  }

  if (!vaga) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Vaga não encontrada</p>
          <Button onClick={() => router.push(`${basePath}/vagas`)} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Estatísticas
  const porStatus = {
    enviada: candidaturas.filter((c) => c.ds_status === "enviada").length,
    em_analise: candidaturas.filter((c) => c.ds_status === "em_analise").length,
    entrevista_agendada: candidaturas.filter((c) => c.ds_status === "entrevista_agendada").length,
    aprovado: candidaturas.filter((c) => c.ds_status === "aprovado").length,
    reprovado: candidaturas.filter((c) => c.ds_status === "reprovado").length,
  };

  const matchScoreMedio =
    candidaturas.length > 0
      ? candidaturas.reduce((acc, c) => acc + (c.nr_match_score || 0), 0) / candidaturas.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container px-4 py-6">
          <button
            onClick={() => router.push(`${basePath}/vagas`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Minhas Vagas
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidatos</h1>
          <p className="text-lg text-gray-700">{vaga.nm_cargo}</p>
          <p className="text-sm text-gray-600 mt-1">
            {vaga.nm_cidade}, {vaga.nm_estado}
          </p>

          {/* Stats */}
          <div className="grid md:grid-cols-5 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 opacity-80" />
                <span className="text-2xl font-bold">{candidaturas.length}</span>
              </div>
              <p className="text-sm opacity-90">Total</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-6 h-6 opacity-80" />
                <span className="text-2xl font-bold">{porStatus.enviada}</span>
              </div>
              <p className="text-sm opacity-90">Novas</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-6 h-6 opacity-80" />
                <span className="text-2xl font-bold">{porStatus.entrevista_agendada}</span>
              </div>
              <p className="text-sm opacity-90">Entrevistas</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-6 h-6 opacity-80" />
                <span className="text-2xl font-bold">{porStatus.aprovado}</span>
              </div>
              <p className="text-sm opacity-90">Aprovados</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 opacity-80" />
                <span className="text-2xl font-bold">{matchScoreMedio.toFixed(0)}%</span>
              </div>
              <p className="text-sm opacity-90">Match Médio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container px-4 py-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="entrevista_agendada">Entrevista Agendada</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-sm text-gray-600">
              {filteredCandidaturas.length} candidato{filteredCandidaturas.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Candidatos List */}
        {filteredCandidaturas.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-200">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum candidato encontrado</h3>
            <p className="text-gray-600">
              {statusFilter ? "Tente ajustar o filtro de status" : "Aguardando candidaturas para esta vaga"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCandidaturas.map((candidatura) => (
              <div
                key={candidatura.id_candidatura}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{candidatura.nm_candidato}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {candidatura.ds_email_candidato}
                    </div>
                    {candidatura.nr_telefone_candidato && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Phone className="w-4 h-4" />
                        {candidatura.nr_telefone_candidato}
                      </div>
                    )}
                  </div>

                  {/* Match Score */}
                  {candidatura.nr_match_score !== null && candidatura.nr_match_score !== undefined && (
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

                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      statusBadge[candidatura.ds_status as keyof typeof statusBadge]?.color
                    }`}
                  >
                    {statusBadge[candidatura.ds_status as keyof typeof statusBadge]?.label}
                  </span>
                </div>

                {/* Carta de Apresentação */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Carta de Apresentação:</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">{candidatura.ds_carta_apresentacao}</p>
                </div>

                {/* Data */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  Candidatou-se em {new Date(candidatura.dt_candidatura).toLocaleDateString("pt-BR")}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAbrirModal(candidatura)}
                    className="flex-1"
                  >
                    Ver Detalhes / Atualizar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Candidatura</DialogTitle>
            <DialogDescription>
              {candidaturaSelecionada?.nm_candidato}
            </DialogDescription>
          </DialogHeader>

          {candidaturaSelecionada && (
            <div className="space-y-6">
              {/* Match Score */}
              {candidaturaSelecionada.nr_match_score !== null && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center">
                  <div className={`text-5xl font-bold mb-2 ${getMatchScoreColor(candidaturaSelecionada.nr_match_score)}`}>
                    {candidaturaSelecionada.nr_match_score}%
                  </div>
                  <p className="text-sm text-gray-600">Score de Compatibilidade</p>
                </div>
              )}

              {/* Carta de Apresentação */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Carta de Apresentação:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {candidaturaSelecionada.ds_carta_apresentacao}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alterar Status
                </label>
                <Select value={novoStatus} onValueChange={setNovoStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="entrevista_agendada">Entrevista Agendada</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data da Entrevista (se status = entrevista_agendada) */}
              {novoStatus === "entrevista_agendada" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data e Hora da Entrevista *
                  </label>
                  <input
                    type="datetime-local"
                    value={dtEntrevista}
                    onChange={(e) => setDtEntrevista(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback para o Candidato (Opcional)
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Escreva um feedback sobre o candidato..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAtualizarStatus}
                  disabled={atualizando}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {atualizando ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
