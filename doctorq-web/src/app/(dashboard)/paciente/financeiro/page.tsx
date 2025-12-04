import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { FinanceiroOverview } from './_components/FinanceiroOverview';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Financeiro | DoctorQ',
  description: 'Suas faturas e transações',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const id_empresa = 'placeholder'; // TODO: Get from session

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Financeiro" description="Gerencie suas faturas e pagamentos" />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <FinanceiroOverview id_usuario={session.user.id} id_empresa={id_empresa} />
        </Suspense>
      </div>
    </div>
  );
}
