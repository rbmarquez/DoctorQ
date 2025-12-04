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
      "Authorization": `Bearer ${API_KEY}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Erro na requisição");
  }

  return response.json();
}

// GET /api/perfis - Listar perfis com paginação
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const perfis = await makeBackendRequest<any>(
      `/perfis/?${queryString}`
    );

    return NextResponse.json(perfis);
  } catch (error: any) {
    console.error("Erro ao buscar perfis:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar perfis" },
      { status: 500 }
    );
  }
}

// POST /api/perfis - Criar novo perfil
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apenas admins podem criar perfis
    const userRole = session.user?.role || session.user?.backendData?.nm_papel;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const perfil = await makeBackendRequest<any>("/perfis/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json(perfil, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar perfil" },
      { status: 500 }
    );
  }
}
