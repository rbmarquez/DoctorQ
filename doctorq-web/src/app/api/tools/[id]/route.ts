import { auth } from "@/auth";
import { NextRequest } from "next/server";
import {
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

// Backend específico para AI Service (porta 8082)
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8082";
const AI_API_KEY = process.env.API_DOCTORQ_API_KEY || process.env.NEXT_PUBLIC_API_KEY || "";

async function aiServiceFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const url = `${AI_SERVICE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(init.headers || {});

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (AI_API_KEY && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${AI_API_KEY}`);
  }

  return fetch(url, { ...init, headers });
}

const ADMIN_ROLES = new Set(["administrador", "admin"]);

function hasRole(session: Awaited<ReturnType<typeof auth>>) {
  const role = session?.user?.role;
  return role ? role.toString().trim().toLowerCase() : "";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const role = hasRole(session);
    if (!role) {
      return jsonResponse({ error: "Forbidden - Role not defined" }, 403);
    }

    const { id } = params;
    const response = await aiServiceFetch(`/tools/${id}`);

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao buscar tool:", error);
    return jsonResponse(
      { error: "Erro interno ao buscar tool" },
      500
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const role = hasRole(session);
    if (!ADMIN_ROLES.has(role)) {
      return jsonResponse(
        { error: "Forbidden - Admin access required" },
        403
      );
    }

    const { id } = params;
    const body = await request.json();

    const response = await aiServiceFetch(`/tools/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao atualizar tool:", error);
    return jsonResponse(
      { error: "Erro interno ao atualizar tool" },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const role = hasRole(session);
    if (!ADMIN_ROLES.has(role)) {
      return jsonResponse(
        { error: "Forbidden - Admin access required" },
        403
      );
    }

    const { id } = params;
    const response = await aiServiceFetch(`/tools/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir tool:", error);
    return jsonResponse(
      { error: "Erro interno ao excluir tool" },
      500
    );
  }
}
