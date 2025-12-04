"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Package, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  total_leads: number;
  leads_pendentes: number;
  leads_aprovados: number;
  leads_rejeitados: number;
  total_contratos_ativos: number;
  receita_mes_atual: number;
  taxa_conversao: number;
}

export default function ParceirosDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/parceiros/dashboard/stats");

      if (!response.ok) {
        throw new Error(`Erro ao carregar estatísticas: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erro ao Carregar Dashboard
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar as estatísticas do dashboard. Tente novamente em alguns instantes.
            </p>
            <button
              onClick={fetchDashboardStats}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Tentar Novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dados temporários para desenvolvimento
  const tempStats: DashboardStats = stats || {
    total_leads: 248,
    leads_pendentes: 42,
    leads_aprovados: 186,
    leads_rejeitados: 20,
    total_contratos_ativos: 156,
    receita_mes_atual: 87500.00,
    taxa_conversao: 75.0,
  };

  const statCards = [
    {
      title: "Total de Leads",
      value: tempStats.total_leads.toString(),
      description: `${tempStats.leads_pendentes} pendentes de análise`,
      icon: Users,
      trend: "+12.5% vs mês anterior",
      trendPositive: true,
    },
    {
      title: "Taxa de Conversão",
      value: `${tempStats.taxa_conversao.toFixed(1)}%`,
      description: `${tempStats.leads_aprovados} leads convertidos`,
      icon: TrendingUp,
      trend: "+4.3% vs mês anterior",
      trendPositive: true,
    },
    {
      title: "Contratos Ativos",
      value: tempStats.total_contratos_ativos.toString(),
      description: "Clínicas e profissionais",
      icon: Package,
      trend: "+23 novos este mês",
      trendPositive: true,
    },
    {
      title: "Receita do Mês",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(tempStats.receita_mes_atual),
      description: "Receita recorrente (MRR)",
      icon: DollarSign,
      trend: "+18.2% vs mês anterior",
      trendPositive: true,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "lead",
      title: "Novo Lead: Clínica Belle Vie",
      description: "Cadastro via landing page - Pacote Premium",
      time: "Há 15 minutos",
      status: "pending",
    },
    {
      id: 2,
      type: "approval",
      title: "Lead Aprovado: Dr. Carlos Silva",
      description: "Profissional autônomo - Pacote Basic",
      time: "Há 1 hora",
      status: "approved",
    },
    {
      id: 3,
      type: "contract",
      title: "Contrato Assinado: Estética Avançada",
      description: "Upgrade para Pacote Enterprise",
      time: "Há 3 horas",
      status: "completed",
    },
    {
      id: 4,
      type: "renewal",
      title: "Renovação Automática: Beauty Center",
      description: "Renovação anual processada com sucesso",
      time: "Ontem",
      status: "completed",
    },
  ];

  // Dados para gráficos
  const receitaMensalData = [
    { mes: "Ago", receita: 52300, leads: 38, conversao: 68.4 },
    { mes: "Set", receita: 61200, leads: 45, conversao: 71.1 },
    { mes: "Out", receita: 68900, leads: 52, conversao: 73.1 },
    { mes: "Nov", receita: 74100, leads: 58, conversao: 72.4 },
    { mes: "Dez", receita: 81250, leads: 63, conversao: 74.6 },
    { mes: "Jan", receita: 87500, leads: 67, conversao: 75.0 },
  ];

  const leadsDistribuicaoData = [
    { nome: "Aprovados", valor: tempStats.leads_aprovados, cor: "#22c55e" },
    { nome: "Pendentes", valor: tempStats.leads_pendentes, cor: "#f59e0b" },
    { nome: "Rejeitados", valor: tempStats.leads_rejeitados, cor: "#ef4444" },
  ];

  const contratosPorPacoteData = [
    { pacote: "Basic", quantidade: 45, receita: 13500 },
    { pacote: "Professional", quantidade: 68, receita: 40800 },
    { pacote: "Premium", quantidade: 32, receita: 25600 },
    { pacote: "Enterprise", quantidade: 11, receita: 13200 },
  ];

  const COLORS_PIE = ["#22c55e", "#f59e0b", "#ef4444"];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Parceiros</h1>
          <p className="text-muted-foreground">
            Visão geral do programa de parceiros DoctorQ
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            Exportar Relatório
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Novo Lead
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className={`h-3 w-3 ${stat.trendPositive ? "text-green-600" : "text-red-600"}`} />
                <span className={`text-xs ${stat.trendPositive ? "text-green-600" : "text-red-600"}`}>
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Evolução de Receita e Leads</CardTitle>
            <CardDescription>Receita recorrente mensal (MRR) e conversão de leads nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={receitaMensalData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#22c55e" />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value: number, name: string) => {
                    if (name === "receita") return [`R$ ${value.toLocaleString('pt-BR')}`, "Receita"];
                    if (name === "leads") return [value, "Leads Convertidos"];
                    if (name === "conversao") return [`${value}%`, "Taxa de Conversão"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="receita"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                  name="Receita (R$)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                  name="Leads Convertidos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Leads</CardTitle>
            <CardDescription>Status atual de todos os leads cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={leadsDistribuicaoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, valor, percent }) => `${nome}: ${valor} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {leadsDistribuicaoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value: number) => [value, "Quantidade"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {leadsDistribuicaoData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                  <span className="text-sm text-muted-foreground">{item.nome}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contracts by Package Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Contratos por Pacote</CardTitle>
            <CardDescription>Distribuição de contratos ativos por tipo de pacote</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={contratosPorPacoteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="pacote" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value: number, name: string) => {
                    if (name === "quantidade") return [value, "Contratos"];
                    if (name === "receita") return [`R$ ${value.toLocaleString('pt-BR')}`, "Receita"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="quantidade" fill="#3b82f6" name="Contratos" radius={[8, 8, 0, 0]} />
                <Bar dataKey="receita" fill="#22c55e" name="Receita (R$)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas atualizações do programa de parceiros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className={`mt-0.5 p-2 rounded-lg ${
                    activity.status === "pending" ? "bg-yellow-100 text-yellow-600" :
                    activity.status === "approved" ? "bg-blue-100 text-blue-600" :
                    "bg-green-100 text-green-600"
                  }`}>
                    {activity.status === "pending" && <Clock className="h-4 w-4" />}
                    {activity.status === "approved" && <CheckCircle2 className="h-4 w-4" />}
                    {activity.status === "completed" && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Gerencie seus parceiros e leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/parceiros/leads"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Gerenciar Leads</p>
                  <p className="text-sm text-muted-foreground">{tempStats.leads_pendentes} pendentes</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              href="/parceiros/contratos"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Contratos Ativos</p>
                  <p className="text-sm text-muted-foreground">{tempStats.total_contratos_ativos} contratos</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              href="/parceiros/relatorios"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Relatórios</p>
                  <p className="text-sm text-muted-foreground">Análises detalhadas</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              href="/parceiros/propostas"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Propostas Comerciais</p>
                  <p className="text-sm text-muted-foreground">Pacotes e preços</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
