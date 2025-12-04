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
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Eye,
  RefreshCw,
  Pause,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Contrato {
  id_contrato: string;
  nm_empresa: string;
  nm_pacote: string;
  vl_mensal: number;
  dt_inicio: string;
  dt_vencimento: string;
  fg_status: "active" | "suspended" | "expired";
}

export default function ParceiroContratosPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pacoteFilter, setPacoteFilter] = useState<string>("all");

  // Dados temporários de fallback
  const tempContratos: Contrato[] = [
    {
      id_contrato: "1",
      nm_empresa: "Clínica Belle Vie",
      nm_pacote: "Premium",
      vl_mensal: 799.0,
      dt_inicio: "2024-06-01",
      dt_vencimento: "2025-06-01",
      fg_status: "active",
    },
    {
      id_contrato: "2",
      nm_empresa: "Estética Avançada",
      nm_pacote: "Enterprise",
      vl_mensal: 1199.0,
      dt_inicio: "2024-03-15",
      dt_vencimento: "2025-03-15",
      fg_status: "active",
    },
    {
      id_contrato: "3",
      nm_empresa: "Beauty Center",
      nm_pacote: "Professional",
      vl_mensal: 599.0,
      dt_inicio: "2024-08-20",
      dt_vencimento: "2025-08-20",
      fg_status: "active",
    },
    {
      id_contrato: "4",
      nm_empresa: "Spa Harmonia",
      nm_pacote: "Basic",
      vl_mensal: 299.0,
      dt_inicio: "2024-01-10",
      dt_vencimento: "2025-01-10",
      fg_status: "expired",
    },
    {
      id_contrato: "5",
      nm_empresa: "Dermaclin",
      nm_pacote: "Professional",
      vl_mensal: 599.0,
      dt_inicio: "2024-07-05",
      dt_vencimento: "2025-07-05",
      fg_status: "suspended",
    },
    {
      id_contrato: "6",
      nm_empresa: "Clínica Renova",
      nm_pacote: "Premium",
      vl_mensal: 799.0,
      dt_inicio: "2024-09-12",
      dt_vencimento: "2025-09-12",
      fg_status: "active",
    },
  ];

  const stats = {
    total: tempContratos.length,
    active: tempContratos.filter((c) => c.fg_status === "active").length,
    suspended: tempContratos.filter((c) => c.fg_status === "suspended").length,
    expired: tempContratos.filter((c) => c.fg_status === "expired").length,
  };

  const filteredContratos = tempContratos.filter((contrato) => {
    const matchesSearch = contrato.nm_empresa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || contrato.fg_status === statusFilter;
    const matchesPacote = pacoteFilter === "all" || contrato.nm_pacote === pacoteFilter;
    return matchesSearch && matchesStatus && matchesPacote;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Pause className="w-3 h-3 mr-1" />
            Suspenso
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Vencido
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
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleView = (id: string) => {
    console.log("Visualizar contrato:", id);
  };

  const handleRenew = (id: string) => {
    console.log("Renovar contrato:", id);
  };

  const handleSuspend = (id: string) => {
    console.log("Suspender contrato:", id);
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
        <h1 className="text-3xl font-bold tracking-tight">Contratos Ativos</h1>
        <p className="text-muted-foreground">
          Gerencie contratos de parceiros e assinaturas ativas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">No sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Em vigência</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspensos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.suspended}</div>
            <p className="text-xs text-muted-foreground">Temporariamente inativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Necessitam renovação</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
          <CardDescription>Filtre e gerencie os contratos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pacoteFilter} onValueChange={setPacoteFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Pacote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pacotes</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContratos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhum contrato encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContratos.map((contrato) => (
                    <TableRow key={contrato.id_contrato}>
                      <TableCell className="font-medium">{contrato.nm_empresa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contrato.nm_pacote}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(contrato.vl_mensal)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(contrato.dt_inicio)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(contrato.dt_vencimento)}
                      </TableCell>
                      <TableCell>{getStatusBadge(contrato.fg_status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(contrato.id_contrato)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar Detalhes
                            </DropdownMenuItem>
                            {contrato.fg_status === "expired" && (
                              <DropdownMenuItem
                                onClick={() => handleRenew(contrato.id_contrato)}
                                className="text-green-600"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Renovar Contrato
                              </DropdownMenuItem>
                            )}
                            {contrato.fg_status === "active" && (
                              <DropdownMenuItem
                                onClick={() => handleSuspend(contrato.id_contrato)}
                                className="text-yellow-600"
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
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
          {filteredContratos.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredContratos.length} de {stats.total} contratos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
