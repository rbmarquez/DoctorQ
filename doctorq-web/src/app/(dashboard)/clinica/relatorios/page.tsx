"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  Filter,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Activity,
  PieChart,
  LineChart,
} from "lucide-react";

interface Relatorio {
  id_relatorio: string;
  nm_relatorio: string;
  ds_relatorio: string;
  ds_tipo: string;
  ds_categoria: string;
  icone: any;
  cor: string;
}

const TIPOS_RELATORIO = [
  "Financeiro",
  "Operacional",
  "Clínico",
  "Marketing",
  "RH",
];

const PERIODOS = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Última Semana" },
  { value: "mes", label: "Último Mês" },
  { value: "trimestre", label: "Último Trimestre" },
  { value: "ano", label: "Último Ano" },
  { value: "personalizado", label: "Período Personalizado" },
];

// Relatórios disponíveis
const RELATORIOS_DISPONIVEIS: Relatorio[] = [
  {
    id_relatorio: "1",
    nm_relatorio: "Faturamento",
    ds_relatorio: "Análise detalhada de receitas e despesas por período",
    ds_tipo: "Financeiro",
    ds_categoria: "Gestão",
    icone: DollarSign,
    cor: "text-green-600",
  },
  {
    id_relatorio: "2",
    nm_relatorio: "Agendamentos",
    ds_relatorio: "Estatísticas de agendamentos realizados, cancelados e confirmados",
    ds_tipo: "Operacional",
    ds_categoria: "Atendimento",
    icone: Calendar,
    cor: "text-blue-600",
  },
  {
    id_relatorio: "3",
    nm_relatorio: "Procedimentos Realizados",
    ds_relatorio: "Ranking dos procedimentos mais realizados e sua rentabilidade",
    ds_tipo: "Clínico",
    ds_categoria: "Atendimento",
    icone: Activity,
    cor: "text-purple-600",
  },
  {
    id_relatorio: "4",
    nm_relatorio: "Desempenho de Profissionais",
    ds_relatorio: "Análise de produtividade e avaliação dos profissionais",
    ds_tipo: "RH",
    ds_categoria: "Gestão",
    icone: Users,
    cor: "text-orange-600",
  },
  {
    id_relatorio: "5",
    nm_relatorio: "Novos Pacientes",
    ds_relatorio: "Análise de aquisição de novos pacientes e fontes de captação",
    ds_tipo: "Marketing",
    ds_categoria: "Aquisição",
    icone: TrendingUp,
    cor: "text-blue-600",
  },
  {
    id_relatorio: "6",
    nm_relatorio: "Taxa de Ocupação",
    ds_relatorio: "Percentual de ocupação da agenda por profissional e sala",
    ds_tipo: "Operacional",
    ds_categoria: "Eficiência",
    icone: PieChart,
    cor: "text-indigo-600",
  },
  {
    id_relatorio: "7",
    nm_relatorio: "Tempo Médio de Atendimento",
    ds_relatorio: "Análise do tempo médio de atendimento por procedimento",
    ds_tipo: "Operacional",
    ds_categoria: "Eficiência",
    icone: Clock,
    cor: "text-cyan-600",
  },
  {
    id_relatorio: "8",
    nm_relatorio: "Inadimplência",
    ds_relatorio: "Relatório de pagamentos pendentes e em atraso",
    ds_tipo: "Financeiro",
    ds_categoria: "Cobrança",
    icone: AlertCircle,
    cor: "text-red-600",
  },
  {
    id_relatorio: "9",
    nm_relatorio: "Satisfação dos Pacientes",
    ds_relatorio: "Análise de avaliações e feedback dos pacientes",
    ds_tipo: "Marketing",
    ds_categoria: "Qualidade",
    icone: CheckCircle,
    cor: "text-emerald-600",
  },
  {
    id_relatorio: "10",
    nm_relatorio: "Estoque de Produtos",
    ds_relatorio: "Controle de estoque, produtos mais vendidos e reposição",
    ds_tipo: "Operacional",
    ds_categoria: "Gestão",
    icone: Package,
    cor: "text-amber-600",
  },
  {
    id_relatorio: "11",
    nm_relatorio: "Retorno de Pacientes",
    ds_relatorio: "Taxa de retorno e fidelização de pacientes",
    ds_tipo: "Clínico",
    ds_categoria: "Fidelização",
    icone: LineChart,
    cor: "text-violet-600",
  },
  {
    id_relatorio: "12",
    nm_relatorio: "Origem dos Pacientes",
    ds_relatorio: "Análise das fontes de captação (redes sociais, indicação, etc.)",
    ds_tipo: "Marketing",
    ds_categoria: "Aquisição",
    icone: BarChart3,
    cor: "text-fuchsia-600",
  },
];

import { Package, AlertCircle } from "lucide-react";

export default function RelatoriosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("mes");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Filtrar relatórios
  const filteredRelatorios = useMemo(() => {
    return RELATORIOS_DISPONIVEIS.filter((rel) => {
      const matchesSearch =
        rel.nm_relatorio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.ds_relatorio.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = tipoFilter === "all" || rel.ds_tipo === tipoFilter;
      const matchesCategoria =
        categoriaFilter === "all" || rel.ds_categoria === categoriaFilter;

      return matchesSearch && matchesTipo && matchesCategoria;
    });
  }, [searchTerm, tipoFilter, categoriaFilter]);

  // Estatísticas
  const stats = {
    totalRelatorios: RELATORIOS_DISPONIVEIS.length,
    financeiros: RELATORIOS_DISPONIVEIS.filter((r) => r.ds_tipo === "Financeiro").length,
    operacionais: RELATORIOS_DISPONIVEIS.filter((r) => r.ds_tipo === "Operacional").length,
    clinicos: RELATORIOS_DISPONIVEIS.filter((r) => r.ds_tipo === "Clínico").length,
    marketing: RELATORIOS_DISPONIVEIS.filter((r) => r.ds_tipo === "Marketing").length,
    rh: RELATORIOS_DISPONIVEIS.filter((r) => r.ds_tipo === "RH").length,
  };

  const handleGerarRelatorio = (relatorio: Relatorio) => {
    // Simular geração de relatório
    alert(
      `Gerando relatório: ${relatorio.nm_relatorio}\nPeríodo: ${
        periodoSelecionado === "personalizado"
          ? `${dataInicio} até ${dataFim}`
          : PERIODOS.find((p) => p.value === periodoSelecionado)?.label
      }`
    );
  };

  const handleExportarRelatorio = (relatorio: Relatorio, formato: string) => {
    alert(`Exportando ${relatorio.nm_relatorio} em formato ${formato.toUpperCase()}`);
  };

  // Obter categorias únicas
  const categorias = Array.from(
    new Set(RELATORIOS_DISPONIVEIS.map((r) => r.ds_categoria))
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e insights completos sobre a clínica
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRelatorios}</div>
            <p className="text-xs text-muted-foreground">Relatórios disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financeiros</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.financeiros}</div>
            <p className="text-xs text-muted-foreground">Análises financeiras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operacionais</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.operacionais}</div>
            <p className="text-xs text-muted-foreground">Gestão operacional</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clínicos</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.clinicos}</div>
            <p className="text-xs text-muted-foreground">Atendimentos clínicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketing</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.marketing}</div>
            <p className="text-xs text-muted-foreground">Aquisição e retenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RH</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.rh}</div>
            <p className="text-xs text-muted-foreground">Recursos humanos</p>
          </CardContent>
        </Card>
      </div>

      {/* Seleção de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Análise
          </CardTitle>
          <CardDescription>Selecione o período para gerar os relatórios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((periodo) => (
                    <SelectItem key={periodo.value} value={periodo.value}>
                      {periodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {periodoSelecionado === "personalizado" && (
              <>
                <div>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    placeholder="Data inicial"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    placeholder="Data final"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
          <CardDescription>Encontre relatórios por nome ou tipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar relatórios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {TIPOS_RELATORIO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Grid */}
      {filteredRelatorios.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRelatorios.map((relatorio) => {
            const IconComponent = relatorio.icone;
            return (
              <Card
                key={relatorio.id_relatorio}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-muted ${relatorio.cor} bg-opacity-10`}
                      >
                        <IconComponent className={`h-6 w-6 ${relatorio.cor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{relatorio.nm_relatorio}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{relatorio.ds_tipo}</Badge>
                          <Badge variant="secondary">{relatorio.ds_categoria}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{relatorio.ds_relatorio}</p>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleGerarRelatorio(relatorio)}
                      className="flex-1"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Gerar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportarRelatorio(relatorio, "pdf")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredRelatorios.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
            <p className="text-muted-foreground text-center">
              Tente ajustar os filtros ou faça uma nova busca.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
