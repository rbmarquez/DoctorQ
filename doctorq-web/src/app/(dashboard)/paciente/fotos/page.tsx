import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { FotosGallery } from './_components/FotosGallery';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Minhas Fotos | DoctorQ',
  description: 'Álbum de fotos antes e depois',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // TODO: Obter id_paciente do usuário logado via API
  const id_paciente = session.user.id; // Placeholder

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Minhas Fotos" description="Álbum de fotos antes e depois dos seus tratamentos" />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <FotosGallery id_paciente={id_paciente} />
        </Suspense>
      </div>
    </div>
  );
}
