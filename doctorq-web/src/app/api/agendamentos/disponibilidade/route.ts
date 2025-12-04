import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para buscar disponibilidade de um profissional
 * Usa o endpoint batch do backend para buscar múltiplos dias de uma vez
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idProfissional = searchParams.get('id_profissional');
    const data = searchParams.get('data');
    const numDias = parseInt(searchParams.get('num_dias') || '30');

    if (!idProfissional) {
      return NextResponse.json(
        { error: 'id_profissional é obrigatório' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const apiKey = process.env.API_DOCTORQ_API_KEY;

    if (!apiKey) {
      console.error('API_DOCTORQ_API_KEY não configurada');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    // Data padrão: amanhã
    const dataInicio = data || new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Usar endpoint batch que suporta múltiplos dias (limite de 30 no backend)
    const numDiasLimitado = Math.min(numDias, 30);

    const response = await fetch(
      `${backendUrl}/agendamentos/disponibilidade/batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ids_profissionais: [idProfissional],
          data_inicio: dataInicio,
          num_dias: numDiasLimitado,
          duracao_minutos: 60,
        }),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro do backend:', responseData);
      return NextResponse.json(
        { error: responseData.detail || 'Erro ao buscar disponibilidade' },
        { status: response.status }
      );
    }

    // O endpoint batch retorna array de profissionais, pegamos o primeiro
    const profissionalData = responseData[0];
    if (!profissionalData || !profissionalData.horarios) {
      return NextResponse.json([], { status: 200 });
    }

    // Organizar slots por data
    const slotsPorData: Record<string, { time: string; available: boolean }[]> = {};

    for (const slot of profissionalData.horarios) {
      const dateTime = new Date(slot.dt_horario);
      const dateKey = dateTime.toISOString().split('T')[0];
      const timeStr = dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (!slotsPorData[dateKey]) {
        slotsPorData[dateKey] = [];
      }

      slotsPorData[dateKey].push({
        time: timeStr,
        available: slot.disponivel,
      });
    }

    // Converter para array de dias
    const dias = Object.entries(slotsPorData).map(([date, slots]) => ({
      date,
      dayName: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }),
      dayNumber: new Date(date + 'T12:00:00').getDate().toString(),
      slots,
    }));

    // Ordenar por data
    dias.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(dias, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar disponibilidade:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
