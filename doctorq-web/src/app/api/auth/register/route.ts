import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valida��o b�sica
    if (!body.nm_email || !body.nm_completo || !body.senha) {
      return NextResponse.json(
        { error: "Campos obrigat�rios faltando" },
        { status: 400 }
      );
    }

    // Chamar backend FastAPI (sem trailing slash conforme testado)
    const response = await fetch(`${BACKEND_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { "Authorization": `Bearer ${API_KEY}` }),
      },
      body: JSON.stringify({
        nm_email: body.nm_email,
        nm_completo: body.nm_completo,
        senha: body.senha,
        nm_papel: body.nm_papel || "usuario",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Erro ao criar conta" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
