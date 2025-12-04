import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY || "";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Buscar paciente no backend
    const response = await fetch(`${API_URL}/pacientes/${id}/`, {
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
    console.error("Erro ao buscar paciente:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar paciente" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const pacienteData = await request.json();

    // Atualizar paciente no backend
    const response = await fetch(`${API_URL}/pacientes/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(pacienteData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend error:", {
        status: response.status,
        error: errorData,
      });
      return NextResponse.json(
        { error: errorData.detail || "Erro ao atualizar paciente" },
        { status: response.status }
      );
    }

    const updatedPaciente = await response.json();

    return NextResponse.json({
      message: "Paciente atualizado com sucesso",
      data: updatedPaciente,
    });
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar paciente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Desativar paciente no backend
    const response = await fetch(`${API_URL}/pacientes/${id}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Erro ao desativar paciente" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: "Paciente desativado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao desativar paciente:", error);
    return NextResponse.json(
      { error: "Erro interno ao desativar paciente" },
      { status: 500 }
    );
  }
}
