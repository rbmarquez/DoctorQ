import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const apiKey = process.env.API_DOCTORQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    // Extrair query params
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const size = searchParams.get("size") || "20";
    const status = searchParams.get("status");
    const dt_inicio = searchParams.get("dt_inicio");
    const dt_fim = searchParams.get("dt_fim");

    // Construir query string
    const queryParams = new URLSearchParams({
      page,
      size,
    });

    if (status && status !== "all") {
      queryParams.append("status", status);
    }
    if (dt_inicio) {
      queryParams.append("dt_inicio", dt_inicio);
    }
    if (dt_fim) {
      queryParams.append("dt_fim", dt_fim);
    }

    const response = await fetch(
      `${backendUrl}/profissional-consolidacao/${params.id}/agendas/consolidadas/?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Erro ao buscar agendamentos: ${response.status} ${error}`);
      return NextResponse.json(
        { error: "Erro ao buscar agendamentos" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar agendamentos consolidados:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
