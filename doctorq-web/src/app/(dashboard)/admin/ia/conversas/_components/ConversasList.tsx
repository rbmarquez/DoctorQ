'use client';

import { useState } from 'react';
import { MessageSquare, Bot, Calendar, Eye, Trash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/shared/navigation/Pagination';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import type { Conversa, Agente } from '@/lib/api/server';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ConversasListProps {
  initialConversas: Conversa[];
  initialMeta: { total: number; page: number; size: number; pages: number };
  agentes: Agente[];
}

export function ConversasList({ initialConversas, initialMeta, agentes }: ConversasListProps) {
  const router = useRouter();
  const [agenteFilter, setAgenteFilter] = useState<string>('all');

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    if (agenteFilter !== 'all') params.set('id_agente', agenteFilter);
    router.push(`/admin/ia/conversas?${params.toString()}`);
  };

  const handleFilterChange = (value: string) => {
    setAgenteFilter(value);
    const params = new URLSearchParams();
    if (value !== 'all') params.set('id_agente', value);
    router.push(`/admin/ia/conversas?${params.toString()}`);
  };

  const getAgenteName = (id: string) => {
    return agentes.find((a) => a.id_agente === id)?.nm_agente || 'Agente';
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filtrar por agente:</label>
            <Select value={agenteFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todos os agentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os agentes</SelectItem>
                {agentes.map((agente) => (
                  <SelectItem key={agente.id_agente} value={agente.id_agente}>
                    {agente.nm_agente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-600">
        Total: <span className="font-semibold">{initialMeta.total}</span> conversas
      </p>

      {initialConversas.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhuma conversa encontrada"
          description="As conversas aparecerão aqui quando os usuários interagirem com os agentes"
        />
      ) : (
        <div className="space-y-4">
          {initialConversas.map((conversa) => (
            <Card
              key={conversa.id_conversa}
              className="group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-white to-gray-50"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-gray-900">
                        {conversa.nm_titulo || 'Sem título'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Bot className="w-4 h-4" />
                          <span>{getAgenteName(conversa.id_agente)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(conversa.dt_criacao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/ia/conversas/${conversa.id_conversa}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {initialMeta.pages > 1 && (
        <Pagination
          currentPage={initialMeta.page}
          totalPages={initialMeta.pages}
          totalItems={initialMeta.total}
          pageSize={initialMeta.size}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
