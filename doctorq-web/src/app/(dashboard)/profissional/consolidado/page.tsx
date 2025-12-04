"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, FileText, Building2, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Agendamento {
  id_agendamento: string;
  dt_agendamento: string;
  hr_inicio: string;
  hr_fim: string;
  ds_status: string;
  ds_servico: string;
  vl_valor: number;
  clinica: {
    id_clinica: string;
    nm_clinica: string;
  };
  paciente: {
    id_paciente: string;
    nm_paciente: string;
  };
}

interface Paciente {
  id_paciente: string;
  nm_paciente: string;
  ds_email: string;
  nr_telefone: string;
  qt_agendamentos_total: number;
  clinicas_atendimento: string[];
}

interface Prontuario {
  id_prontuario: string;
  dt_consulta: string;
  ds_queixa_principal: string;
  ds_diagnostico: string;
  clinica: {
    nm_clinica: string;
  };
  paciente: {
    nm_paciente: string;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function ProfissionalConsolidadoPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("agendamentos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para agendamentos
  const [agendamentos, setAgendamentos] = useState<PaginatedResponse<Agendamento> | null>(null);
  const [agendamentosPage, setAgendamentosPage] = useState(1);
  const [agendamentosStatus, setAgendamentosStatus] = useState<string>("all");
  const [agendamentosDataInicio, setAgendamentosDataInicio] = useState<string>("");
  const [agendamentosDataFim, setAgendamentosDataFim] = useState<string>("");
  const [agendamentosClinica, setAgendamentosClinica] = useState<string>("all");

  // Estados para pacientes
  const [pacientes, setPacientes] = useState<PaginatedResponse<Paciente> | null>(null);
  const [pacientesPage, setPacientesPage] = useState(1);
  const [pacientesSearch, setPacientesSearch] = useState("");
  const [pacientesClinica, setPacientesClinica] = useState<string>("all");

  // Estados para prontuários
  const [prontuarios, setProntuarios] = useState<PaginatedResponse<Prontuario> | null>(null);
  const [prontuariosPage, setProntuariosPage] = useState(1);
  const [prontuariosDataInicio, setProntuariosDataInicio] = useState<string>("");
  const [prontuariosDataFim, setProntuariosDataFim] = useState<string>("");

  // Estatísticas
  const [stats, setStats] = useState<any>(null);

  // Lista de clínicas (para filtros)
  const [clinicas, setClinicas] = useState<Array<{id: string; nome: string}>>([]);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
      fetchClinicas();
      if (activeTab === "agendamentos") {
        fetchAgendamentos();
      } else if (activeTab === "pacientes") {
        fetchPacientes();
      } else if (activeTab === "prontuarios") {
        fetchProntuarios();
      }
    }
  }, [
    session,
    activeTab,
    agendamentosPage,
    agendamentosStatus,
    agendamentosDataInicio,
    agendamentosDataFim,
    agendamentosClinica,
    pacientesPage,
    pacientesSearch,
    pacientesClinica,
    prontuariosPage,
    prontuariosDataInicio,
    prontuariosDataFim,
  ]);

  const fetchStats = async () => {
    try {
      const profissionalId = session?.user?.id_profissional || session?.user?.id;
      const response = await fetch(`/api/profissionais/${profissionalId}/estatisticas`);

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
    }
  };

  const fetchClinicas = async () => {
    try {
      const profissionalId = session?.user?.id_profissional || session?.user?.id;
      const response = await fetch(`/api/profissionais/${profissionalId}/clinicas`);

      if (response.ok) {
        const data = await response.json();
        // Assumir que retorna array de clínicas
        if (Array.isArray(data)) {
          setClinicas(data.map((c: any) => ({
            id: c.id_clinica,
            nome: c.nm_clinica || c.nm_fantasia || "Clínica sem nome"
          })));
        }
      }
    } catch (err) {
      console.error("Erro ao buscar clínicas:", err);
      // Em caso de erro, usar lista vazia
      setClinicas([]);
    }
  };

  const fetchAgendamentos = async () => {
    try {
      setLoading(true);
      setError(null);

      const profissionalId = session?.user?.id_profissional || session?.user?.id;
      const params = new URLSearchParams({
        page: agendamentosPage.toString(),
        size: "20",
      });

      if (agendamentosStatus !== "all") {
        params.append("status", agendamentosStatus);
      }

      if (agendamentosDataInicio) {
        params.append("dt_inicio", agendamentosDataInicio);
      }

      if (agendamentosDataFim) {
        params.append("dt_fim", agendamentosDataFim);
      }

      if (agendamentosClinica !== "all") {
        params.append("id_clinica", agendamentosClinica);
      }

      const response = await fetch(
        `/api/profissionais/${profissionalId}/agendas/consolidadas?${params}`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar agendamentos");
      }

      const data = await response.json();
      setAgendamentos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      setError(null);

      const profissionalId = session?.user?.id_profissional || session?.user?.id;
      const params = new URLSearchParams({
        page: pacientesPage.toString(),
        size: "20",
      });

      if (pacientesSearch) {
        params.append("search", pacientesSearch);
      }

      if (pacientesClinica !== "all") {
        params.append("id_clinica", pacientesClinica);
      }

      const response = await fetch(
        `/api/profissionais/${profissionalId}/pacientes?${params}`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar pacientes");
      }

      const data = await response.json();
      setPacientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const fetchProntuarios = async () => {
    try {
      setLoading(true);
      setError(null);

      const profissionalId = session?.user?.id_profissional || session?.user?.id;
      const params = new URLSearchParams({
        page: prontuariosPage.toString(),
        size: "20",
      });

      if (prontuariosDataInicio) {
        params.append("dt_inicio", prontuariosDataInicio);
      }

      if (prontuariosDataFim) {
        params.append("dt_fim", prontuariosDataFim);
      }

      const response = await fetch(
        `/api/profissionais/${profissionalId}/prontuarios?${params}`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar prontuários");
      }

      const data = await response.json();
      setProntuarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      agendado: { label: "Agendado", className: "bg-blue-100 text-blue-800" },
      confirmado: { label: "Confirmado", className: "bg-green-100 text-green-800" },
      cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800" },
      concluido: { label: "Concluído", className: "bg-gray-100 text-gray-800" },
    };

    const config = variants[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (!session) {
    return <div className="p-6">Carregando sessão...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Consolidada</h1>
        <p className="text-muted-foreground">
          Todos os seus atendimentos em um só lugar
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clínicas Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qt_clinicas_ativas || 0}</div>
              <p className="text-xs text-muted-foreground">
                Locais de atendimento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qt_pacientes_total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total de pacientes atendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos (Mês)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qt_agendamentos_mes_atual || 0}</div>
              <p className="text-xs text-muted-foreground">
                Consultas este mês
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Agendamentos por Período */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Agendamentos ao Longo do Tempo</CardTitle>
              <CardDescription>Consultas realizadas nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { mes: "Ago", agendamentos: 42, concluidos: 38 },
                    { mes: "Set", agendamentos: 51, concluidos: 47 },
                    { mes: "Out", agendamentos: 58, concluidos: 54 },
                    { mes: "Nov", agendamentos: 63, concluidos: 59 },
                    { mes: "Dez", agendamentos: 71, concluidos: 67 },
                    { mes: "Jan", agendamentos: 78, concluidos: 72 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="agendamentos"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total Agendamentos"
                  />
                  <Line
                    type="monotone"
                    dataKey="concluidos"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Concluídos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Agendamentos</CardTitle>
              <CardDescription>Distribuição por status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { nome: "Concluídos", valor: 285, cor: "#22c55e" },
                      { nome: "Agendados", valor: 42, cor: "#3b82f6" },
                      { nome: "Confirmados", valor: 28, cor: "#10b981" },
                      { nome: "Cancelados", valor: 8, cor: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nome, valor, percent }) => `${nome}: ${valor} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valor"
                  >
                    {[
                      { nome: "Concluídos", valor: 285, cor: "#22c55e" },
                      { nome: "Agendados", valor: 42, cor: "#3b82f6" },
                      { nome: "Confirmados", valor: 28, cor: "#10b981" },
                      { nome: "Cancelados", valor: 8, cor: "#ef4444" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Agendamentos por Clínica */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos por Clínica</CardTitle>
              <CardDescription>Distribuição de atendimentos por local</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[
                    { clinica: "Clínica A", quantidade: 156 },
                    { clinica: "Clínica B", quantidade: 98 },
                    { clinica: "Clínica C", quantidade: 67 },
                    { clinica: "Clínica D", quantidade: 42 },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="clinica" type="category" stroke="#6b7280" width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  />
                  <Bar dataKey="quantidade" fill="#3b82f6" name="Agendamentos" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agendamentos">
            <Calendar className="h-4 w-4 mr-2" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="pacientes">
            <Users className="h-4 w-4 mr-2" />
            Pacientes
          </TabsTrigger>
          <TabsTrigger value="prontuarios">
            <FileText className="h-4 w-4 mr-2" />
            Prontuários
          </TabsTrigger>
        </TabsList>

        {/* Tab: Agendamentos */}
        <TabsContent value="agendamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos Consolidados</CardTitle>
              <CardDescription>
                Todos os seus agendamentos em todas as clínicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros Avançados */}
              <div className="grid gap-4 md:grid-cols-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={agendamentosStatus} onValueChange={setAgendamentosStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Clínica</label>
                  <Select value={agendamentosClinica} onValueChange={setAgendamentosClinica}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {clinicas.map((clinica) => (
                        <SelectItem key={clinica.id} value={clinica.id}>
                          {clinica.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <Input
                    type="date"
                    value={agendamentosDataInicio}
                    onChange={(e) => setAgendamentosDataInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Fim</label>
                  <Input
                    type="date"
                    value={agendamentosDataFim}
                    onChange={(e) => setAgendamentosDataFim(e.target.value)}
                  />
                </div>
              </div>

              {/* Lista de Agendamentos */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : agendamentos && agendamentos.items.length > 0 ? (
                <div className="space-y-4">
                  {agendamentos.items.map((agendamento) => (
                    <div
                      key={agendamento.id_agendamento}
                      className="flex items-start justify-between border-b pb-4 last:border-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{agendamento.paciente.nm_paciente}</p>
                          {getStatusBadge(agendamento.ds_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {agendamento.ds_servico || "Consulta"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {agendamento.clinica.nm_clinica}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(agendamento.dt_agendamento).toLocaleDateString()} às {agendamento.hr_inicio}
                          </span>
                        </div>
                      </div>
                      {agendamento.vl_valor && (
                        <div className="text-right">
                          <p className="font-semibold">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(agendamento.vl_valor)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Paginação */}
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {agendamentos.items.length} de {agendamentos.total} agendamentos
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAgendamentosPage((p) => Math.max(1, p - 1))}
                        disabled={agendamentosPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Página {agendamentosPage} de {agendamentos.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAgendamentosPage((p) => p + 1)}
                        disabled={agendamentosPage >= agendamentos.pages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum agendamento encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pacientes */}
        <TabsContent value="pacientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes Consolidados</CardTitle>
              <CardDescription>
                Todos os pacientes que você já atendeu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros Avançados */}
              <div className="grid gap-4 md:grid-cols-2 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Nome ou email do paciente..."
                    value={pacientesSearch}
                    onChange={(e) => setPacientesSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Clínica</label>
                  <Select value={pacientesClinica} onValueChange={setPacientesClinica}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {clinicas.map((clinica) => (
                        <SelectItem key={clinica.id} value={clinica.id}>
                          {clinica.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : pacientes && pacientes.items.length > 0 ? (
                <div className="space-y-4">
                  {pacientes.items.map((paciente) => (
                    <div
                      key={paciente.id_paciente}
                      className="flex items-start justify-between border-b pb-4 last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{paciente.nm_paciente}</p>
                        <p className="text-sm text-muted-foreground">{paciente.ds_email}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{paciente.qt_agendamentos_total} atendimentos</span>
                          <span>•</span>
                          <span>{paciente.clinicas_atendimento.length} clínicas</span>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {paciente.clinicas_atendimento.join(", ")}
                      </Badge>
                    </div>
                  ))}

                  {/* Paginação */}
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {pacientes.items.length} de {pacientes.total} pacientes
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPacientesPage((p) => Math.max(1, p - 1))}
                        disabled={pacientesPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Página {pacientesPage} de {pacientes.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPacientesPage((p) => p + 1)}
                        disabled={pacientesPage >= pacientes.pages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum paciente encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Prontuários */}
        <TabsContent value="prontuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prontuários Consolidados</CardTitle>
              <CardDescription>
                Histórico de consultas e prontuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros Avançados */}
              <div className="grid gap-4 md:grid-cols-2 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <Input
                    type="date"
                    value={prontuariosDataInicio}
                    onChange={(e) => setProntuariosDataInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Fim</label>
                  <Input
                    type="date"
                    value={prontuariosDataFim}
                    onChange={(e) => setProntuariosDataFim(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : prontuarios && prontuarios.items.length > 0 ? (
                <div className="space-y-4">
                  {prontuarios.items.map((prontuario) => (
                    <div
                      key={prontuario.id_prontuario}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{prontuario.paciente.nm_paciente}</p>
                          <p className="text-sm text-muted-foreground">
                            {prontuario.clinica.nm_clinica}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(prontuario.dt_consulta).toLocaleDateString()}
                        </Badge>
                      </div>
                      {prontuario.ds_queixa_principal && (
                        <div>
                          <p className="text-sm font-medium">Queixa:</p>
                          <p className="text-sm text-muted-foreground">
                            {prontuario.ds_queixa_principal}
                          </p>
                        </div>
                      )}
                      {prontuario.ds_diagnostico && (
                        <div>
                          <p className="text-sm font-medium">Diagnóstico:</p>
                          <p className="text-sm text-muted-foreground">
                            {prontuario.ds_diagnostico}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Paginação */}
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {prontuarios.items.length} de {prontuarios.total} prontuários
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProntuariosPage((p) => Math.max(1, p - 1))}
                        disabled={prontuariosPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Página {prontuariosPage} de {prontuarios.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProntuariosPage((p) => p + 1)}
                        disabled={prontuariosPage >= prontuarios.pages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum prontuário encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
