import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para cancelar agendamento pelo paciente
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const apiKey = process.env.API_DOCTORQ_API_KEY;

    if (!apiKey) {
      console.error('API_DOCTORQ_API_KEY não configurada');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    // Primeiro, buscar o agendamento para obter o id_paciente
    const agendamentoResponse = await fetch(`${backendUrl}/agendamentos/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!agendamentoResponse.ok) {
      const errorData = await agendamentoResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Agendamento não encontrado' },
        { status: agendamentoResponse.status }
      );
    }

    const agendamento = await agendamentoResponse.json();
    const idPaciente = agendamento.id_paciente;

    if (!idPaciente) {
      return NextResponse.json(
        { error: 'ID do paciente não encontrado no agendamento' },
        { status: 400 }
      );
    }

    // Agora fazer o cancelamento com o id_paciente correto
    const response = await fetch(`${backendUrl}/agendamentos/${id}/cancelar-paciente`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        motivo: body.motivo || 'Cancelado pelo paciente',
        id_paciente: idPaciente,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro do backend:', data);
      return NextResponse.json(
        { error: data.detail || data.error || 'Erro ao cancelar agendamento' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao cancelar agendamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
