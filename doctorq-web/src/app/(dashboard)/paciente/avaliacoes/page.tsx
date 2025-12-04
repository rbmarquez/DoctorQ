"use client";

import { useState } from "react";
import { Star, Send, Calendar, User, ThumbsUp, Filter, Search, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Avaliacao {
  id_avaliacao: string;
  nm_procedimento: string;
  nm_profissional: string;
  dt_procedimento: string;
  dt_avaliacao: string;
  nr_nota: number;
  ds_comentario: string;
  st_publicada: boolean;
  nr_likes: number;
}

export default function AvaliacoesPage() {
  const [avaliacaoDialog, setAvaliacaoDialog] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(0);
  const [comentario, setComentario] = useState("");
  const [filtroNota, setFiltroNota] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  // Mock data - suas avaliações
  const minhasAvaliacoes: Avaliacao[] = [
    {
      id_avaliacao: "1",
      nm_procedimento: "Limpeza de Pele Profunda",
      nm_profissional: "Dra. Ana Paula Costa",
      dt_procedimento: "2025-10-15",
      dt_avaliacao: "2025-10-16",
      nr_nota: 5,
      ds_comentario: "Excelente profissional! Minha pele ficou incrível após o procedimento. Super recomendo!",
      st_publicada: true,
      nr_likes: 12,
    },
    {
      id_avaliacao: "2",
      nm_procedimento: "Preenchimento Labial",
      nm_profissional: "Dr. Carlos Mendes",
      dt_procedimento: "2025-09-20",
      dt_avaliacao: "2025-09-21",
      nr_nota: 4,
      ds_comentario: "Resultado natural e muito bom. O atendimento foi excelente e o Dr. Carlos é muito atencioso.",
      st_publicada: true,
      nr_likes: 8,
    },
    {
      id_avaliacao: "3",
      nm_procedimento: "Massagem Relaxante",
      nm_profissional: "Terapeuta Maria Silva",
      dt_procedimento: "2025-08-10",
      dt_avaliacao: "2025-08-10",
      nr_nota: 5,
      ds_comentario: "Massagem maravilhosa! Saí de lá completamente relaxada. Ambiente muito tranquilo e acolhedor.",
      st_publicada: true,
      nr_likes: 5,
    },
  ];

  // Procedimentos pendentes de avaliação
  const procedimentosPendentes = [
    {
      id_procedimento: "4",
      nm_procedimento: "Peeling Químico",
      nm_profissional: "Dra. Patricia Alves",
      dt_procedimento: "2025-10-18",
      ds_imagem: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400",
    },
    {
      id_procedimento: "5",
      nm_procedimento: "Drenagem Linfática",
      nm_profissional: "Ft. Juliana Santos",
      dt_procedimento: "2025-10-10",
      ds_imagem: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400",
    },
  ];

  const handleSubmitAvaliacao = () => {
    if (notaSelecionada === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5 estrelas");
      return;
    }

    if (comentario.trim().length < 10) {
      toast.error("Por favor, escreva um comentário com pelo menos 10 caracteres");
      return;
    }

    toast.success("Avaliação enviada com sucesso!");
    setAvaliacaoDialog(false);
    setNotaSelecionada(0);
    setComentario("");
  };

  const handleDeleteAvaliacao = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta avaliação?")) {
      toast.success("Avaliação excluída com sucesso!");
    }
  };

  const avaliacoesFiltradas = minhasAvaliacoes.filter((av) => {
    const matchNota = filtroNota === null || av.nr_nota === filtroNota;
    const matchBusca =
      busca === "" ||
      av.nm_procedimento.toLowerCase().includes(busca.toLowerCase()) ||
      av.nm_profissional.toLowerCase().includes(busca.toLowerCase());
    return matchNota && matchBusca;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Minhas Avaliações
          </h1>
          <p className="text-gray-600 mt-1">Compartilhe sua experiência e ajude outros clientes</p>
        </div>
      </div>

      {/* Procedimentos Pendentes de Avaliação */}
      {procedimentosPendentes.length > 0 && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Star className="h-5 w-5" />
              Aguardando sua avaliação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {procedimentosPendentes.map((proc) => (
              <div
                key={proc.id_procedimento}
                className="bg-white rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img src={proc.ds_imagem} alt={proc.nm_procedimento} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{proc.nm_procedimento}</h3>
                    <p className="text-sm text-gray-600">{proc.nm_profissional}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(proc.dt_procedimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Dialog open={avaliacaoDialog} onOpenChange={setAvaliacaoDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                      <Star className="h-4 w-4 mr-2" />
                      Avaliar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Avaliar Procedimento</DialogTitle>
                      <DialogDescription>
                        Como foi sua experiência com {proc.nm_procedimento}?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Nota Geral</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((nota) => (
                            <button
                              key={nota}
                              onClick={() => setNotaSelecionada(nota)}
                              className="group relative"
                            >
                              <Star
                                className={`h-10 w-10 transition-all ${
                                  nota <= notaSelecionada
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 group-hover:text-yellow-200"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        {notaSelecionada > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            {notaSelecionada === 5 && "Excelente!"}
                            {notaSelecionada === 4 && "Muito bom!"}
                            {notaSelecionada === 3 && "Bom"}
                            {notaSelecionada === 2 && "Regular"}
                            {notaSelecionada === 1 && "Ruim"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block">Seu Comentário</label>
                        <Textarea
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                          placeholder="Conte sobre sua experiência com este procedimento..."
                          className="min-h-32 resize-none"
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">{comentario.length}/500 caracteres</p>
                      </div>

                      <Button
                        onClick={handleSubmitAvaliacao}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Avaliação
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por procedimento ou profissional..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtroNota === null ? "default" : "outline"}
                onClick={() => setFiltroNota(null)}
                size="sm"
              >
                Todas
              </Button>
              {[5, 4, 3, 2, 1].map((nota) => (
                <Button
                  key={nota}
                  variant={filtroNota === nota ? "default" : "outline"}
                  onClick={() => setFiltroNota(nota)}
                  size="sm"
                  className="gap-1"
                >
                  {nota} <Star className="h-3 w-3 fill-current" />
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Avaliações</p>
                <p className="text-3xl font-bold text-blue-700">{minhasAvaliacoes.length}</p>
              </div>
              <Star className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Média de Notas</p>
                <p className="text-3xl font-bold text-purple-700">
                  {(minhasAvaliacoes.reduce((acc, av) => acc + av.nr_nota, 0) / minhasAvaliacoes.length).toFixed(1)}
                </p>
              </div>
              <ThumbsUp className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Likes</p>
                <p className="text-3xl font-bold text-yellow-700">
                  {minhasAvaliacoes.reduce((acc, av) => acc + av.nr_likes, 0)}
                </p>
              </div>
              <ThumbsUp className="h-12 w-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {avaliacoesFiltradas.map((avaliacao) => (
          <Card key={avaliacao.id_avaliacao} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{avaliacao.nm_procedimento}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {avaliacao.nm_profissional}
                      </p>
                    </div>
                    {avaliacao.st_publicada && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">Publicada</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < avaliacao.nr_nota ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      Avaliado em {new Date(avaliacao.dt_avaliacao).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <p className="text-gray-700 leading-relaxed">{avaliacao.ds_comentario}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{avaliacao.nr_likes} pessoas acharam útil</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Procedimento em {new Date(avaliacao.dt_procedimento).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteAvaliacao(avaliacao.id_avaliacao)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {avaliacoesFiltradas.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
              <p className="text-gray-600">Tente ajustar os filtros ou faça sua primeira avaliação!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
