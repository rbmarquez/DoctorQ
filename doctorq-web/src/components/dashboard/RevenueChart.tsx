"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface RevenueChartProps {
  data?: {
    mes: string;
    valor: number;
  }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Mock data se não houver dados
  const chartData = data || [
    { mes: "Jan", valor: 12000 },
    { mes: "Fev", valor: 15000 },
    { mes: "Mar", valor: 18000 },
    { mes: "Abr", valor: 16000 },
    { mes: "Mai", valor: 22000 },
    { mes: "Jun", valor: 25000 },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.valor));
  const currentMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];
  const trend = currentMonth.valor > previousMonth.valor;
  const trendPercentage = (
    ((currentMonth.valor - previousMonth.valor) / previousMonth.valor) *
    100
  ).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Faturamento Mensal</h3>
          <p className="text-sm text-gray-600 mt-1">Últimos 6 meses</p>
        </div>
        <div className="flex items-center space-x-2">
          {trend ? (
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">+{trendPercentage}%</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-semibold">{trendPercentage}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-4">
        {chartData.map((item, index) => {
          const percentage = (item.valor / maxValue) * 100;
          const isCurrentMonth = index === chartData.length - 1;

          return (
            <div key={item.mes} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${isCurrentMonth ? "text-blue-600" : "text-gray-600"}`}>
                  {item.mes}
                </span>
                <span className={`font-semibold ${isCurrentMonth ? "text-blue-600" : "text-gray-900"}`}>
                  R$ {item.valor.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                    isCurrentMonth
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                      : "bg-gradient-to-r from-gray-300 to-gray-400"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total (6 meses)</p>
            <p className="text-2xl font-bold text-gray-900">
              R$ {chartData.reduce((acc, item) => acc + item.valor, 0).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Média Mensal</p>
            <p className="text-xl font-bold text-gray-900">
              R${" "}
              {(
                chartData.reduce((acc, item) => acc + item.valor, 0) / chartData.length
              ).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
