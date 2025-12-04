/**
 * Admin Dashboard - Server Component
 *
 * Migrado para Server Component para:
 * - Reduzir bundle JavaScript (~40%)
 * - Melhorar TTI (Time to Interactive)
 * - Manter API key segura no servidor
 * - Permitir fetch paralelo no servidor
 *
 * @page Admin Dashboard
 */

import { Suspense } from 'react';
import { getDashboardStats } from '@/lib/api/server';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { LoadingState } from '@/components/shared/feedback/LoadingState';
import { StatsCards } from './_components/StatsCards';
import { QuickActions } from './_components/QuickActions';
import { RecentActivity } from './_components/RecentActivity';
import { UserLimitGauge } from '@/components/dashboard/UserLimitGauge';

// Forçar renderização dinâmica para evitar erro de prerender
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard Administrativo | DoctorQ',
  description: 'Visão geral do sistema DoctorQ - gerenciamento de clínicas de estética',
};

/**
 * Page Component (Server Component)
 *
 * Server Components são o padrão no Next.js 15.
 * Use 'use client' apenas nos componentes filhos que precisam de interatividade.
 */
export default async function AdminDashboardPage() {
  // ✅ Fetch no servidor - executa em paralelo com outras operações
  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-8">
        <PageHeader
          title="Dashboard Administrativo"
          description="Visão geral do sistema e acesso rápido às funcionalidades principais"
        />

        {/* Stats Cards - Server Component com dados */}
        <StatsCards stats={stats} />

        {/* User Limit Gauge - Widget de limite de usuários */}
        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<LoadingState message="Carregando limite de usuários..." />}>
            <UserLimitGauge />
          </Suspense>

          {/* Quick Actions - Client Component para interatividade */}
          <QuickActions />
        </div>

        {/* Recent Activity - Suspense para loading incremental */}
        <Suspense fallback={<LoadingState message="Carregando atividades recentes..." />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  );
}
