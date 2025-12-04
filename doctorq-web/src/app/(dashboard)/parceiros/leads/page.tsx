"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lead {
  id_lead: string;
  nm_empresa: string;
  nm_contato: string;
  ds_email: string;
  nm_telefone: string;
  nm_pacote: string;
  dt_criacao: string;
  fg_status: "pending" | "approved" | "rejected";
}

export default function ParceiroLeadsPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dados temporários de fallback
  const tempLeads: Lead[] = [
    {
      id_lead: "1",
      nm_empresa: "Clínica Belle Vie",
      nm_contato: "Ana Paula Santos",
      ds_email: "ana.paula@bellevie.com.br",
      nm_telefone: "(11) 98765-4321",
      nm_pacote: "Premium",
      dt_criacao: "2025-01-08T10:30:00",
      fg_status: "pending",
    },
    {
      id_lead: "2",
      nm_empresa: "Estética Avançada",
      nm_contato: "Dr. Carlos Silva",
      ds_email: "carlos@esteticaavancada.com.br",
      nm_telefone: "(21) 99876-5432",
      nm_pacote: "Enterprise",
      dt_criacao: "2025-01-07T14:20:00",
      fg_status: "approved",
    },
    {
      id_lead: "3",
      nm_empresa: "Beauty Center",
      nm_contato: "Mariana Costa",
      ds_email: "mariana@beautycenter.com.br",
      nm_telefone: "(11) 97654-3210",
      nm_pacote: "Professional",
      dt_criacao: "2025-01-06T09:15:00",
      fg_status: "approved",
    },
    {
      id_lead: "4",
      nm_empresa: "Dermaclin",
      nm_contato: "Roberto Mendes",
      ds_email: "roberto@dermaclin.com.br",
      nm_telefone: "(31) 98123-4567",
      nm_pacote: "Basic",
      dt_criacao: "2025-01-05T16:45:00",
      fg_status: "rejected",
    },
    {
      id_lead: "5",
      nm_empresa: "Spa Harmonia",
      nm_contato: "Juliana Ferreira",
      ds_email: "juliana@spaharmonia.com.br",
      nm_telefone: "(41) 99234-5678",
      nm_pacote: "Premium",
      dt_criacao: "2025-01-08T11:00:00",
      fg_status: "pending",
    },
  ];

  const stats = {
    total: tempLeads.length,
    pending: tempLeads.filter((l) => l.fg_status === "pending").length,
    approved: tempLeads.filter((l) => l.fg_status === "approved").length,
    rejected: tempLeads.filter((l) => l.fg_status === "rejected").length,
  };

  const filteredLeads = tempLeads.filter((lead) => {
    const matchesSearch =
      lead.nm_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nm_contato.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.ds_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.fg_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleApprove = (id: string) => {
    console.log("Aprovar lead:", id);
    // Implementação futura com API
  };

  const handleReject = (id: string) => {
    console.log("Rejeitar lead:", id);
    // Implementação futura com API
  };

  const handleView = (id: string) => {
    console.log("Visualizar lead:", id);
    // Implementação futura com modal ou página de detalhes
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Leads</h1>
        <p className="text-muted-foreground">
          Gerencie leads de parceiros interessados nos pacotes DoctorQ
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Convertidos em parceiros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Não qualificados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>Filtre e gerencie os leads cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, contato ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhum lead encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id_lead}>
                      <TableCell className="font-medium">{lead.nm_empresa}</TableCell>
                      <TableCell>{lead.nm_contato}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.ds_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.nm_pacote}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(lead.dt_criacao)}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.fg_status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(lead.id_lead)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar Detalhes
                            </DropdownMenuItem>
                            {lead.fg_status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(lead.id_lead)}
                                  className="text-green-600"
                                >
                                  <ThumbsUp className="h-4 w-4 mr-2" />
                                  Aprovar Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(lead.id_lead)}
                                  className="text-red-600"
                                >
                                  <ThumbsDown className="h-4 w-4 mr-2" />
                                  Rejeitar Lead
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          {filteredLeads.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredLeads.length} de {stats.total} leads
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
