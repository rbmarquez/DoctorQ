/**
 * QuickActions Component - Server Component
 *
 * Links rápidos para funcionalidades principais do admin.
 * Não precisa ser Client Component pois são apenas links estáticos.
 */

import Link from 'next/link';
import { Users, Bot, BookOpen, Wrench, Package, Calendar, BarChart, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const quickActions = [
  {
    title: 'Gerenciar Usuários',
    description: 'Adicionar e gerenciar usuários do sistema',
    icon: Users,
    link: '/admin/usuarios',
    color: 'blue',
  },
  {
    title: 'Configurar Agentes',
    description: 'Criar e treinar agentes de IA',
    icon: Bot,
    link: '/admin/agentes',
    color: 'purple',
  },
  {
    title: 'Base de Conhecimento',
    description: 'Gerenciar documentos e embeddings',
    icon: BookOpen,
    link: '/admin/knowledge',
    color: 'green',
  },
  {
    title: 'Ferramentas IA',
    description: 'Configurar tools e integrações',
    icon: Wrench,
    link: '/admin/tools',
    color: 'orange',
  },
  {
    title: 'Produtos',
    description: 'Gerenciar catálogo do marketplace',
    icon: Package,
    link: '/admin/produtos',
    color: 'pink',
  },
  {
    title: 'Agendamentos',
    description: 'Visualizar agenda e compromissos',
    icon: Calendar,
    link: '/admin/agendamentos',
    color: 'indigo',
  },
  {
    title: 'Analytics',
    description: 'Relatórios e métricas do sistema',
    icon: BarChart,
    link: '/admin/analytics',
    color: 'cyan',
  },
  {
    title: 'Configurações',
    description: 'Ajustes gerais do sistema',
    icon: Settings,
    link: '/admin/configuracoes',
    color: 'gray',
  },
];

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
  purple: 'from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700',
  green: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
  orange: 'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
  pink: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
  indigo: 'from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700',
  cyan: 'from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700',
  gray: 'from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700',
};

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Ações Rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const gradientClass = colorMap[action.color] || colorMap.gray;

          return (
            <Link key={action.title} href={action.link}>
              <Card className="group hover:shadow-lg transition-all duration-300 h-full border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {action.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
