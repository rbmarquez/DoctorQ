import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';

export const metadata = { title: 'Analytics | DoctorQ Admin' };

export default function AnalyticsPage() {
  const stats = [
    { label: 'Total de Usuários', value: '1,234', icon: Users, color: 'text-blue-600' },
    { label: 'Agendamentos (Mês)', value: '456', icon: Calendar, color: 'text-green-600' },
    { label: 'Receita (Mês)', value: 'R$ 45.6K', icon: DollarSign, color: 'text-purple-600' },
    { label: 'Taxa de Crescimento', value: '+12.5%', icon: TrendingUp, color: 'text-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Analytics" description="Métricas e indicadores do sistema" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Gráficos em Desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
            Charts com Recharts ou Chart.js - A implementar
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
