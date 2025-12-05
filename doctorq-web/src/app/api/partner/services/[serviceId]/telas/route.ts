import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.API_BASE_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY;

interface TelaConfigInput {
  cd_tela: string;
  fg_visivel: boolean;
}

/**
 * GET /api/partner/services/[serviceId]/telas
 * Retorna as configurações de telas para um plano específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { serviceId } = await params;

    const response = await fetch(`${API_URL}/plano-telas/${serviceId}/`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      // Se não encontrou, retorna lista vazia
      if (response.status === 404) {
        return NextResponse.json([]);
      }
      const errorData = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
      throw new Error(errorData.detail || "Erro ao buscar configurações");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API] Erro ao buscar telas do plano:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar configurações de telas" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partner/services/[serviceId]/telas
 * Salva as configurações de telas para um plano
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificar se é admin
  const userRole = (session.user?.role || session.user?.backendData?.nm_papel || "").toLowerCase();
  const isAdmin = ["admin", "administrador", "super_admin", "superadmin"].includes(userRole);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { serviceId } = await params;
    const body = await request.json();
    const { telas } = body as { telas: TelaConfigInput[] };

    if (!telas || !Array.isArray(telas)) {
      return NextResponse.json(
        { error: "O campo 'telas' é obrigatório e deve ser um array" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/plano-telas/${serviceId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ telas }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
      throw new Error(errorData.detail || "Erro ao salvar configurações");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API] Erro ao salvar telas do plano:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar configurações de telas" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partner/services/[serviceId]/telas
 * Remove todas as configurações de telas de um plano
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificar se é admin
  const userRole = (session.user?.role || session.user?.backendData?.nm_papel || "").toLowerCase();
  const isAdmin = ["admin", "administrador", "super_admin", "superadmin"].includes(userRole);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { serviceId } = await params;

    const response = await fetch(`${API_URL}/plano-telas/${serviceId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
      throw new Error(errorData.detail || "Erro ao remover configurações");
    }

    return NextResponse.json({ message: "Configurações removidas com sucesso" });
  } catch (error: any) {
    console.error("[API] Erro ao remover telas do plano:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao remover configurações de telas" },
      { status: 500 }
    );
  }
}
