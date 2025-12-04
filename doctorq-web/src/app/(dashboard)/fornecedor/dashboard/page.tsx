"use client";

import { useUserType } from "@/contexts/UserTypeContext";
import { Package, ShoppingBag, TrendingUp, DollarSign, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FornecedorDashboardPage() {
  const { user } = useUserType();

  const stats = [
    { label: "Pedidos Hoje", value: "24", icon: ShoppingBag, color: "from-green-500 to-emerald-600", change: "+12%" },
    { label: "Produtos Ativos", value: "342", icon: Package, color: "from-blue-500 to-indigo-600", change: "+8%" },
    { label: "Faturamento Mês", value: "R$ 52k", icon: DollarSign, color: "from-purple-500 to-blue-600", change: "+23%" },
    { label: "Taxa Conversão", value: "3.4%", icon: TrendingUp, color: "from-yellow-500 to-orange-600", change: "+0.5%" },
  ];

  const recentOrders = [
    { id: "PED-001", clinic: "Clínica Estética Premium", items: 5, value: "R$ 1.240", status: "pending" },
    { id: "PED-002", clinic: "Spa & Beleza Total", items: 3, value: "R$ 890", status: "processing" },
    { id: "PED-003", clinic: "Derma Center", items: 8, value: "R$ 2.100", status: "completed" },
    { id: "PED-004", clinic: "Beauty Clinic", items: 2, value: "R$ 450", status: "pending" },
  ];

  const topProducts = [
    { name: "Sérum Anti-idade Premium", sales: 145, revenue: "R$ 21.750" },
    { name: "Kit Limpeza Profunda", sales: 98, revenue: "R$ 9.800" },
    { name: "Máscara Facial Revitalizante", sales: 87, revenue: "R$ 8.700" },
    { name: "Tônico Hidratante", sales: 76, revenue: "R$ 5.320" },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      processing: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: Package },
      completed: { label: "Concluído", color: "bg-green-100 text-green-800", icon: CheckCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bem-vindo, {user?.nm_completo}!</h1>
          <p className="text-gray-600 mt-1">Painel do Fornecedor - Visão Geral</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} w-fit mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Pedidos Recentes</h2>
              <Button variant="outline" size="sm">Ver Todos</Button>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <p className="font-semibold text-gray-900">{order.id}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-600">{order.clinic}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.items} itens</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{order.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Produtos Mais Vendidos</h2>
              <Button variant="outline" size="sm">Relatório</Button>
            </div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.sales} vendas</p>
                  </div>
                  <p className="font-bold text-gray-900">{product.revenue}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-24 flex-col space-y-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <Package className="h-6 w-6" />
              <span>Novo Produto</span>
            </Button>
            <Button className="h-24 flex-col space-y-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              <ShoppingBag className="h-6 w-6" />
              <span>Ver Pedidos</span>
            </Button>
            <Button className="h-24 flex-col space-y-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
              <TrendingUp className="h-6 w-6" />
              <span>Relatórios</span>
            </Button>
            <Button className="h-24 flex-col space-y-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
              <DollarSign className="h-6 w-6" />
              <span>Financeiro</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
