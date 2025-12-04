/**
 * StatsCards Component - Server Component
 *
 * Exibe cards de estatísticas do dashboard.
 * Como não tem interatividade, pode ser Server Component.
 */

import Link from 'next/link';
import {
  Users,
  Briefcase,
  Bot,
  MessageSquare,
  Calendar,
  UserCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardStats } from '@/lib/api/server';

interface StatsCardsProps {
  stats: DashboardStats;
}

const statCards = [
  {
    key: 'total_empresas' as keyof DashboardStats,
    label: 'Empresas',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-600',
    link: '/admin/empresas',
    change: '+12%',
    changeType: 'up' as const,
  },
  {
    key: 'total_agentes' as keyof DashboardStats,
    label: 'Agentes de IA',
    icon: Bot,
    color: 'from-purple-500 to-blue-600',
    link: '/admin/agentes',
    change: '+8%',
    changeType: 'up' as const,
  },
  {
    key: 'total_usuarios' as keyof DashboardStats,
    label: 'Usuários',
    icon: Users,
    color: 'from-green-500 to-emerald-600',
    link: '/admin/usuarios',
    change: '+5%',
    changeType: 'up' as const,
  },
  {
    key: 'total_profissionais' as keyof DashboardStats,
    label: 'Profissionais',
    icon: UserCheck,
    color: 'from-cyan-500 to-blue-600',
    link: '/admin/usuarios?papel=profissional',
    change: '+3%',
    changeType: 'up' as const,
  },
  {
    key: 'total_agendamentos' as keyof DashboardStats,
    label: 'Agendamentos',
    icon: Calendar,
    color: 'from-orange-500 to-red-600',
    link: '/admin/agendamentos',
    change: '+15%',
    changeType: 'up' as const,
  },
  {
    key: 'total_conversas' as keyof DashboardStats,
    label: 'Conversas IA',
    icon: MessageSquare,
    color: 'from-blue-500 to-cyan-600',
    link: '/admin/conversas',
    change: '+22%',
    changeType: 'up' as const,
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key] || 0;
        const ChangeIcon = card.changeType === 'up' ? TrendingUp : TrendingDown;

        return (
          <Link key={card.key} href={card.link}>
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.label}
                </CardTitle>
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {value.toLocaleString('pt-BR')}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1 ${
                        card.changeType === 'up'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <ChangeIcon className="w-3 h-3" />
                      <span className="text-xs font-semibold">{card.change}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {card.changeType === 'up' ? 'Crescimento' : 'Redução'} em relação ao mês
                    anterior
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
