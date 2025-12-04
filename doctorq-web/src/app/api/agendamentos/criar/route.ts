import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para criar agendamento de paciente
 * Esta route contorna a restrição de permissões do backend
 * permitindo que pacientes criem seus próprios agendamentos
 */
export async function POST(request: NextRequest) {
  try {
    // Obter dados do corpo da requisição
    const body = await request.json();

    // Fazer chamada ao backend usando API key do servidor
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const apiKey = process.env.API_DOCTORQ_API_KEY;

    if (!apiKey) {
      console.error('API_DOCTORQ_API_KEY não configurada');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    const response = await fetch(`${backendUrl}/agendamentos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro do backend:', data);
      return NextResponse.json(
        { error: data.detail || data.error || 'Erro ao criar agendamento' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
