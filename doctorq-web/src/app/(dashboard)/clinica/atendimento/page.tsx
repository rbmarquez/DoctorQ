"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Search,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Star,
  Archive,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
  Info,
  CalendarDays,
  UserCircle,
  Stethoscope,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Conversa {
  id: string;
  paciente: {
    nome: string;
    avatar?: string;
    iniciais: string;
  };
  ultimaMensagem: string;
  horario: string;
  naoLidas: number;
  status: "ativa" | "aguardando" | "resolvida";
  protocolo: string;
}

interface Mensagem {
  id: string;
  autor: "paciente" | "agente";
  texto: string;
  horario: string;
  lida: boolean;
}

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  avatar?: string;
  iniciais: string;
}

interface HorarioDisponivel {
  data: string;
  diaSemana: string;
  horarios: {
    hora: string;
    disponivel: boolean;
    profissional: string;
  }[];
}

// Dados mock
const CONVERSAS_MOCK: Conversa[] = [
  {
    id: "1",
    paciente: { nome: "Maria Silva", iniciais: "MS" },
    ultimaMensagem: "Gostaria de saber sobre o procedimento de limpeza de pele",
    horario: "10:45",
    naoLidas: 2,
    status: "ativa",
    protocolo: "#20250108-001",
  },
  {
    id: "2",
    paciente: { nome: "João Santos", iniciais: "JS" },
    ultimaMensagem: "Preciso remarcar meu agendamento para amanhã",
    horario: "10:32",
    naoLidas: 0,
    status: "aguardando",
    protocolo: "#20250108-002",
  },
  {
    id: "3",
    paciente: { nome: "Ana Costa", iniciais: "AC" },
    ultimaMensagem: "Obrigada pelo atendimento! Ficou perfeito",
    horario: "10:15",
    naoLidas: 0,
    status: "resolvida",
    protocolo: "#20250108-003",
  },
  {
    id: "4",
    paciente: { nome: "Carlos Mendes", iniciais: "CM" },
    ultimaMensagem: "Quanto custa o peeling químico?",
    horario: "09:58",
    naoLidas: 1,
    status: "ativa",
    protocolo: "#20250108-004",
  },
  {
    id: "5",
    paciente: { nome: "Juliana Lima", iniciais: "JL" },
    ultimaMensagem: "Vocês atendem aos sábados?",
    horario: "09:42",
    naoLidas: 0,
    status: "aguardando",
    protocolo: "#20250108-005",
  },
];

const MENSAGENS_MOCK: Record<string, Mensagem[]> = {
  "1": [
    {
      id: "1",
      autor: "paciente",
      texto: "Olá! Gostaria de saber mais informações sobre limpeza de pele profunda.",
      horario: "10:40",
      lida: true,
    },
    {
      id: "2",
      autor: "agente",
      texto: "Olá Maria! Seja bem-vinda à Clínica Bella Donna. Temos sim o procedimento de limpeza de pele profunda. É um tratamento que inclui extração de cravos, esfoliação e hidratação.",
      horario: "10:41",
      lida: true,
    },
    {
      id: "3",
      autor: "paciente",
      texto: "Qual o valor e quanto tempo dura?",
      horario: "10:43",
      lida: true,
    },
    {
      id: "4",
      autor: "agente",
      texto: "O valor é R$ 150,00 e a sessão dura aproximadamente 60 minutos. Temos disponibilidade para esta semana. Gostaria de agendar?",
      horario: "10:44",
      lida: true,
    },
    {
      id: "5",
      autor: "paciente",
      texto: "Gostaria de saber sobre o procedimento de limpeza de pele",
      horario: "10:45",
      lida: false,
    },
  ],
  "4": [
    {
      id: "1",
      autor: "paciente",
      texto: "Boa tarde! Quanto custa o peeling químico?",
      horario: "09:58",
      lida: false,
    },
  ],
};

const PROFISSIONAIS_MOCK: Profissional[] = [
  { id: "1", nome: "Dra. Juliana Ferreira", especialidade: "Dermatologista", iniciais: "JF" },
  { id: "2", nome: "Dr. Roberto Lima", especialidade: "Esteticista", iniciais: "RL" },
  { id: "3", nome: "Dra. Camila Santos", especialidade: "Fisioterapeuta", iniciais: "CS" },
];

const HORARIOS_DISPONIVEIS_MOCK: HorarioDisponivel[] = [
  {
    data: "2025-01-09",
    diaSemana: "Quinta",
    horarios: [
      { hora: "08:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "09:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "10:00", disponivel: false, profissional: "" },
      { hora: "11:00", disponivel: true, profissional: "Dra. Camila Santos" },
      { hora: "14:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "15:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "16:00", disponivel: false, profissional: "" },
    ],
  },
  {
    data: "2025-01-10",
    diaSemana: "Sexta",
    horarios: [
      { hora: "08:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "09:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "10:00", disponivel: true, profissional: "Dra. Camila Santos" },
      { hora: "11:00", disponivel: false, profissional: "" },
      { hora: "14:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "15:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "16:00", disponivel: true, profissional: "Dra. Camila Santos" },
    ],
  },
  {
    data: "2025-01-11",
    diaSemana: "Sábado",
    horarios: [
      { hora: "08:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "09:00", disponivel: true, profissional: "Dra. Camila Santos" },
      { hora: "10:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "11:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "12:00", disponivel: false, profissional: "" },
    ],
  },
  {
    data: "2025-01-12",
    diaSemana: "Domingo",
    horarios: [],
  },
  {
    data: "2025-01-13",
    diaSemana: "Segunda",
    horarios: [
      { hora: "08:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "09:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "10:00", disponivel: true, profissional: "Dra. Camila Santos" },
      { hora: "14:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "15:00", disponivel: false, profissional: "" },
      { hora: "16:00", disponivel: true, profissional: "Dr. Roberto Lima" },
    ],
  },
  {
    data: "2025-01-14",
    diaSemana: "Terça",
    horarios: [
      { hora: "08:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "09:00", disponivel: true, profissional: "Dra. Camila Santos" },
      { hora: "10:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "11:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "14:00", disponivel: false, profissional: "" },
      { hora: "15:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "16:00", disponivel: true, profissional: "Dra. Camila Santos" },
    ],
  },
  {
    data: "2025-01-15",
    diaSemana: "Quarta",
    horarios: [
      { hora: "08:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "09:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "10:00", disponivel: false, profissional: "" },
      { hora: "11:00", disponivel: true, profissional: "Dra. Camila Santos" },
      { hora: "14:00", disponivel: true, profissional: "Dra. Juliana Ferreira" },
      { hora: "15:00", disponivel: true, profissional: "Dr. Roberto Lima" },
      { hora: "16:00", disponivel: true, profissional: "Dra. Camila Santos" },
    ],
  },
];

export default function AtendimentoPage() {
  const [conversaSelecionada, setConversaSelecionada] = useState<string>("1");
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [infoColapsed, setInfoColapsed] = useState(false);
  const [agendaExpanded, setAgendaExpanded] = useState(false);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<string>("");
  const [dataSelecionada, setDataSelecionada] = useState<string>("2025-01-09");
  const [visualizacao, setVisualizacao] = useState<"dia" | "semana" | "mes">("semana");

  const conversaAtual = CONVERSAS_MOCK.find((c) => c.id === conversaSelecionada);
  const mensagens = MENSAGENS_MOCK[conversaSelecionada] || [];

  const conversasFiltradas = CONVERSAS_MOCK.filter((conv) =>
    conv.paciente.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnviarMensagem = () => {
    if (!mensagemTexto.trim()) return;
    // Aqui seria a lógica de enviar mensagem
    alert(`Mensagem enviada: ${mensagemTexto}`);
    setMensagemTexto("");
  };

  const handleAgendar = (data: string, hora: string, profissional: string) => {
    alert(
      `Agendamento solicitado:\nData: ${data}\nHorário: ${hora}\nProfissional: ${profissional}\nPaciente: ${conversaAtual?.paciente.nome}`
    );
    setAgendaExpanded(false);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      ativa: { variant: "default", label: "Ativa", icon: MessageSquare },
      aguardando: { variant: "outline", label: "Aguardando", icon: Clock },
      resolvida: { variant: "secondary", label: "Resolvida", icon: CheckCircle2 },
    };
    const config = configs[status] || configs.ativa;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Filtrar horários baseado na visualização
  const horariosExibidos = useMemo(() => {
    if (visualizacao === "dia") {
      return HORARIOS_DISPONIVEIS_MOCK.filter((dia) => dia.data === dataSelecionada);
    } else if (visualizacao === "semana") {
      // Próximos 7 dias a partir da data selecionada
      const dataInicio = new Date(dataSelecionada);
      return HORARIOS_DISPONIVEIS_MOCK.filter((dia) => {
        const diaDate = new Date(dia.data);
        const diffDays = Math.floor((diaDate.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays < 7;
      });
    } else {
      // Mês inteiro (simplificado - todos os dias mock)
      return HORARIOS_DISPONIVEIS_MOCK;
    }
  }, [visualizacao, dataSelecionada]);

  // Calcular a largura das colunas baseado no estado dos painéis
  const conversasColSpan = "lg:col-span-2";
  const chatColSpan = useMemo(() => {
    if (agendaExpanded && !infoColapsed) return "lg:col-span-4";
    if (agendaExpanded && infoColapsed) return "lg:col-span-6";
    if (!agendaExpanded && infoColapsed) return "lg:col-span-10";
    return "lg:col-span-7"; // Padrão: agenda fechada, info aberto
  }, [infoColapsed, agendaExpanded]);

  const infoColSpan = "lg:col-span-3";
  const agendaColSpan = "lg:col-span-3";

  return (
    <div className="h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="flex flex-col gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atendimento Humano</h1>
          <p className="text-muted-foreground">
            Converse em tempo real com os pacientes da clínica
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 h-[calc(100%-5rem)]">
        {/* Coluna 1: Lista de Conversas (2 cols) */}
        <Card className={`col-span-12 ${conversasColSpan} flex flex-col`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Conversas
              <Badge variant="secondary" className="ml-auto text-xs">
                {CONVERSAS_MOCK.length}
              </Badge>
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-3 pt-0">
                {conversasFiltradas.map((conversa) => (
                  <button
                    key={conversa.id}
                    onClick={() => setConversaSelecionada(conversa.id)}
                    className={`w-full p-2 rounded-lg text-left transition-colors hover:bg-muted ${
                      conversaSelecionada === conversa.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conversa.paciente.avatar} />
                        <AvatarFallback className="text-xs">{conversa.paciente.iniciais}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-xs truncate">
                            {conversa.paciente.nome}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {conversa.horario}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {conversa.ultimaMensagem}
                        </p>
                        <div className="flex items-center justify-between">
                          {getStatusBadge(conversa.status)}
                          {conversa.naoLidas > 0 && (
                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center rounded-full text-xs">
                              {conversa.naoLidas}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Coluna 2: Área de Mensagens (dinâmica) */}
        <Card className={`col-span-12 ${chatColSpan} flex flex-col`}>
          {conversaAtual ? (
            <>
              {/* Header do Chat */}
              <CardHeader className="border-b py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={conversaAtual.paciente.avatar} />
                      <AvatarFallback className="text-xs">{conversaAtual.paciente.iniciais}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm">{conversaAtual.paciente.nome}</h3>
                      <p className="text-xs text-muted-foreground">
                        {conversaAtual.protocolo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Video className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={agendaExpanded ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setAgendaExpanded(!agendaExpanded)}
                      title="Agenda de Profissionais"
                      className="h-7 w-7"
                    >
                      <CalendarDays className="h-3 w-3" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Star className="h-3 w-3 mr-2" />
                          Favoritar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-3 w-3 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {/* Mensagens */}
              <CardContent className="flex-1 p-3 overflow-hidden">
                <ScrollArea className="h-full pr-3">
                  <div className="space-y-3">
                    {mensagens.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.autor === "agente" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-1.5 ${
                            msg.autor === "agente"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-xs">{msg.texto}</p>
                          <span
                            className={`text-xs mt-0.5 block ${
                              msg.autor === "agente"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {msg.horario}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input de Mensagem */}
              <CardContent className="border-t p-2">
                <div className="flex items-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Paperclip className="h-3 w-3" />
                  </Button>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={mensagemTexto}
                    onChange={(e) => setMensagemTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEnviarMensagem();
                      }
                    }}
                    className="min-h-[50px] max-h-[100px] resize-none text-xs"
                  />
                  <Button onClick={handleEnviarMensagem} size="icon" className="h-7 w-7">
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Selecione uma conversa para começar</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Coluna 3: Informações do Paciente (3 cols, colapsável com Tabs) */}
        {!infoColapsed && (
          <Card className={`col-span-12 ${infoColSpan} flex flex-col`}>
            {conversaAtual ? (
              <>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Informações</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setInfoColapsed(true)}
                      title="Recolher painel"
                      className="h-6 w-6"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <Tabs defaultValue="info" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 mx-3 h-8">
                      <TabsTrigger value="info" className="text-xs py-1">
                        <Info className="h-3 w-3 mr-1" />
                        Info
                      </TabsTrigger>
                      <TabsTrigger value="historico" className="text-xs py-1">
                        <History className="h-3 w-3 mr-1" />
                        Histórico
                      </TabsTrigger>
                      <TabsTrigger value="perfil" className="text-xs py-1">
                        <UserCircle className="h-3 w-3 mr-1" />
                        Perfil
                      </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1">
                      {/* Tab: Informações */}
                      <TabsContent value="info" className="p-3 mt-0">
                        <div className="space-y-4">
                          <div className="flex flex-col items-center text-center">
                            <Avatar className="h-16 w-16 mb-2">
                              <AvatarImage src={conversaAtual.paciente.avatar} />
                              <AvatarFallback className="text-lg">
                                {conversaAtual.paciente.iniciais}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-sm">{conversaAtual.paciente.nome}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Paciente desde Jan 2024
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">Protocolo</span>
                              <span className="text-xs font-medium">{conversaAtual.protocolo}</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">Status</span>
                              {getStatusBadge(conversaAtual.status)}
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">Última msg</span>
                              <span className="text-xs font-medium">{conversaAtual.horario}</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">Telefone</span>
                              <span className="text-xs font-medium">(11) 98765-4321</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b">
                              <span className="text-xs text-muted-foreground">E-mail</span>
                              <span className="text-xs font-medium truncate">
                                {conversaAtual.paciente.nome.toLowerCase().split(" ")[0]}@email.com
                              </span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Tab: Histórico */}
                      <TabsContent value="historico" className="p-3 mt-0">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-xs mb-2">Histórico de Atendimentos</h4>
                          <div className="space-y-2">
                            <div className="p-2 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium">Limpeza de Pele</span>
                                <Badge variant="outline" className="text-xs h-4 px-1">Concluído</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-0.5">05/01/2025 - 14:00</p>
                              <p className="text-xs text-muted-foreground">
                                Profissional: Dra. Juliana Ferreira
                              </p>
                            </div>
                            <div className="p-2 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium">Peeling Químico</span>
                                <Badge variant="outline" className="text-xs h-4 px-1">Agendado</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-0.5">15/01/2025 - 10:00</p>
                              <p className="text-xs text-muted-foreground">
                                Profissional: Dr. Roberto Lima
                              </p>
                            </div>
                            <div className="p-2 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium">Hidratação Facial</span>
                                <Badge variant="secondary" className="text-xs h-4 px-1">Cancelado</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-0.5">28/12/2024 - 16:00</p>
                              <p className="text-xs text-muted-foreground">
                                Profissional: Dra. Camila Santos
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Tab: Perfil Completo */}
                      <TabsContent value="perfil" className="p-3 mt-0">
                        <div className="space-y-3">
                          <div className="flex flex-col items-center text-center mb-3">
                            <Avatar className="h-14 w-14 mb-1.5">
                              <AvatarImage src={conversaAtual.paciente.avatar} />
                              <AvatarFallback className="text-base">
                                {conversaAtual.paciente.iniciais}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-sm">{conversaAtual.paciente.nome}</h3>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-xs">Dados Pessoais</h4>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">CPF:</span>
                                <span className="font-medium">123.456.789-00</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Data Nasc.:</span>
                                <span className="font-medium">15/05/1990</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Gênero:</span>
                                <span className="font-medium">Feminino</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-xs">Contato</h4>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Celular:</span>
                                <span className="font-medium">(11) 98765-4321</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-muted-foreground">E-mail:</span>
                                <span className="font-medium text-xs break-all">
                                  {conversaAtual.paciente.nome.toLowerCase().split(" ")[0]}@email.com
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-xs">Endereço</h4>
                            <div className="text-xs text-muted-foreground">
                              <p>Rua das Flores, 123</p>
                              <p>Jardim Paulista - São Paulo/SP</p>
                              <p>CEP: 01234-567</p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-xs">Observações</h4>
                            <p className="text-xs text-muted-foreground">
                              Paciente com pele sensível. Evitar produtos com ácido salicílico.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-xs">Nenhum paciente selecionado</p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Botão para expandir painel de informações quando colapsado */}
        {infoColapsed && !agendaExpanded && (
          <div className="col-span-12 lg:col-span-1 flex items-start justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setInfoColapsed(false)}
              title="Expandir painel de informações"
              className="mt-2 h-7 w-7"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Painel de Agenda dos Profissionais (3 cols, expandível) */}
        {agendaExpanded && (
          <Card className={`col-span-12 ${agendaColSpan} flex flex-col`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Agenda
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAgendaExpanded(false)}
                  title="Fechar agenda"
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Agende para {conversaAtual?.paciente.nome}
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden space-y-2 p-3">
              {/* Filtros e Controles */}
              <div className="space-y-2">
                {/* Tipo de Visualização */}
                <div className="flex gap-1">
                  <Button
                    variant={visualizacao === "dia" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVisualizacao("dia")}
                    className="flex-1 h-7 text-xs"
                  >
                    Dia
                  </Button>
                  <Button
                    variant={visualizacao === "semana" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVisualizacao("semana")}
                    className="flex-1 h-7 text-xs"
                  >
                    Semana
                  </Button>
                  <Button
                    variant={visualizacao === "mes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVisualizacao("mes")}
                    className="flex-1 h-7 text-xs"
                  >
                    Mês
                  </Button>
                </div>

                {/* Seletor de Data */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Data</label>
                  <Input
                    type="date"
                    value={dataSelecionada}
                    onChange={(e) => setDataSelecionada(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Seletor de Profissional */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Profissional</label>
                  <Select value={profissionalSelecionado} onValueChange={setProfissionalSelecionado}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os profissionais</SelectItem>
                      {PROFISSIONAIS_MOCK.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Calendário de Horários */}
              <ScrollArea className="h-[calc(100%-10rem)]">
                <div className="space-y-4 pr-3">
                  {horariosExibidos.map((dia) => (
                    <div key={dia.data} className="space-y-2">
                      <div className="sticky top-0 bg-background z-10 pb-1">
                        <h3 className="font-semibold text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dia.diaSemana} - {dia.data}
                        </h3>
                      </div>
                      {dia.horarios.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Sem atendimento</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          {dia.horarios
                            .filter((horario) => {
                              if (!profissionalSelecionado || profissionalSelecionado === "todos") {
                                return true;
                              }
                              const prof = PROFISSIONAIS_MOCK.find((p) => p.id === profissionalSelecionado);
                              return horario.profissional === prof?.nome;
                            })
                            .map((horario, idx) => (
                              <Button
                                key={idx}
                                variant={horario.disponivel ? "outline" : "secondary"}
                                disabled={!horario.disponivel}
                                onClick={() =>
                                  horario.disponivel &&
                                  handleAgendar(dia.data, horario.hora, horario.profissional)
                                }
                                className="w-full flex flex-col items-start h-auto py-1.5 px-2"
                              >
                                <div className="flex items-center gap-0.5 font-semibold text-xs">
                                  <Clock className="h-2.5 w-2.5" />
                                  {horario.hora}
                                </div>
                                {horario.disponivel && (
                                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground mt-0.5">
                                    <Stethoscope className="h-2.5 w-2.5" />
                                    <span className="truncate text-xs">
                                      {horario.profissional.split(" ").slice(0, 2).join(" ")}
                                    </span>
                                  </div>
                                )}
                                {!horario.disponivel && (
                                  <span className="text-xs text-muted-foreground mt-0.5">Indisponível</span>
                                )}
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
