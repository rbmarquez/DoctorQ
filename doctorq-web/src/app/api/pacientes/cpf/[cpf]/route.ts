import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY || "";

export async function GET(
  request: NextRequest,
  { params }: { params: { cpf: string } }
) {
  try {
    // Obter sessão do usuário
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { cpf } = params;

    // Buscar paciente por CPF no backend
    const response = await fetch(`${API_URL}/pacientes/cpf/${cpf}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Erro ao buscar paciente" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar paciente por CPF:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar paciente" },
      { status: 500 }
    );
  }
}
