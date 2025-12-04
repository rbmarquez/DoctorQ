"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  criarAvaliacao,
  revalidarAvaliacoes,
  useAvaliacoes,
  type Avaliacao,
  type CriarAvaliacaoData,
} from "@/lib/api/hooks/useAvaliacoes";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Search,
  Award,
  Users,
  Loader2,
} from "lucide-react";

export default function AvaliacoesPage() {
  const [filtroEstrelas, setFiltroEstrelas] = useState<number | undefined>(undefined);
  const [busca, setBusca] = useState("");
  const [novaNota, setNovaNota] = useState("5");
  const [comentario, setComentario] = useState("");
  const [idProfissional, setIdProfissional] = useState("");
  const [idClinica, setIdClinica] = useState("");
  const [idProcedimento, setIdProcedimento] = useState("");
  const [idAgendamento, setIdAgendamento] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const filtros = filtroEstrelas ? { nr_nota: filtroEstrelas } : undefined;
  const { avaliacoes, isLoading, error: fetchError, meta } = useAvaliacoes(filtros);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const resetMessages = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const avaliacoesFiltradas = useMemo<Avaliacao[]>(() => {
    const termo = busca.trim().toLowerCase();

    return avaliacoes.filter((avaliacaoItem) => {
      const nota = Math.round(avaliacaoItem.nr_nota ?? 0);
      const matchesNota = filtroEstrelas ? nota === filtroEstrelas : true;

      const fieldsToSearch = [
        avaliacaoItem.ds_comentario,
        avaliacaoItem.nm_produto,
        avaliacaoItem.nm_profissional,
        avaliacaoItem.nm_clinica,
        avaliacaoItem.nm_user,
        avaliacaoItem.nm_paciente,
      ];

      const matchesBusca = termo
        ? fieldsToSearch.some((value) => value?.toLowerCase().includes(termo))
        : true;

      return matchesNota && matchesBusca;
    });
  }, [avaliacoes, filtroEstrelas, busca]);

  const dataset: Avaliacao[] = avaliacoesFiltradas.length ? avaliacoesFiltradas : avaliacoes;
  const totalAvaliacoes = meta?.totalItems ?? avaliacoes.length;

  const mediaGeral = useMemo(() => {
    if (!dataset.length) {
      return 0;
    }

    const soma = dataset.reduce((acc, avaliacaoItem) => acc + (avaliacaoItem.nr_nota ?? 0), 0);
    return Number((soma / dataset.length).toFixed(1));
  }, [dataset]);

  const recomendacaoPercentual = useMemo(() => {
    if (!dataset.length) {
      return 0;
    }

    const totalQueRecomendam = dataset.filter((avaliacaoItem) =>
      avaliacaoItem.st_recomenda === undefined ? true : avaliacaoItem.st_recomenda
    ).length;

    return Math.round((totalQueRecomendam / dataset.length) * 100);
  }, [dataset]);

  const stats = useMemo(
    () => ({
      totalAvaliacoes,
      mediaGeral,
      recomendacao: recomendacaoPercentual,
    }),
    [totalAvaliacoes, mediaGeral, recomendacaoPercentual]
  );

  const distribuicaoNotas = useMemo<Record<1 | 2 | 3 | 4 | 5, number>>(() => {
    const base: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    dataset.forEach((avaliacaoItem) => {
      const nota = Math.round(avaliacaoItem.nr_nota ?? 0);
      if (nota >= 1 && nota <= 5) {
        base[nota as 1 | 2 | 3 | 4 | 5] += 1;
      }
    });

    return base;
  }, [dataset]);

  const totalDistribuicao = useMemo(
    () => Object.values(distribuicaoNotas).reduce((acc, value) => acc + value, 0),
    [distribuicaoNotas]
  );

  const fetchErrorMessage =
    fetchError instanceof Error ? fetchError.message : "Erro ao carregar avaliações.";

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return "";
    }

    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const renderStars = (rating: number | undefined) => {
    const rounded = Math.round(rating ?? 0);

    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rounded ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const handleResetForm = () => {
    setNovaNota("5");
    setComentario("");
    setIdProfissional("");
    setIdClinica("");
    setIdProcedimento("");
    setIdAgendamento("");
    resetMessages();
  };

  const handleSubmitAvaliacao = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!novaNota) {
      setSubmitError("Selecione a nota da sua avaliação.");
      return;
    }

    if (!isAuthenticated) {
      setSubmitError("Você precisa estar autenticado para enviar uma avaliação.");
      return;
    }

    const pacienteId =
      (user as Record<string, unknown> | undefined)?.id_user ??
      (user as Record<string, unknown> | undefined)?.id ??
      (user as Record<string, unknown> | undefined)?.idUser;

    if (!pacienteId || typeof pacienteId !== "string") {
      setSubmitError("Não foi possível identificar o usuário autenticado. Faça login novamente.");
      return;
    }

    const payload: CriarAvaliacaoData = {
      id_paciente: pacienteId,
      nr_nota: Number(novaNota),
      ds_comentario: comentario.trim() || undefined,
    };

    if (idProfissional.trim()) {
      payload.id_profissional = idProfissional.trim();
    }

    if (idClinica.trim()) {
      payload.id_clinica = idClinica.trim();
    }

    if (idProcedimento.trim()) {
      payload.id_procedimento = idProcedimento.trim();
    }

    if (idAgendamento.trim()) {
      payload.id_agendamento = idAgendamento.trim();
    }

    setIsSubmitting(true);

    try {
      await criarAvaliacao(payload);

      setComentario("");
      setNovaNota("5");
      setIdProfissional("");
      setIdClinica("");
      setIdProcedimento("");
      setIdAgendamento("");

      setSubmitSuccess("Avaliação enviada com sucesso! Obrigado por compartilhar sua experiência.");

      await revalidarAvaliacoes();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message || "Erro ao enviar avaliação. Tente novamente.");
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Erro inesperado ao enviar avaliação.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Avaliações</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Veja o que nossos clientes estão dizendo e compartilhe a sua experiência.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="w-8 h-8 text-yellow-600 fill-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Média Geral</p>
                  <p className="text-3xl font-bold">{stats.mediaGeral.toFixed(1)}</p>
                  <div className="flex mt-1">{renderStars(stats.mediaGeral)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Avaliações</p>
                  <p className="text-3xl font-bold">{stats.totalAvaliacoes}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Exibindo {avaliacoesFiltradas.length}{" "}
                    {avaliacoesFiltradas.length === 1 ? "resultado" : "resultados"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ThumbsUp className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recomendariam</p>
                  <p className="text-3xl font-bold">{stats.recomendacao}%</p>
                  <p className="text-xs text-gray-500 mt-1">dos clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Compartilhe sua avaliação</h2>
                <p className="text-gray-600 text-sm">
                  Após autenticação, preencha os campos abaixo para registrar sua experiência.
                </p>
              </div>
            </div>

            {authLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : isAuthenticated ? (
              <form onSubmit={handleSubmitAvaliacao} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nota">Nota geral</Label>
                    <Select
                      value={novaNota}
                      onValueChange={(value) => {
                        setNovaNota(value);
                        resetMessages();
                      }}
                    >
                      <SelectTrigger id="nota">
                        <SelectValue placeholder="Selecione a nota" />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((nota) => (
                          <SelectItem key={nota} value={String(nota)}>
                            {nota} {nota === 1 ? "estrela" : "estrelas"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pré-visualização</Label>
                    <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
                      {renderStars(Number(novaNota))}
                      <span className="text-sm text-gray-600">{novaNota}/5</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comentario">Comentário</Label>
                  <Textarea
                    id="comentario"
                    value={comentario}
                    onChange={(event) => {
                      setComentario(event.target.value);
                      resetMessages();
                    }}
                    placeholder="Conte os detalhes da sua experiência (opcional, mas nos ajuda bastante!)"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="id-profissional">ID do profissional (opcional)</Label>
                    <Input
                      id="id-profissional"
                      value={idProfissional}
                      onChange={(event) => {
                        setIdProfissional(event.target.value);
                        resetMessages();
                      }}
                      placeholder="Ex.: 4b3e8d2a-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id-clinica">ID da clínica (opcional)</Label>
                    <Input
                      id="id-clinica"
                      value={idClinica}
                      onChange={(event) => {
                        setIdClinica(event.target.value);
                        resetMessages();
                      }}
                      placeholder="Ex.: f1c29e1a-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id-procedimento">ID do procedimento (opcional)</Label>
                    <Input
                      id="id-procedimento"
                      value={idProcedimento}
                      onChange={(event) => {
                        setIdProcedimento(event.target.value);
                        resetMessages();
                      }}
                      placeholder="Ex.: 97aa12c4-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id-agendamento">ID do agendamento (opcional)</Label>
                    <Input
                      id="id-agendamento"
                      value={idAgendamento}
                      onChange={(event) => {
                        setIdAgendamento(event.target.value);
                        resetMessages();
                      }}
                      placeholder="Ex.: 3fa85f64-..."
                    />
                  </div>
                </div>

                {submitError && (
                  <Alert variant="destructive">
                    <AlertTitle>Não foi possível enviar</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {submitSuccess && (
                  <Alert>
                    <AlertTitle>Obrigado!</AlertTitle>
                    <AlertDescription>{submitSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={handleResetForm} disabled={isSubmitting}>
                    Limpar formulário
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar avaliação
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-600 text-sm">
                  Faça login para liberar o envio de avaliações e acompanhar suas contribuições.
                </p>
                <Button asChild>
                  <Link href="/login">Fazer login</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-6">Distribuição de Notas</h3>
                <div className="space-y-3">
                  {Object.entries(distribuicaoNotas)
                    .sort((a, b) => Number(b[0]) - Number(a[0]))
                    .map(([estrelas, quantidade]) => {
                      const percentual =
                        totalDistribuicao > 0 ? (quantidade / totalDistribuicao) * 100 : 0;

                      return (
                        <div key={estrelas} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-12">
                            {estrelas}{" "}
                            <Star className="h-3 w-3 inline fill-yellow-400 text-yellow-400" />
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{quantidade}</span>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Filtrar por Nota</h4>
                  <Select
                    value={filtroEstrelas?.toString() || "todas"}
                    onValueChange={(value) =>
                      setFiltroEstrelas(value === "todas" ? undefined : parseInt(value, 10))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as notas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as notas</SelectItem>
                      <SelectItem value="5">5 estrelas</SelectItem>
                      <SelectItem value="4">4 estrelas</SelectItem>
                      <SelectItem value="3">3 estrelas</SelectItem>
                      <SelectItem value="2">2 estrelas</SelectItem>
                      <SelectItem value="1">1 estrela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar avaliações..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Carregando avaliações...</p>
                {[...Array(3)].map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : fetchError ? (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível carregar as avaliações</AlertTitle>
                <AlertDescription className="space-y-3">
                  <span>{fetchErrorMessage}</span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void revalidarAvaliacoes();
                    }}
                  >
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            ) : avaliacoesFiltradas.length > 0 ? (
              avaliacoesFiltradas.map((avaliacao) => {
                const reviewerName =
                  avaliacao.nm_user || avaliacao.nm_paciente || "Cliente";
                const createdAt = formatDate(avaliacao.dt_criacao) || "Data indisponível";
                const comentario =
                  avaliacao.ds_comentario || "Este cliente preferiu não deixar comentários.";
                const isVerificada = Boolean(
                  avaliacao.st_verificada ?? avaliacao.st_verificado
                );

                return (
                  <Card key={avaliacao.id_avaliacao}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                            {reviewerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{reviewerName}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">{renderStars(avaliacao.nr_nota)}</div>
                                {isVerificada && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Award className="h-3 w-3 mr-1" />
                                    Verificado
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">{createdAt}</span>
                          </div>

                          {avaliacao.nm_produto && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Produto:</strong> {avaliacao.nm_produto}
                            </p>
                          )}

                          <p className="text-gray-700 mb-4">{comentario}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                              <ThumbsUp className="h-4 w-4" />
                              <span>Útil ({avaliacao.nr_likes || 0})</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                              <MessageSquare className="h-4 w-4" />
                              <span>Responder</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>
                    {busca.trim() || filtroEstrelas
                      ? "Nenhuma avaliação encontrada com os filtros atuais."
                      : "Nenhuma avaliação encontrada."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
