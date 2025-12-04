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

    // Buscar clínicas associadas ao profissional
    const response = await fetch(
      `${backendUrl}/profissional-consolidacao/${params.id}/clinicas/`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Erro ao buscar clínicas: ${response.status}`);
      // Retornar array vazio em caso de erro
      return NextResponse.json([]);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar clínicas:", error);
    return NextResponse.json([], { status: 200 }); // Retornar array vazio ao invés de erro
  }
}
