"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  Heart,
  Tag,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  AlertCircle,
  Settings,
  Trash2,
  Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Notificacao {
  id_notificacao: string;
  ds_tipo: "agendamento" | "promocao" | "sistema" | "lembrete" | "avaliacao";
  ds_titulo: string;
  ds_mensagem: string;
  dt_criacao: string;
  st_lida: boolean;
  ds_icone: string;
  ds_cor: string;
}

export default function NotificacoesPage() {
  const [filtroTipo, setFiltroTipo] = useState<string>("todas");
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    {
      id_notificacao: "1",
      ds_tipo: "agendamento",
      ds_titulo: "Lembrete de Agendamento",
      ds_mensagem: "Você tem um agendamento amanhã às 14:00 - Limpeza de Pele com Dra. Ana Paula Costa",
      dt_criacao: "2025-10-22T10:00:00",
      st_lida: false,
      ds_icone: "calendar",
      ds_cor: "blue",
    },
    {
      id_notificacao: "2",
      ds_tipo: "promocao",
      ds_titulo: "Promoção Especial 🎉",
      ds_mensagem: "30% de desconto em todos os procedimentos faciais nesta semana! Aproveite!",
      dt_criacao: "2025-10-22T08:30:00",
      st_lida: false,
      ds_icone: "tag",
      ds_cor: "pink",
    },
    {
      id_notificacao: "3",
      ds_tipo: "avaliacao",
      ds_titulo: "Avalie seu Procedimento",
      ds_mensagem: "Que tal avaliar o procedimento de Peeling Químico realizado em 18/10? Sua opinião é muito importante!",
      dt_criacao: "2025-10-21T16:00:00",
      st_lida: false,
      ds_icone: "heart",
      ds_cor: "purple",
    },
    {
      id_notificacao: "4",
      ds_tipo: "sistema",
      ds_titulo: "Agendamento Confirmado",
      ds_mensagem: "Seu agendamento para Massagem Relaxante foi confirmado para 25/10 às 10:00",
      dt_criacao: "2025-10-20T14:20:00",
      st_lida: true,
      ds_icone: "check",
      ds_cor: "green",
    },
    {
      id_notificacao: "5",
      ds_tipo: "lembrete",
      ds_titulo: "Lembrete de Cuidados",
      ds_mensagem: "Não esqueça de aplicar o protetor solar após o procedimento de Peeling Químico",
      dt_criacao: "2025-10-19T09:00:00",
      st_lida: true,
      ds_icone: "alert",
      ds_cor: "orange",
    },
    {
      id_notificacao: "6",
      ds_tipo: "promocao",
      ds_titulo: "Programa de Fidelidade",
      ds_mensagem: "Você acumulou 150 pontos! Troque por descontos em procedimentos.",
      dt_criacao: "2025-10-18T11:00:00",
      st_lida: true,
      ds_icone: "gift",
      ds_cor: "yellow",
    },
    {
      id_notificacao: "7",
      ds_tipo: "agendamento",
      ds_titulo: "Confirmação Necessária",
      ds_mensagem: "Por favor, confirme seu agendamento para Drenagem Linfática em 28/10",
      dt_criacao: "2025-10-17T15:00:00",
      st_lida: true,
      ds_icone: "calendar",
      ds_cor: "blue",
    },
  ]);

  const tiposNotificacao = [
    { valor: "todas", label: "Todas", icon: Bell, cor: "gray" },
    { valor: "agendamento", label: "Agendamentos", icon: Calendar, cor: "blue" },
    { valor: "promocao", label: "Promoções", icon: Tag, cor: "pink" },
    { valor: "avaliacao", label: "Avaliações", icon: Heart, cor: "purple" },
    { valor: "lembrete", label: "Lembretes", icon: AlertCircle, cor: "orange" },
    { valor: "sistema", label: "Sistema", icon: Settings, cor: "green" },
  ];

  const getIconByType = (tipo: string) => {
    const icons: { [key: string]: any } = {
      calendar: Calendar,
      tag: Tag,
      heart: Heart,
      check: CheckCircle,
      alert: AlertCircle,
      gift: Gift,
    };
    return icons[tipo] || Bell;
  };

  const getColorByType = (cor: string) => {
    const colors: { [key: string]: string } = {
      blue: "from-purple-500 to-blue-600",
      pink: "from-blue-500 to-cyan-600",
      purple: "from-purple-500 to-blue-600",
      green: "from-green-500 to-emerald-600",
      orange: "from-orange-500 to-amber-600",
      yellow: "from-yellow-500 to-orange-500",
      gray: "from-gray-500 to-slate-600",
    };
    return colors[cor] || colors.gray;
  };

  const handleMarcarComoLida = (id: string) => {
    setNotificacoes((prev) =>
      prev.map((not) => (not.id_notificacao === id ? { ...not, st_lida: true } : not))
    );
    toast.success("Notificação marcada como lida");
  };

  const handleMarcarTodasComoLidas = () => {
    setNotificacoes((prev) => prev.map((not) => ({ ...not, st_lida: true })));
    toast.success("Todas as notificações foram marcadas como lidas");
  };

  const handleExcluirNotificacao = (id: string) => {
    setNotificacoes((prev) => prev.filter((not) => not.id_notificacao !== id));
    toast.success("Notificação excluída");
  };

  const handleExcluirTodasLidas = () => {
    if (confirm("Tem certeza que deseja excluir todas as notificações lidas?")) {
      setNotificacoes((prev) => prev.filter((not) => !not.st_lida));
      toast.success("Notificações lidas foram excluídas");
    }
  };

  const notificacoesFiltradas = notificacoes.filter(
    (not) => filtroTipo === "todas" || not.ds_tipo === filtroTipo
  );

  const naoLidas = notificacoes.filter((not) => !not.st_lida);
  const lidas = notificacoes.filter((not) => not.st_lida);

  const formatarDataHora = (data: string) => {
    const dt = new Date(data);
    const agora = new Date();
    const diff = agora.getTime() - dt.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return "Agora mesmo";
    if (minutos < 60) return `Há ${minutos} minuto${minutos > 1 ? "s" : ""}`;
    if (horas < 24) return `Há ${horas} hora${horas > 1 ? "s" : ""}`;
    if (dias < 7) return `Há ${dias} dia${dias > 1 ? "s" : ""}`;
    return dt.toLocaleDateString("pt-BR");
  };

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Notificações
            </h1>
            <p className="text-gray-600 mt-1">Fique por dentro de tudo que acontece</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleMarcarTodasComoLidas}
              disabled={naoLidas.length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
            <Button variant="outline" onClick={handleExcluirTodasLidas} disabled={lidas.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar lidas
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-blue-700">{notificacoes.length}</p>
                </div>
                <Bell className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Não Lidas</p>
                  <p className="text-3xl font-bold text-orange-700">{naoLidas.length}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lidas</p>
                  <p className="text-3xl font-bold text-green-700">{lidas.length}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-gray-500" />
              {tiposNotificacao.map((tipo) => {
                const Icon = tipo.icon;
                return (
                  <Button
                    key={tipo.valor}
                    variant={filtroTipo === tipo.valor ? "default" : "outline"}
                    onClick={() => setFiltroTipo(tipo.valor)}
                    size="sm"
                    className={
                      filtroTipo === tipo.valor
                        ? `bg-gradient-to-r ${getColorByType(tipo.cor)}`
                        : ""
                    }
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tipo.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Notificações */}
        <Tabs defaultValue="todas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todas">
              Todas ({notificacoesFiltradas.length})
            </TabsTrigger>
            <TabsTrigger value="nao-lidas">
              Não Lidas ({naoLidas.filter((n) => filtroTipo === "todas" || n.ds_tipo === filtroTipo).length})
            </TabsTrigger>
            <TabsTrigger value="lidas">
              Lidas ({lidas.filter((n) => filtroTipo === "todas" || n.ds_tipo === filtroTipo).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="space-y-3 mt-6">
            {notificacoesFiltradas.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma notificação encontrada
                  </h3>
                  <p className="text-gray-600">Você está em dia com todas as suas notificações!</p>
                </CardContent>
              </Card>
            ) : (
              notificacoesFiltradas.map((not) => {
                const Icon = getIconByType(not.ds_icone);
                return (
                  <Card
                    key={not.id_notificacao}
                    className={`transition-all hover:shadow-md ${
                      !not.st_lida ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`h-12 w-12 rounded-full bg-gradient-to-br ${getColorByType(
                            not.ds_cor
                          )} flex items-center justify-center flex-shrink-0 shadow-lg`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{not.ds_titulo}</h3>
                            {!not.st_lida && (
                              <Badge className="bg-blue-500 text-white flex-shrink-0">Nova</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed mb-2">{not.ds_mensagem}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatarDataHora(not.dt_criacao)}
                            </span>
                            <div className="flex gap-2">
                              {!not.st_lida && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarcarComoLida(not.id_notificacao)}
                                  className="h-8 text-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Marcar como lida
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExcluirNotificacao(not.id_notificacao)}
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="nao-lidas" className="space-y-3 mt-6">
            {naoLidas.filter((n) => filtroTipo === "todas" || n.ds_tipo === filtroTipo).length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Você está em dia!
                  </h3>
                  <p className="text-gray-600">Não há notificações não lidas.</p>
                </CardContent>
              </Card>
            ) : (
              naoLidas
                .filter((n) => filtroTipo === "todas" || n.ds_tipo === filtroTipo)
                .map((not) => {
                  const Icon = getIconByType(not.ds_icone);
                  return (
                    <Card
                      key={not.id_notificacao}
                      className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:shadow-md transition-all"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${getColorByType(
                              not.ds_cor
                            )} flex items-center justify-center flex-shrink-0 shadow-lg`}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{not.ds_titulo}</h3>
                              <Badge className="bg-blue-500 text-white flex-shrink-0">Nova</Badge>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed mb-2">{not.ds_mensagem}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatarDataHora(not.dt_criacao)}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarcarComoLida(not.id_notificacao)}
                                  className="h-8 text-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Marcar como lida
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExcluirNotificacao(not.id_notificacao)}
                                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>

          <TabsContent value="lidas" className="space-y-3 mt-6">
            {lidas.filter((n) => filtroTipo === "todas" || n.ds_tipo === filtroTipo).length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma notificação lida
                  </h3>
                  <p className="text-gray-600">As notificações lidas aparecerão aqui.</p>
                </CardContent>
              </Card>
            ) : (
              lidas
                .filter((n) => filtroTipo === "todas" || n.ds_tipo === filtroTipo)
                .map((not) => {
                  const Icon = getIconByType(not.ds_icone);
                  return (
                    <Card key={not.id_notificacao} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${getColorByType(
                              not.ds_cor
                            )} flex items-center justify-center flex-shrink-0 shadow-lg opacity-60`}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-700">{not.ds_titulo}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed mb-2">{not.ds_mensagem}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatarDataHora(not.dt_criacao)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExcluirNotificacao(not.id_notificacao)}
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}
