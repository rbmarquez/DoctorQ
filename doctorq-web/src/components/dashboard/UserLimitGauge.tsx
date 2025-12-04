"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import Link from "next/link";

interface UserLimitData {
  qt_usuarios_atuais: number;
  qt_limite_usuarios: number;
  qt_usuarios_disponiveis: number;
  percentual_uso: number;
}

export function UserLimitGauge() {
  const [limitData, setLimitData] = useState<UserLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLimitData();
  }, []);

  const fetchLimitData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/user-limits");

      if (!response.ok) {
        // Não lançar erro, apenas registrar no console
        console.warn("API de limites de usuários não disponível:", response.status);
        setError("API de limites não disponível");
        return;
      }

      const data = await response.json();
      setLimitData(data);
      setError(null);
    } catch (err) {
      console.warn("Erro ao buscar limite de usuários:", err);
      setError("Serviço temporariamente indisponível");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Limite de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !limitData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Limite de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error || "Erro ao carregar dados"}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { qt_usuarios_atuais, qt_limite_usuarios, qt_usuarios_disponiveis, percentual_uso } = limitData;

  // Determinar cor e alerta baseado no percentual
  const getAlertLevel = (percent: number) => {
    if (percent >= 95) return { color: "#dc2626", level: "critical", icon: "🚨", text: "CRÍTICO" };
    if (percent >= 90) return { color: "#f59e0b", level: "warning", icon: "⚠️", text: "ATENÇÃO" };
    if (percent >= 80) return { color: "#f97316", level: "caution", icon: "⚡", text: "ALERTA" };
    return { color: "#22c55e", level: "normal", icon: "✅", text: "OK" };
  };

  const alert = getAlertLevel(percentual_uso);

  // Dados para o gauge chart (Pie Chart semicircular)
  const gaugeData = [
    { name: "Usado", value: percentual_uso },
    { name: "Disponível", value: 100 - percentual_uso },
  ];

  return (
    <Card className={percentual_uso >= 90 ? "border-2" : ""} style={percentual_uso >= 90 ? { borderColor: alert.color } : {}}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Limite de Usuários
            </CardTitle>
            <CardDescription>
              Uso atual do plano contratado
            </CardDescription>
          </div>
          {percentual_uso >= 80 && (
            <div className="flex items-center gap-1 text-sm font-medium" style={{ color: alert.color }}>
              {alert.icon} {alert.text}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauge Chart */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
              >
                <Cell fill={alert.color} />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Texto central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: "50%" }}>
            <div className="text-4xl font-bold" style={{ color: alert.color }}>
              {percentual_uso.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {qt_usuarios_atuais} de {qt_limite_usuarios}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{qt_usuarios_atuais}</div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: alert.color }}>
              {qt_usuarios_disponiveis}
            </div>
            <div className="text-xs text-muted-foreground">Disponíveis</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{qt_limite_usuarios}</div>
            <div className="text-xs text-muted-foreground">Limite</div>
          </div>
        </div>

        {/* Alertas e ações */}
        {percentual_uso >= 90 && (
          <Alert style={{ backgroundColor: `${alert.color}10`, borderColor: alert.color }}>
            <AlertTriangle className="h-4 w-4" style={{ color: alert.color }} />
            <AlertDescription>
              {percentual_uso >= 95 ? (
                <span>
                  <strong>Limite quase esgotado!</strong> Você tem apenas {qt_usuarios_disponiveis} {qt_usuarios_disponiveis === 1 ? 'vaga disponível' : 'vagas disponíveis'}.
                </span>
              ) : (
                <span>
                  <strong>Atenção!</strong> Você está próximo do limite. Considere fazer upgrade do plano.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {percentual_uso >= 80 && percentual_uso < 90 && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Você está usando <strong>{percentual_uso.toFixed(0)}%</strong> do limite. Planeje adicionar mais usuários em breve.
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Link href="/clinica/equipe" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Users className="h-4 w-4" />
              Gerenciar Equipe
            </Button>
          </Link>
          {percentual_uso >= 80 && (
            <Link href="/admin/billing" className="flex-1">
              <Button className="w-full gap-2" style={{ backgroundColor: alert.color }}>
                Upgrade
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
