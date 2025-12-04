"use client";

import { useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  CalendarClock,
  ShoppingCart,
  Bell,
  Loader2,
  Heart,
  Star,
  TrendingUp,
  Award,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useAgendamentos } from "@/lib/api/hooks/useAgendamentos";
import { useAvaliacoes } from "@/lib/api/hooks/useAvaliacoes";
import { useFavoritosStats } from "@/lib/api/hooks/useFavoritos";
import { useProcedimentos } from "@/lib/api/hooks/useProcedimentos";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientStats } from "@/components/dashboard/PatientStats";
import { PendingReviews } from "@/components/dashboard/PendingReviews";
import { ProcedureHistory } from "@/components/dashboard/ProcedureHistory";
import { RecommendedProcedures } from "@/components/dashboard/RecommendedProcedures";

const statusConfig = {
  agendado: { label: "Agendado", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
  concluido: { label: "Concluído", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
} satisfies Record<
  string,
  {
    label: string;
    color: string;
    icon: typeof AlertCircle;
  }
>;

export default function PatientDashboardPage() {
  const { user } = useAuth();

  const {
    agendamentos,
    isLoading,
  } = useAgendamentos({
    id_paciente: user?.id_user,
    page: 1,
    size: 100,
  });

  // Buscar avaliações do paciente
  const userId = user?.backendUserId || user?.id;
  const { avaliacoes, total: totalAvaliacoes, isLoading: isLoadingAvaliacoes } = useAvaliacoes(
    userId ? { id_paciente: userId } : undefined
  );

  // Buscar estatísticas de favoritos
  const { totalGeral: totalFavoritos, isLoading: isLoadingFavoritos } = useFavoritosStats(userId || null);

  // Buscar procedimentos recomendados (populares)
  const { procedimentos: procedimentosRecomendados, isLoading: isLoadingProcedimentos } = useProcedimentos({
    page: 1,
    size: 6,
    ordenacao: "relevancia",
  });

  const stats = useMemo(() => {
    const now = new Date();
    const proximos = agendamentos.filter((agendamento) => {
      const data = new Date(agendamento.dt_agendamento);
      return data >= now && agendamento.ds_status !== "cancelado" && agendamento.ds_status !== "concluido";
    });

    const concluidos = agendamentos.filter((agendamento) => agendamento.ds_status === "concluido");
    const pendentes = agendamentos.filter(
      (agendamento) => agendamento.ds_status === "agendado" && !agendamento.st_confirmado
    );

    // Calcular dias até o próximo agendamento
    let nextAppointmentDays = -1; // -1 indica sem agendamentos
    if (proximos.length > 0) {
      const proximoAgendamento = proximos.sort(
        (a, b) => new Date(a.dt_agendamento).getTime() - new Date(b.dt_agendamento).getTime()
      )[0];
      const diffTime = new Date(proximoAgendamento.dt_agendamento).getTime() - now.getTime();
      nextAppointmentDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      total: agendamentos.length,
      proximos: proximos.length,
      concluidos: concluidos.length,
      pendentes: pendentes.length,
      nextAppointmentDays,
      agendamentosConcluidos: concluidos,
    };
  }, [agendamentos]);

  // Calcular média das avaliações
  const avaliacoesStats = useMemo(() => {
    if (!avaliacoes || avaliacoes.length === 0) {
      return { total: 0, media: 0 };
    }
    const somaNotas = avaliacoes.reduce((acc, av) => acc + (av.nr_nota || 0), 0);
    const media = somaNotas / avaliacoes.length;
    return { total: avaliacoes.length, media };
  }, [avaliacoes]);

  // Identificar agendamentos concluídos que não foram avaliados
  const agendamentosPendentesAvaliacao = useMemo(() => {
    const idsAgendamentosAvaliados = new Set(
      avaliacoes.filter(av => av.id_agendamento).map(av => av.id_agendamento)
    );
    return stats.agendamentosConcluidos
      .filter(ag => !idsAgendamentosAvaliados.has(ag.id_agendamento))
      .map(ag => {
        const dtAgendamento = new Date(ag.dt_agendamento);
        const now = new Date();
        const diffTime = now.getTime() - dtAgendamento.getTime();
        const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: ag.id_agendamento,
          procedureName: ag.nm_procedimento || "Procedimento",
          professionalName: ag.nm_profissional || "Profissional",
          date: ag.dt_agendamento,
          daysAgo,
        };
      });
  }, [stats.agendamentosConcluidos, avaliacoes]);

  // Preparar histórico de procedimentos para o componente
  const procedureHistoryData = useMemo(() => {
    const idsAgendamentosAvaliados = new Map(
      avaliacoes.filter(av => av.id_agendamento).map(av => [av.id_agendamento, av])
    );
    return stats.agendamentosConcluidos.map(ag => {
      const avaliacao = idsAgendamentosAvaliados.get(ag.id_agendamento);
      return {
        id: ag.id_agendamento,
        procedureName: ag.nm_procedimento || "Procedimento",
        professionalName: ag.nm_profissional || "Profissional",
        date: ag.dt_agendamento,
        status: avaliacao ? "reviewed" as const : "pending_review" as const,
        price: ag.vl_procedimento || 0,
        rating: avaliacao?.nr_nota,
      };
    });
  }, [stats.agendamentosConcluidos, avaliacoes]);

  // Preparar procedimentos recomendados
  const recommendedProceduresData = useMemo(() => {
    return procedimentosRecomendados.slice(0, 3).map(proc => ({
      id: proc.id_procedimento,
      name: proc.nm_procedimento,
      category: proc.ds_categoria || "Estética",
      price: proc.vl_preco_base || 0,
      duration: proc.nr_duracao_minutos || 60,
      rating: proc.nr_media_avaliacoes || 4.5,
      imageUrl: proc.ds_foto_principal,
      reason: "Procedimento popular na plataforma",
    }));
  }, [procedimentosRecomendados]);

  const proximosAgendamentos = useMemo(() => {
    const now = new Date();

    return agendamentos
      .filter((agendamento) => {
        const data = new Date(agendamento.dt_agendamento);
        return data >= now && agendamento.ds_status !== "cancelado";
      })
      .sort(
        (a, b) =>
          new Date(a.dt_agendamento).getTime() - new Date(b.dt_agendamento).getTime()
      )
      .slice(0, 3);
  }, [agendamentos]);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-blue-100 bg-white/70 p-10 shadow-sm">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        <p className="mt-4 text-lg text-gray-600">Carregando seu painel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
          Olá, {user?.nm_completo || "Paciente"}! 👋
        </h1>
        <p className="mt-1 text-gray-600">Bem-vindo ao seu painel de controle.</p>
      </div>

      {/* Estatísticas com componente PatientStats - usando dados reais */}
      <PatientStats
        totalAppointments={stats.total}
        totalProcedures={stats.concluidos}
        totalReviews={avaliacoesStats.total}
        averageRating={avaliacoesStats.media}
        favoritesCount={totalFavoritos}
        nextAppointmentDays={stats.nextAppointmentDays}
      />

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as principais funcionalidades.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link href="/procedimentos">
              <Button variant="outline" className="flex h-24 w-full flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50">
                <Award className="h-8 w-8 text-blue-600" />
                <span>Explorar Procedimentos</span>
              </Button>
            </Link>
            <Link href="/paciente/agendamentos/novo">
              <Button variant="outline" className="flex h-24 w-full flex-col items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50">
                <Calendar className="h-8 w-8 text-purple-600" />
                <span>Agendar Consulta</span>
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="flex h-24 w-full flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <span>Marketplace</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Seus procedimentos agendados.</CardDescription>
          </div>
          <Link href="/paciente/agendamentos">
            <Button variant="ghost" size="sm">
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {proximosAgendamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-white py-12 text-center">
              <Calendar className="mb-4 h-14 w-14 text-blue-300" />
              <h3 className="text-lg font-semibold text-gray-900">Nenhum agendamento próximo</h3>
              <p className="mt-2 text-sm text-gray-600">
                Que tal agendar um novo procedimento?
              </p>
              <Link href="/paciente/agendamentos/novo" className="mt-4">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                  Agendar agora
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {proximosAgendamentos.map((agendamento) => {
                const config =
                  statusConfig[agendamento.ds_status as keyof typeof statusConfig] ?? statusConfig.agendado;
                const StatusIcon = config.icon;

                return (
                  <div
                    key={agendamento.id_agendamento}
                    className="rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-300"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">
                          {agendamento.nm_procedimento || "Procedimento"}
                        </h4>
                        <p className="text-sm text-gray-600">{agendamento.nm_profissional || "Profissional"}</p>
                      </div>
                      <Badge className={config.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(agendamento.dt_agendamento)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{agendamento.nr_duracao_minutos} minutos</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link href="/paciente/agendamentos" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avaliações Pendentes */}
      <PendingReviews reviews={agendamentosPendentesAvaliacao} />

      {/* Histórico de Procedimentos */}
      <ProcedureHistory history={procedureHistoryData} limit={5} />

      {/* Procedimentos Recomendados */}
      <RecommendedProcedures procedures={recommendedProceduresData} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-600" />
              Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Gerencie seus procedimentos e profissionais favoritos.
            </p>
            <Link href="/paciente/favoritos">
              <Button variant="outline" className="w-full">
                Ver favoritos
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Compartilhe sua experiência e ajude outros pacientes.
            </p>
            <Link href="/paciente/avaliacoes">
              <Button variant="outline" className="w-full">
                Minhas avaliações
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
