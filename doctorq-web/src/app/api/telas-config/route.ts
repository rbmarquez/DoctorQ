import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.API_BASE_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY;

async function makeBackendRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
    throw new Error(error.detail || error.message || "Falha na requisição");
  }

  return response.json();
}

// GET /api/telas-config - Listar configurações de telas
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const configs = await makeBackendRequest<any>(
      `/telas-config/${queryString ? `?${queryString}` : ""}`
    );

    return NextResponse.json(configs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar configurações de telas" },
      { status: 500 }
    );
  }
}

// POST /api/telas-config - Criar ou atualizar configuração de tela
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificar se é admin (aceita variações: admin, administrador)
  const userRole = (session.user?.role || session.user?.backendData?.nm_papel || "").toLowerCase();
  const isAdmin = ["admin", "administrador", "super_admin", "superadmin"].includes(userRole);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { cd_tela, tp_tipo, fg_visivel } = body;

    if (!cd_tela || !tp_tipo || fg_visivel === undefined) {
      return NextResponse.json(
        { error: "cd_tela, tp_tipo e fg_visivel são obrigatórios" },
        { status: 400 }
      );
    }

    const config = await makeBackendRequest<any>(
      `/telas-config/?cd_tela=${cd_tela}&tp_tipo=${tp_tipo}&fg_visivel=${fg_visivel}`,
      { method: "POST" }
    );

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar/atualizar configuração" },
      { status: 500 }
    );
  }
}
