import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, TrendingUp, Users } from 'lucide-react';

export const metadata = {
  title: 'Billing | DoctorQ Admin',
  description: 'Faturamento e assinaturas',
};

export default async function BillingPage() {
  const stats = {
    mrr: 15420.0,
    clientes_ativos: 48,
    taxa_conversao: 3.2,
    churn: 2.1,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Billing & Assinaturas" description="Métricas de faturamento e gestão de assinaturas" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">MRR (Receita Mensal)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">R$ {stats.mrr.toLocaleString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{stats.clientes_ativos}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{stats.taxa_conversao}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">{stats.churn}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Assinaturas por Plano</CardTitle>
            <CardDescription>Distribuição de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { plano: 'Enterprise', count: 12, value: 7200, color: 'bg-amber-100 text-amber-700' },
                { plano: 'Professional', count: 20, value: 5980, color: 'bg-purple-100 text-purple-700' },
                { plano: 'Basic', count: 16, value: 1584, color: 'bg-blue-100 text-blue-700' },
                { plano: 'Free', count: 89, value: 0, color: 'bg-gray-100 text-gray-700' },
              ].map((item) => (
                <div key={item.plano} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge className={item.color}>{item.plano}</Badge>
                    <span className="text-sm text-muted-foreground">{item.count} clientes</span>
                  </div>
                  <span className="font-semibold">R$ {item.value.toLocaleString('pt-BR')}/mês</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
