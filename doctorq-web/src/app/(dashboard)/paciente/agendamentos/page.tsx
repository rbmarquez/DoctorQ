import { PageHeader } from '@/components/shared/layout/PageHeader';
import { AgendamentosList } from './_components/AgendamentosList';
import { getAgendamentosPaciente } from '@/lib/api/server';
import { getPacienteId } from '@/lib/auth/session';

export const metadata = {
  title: 'Meus Agendamentos | DoctorQ',
  description: 'Consulte e gerencie seus agendamentos',
};

interface AgendamentosPageProps {
  searchParams: {
    page?: string;
    status?: string;
  };
}

export default async function AgendamentosPacientePage({ searchParams }: AgendamentosPageProps) {
  const page = parseInt(searchParams.page || '1');
  const status = searchParams.status;

  let agendamentos: any = { items: [], meta: { page: 1, size: 20, total: 0, pages: 0 } };

  try {
    const pacienteId = await getPacienteId();
    if (pacienteId) {
      agendamentos = await getAgendamentosPaciente(pacienteId, { page, size: 20, status });
    }
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Meus Agendamentos" description="Consulte e gerencie seus agendamentos com profissionais" action={{ label: 'Novo Agendamento', href: '/busca' }} />
        <AgendamentosList initialAgendamentos={agendamentos.items} />
      </div>
    </div>
  );
}
