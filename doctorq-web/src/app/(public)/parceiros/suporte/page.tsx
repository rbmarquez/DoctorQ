"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { HelpCircle, MessageSquare, Phone, Mail, Video, Book, Search, Clock, CheckCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ParceiroSuportePage() {
  const [assunto, setAssunto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // TODO: Fetch from API
  const faqItems = [
    {
      pergunta: "Como altero os dados da minha conta?",
      resposta: "Acesse 'Configurações' > 'Dados da Conta' e edite as informações desejadas. Algumas alterações podem requerer verificação.",
      categoria: "Conta",
    },
    {
      pergunta: "Qual a taxa de comissão da plataforma?",
      resposta: "A comissão varia de 5% a 15% dependendo do seu plano. Parceiros Premium têm taxas reduzidas.",
      categoria: "Financeiro",
    },
    {
      pergunta: "Como recebo meus pagamentos?",
      resposta: "Os pagamentos são feitos semanalmente via transferência bancária. Você pode configurar sua conta em 'Financeiro' > 'Dados Bancários'.",
      categoria: "Financeiro",
    },
    {
      pergunta: "Posso cancelar um pedido após confirmação?",
      resposta: "Pedidos podem ser cancelados até 2 horas após confirmação sem penalidades. Cancelamentos frequentes podem afetar sua avaliação.",
      categoria: "Pedidos",
    },
    {
      pergunta: "Como adiciono novos produtos ao catálogo?",
      resposta: "Vá em 'Produtos' > 'Adicionar Produto' e preencha todos os campos obrigatórios. Produtos passam por aprovação em até 24h.",
      categoria: "Produtos",
    },
    {
      pergunta: "O que fazer se um cliente não retira o pedido?",
      resposta: "Entre em contato com o cliente e aguarde 48h. Após esse prazo, você pode cancelar o pedido sem penalidades.",
      categoria: "Pedidos",
    },
  ];

  const tickets = [
    {
      id: "#12345",
      assunto: "Problema com pagamento",
      status: "aberto",
      data: "25/01/2025",
      prioridade: "alta",
    },
    {
      id: "#12344",
      assunto: "Dúvida sobre comissão",
      status: "respondido",
      data: "20/01/2025",
      prioridade: "media",
    },
    {
      id: "#12343",
      assunto: "Atualização de dados",
      status: "resolvido",
      data: "15/01/2025",
      prioridade: "baixa",
    },
  ];

  const canaisAtendimento = [
    {
      titulo: "Chat ao Vivo",
      descricao: "Fale com um atendente em tempo real",
      horario: "Seg-Sex: 8h às 20h",
      tempoResposta: "Imediato",
      icon: MessageSquare,
      cor: "blue",
      disponivel: true,
    },
    {
      titulo: "Telefone",
      descricao: "Ligue para nossa central",
      horario: "0800 123 4567",
      tempoResposta: "Imediato",
      icon: Phone,
      cor: "green",
      disponivel: true,
    },
    {
      titulo: "E-mail",
      descricao: "Envie sua dúvida por e-mail",
      horario: "parceiros@doctorq.com.br",
      tempoResposta: "Até 24h",
      icon: Mail,
      cor: "purple",
      disponivel: true,
    },
    {
      titulo: "Videochamada",
      descricao: "Agende uma reunião online",
      horario: "Agendamento prévio",
      tempoResposta: "Conforme agendamento",
      icon: Video,
      cor: "orange",
      disponivel: false,
    },
  ];

  const recursos = [
    {
      titulo: "Central de Ajuda",
      descricao: "Artigos e tutoriais completos",
      link: "/ajuda/categorias",
      icon: Book,
    },
    {
      titulo: "Guia do Parceiro",
      descricao: "Manual completo para parceiros",
      link: "#",
      icon: Book,
    },
    {
      titulo: "Vídeos Tutoriais",
      descricao: "Aprenda assistindo",
      link: "#",
      icon: Video,
    },
  ];

  const filteredFaq = faqItems.filter((item) =>
    item.pergunta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    // TODO: Call API to create support ticket
    if (!categoria || !assunto || !mensagem) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    alert("Ticket criado com sucesso! Você receberá uma resposta em breve.");
    setCategoria("");
    setAssunto("");
    setMensagem("");
  };

  const getStatusBadge = (status: string) => {
    if (status === "aberto") return <Badge className="bg-blue-500">Aberto</Badge>;
    if (status === "respondido") return <Badge className="bg-yellow-500">Respondido</Badge>;
    if (status === "resolvido") return <Badge className="bg-green-500">Resolvido</Badge>;
    return <Badge variant="outline">Desconhecido</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    if (prioridade === "alta") return <Badge variant="destructive">Alta</Badge>;
    if (prioridade === "media") return <Badge variant="outline">Média</Badge>;
    if (prioridade === "baixa") return <Badge variant="outline">Baixa</Badge>;
    return <Badge variant="outline">Normal</Badge>;
  };

  const getCanalColor = (cor: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      green: "bg-green-100 text-green-600 border-green-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
      orange: "bg-orange-100 text-orange-600 border-orange-200",
    };
    return colors[cor as keyof typeof colors] || colors.blue;
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-purple-500" />
            Suporte para Parceiros
          </h1>
          <p className="text-gray-600">Estamos aqui para ajudar você a ter sucesso</p>
        </div>

        {/* Canais de Atendimento */}
        <div>
          <h2 className="text-xl font-bold mb-4">Canais de Atendimento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {canaisAtendimento.map((canal, index) => {
              const Icon = canal.icon;
              return (
                <Card key={index} className={!canal.disponivel ? "opacity-60" : ""}>
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 border-2 ${getCanalColor(canal.cor)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-1">{canal.titulo}</h3>
                    <p className="text-sm text-gray-600 mb-2">{canal.descricao}</p>
                    <Separator className="my-2" />
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>{canal.horario}</p>
                      <p>Resposta: {canal.tempoResposta}</p>
                    </div>
                    {canal.disponivel ? (
                      <Button size="sm" className="w-full mt-3">
                        Usar Canal
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full mt-3" variant="outline" disabled>
                        Em Breve
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Abrir Ticket */}
        <Card>
          <CardHeader>
            <CardTitle>Abrir Ticket de Suporte</CardTitle>
            <p className="text-sm text-gray-600">
              Descreva seu problema ou dúvida detalhadamente
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conta">Conta e Perfil</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="produtos">Produtos</SelectItem>
                      <SelectItem value="pedidos">Pedidos</SelectItem>
                      <SelectItem value="tecnico">Problema Técnico</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assunto">Assunto *</Label>
                  <Input
                    id="assunto"
                    placeholder="Resuma seu problema em uma linha"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  placeholder="Descreva seu problema ou dúvida detalhadamente. Quanto mais informações, melhor poderemos ajudá-lo."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Ticket
                </Button>
                <Button variant="outline">Cancelar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meus Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Você ainda não tem tickets de suporte
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-gray-600">{ticket.id}</span>
                          {getStatusBadge(ticket.status)}
                          {getPrioridadeBadge(ticket.prioridade)}
                        </div>
                        <p className="font-semibold mb-1">{ticket.assunto}</p>
                        <p className="text-sm text-gray-600">Aberto em {ticket.data}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
            <div className="mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar nas perguntas frequentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredFaq.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma pergunta encontrada
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaq.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <HelpCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{item.pergunta}</p>
                          <Badge variant="outline">{item.categoria}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{item.resposta}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recursos Adicionais */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recursos Adicionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recursos.map((recurso, index) => {
              const Icon = recurso.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="h-8 w-8 text-purple-600 mb-3" />
                    <h3 className="font-bold mb-1">{recurso.titulo}</h3>
                    <p className="text-sm text-gray-600 mb-4">{recurso.descricao}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Acessar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Horário de Atendimento</h3>
            <p className="text-gray-700 mb-2">
              <strong>Segunda a Sexta:</strong> 8h às 20h
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Sábados:</strong> 9h às 14h
            </p>
            <p className="text-sm text-gray-600">
              Tickets enviados fora do horário serão respondidos no próximo dia útil
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
