import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.API_BASE_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY;

/**
 * GET /api/me/telas-permitidas
 * Retorna as telas permitidas para o usuário logado baseado no plano da empresa.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Chamar o backend para obter as telas permitidas
    const response = await fetch(`${API_URL}/plano-telas/usuario/me/telas-permitidas/`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        // Passar dados do usuário para o backend identificar a empresa
        "X-User-Id": session.user.id || "",
        "X-User-Email": session.user.email || "",
      },
    });

    if (!response.ok) {
      // Se der erro, retorna lista vazia (sem restrições)
      console.error("[API] Erro ao buscar telas permitidas:", response.status);
      return NextResponse.json({
        telas_permitidas: [],
        id_service: null,
        nm_plano: null,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API] Erro ao buscar telas permitidas:", error);
    // Em caso de erro, retorna lista vazia (sem restrições)
    return NextResponse.json({
      telas_permitidas: [],
      id_service: null,
      nm_plano: null,
    });
  }
}
