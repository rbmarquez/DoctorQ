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

function userRole(session: Awaited<ReturnType<typeof auth>>) {
  const role = session?.user?.role;
  return role ? role.toString().trim().toLowerCase() : "";
}

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const response = await aiServiceFetch(`/agentes/${params.id}`);
    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao buscar agente:", error);
    return jsonResponse({ error: "Erro interno ao buscar agente" }, 500);
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

    if (!ADMIN_ROLES.has(userRole(session))) {
      return jsonResponse(
        { error: "Forbidden - Admin access required" },
        403
      );
    }

    // Validar ID
    if (!params?.id) {
      return jsonResponse({ error: "ID do agente não fornecido" }, 400);
    }

    console.log(`[PUT /api/agentes/${params.id}] Iniciando atualização`);

    const body = await request.json();
    const { nm_agente, ds_prompt, ds_config, st_principal } = body ?? {};

    console.log("[PUT] Body recebido:", { nm_agente, ds_prompt: ds_prompt?.substring(0, 50), ds_config: !!ds_config, st_principal });

    if (nm_agente !== undefined) {
      if (typeof nm_agente !== "string" || !nm_agente.trim()) {
        return jsonResponse(
          { error: "nm_agente cannot be empty when provided" },
          400
        );
      }
    }

    if (ds_prompt !== undefined) {
      if (typeof ds_prompt !== "string" || !ds_prompt.trim()) {
        return jsonResponse(
          { error: "ds_prompt cannot be empty when provided" },
          400
        );
      }
      if (ds_prompt.length > 10000) {
        return jsonResponse(
          { error: "ds_prompt não pode exceder 10.000 caracteres" },
          400
        );
      }
    }

    const payload: Record<string, unknown> = {};
    if (nm_agente !== undefined) payload.nm_agente = nm_agente.trim();
    if (ds_prompt !== undefined) payload.ds_prompt = ds_prompt.trim();
    if (ds_config !== undefined) payload.ds_config = ds_config;
    if (st_principal !== undefined) payload.st_principal = Boolean(st_principal);

    console.log("[PUT] Payload para backend:", { ...payload, ds_prompt: payload.ds_prompt ? String(payload.ds_prompt).substring(0, 50) : undefined });

    const response = await aiServiceFetch(`/agentes/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    console.log("[PUT] Response status:", response.status);

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao atualizar agente:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    return jsonResponse({
      error: "Erro interno ao atualizar agente",
      detail: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (!ADMIN_ROLES.has(userRole(session))) {
      return jsonResponse(
        { error: "Forbidden - Admin access required" },
        403
      );
    }

    const response = await aiServiceFetch(`/agentes/${params.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    return jsonResponse({ message: "Agente deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar agente:", error);
    return jsonResponse({ error: "Erro interno ao deletar agente" }, 500);
  }
}
