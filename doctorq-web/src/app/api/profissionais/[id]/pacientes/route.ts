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

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const size = searchParams.get("size") || "20";
    const search = searchParams.get("search");

    const queryParams = new URLSearchParams({ page, size });
    if (search) {
      queryParams.append("search", search);
    }

    const response = await fetch(
      `${backendUrl}/profissional-consolidacao/${params.id}/pacientes/?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Erro ao buscar pacientes: ${response.status}`);
      return NextResponse.json(
        { error: "Erro ao buscar pacientes" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
