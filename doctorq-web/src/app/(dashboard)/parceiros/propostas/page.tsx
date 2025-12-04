"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package,
  Check,
  Plus,
  FileText,
  Clock,
  Send,
  Eye,
  AlertCircle,
  Sparkles,
  Users,
  TrendingUp,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Pacote {
  id_pacote: string;
  nm_pacote: string;
  ds_descricao: string;
  vl_mensal: number;
  qt_usuarios: number;
  qt_clinicas: number;
  fg_whatsapp: boolean;
  fg_ia_chat: boolean;
  fg_marketplace: boolean;
  fg_analises: boolean;
  fg_suporte: string;
  ds_features: string[];
}

interface Proposta {
  id_proposta: string;
  nm_empresa: string;
  nm_pacote: string;
  vl_proposta: number;
  dt_criacao: string;
  dt_envio: string | null;
  fg_status: "draft" | "sent" | "accepted" | "rejected";
}

export default function ParceiroPropostasPage() {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Dados temporários - Pacotes
  const tempPacotes: Pacote[] = [
    {
      id_pacote: "1",
      nm_pacote: "Basic",
      ds_descricao: "Ideal para profissionais autônomos iniciando no mercado",
      vl_mensal: 299.0,
      qt_usuarios: 3,
      qt_clinicas: 1,
      fg_whatsapp: false,
      fg_ia_chat: false,
      fg_marketplace: true,
      fg_analises: false,
      fg_suporte: "Email",
      ds_features: [
        "Até 3 usuários",
        "1 clínica/consultório",
        "Agenda de atendimentos",
        "Cadastro de pacientes",
        "Marketplace de produtos",
        "Suporte via email",
      ],
    },
    {
      id_pacote: "2",
      nm_pacote: "Professional",
      ds_descricao: "Para clínicas estabelecidas que buscam crescimento",
      vl_mensal: 599.0,
      qt_usuarios: 10,
      qt_clinicas: 3,
      fg_whatsapp: true,
      fg_ia_chat: true,
      fg_marketplace: true,
      fg_analises: true,
      fg_suporte: "Chat",
      ds_features: [
        "Até 10 usuários",
        "Até 3 clínicas/consultórios",
        "Todos recursos do Basic",
        "Integração WhatsApp",
        "Assistente IA",
        "Analytics básico",
        "Suporte via chat",
      ],
    },
    {
      id_pacote: "3",
      nm_pacote: "Premium",
      ds_descricao: "Solução completa para redes de clínicas",
      vl_mensal: 799.0,
      qt_usuarios: 25,
      qt_clinicas: 10,
      fg_whatsapp: true,
      fg_ia_chat: true,
      fg_marketplace: true,
      fg_analises: true,
      fg_suporte: "Telefone",
      ds_features: [
        "Até 25 usuários",
        "Até 10 clínicas/consultórios",
        "Todos recursos do Professional",
        "Analytics avançado",
        "Relatórios personalizados",
        "API de integração",
        "Suporte prioritário (telefone)",
      ],
    },
    {
      id_pacote: "4",
      nm_pacote: "Enterprise",
      ds_descricao: "Solução corporativa com recursos ilimitados",
      vl_mensal: 1199.0,
      qt_usuarios: 999,
      qt_clinicas: 999,
      fg_whatsapp: true,
      fg_ia_chat: true,
      fg_marketplace: true,
      fg_analises: true,
      fg_suporte: "Dedicado",
      ds_features: [
        "Usuários ilimitados",
        "Clínicas ilimitadas",
        "Todos recursos do Premium",
        "White label",
        "SLA garantido",
        "Gerente de conta dedicado",
        "Treinamento personalizado",
        "Customizações sob demanda",
      ],
    },
  ];

  // Dados temporários - Propostas
  const tempPropostas: Proposta[] = [
    {
      id_proposta: "1",
      nm_empresa: "Clínica Belle Vie",
      nm_pacote: "Premium",
      vl_proposta: 799.0,
      dt_criacao: "2025-01-08T10:00:00",
      dt_envio: "2025-01-08T14:30:00",
      fg_status: "sent",
    },
    {
      id_proposta: "2",
      nm_empresa: "Estética Avançada",
      nm_pacote: "Enterprise",
      vl_proposta: 1199.0,
      dt_criacao: "2025-01-07T09:15:00",
      dt_envio: "2025-01-07T16:00:00",
      fg_status: "accepted",
    },
    {
      id_proposta: "3",
      nm_empresa: "Beauty Center",
      nm_pacote: "Professional",
      vl_proposta: 599.0,
      dt_criacao: "2025-01-06T11:20:00",
      dt_envio: null,
      fg_status: "draft",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <FileText className="w-3 h-3 mr-1" />
            Rascunho
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Send className="w-3 h-3 mr-1" />
            Enviada
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            Aceita
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejeitada
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCreateProposal = () => {
    console.log("Criar nova proposta");
    setModalOpen(false);
    // Implementação futura
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propostas Comerciais</h1>
          <p className="text-muted-foreground">
            Pacotes disponíveis e propostas enviadas para parceiros
          </p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Proposta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Nova Proposta</DialogTitle>
              <DialogDescription>
                Selecione um pacote e personalize a proposta para o cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Funcionalidade em desenvolvimento. Em breve você poderá criar propostas
                personalizadas diretamente por aqui.
              </p>
              <Button onClick={handleCreateProposal} className="w-full">
                Continuar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Package Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pacotes Disponíveis</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tempPacotes.map((pacote) => (
            <Card
              key={pacote.id_pacote}
              className={`relative ${
                pacote.nm_pacote === "Premium" ? "border-primary shadow-lg" : ""
              }`}
            >
              {pacote.nm_pacote === "Premium" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8 text-primary" />
                  {pacote.nm_pacote === "Enterprise" && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Enterprise
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl mt-4">{pacote.nm_pacote}</CardTitle>
                <CardDescription className="min-h-[40px]">
                  {pacote.ds_descricao}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-t pt-4">
                  <div className="text-3xl font-bold">{formatCurrency(pacote.vl_mensal)}</div>
                  <p className="text-sm text-muted-foreground">por mês</p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {pacote.qt_usuarios === 999 ? "Ilimitados" : `Até ${pacote.qt_usuarios}`}{" "}
                      usuários
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {pacote.qt_clinicas === 999 ? "Ilimitadas" : `Até ${pacote.qt_clinicas}`}{" "}
                      clínicas
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 border-t pt-4">
                  {pacote.ds_features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="outline" className="w-full mt-4">
                  Usar Este Pacote
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Proposals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Propostas Enviadas</CardTitle>
          <CardDescription>Histórico de propostas criadas e enviadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Data Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tempPropostas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhuma proposta encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  tempPropostas.map((proposta) => (
                    <TableRow key={proposta.id_proposta}>
                      <TableCell className="font-medium">{proposta.nm_empresa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{proposta.nm_pacote}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(proposta.vl_proposta)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(proposta.dt_criacao)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(proposta.dt_envio)}
                      </TableCell>
                      <TableCell>{getStatusBadge(proposta.fg_status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {tempPropostas.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {tempPropostas.length} propostas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
