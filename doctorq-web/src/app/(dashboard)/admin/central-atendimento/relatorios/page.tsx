'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import useSWR from 'swr';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  Star,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Fetcher para SWR
const fetcher = async (url: string) => {
  const token = localStorage.getItem('api_token') || process.env.NEXT_PUBLIC_API_KEY;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Erro ao carregar dados');
  return res.json();
};

// Cores para gráficos
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Tipos
interface MetricasDashboard {
  conversas_total: number;
  conversas_abertas: number;
  conversas_fechadas: number;
  conversas_aguardando_humano: number;
  conversas_com_bot: number;
  conversas_periodo: number;
  conversas_periodo_anterior: number;
  variacao_conversas: number;
  tempo_medio_resposta_segundos: number;
  satisfacao_media: number;
  total_avaliacoes: number;
  taxa_resolucao: number;
}

interface ConversaPorDia {
  data: string;
  total: number;
  abertas: number;
  fechadas: number;
}

interface ConversaPorCanal {
  canal: string;
  total: number;
  percentual: number;
}

interface ConversaPorHora {
  hora: number;
  total: number;
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState('7d');
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [isExporting, setIsExporting] = useState(false);

  // Buscar dados da API
  const { data: metricas, isLoading: loadingMetricas, mutate: refreshMetricas } = useSWR<MetricasDashboard>(
    `/central-atendimento/metricas/dashboard?periodo=${periodo}`,
    fetcher
  );

  const { data: conversasPorDia, isLoading: loadingPorDia } = useSWR<ConversaPorDia[]>(
    `/central-atendimento/metricas/conversas-por-dia?periodo=${periodo}`,
    fetcher
  );

  const { data: conversasPorCanal, isLoading: loadingPorCanal } = useSWR<ConversaPorCanal[]>(
    `/central-atendimento/metricas/conversas-por-canal?periodo=${periodo}`,
    fetcher
  );

  const { data: conversasPorHora, isLoading: loadingPorHora } = useSWR<ConversaPorHora[]>(
    `/central-atendimento/metricas/conversas-por-hora?periodo=${periodo}`,
    fetcher
  );

  const isLoading = loadingMetricas || loadingPorDia || loadingPorCanal || loadingPorHora;

  // Exportar CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('api_token') || process.env.NEXT_PUBLIC_API_KEY;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/central-atendimento/metricas/exportar/csv?periodo=${periodo}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_central_${periodo}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar PDF (usando dados estruturados)
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('api_token') || process.env.NEXT_PUBLIC_API_KEY;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/central-atendimento/metricas/exportar/pdf-data?periodo=${periodo}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao exportar');

      const data = await response.json();

      // Criar PDF simples usando window.print() com estilo
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${data.titulo}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #4F46E5; }
              h2 { color: #374151; margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #E5E7EB; padding: 8px; text-align: left; }
              th { background-color: #F3F4F6; }
              .metric { display: inline-block; margin: 10px; padding: 15px; background: #F3F4F6; border-radius: 8px; }
              .metric-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
              .metric-label { font-size: 12px; color: #6B7280; }
            </style>
          </head>
          <body>
            <h1>${data.titulo}</h1>
            <p>Período: ${new Date(data.periodo.inicio).toLocaleDateString('pt-BR')} a ${new Date(data.periodo.fim).toLocaleDateString('pt-BR')}</p>

            <h2>Métricas Principais</h2>
            <div>
              <div class="metric">
                <div class="metric-value">${data.metricas_principais.total_conversas}</div>
                <div class="metric-label">Total de Conversas</div>
              </div>
              <div class="metric">
                <div class="metric-value">${data.metricas_principais.taxa_resolucao}</div>
                <div class="metric-label">Taxa de Resolução</div>
              </div>
              <div class="metric">
                <div class="metric-value">${data.metricas_principais.satisfacao_media}</div>
                <div class="metric-label">Satisfação Média</div>
              </div>
              <div class="metric">
                <div class="metric-value">${data.metricas_principais.tempo_medio_resposta}</div>
                <div class="metric-label">Tempo Médio Resposta</div>
              </div>
            </div>

            <h2>Conversas por Dia</h2>
            <table>
              <thead>
                <tr><th>Data</th><th>Total</th></tr>
              </thead>
              <tbody>
                ${data.graficos.conversas_por_dia.map((d: any) => `
                  <tr><td>${d.data}</td><td>${d.total}</td></tr>
                `).join('')}
              </tbody>
            </table>

            <h2>Conversas por Canal</h2>
            <table>
              <thead>
                <tr><th>Canal</th><th>Total</th><th>Percentual</th></tr>
              </thead>
              <tbody>
                ${data.graficos.conversas_por_canal.map((c: any) => `
                  <tr><td>${c.canal}</td><td>${c.total}</td><td>${c.percentual}%</td></tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Formatar tempo
  const formatTempo = (segundos: number) => {
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${minutos}m ${seg}s`;
  };

  // Preparar dados para gráficos
  const dadosGraficoLinha = conversasPorDia?.map(item => ({
    data: format(new Date(item.data), 'dd/MM', { locale: ptBR }),
    total: item.total,
    abertas: item.abertas,
    fechadas: item.fechadas,
  })) || [];

  const dadosGraficoPizza = conversasPorCanal?.map(item => ({
    name: item.canal.charAt(0).toUpperCase() + item.canal.slice(1),
    value: item.total,
    percentual: item.percentual,
  })) || [];

  const dadosGraficoHora = conversasPorHora?.map(item => ({
    hora: `${item.hora.toString().padStart(2, '0')}h`,
    total: item.total,
  })) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada de métricas e performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => refreshMetricas()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            CSV
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="canais">Canais</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          {/* KPIs principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas?.conversas_total || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {metricas?.variacao_conversas && metricas.variacao_conversas > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">+{metricas.variacao_conversas}%</span>
                    </>
                  ) : metricas?.variacao_conversas && metricas.variacao_conversas < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">{metricas.variacao_conversas}%</span>
                    </>
                  ) : (
                    <span>Sem variação</span>
                  )}
                  {' '}vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metricas?.taxa_resolucao || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {metricas?.conversas_fechadas || 0} conversas resolvidas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio Resposta</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatTempo(metricas?.tempo_medio_resposta_segundos || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Média do período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {metricas?.satisfacao_media?.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metricas?.total_avaliacoes || 0} avaliações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Conversas por Dia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Conversas por Dia</CardTitle>
              <CardDescription>Evolução das conversas no período selecionado</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {dadosGraficoLinha.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosGraficoLinha}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="data" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="#4F46E5"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                    <Line
                      type="monotone"
                      dataKey="fechadas"
                      name="Fechadas"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Sem dados para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Atendimento */}
        <TabsContent value="atendimento" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversas Abertas</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metricas?.conversas_abertas || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Aguardando Humano</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metricas?.conversas_aguardando_humano || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Atendimento por Bot</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{metricas?.conversas_com_bot || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de barras - Status das conversas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status das Conversas</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { nome: 'Abertas', valor: metricas?.conversas_abertas || 0, fill: '#3B82F6' },
                    { nome: 'Fechadas', valor: metricas?.conversas_fechadas || 0, fill: '#10B981' },
                    { nome: 'Aguardando', valor: metricas?.conversas_aguardando_humano || 0, fill: '#F59E0B' },
                    { nome: 'Com Bot', valor: metricas?.conversas_com_bot || 0, fill: '#8B5CF6' },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Canais */}
        <TabsContent value="canais" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Distribuição por Canal</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                {dadosGraficoPizza.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosGraficoPizza}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percentual }) => `${name}: ${percentual}%`}
                      >
                        {dadosGraficoPizza.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Sem dados para o período selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabela de canais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Detalhamento por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Percentual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversasPorCanal?.map((canal, index) => (
                      <TableRow key={canal.canal}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {canal.canal.charAt(0).toUpperCase() + canal.canal.slice(1)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{canal.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{canal.percentual}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Horários */}
        <TabsContent value="horarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Conversas por Hora do Dia</CardTitle>
              <CardDescription>Distribuição das conversas ao longo do dia</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {dadosGraficoHora.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoHora}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hora" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="total"
                      name="Conversas"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Sem dados para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Insights de Horário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Horário de Pico</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dadosGraficoHora.length > 0
                      ? `${dadosGraficoHora.reduce((max, item) => item.total > max.total ? item : max, dadosGraficoHora[0]).hora}`
                      : '--'}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Média por Hora</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dadosGraficoHora.length > 0
                      ? Math.round(dadosGraficoHora.reduce((sum, item) => sum + item.total, 0) / 24)
                      : 0}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">Horário Mais Calmo</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dadosGraficoHora.length > 0
                      ? `${dadosGraficoHora.reduce((min, item) => item.total < min.total ? item : min, dadosGraficoHora[0]).hora}`
                      : '--'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
