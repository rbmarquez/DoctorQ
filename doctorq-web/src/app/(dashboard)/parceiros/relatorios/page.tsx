"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Download,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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

export default function ParceiroRelatoriosPage() {
  const [loading, setLoading] = useState(false);
  const [periodoFilter, setPeriodoFilter] = useState<string>("mensal");

  // Dados temporários de fallback
  const metricsData = {
    ltv: 8400.0,
    cac: 1200.0,
    churn: 5.2,
    mrr: 87500.0,
  };

  const conversaoMensalData = [
    { mes: "Ago", leads: 38, conversoes: 26, taxa: 68.4 },
    { mes: "Set", leads: 45, conversoes: 32, taxa: 71.1 },
    { mes: "Out", leads: 52, conversoes: 38, taxa: 73.1 },
    { mes: "Nov", leads: 58, conversoes: 42, taxa: 72.4 },
    { mes: "Dez", leads: 63, conversoes: 47, taxa: 74.6 },
    { mes: "Jan", leads: 67, conversoes: 50, taxa: 75.0 },
  ];

  const receitaPorPlanoData = [
    { plano: "Basic", receita: 13500, clientes: 45 },
    { plano: "Professional", receita: 40800, clientes: 68 },
    { plano: "Premium", receita: 25600, clientes: 32 },
    { plano: "Enterprise", receita: 13200, clientes: 11 },
  ];

  const churnRateData = [
    { mes: "Ago", churn: 6.8, cancelamentos: 4, total: 59 },
    { mes: "Set", churn: 5.9, cancelamentos: 4, total: 68 },
    { mes: "Out", churn: 6.2, cancelamentos: 5, total: 81 },
    { mes: "Nov", churn: 4.8, cancelamentos: 5, total: 104 },
    { mes: "Dez", churn: 5.5, cancelamentos: 7, total: 127 },
    { mes: "Jan", churn: 5.2, cancelamentos: 8, total: 154 },
  ];

  const distribuicaoClientesData = [
    { nome: "Basic", valor: 45, cor: "#3b82f6" },
    { nome: "Professional", valor: 68, cor: "#10b981" },
    { nome: "Premium", valor: 32, cor: "#f59e0b" },
    { nome: "Enterprise", valor: 11, cor: "#8b5cf6" },
  ];

  const COLORS_PIE = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleExportPDF = () => {
    console.log("Exportar PDF");
    // Implementação futura
  };

  const handleExportExcel = () => {
    console.log("Exportar Excel");
    // Implementação futura
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Performance</h1>
          <p className="text-muted-foreground">
            Análises detalhadas do programa de parceiros DoctorQ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtros de Período</CardTitle>
              <CardDescription>Selecione o período para análise</CardDescription>
            </div>
            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Último Mês</SelectItem>
                <SelectItem value="trimestral">Último Trimestre</SelectItem>
                <SelectItem value="anual">Último Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV (Lifetime Value)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricsData.ltv)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor médio do cliente</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+12% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAC (Custo Aquisição)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricsData.cac)}</div>
            <p className="text-xs text-muted-foreground mt-1">Custo por cliente</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownRight className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">-8% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData.churn.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Taxa de cancelamento</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownRight className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">-0.3% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Receita Recorrente)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricsData.mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+18.2% vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Conversion Rate Trend */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Taxa de Conversão Mensal</CardTitle>
            <CardDescription>
              Evolução da conversão de leads em clientes nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversaoMensalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "leads") return [value, "Total Leads"];
                    if (name === "conversoes") return [value, "Conversões"];
                    if (name === "taxa") return [`${value}%`, "Taxa de Conversão"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Leads"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversoes"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Conversões"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="taxa"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Taxa (%)"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Plano</CardTitle>
            <CardDescription>Distribuição de receita mensal por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={receitaPorPlanoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="plano" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "receita") return [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"];
                    if (name === "clientes") return [value, "Clientes"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="receita" fill="#10b981" name="Receita (R$)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Churn Rate</CardTitle>
            <CardDescription>Taxa de cancelamento mensal nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={churnRateData}>
                <defs>
                  <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "churn") return [`${value}%`, "Churn Rate"];
                    if (name === "cancelamentos") return [value, "Cancelamentos"];
                    if (name === "total") return [value, "Total Clientes"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="churn"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorChurn)"
                  name="Churn Rate (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Clientes</CardTitle>
            <CardDescription>Clientes ativos por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distribuicaoClientesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, valor, percent }) =>
                    `${nome}: ${valor} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {distribuicaoClientesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [value, "Clientes"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {distribuicaoClientesData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                  <span className="text-sm text-muted-foreground">{item.nome}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights e Recomendações</CardTitle>
            <CardDescription>Análises baseadas nos dados atuais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Taxa de Conversão em Alta</p>
                <p className="text-sm text-muted-foreground">
                  A conversão aumentou 6.6% nos últimos 6 meses, indicando melhoria na qualificação
                  de leads.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Professional é o Mais Popular</p>
                <p className="text-sm text-muted-foreground">
                  68 clientes no plano Professional representam 43.6% da base total.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Percent className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Churn Rate Controlado</p>
                <p className="text-sm text-muted-foreground">
                  Taxa de 5.2% está dentro da meta. Continue monitorando satisfação dos clientes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">LTV/CAC Ratio Saudável</p>
                <p className="text-sm text-muted-foreground">
                  Ratio de 7:1 indica modelo de negócio sustentável e eficiente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
