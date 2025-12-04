'use client';

import { useFaturas, useTransacoes } from '@/lib/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, FileText, CreditCard, Download } from 'lucide-react';

export function FinanceiroOverview({ id_usuario, id_empresa }: { id_usuario: string; id_empresa: string }) {
  const { data: faturas, isLoading: loadingFaturas } = useFaturas({ id_user: id_usuario });
  const { data: transacoes, isLoading: loadingTransacoes } = useTransacoes({ id_user: id_usuario });

  if (loadingFaturas || loadingTransacoes) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const vl_total_gasto = transacoes?.reduce((sum, t) => sum + (t.ds_tipo === 'despesa' ? t.vl_valor : 0), 0) || 0;
  const nr_faturas_pendentes = faturas?.filter((f) => f.ds_status === 'pendente').length || 0;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                R$ {vl_total_gasto.toFixed(2)}
              </span>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Faturas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{nr_faturas_pendentes}</span>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{faturas?.length || 0}</span>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Faturas */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Faturas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {faturas && faturas.length > 0 ? (
            <div className="space-y-3">
              {faturas.slice(0, 10).map((fatura) => (
                <div key={fatura.id_fatura} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Fatura #{fatura.nr_numero_fatura}</p>
                    <p className="text-sm text-gray-600">
                      Vencimento: {new Date(fatura.dt_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        fatura.ds_status === 'pago' ? 'default' :
                        fatura.ds_status === 'pendente' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {fatura.ds_status}
                    </Badge>
                    <span className="font-bold text-gray-900">R$ {fatura.vl_final.toFixed(2)}</span>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">Nenhuma fatura encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
