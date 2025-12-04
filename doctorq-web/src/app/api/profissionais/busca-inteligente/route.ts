import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY || "";

export async function POST(request: NextRequest) {
  console.log("🔍 Busca Inteligente: Iniciando...");

  try {
    // Obter body da requisição
    const body = await request.json();
    console.log("📤 Busca Inteligente: Enviando para backend:", JSON.stringify(body).slice(0, 200));

    // Fazer requisição ao backend usando API_KEY
    const response = await fetch(`${API_URL}/profissionais/busca-inteligente/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    console.log("📥 Busca Inteligente: Resposta do backend - Status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Busca Inteligente: Erro do backend:", errorData);
      return NextResponse.json(
        { error: errorData.detail || "Erro ao realizar busca inteligente" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ Busca Inteligente: Sucesso! Total encontrados:", data.total_encontrados);
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Busca Inteligente: Exceção:", error);
    return NextResponse.json(
      { error: "Erro interno ao realizar busca inteligente" },
      { status: 500 }
    );
  }
}
