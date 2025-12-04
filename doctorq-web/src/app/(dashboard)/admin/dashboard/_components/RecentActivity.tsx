/**
 * RecentActivity Component - Server Component with Suspense
 *
 * Exibe atividades recentes do sistema.
 * Usa Suspense para carregamento incremental e não bloquear o resto da página.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Bot, Calendar, Package } from 'lucide-react';
import { formatDate } from '@/lib/api/server';

// Dados mockados - substituir por fetch real quando endpoint estiver disponível
const mockActivities = [
  {
    id: '1',
    type: 'usuario' as const,
    description: 'Novo usuário cadastrado',
    user: 'João Silva',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
  },
  {
    id: '2',
    type: 'agente' as const,
    description: 'Agente de atendimento atualizado',
    user: 'Maria Santos',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
  },
  {
    id: '3',
    type: 'agendamento' as const,
    description: 'Novo agendamento confirmado',
    user: 'Pedro Costa',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
  },
  {
    id: '4',
    type: 'produto' as const,
    description: 'Produto adicionado ao marketplace',
    user: 'Ana Lima',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
  },
  {
    id: '5',
    type: 'conversa' as const,
    description: 'Nova conversa com IA iniciada',
    user: 'Carlos Souza',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6h ago
  },
];

const iconMap = {
  usuario: User,
  agente: Bot,
  agendamento: Calendar,
  produto: Package,
  conversa: Bot,
};

const colorMap = {
  usuario: 'bg-blue-100 text-blue-700',
  agente: 'bg-purple-100 text-purple-700',
  agendamento: 'bg-green-100 text-green-700',
  produto: 'bg-orange-100 text-orange-700',
  conversa: 'bg-blue-100 text-blue-700',
};

/**
 * Format timestamp to relative time (e.g., "há 15 minutos")
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) {
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  } else if (hours < 24) {
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else {
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
}

/**
 * RecentActivity Component
 *
 * Server Component que pode ser envolvido em Suspense
 * para carregamento incremental.
 */
export async function RecentActivity() {
  // Simular delay de API (remover em produção)
  // await new Promise(resolve => setTimeout(resolve, 1000));

  // TODO: Substituir por fetch real quando endpoint estiver disponível
  // const activities = await fetch('/api/activities/recent').then(r => r.json());
  const activities = mockActivities;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Atividade Recente</h2>
      <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg">
        <CardHeader>
          <CardTitle>Últimas Ações no Sistema</CardTitle>
          <CardDescription>Acompanhe as atividades mais recentes dos usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = iconMap[activity.type];
              const colorClass = colorMap[activity.type];

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-600">por {activity.user}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
