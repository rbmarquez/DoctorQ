import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    // Obter sessão do usuário
    const session = await auth();

    console.log("[API /pacientes GET] Session:", session?.user?.id ? "Autenticado" : "Não autenticado");

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Obter query parameters
    const searchParams = request.nextUrl.searchParams;
    const id_clinica = searchParams.get("id_clinica");
    const busca = searchParams.get("busca");
    const apenas_ativos = searchParams.get("apenas_ativos") || "true";
    const page = searchParams.get("page") || "1";
    const size = searchParams.get("size") || "50";

    // Construir URL com query parameters
    const params = new URLSearchParams();
    if (id_clinica) params.append("id_clinica", id_clinica);
    if (busca) params.append("busca", busca);
    params.append("apenas_ativos", apenas_ativos);
    params.append("page", page);
    params.append("size", size);

    // Obter JWT token do usuário da sessão
    const userToken = (session.user as any).accessToken;

    if (!userToken) {
      return NextResponse.json(
        { error: "Token de autenticação não encontrado" },
        { status: 401 }
      );
    }

    // Buscar pacientes no backend usando JWT do usuário
    const response = await fetch(
      `${API_URL}/pacientes/?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Erro ao buscar pacientes" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar pacientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obter sessão do usuário
    const session = await auth();

    console.log("[API /pacientes POST] Session:", session?.user?.id ? "Autenticado" : "Não autenticado");
    console.log("[API /pacientes POST] API_KEY:", API_KEY ? `${API_KEY.substring(0, 10)}...` : "NÃO DEFINIDA");

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    const pacienteData = await request.json();

    console.log("[API /pacientes POST] Payload recebido do frontend:", pacienteData);
    console.log("[API /pacientes POST] id_clinica no payload:", pacienteData.id_clinica);

    // IMPORTANTE: Remover id_clinica e id_profissional do payload
    // O backend detecta automaticamente baseado no usuário autenticado via JWT/API Key
    const { id_clinica, id_profissional, ...cleanPayload } = pacienteData;

    console.log("[API /pacientes POST] Payload limpo enviado ao backend:", cleanPayload);

    // Obter JWT token do usuário da sessão
    const userToken = (session.user as any).accessToken;

    if (!userToken) {
      return NextResponse.json(
        { error: "Token de autenticação não encontrado" },
        { status: 401 }
      );
    }

    // IMPORTANTE: Usar JWT do usuário para autenticação
    // O backend detecta o perfil através do JWT e vincula o paciente automaticamente
    const response = await fetch(`${API_URL}/pacientes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(cleanPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend error:", {
        status: response.status,
        error: errorData,
      });
      return NextResponse.json(
        { error: errorData.detail || "Erro ao criar paciente" },
        { status: response.status }
      );
    }

    const createdPaciente = await response.json();

    return NextResponse.json(
      {
        message: "Paciente criado com sucesso",
        data: createdPaciente,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar paciente" },
      { status: 500 }
    );
  }
}
