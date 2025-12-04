"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { MessageSquare, Send, Bell, Mail, Users, FileText, Phone, Video, Clock, Check, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ParceiroComunicacaoPage() {
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [assunto, setAssunto] = useState("");

  // TODO: Fetch from API
  const conversas = [
    {
      id: "1",
      nome: "Maria Silva",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      ultima_mensagem: "Obrigada pelo atendimento!",
      horario: "10:30",
      nao_lidas: 0,
      status: "lida",
    },
    {
      id: "2",
      nome: "João Santos",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao",
      ultima_mensagem: "Quando meu pedido chega?",
      horario: "09:15",
      nao_lidas: 2,
      status: "nova",
    },
    {
      id: "3",
      nome: "Ana Costa",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
      ultima_mensagem: "Produto perfeito, recomendo!",
      horario: "Ontem",
      nao_lidas: 0,
      status: "lida",
    },
  ];

  const notificacoes = [
    {
      id: "1",
      tipo: "pedido",
      titulo: "Novo Pedido Recebido",
      descricao: "Pedido #12345 no valor de R$ 450,00",
      horario: "Há 5 min",
      lida: false,
    },
    {
      id: "2",
      tipo: "avaliacao",
      titulo: "Nova Avaliação",
      descricao: "Cliente deixou 5 estrelas no produto XYZ",
      horario: "Há 1h",
      lida: false,
    },
    {
      id: "3",
      tipo: "mensagem",
      titulo: "Nova Mensagem",
      descricao: "João Santos enviou uma mensagem",
      horario: "Há 2h",
      lida: true,
    },
  ];

  const templates = [
    {
      id: "1",
      titulo: "Confirmação de Pedido",
      conteudo: "Olá {nome}, seu pedido #{numero} foi confirmado e será enviado em breve!",
      categoria: "Pedidos",
    },
    {
      id: "2",
      titulo: "Produto Enviado",
      conteudo: "Seu pedido #{numero} foi enviado! Código de rastreamento: {rastreio}",
      categoria: "Logística",
    },
    {
      id: "3",
      titulo: "Agradecimento",
      conteudo: "Obrigado pela sua compra! Esperamos que goste dos produtos. Avalie sua experiência!",
      categoria: "Pós-venda",
    },
  ];

  const estatisticas = {
    mensagens_enviadas: 234,
    mensagens_recebidas: 189,
    tempo_resposta_medio: "12 min",
    taxa_resposta: 98.5,
  };

  const handleEnviarMensagem = () => {
    // TODO: Call API to send message
    alert("Mensagem enviada!");
    setMensagemTexto("");
  };

  const handleUsarTemplate = (template: typeof templates[0]) => {
    setMensagemTexto(template.conteudo);
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-purple-500" />
            Central de Comunicação
          </h1>
          <p className="text-gray-600">Gerencie mensagens e interações com clientes</p>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Send className="h-5 w-5 text-blue-600" />
                <Badge variant="outline">Mês</Badge>
              </div>
              <p className="text-2xl font-bold">{estatisticas.mensagens_enviadas}</p>
              <p className="text-sm text-gray-600">Mensagens Enviadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <Badge variant="outline">Mês</Badge>
              </div>
              <p className="text-2xl font-bold">{estatisticas.mensagens_recebidas}</p>
              <p className="text-sm text-gray-600">Mensagens Recebidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-green-600" />
                <Badge variant="outline">Média</Badge>
              </div>
              <p className="text-2xl font-bold">{estatisticas.tempo_resposta_medio}</p>
              <p className="text-sm text-gray-600">Tempo de Resposta</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCheck className="h-5 w-5 text-orange-600" />
                <Badge variant="outline">Taxa</Badge>
              </div>
              <p className="text-2xl font-bold">{estatisticas.taxa_resposta}%</p>
              <p className="text-sm text-gray-600">Taxa de Resposta</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="mensagens" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mensagens">
              <MessageSquare className="h-4 w-4 mr-2" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="notificacoes">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="enviar">
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </TabsTrigger>
          </TabsList>

          {/* Mensagens Tab */}
          <TabsContent value="mensagens" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conversas Recentes</CardTitle>
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversas.map((conversa) => (
                    <div
                      key={conversa.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <Avatar>
                        <AvatarImage src={conversa.avatar} />
                        <AvatarFallback>{conversa.nome[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate">{conversa.nome}</p>
                          <span className="text-xs text-gray-500">{conversa.horario}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conversa.ultima_mensagem}</p>
                      </div>
                      {conversa.nao_lidas > 0 && (
                        <Badge className="bg-purple-600">{conversa.nao_lidas}</Badge>
                      )}
                      {conversa.status === "lida" && (
                        <CheckCheck className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Respostas Rápidas</p>
                    <p className="text-sm text-gray-700 mb-3">
                      Responda mais rápido usando templates prontos. Configure respostas automáticas para
                      perguntas frequentes.
                    </p>
                    <Button variant="outline" size="sm">
                      Configurar Respostas Automáticas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notificacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Todas as Notificações</CardTitle>
                  <Button variant="outline" size="sm">
                    Marcar Todas como Lidas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notificacoes.map((notificacao) => (
                    <div
                      key={notificacao.id}
                      className={`p-4 border rounded-lg ${
                        !notificacao.lida ? "bg-purple-50 border-purple-200" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {!notificacao.lida && (
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          )}
                          <p className="font-semibold">{notificacao.titulo}</p>
                        </div>
                        <span className="text-xs text-gray-500">{notificacao.horario}</span>
                      </div>
                      <p className="text-sm text-gray-600">{notificacao.descricao}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Templates de Mensagens</CardTitle>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Criar Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{template.titulo}</p>
                            <Badge variant="outline">{template.categoria}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{template.conteudo}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleUsarTemplate(template)}>
                          Usar Template
                        </Button>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enviar Tab */}
          <TabsContent value="enviar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Mensagem</CardTitle>
                <p className="text-sm text-gray-600">
                  Envie mensagens personalizadas para seus clientes
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="destinatarios">Destinatários</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione os destinatários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Clientes</SelectItem>
                        <SelectItem value="ativos">Clientes Ativos</SelectItem>
                        <SelectItem value="inativos">Clientes Inativos</SelectItem>
                        <SelectItem value="vip">Clientes VIP</SelectItem>
                        <SelectItem value="personalizado">Selecionar Manualmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assunto">Assunto</Label>
                    <Input
                      id="assunto"
                      placeholder="Digite o assunto da mensagem"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mensagem">Mensagem</Label>
                    <Textarea
                      id="mensagem"
                      placeholder="Digite sua mensagem aqui..."
                      value={mensagemTexto}
                      onChange={(e) => setMensagemTexto(e.target.value)}
                      rows={6}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Você pode usar variáveis: {"{nome}"}, {"{pedido}"}, {"{valor}"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={handleEnviarMensagem} className="bg-gradient-to-r from-purple-600 to-blue-600">
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                    <Button variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Agendar Envio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Atenção</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Evite enviar mensagens em excesso para não ser marcado como spam</li>
                      <li>• Respeite horários comerciais (8h às 20h)</li>
                      <li>• Sempre ofereça opção de descadastramento</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Canais de Comunicação */}
        <Card>
          <CardHeader>
            <CardTitle>Canais de Comunicação Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold mb-1">E-mail</p>
                <p className="text-sm text-gray-600 mb-3">Comunicação assíncrona</p>
                <Badge className="bg-green-500">Ativo</Badge>
              </div>

              <div className="p-4 border rounded-lg text-center">
                <Phone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-semibold mb-1">WhatsApp</p>
                <p className="text-sm text-gray-600 mb-3">Mensagens instantâneas</p>
                <Button variant="outline" size="sm">
                  Conectar
                </Button>
              </div>

              <div className="p-4 border rounded-lg text-center">
                <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold mb-1">Chat Interno</p>
                <p className="text-sm text-gray-600 mb-3">Na plataforma</p>
                <Badge className="bg-green-500">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
