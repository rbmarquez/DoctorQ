import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoritosList } from './_components/FavoritosList';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Favoritos | DoctorQ',
  description: 'Seus procedimentos e produtos favoritos',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Favoritos" description="Seus procedimentos e produtos favoritos" />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <FavoritosList id_usuario={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
