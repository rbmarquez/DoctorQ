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

// GET /api/perfis/[id] - Obter perfil por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const perfil = await makeBackendRequest<any>(`/perfis/${params.id}`);

    return NextResponse.json(perfil);
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

// PUT /api/perfis/[id] - Atualizar perfil
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apenas admins podem atualizar perfis
    const userRole = session.user?.role || session.user?.backendData?.nm_papel;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const perfil = await makeBackendRequest<any>(`/perfis/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return NextResponse.json(perfil);
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}

// DELETE /api/perfis/[id] - Desativar perfil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apenas admins podem deletar perfis
    const userRole = session.user?.role || session.user?.backendData?.nm_papel;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const result = await makeBackendRequest<any>(`/perfis/${params.id}`, {
      method: "DELETE",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao deletar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar perfil" },
      { status: 500 }
    );
  }
}
