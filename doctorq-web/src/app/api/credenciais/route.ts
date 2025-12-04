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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const role = hasRole(session);
    if (!role) {
      return jsonResponse({ error: "Forbidden - Role not defined" }, 403);
    }

    // Header especial para obter apenas o credencial principal
    const stPrincipal = request.headers.get("st-principal");
    if (stPrincipal?.toLowerCase() === "true") {
      const response = await aiServiceFetch("/credenciais/", {
        method: "GET",
        headers: {
          "st-principal": "true",
        },
      });

      if (!response.ok) {
        return buildErrorResponse(response);
      }

      const agentId = await response.text();
      return new Response(agentId, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    const url = new URL(request.url);
    const searchParams = new URLSearchParams({
      page: url.searchParams.get("page") ?? "1",
      size: url.searchParams.get("size") ?? "10",
      order_by: url.searchParams.get("order_by") ?? "dt_criacao",
      order_desc: url.searchParams.get("order_desc") ?? "true",
    });

    const search = url.searchParams.get("search");
    if (search) {
      searchParams.append("search", search);
    }

    const response = await aiServiceFetch(`/credenciais/?${searchParams.toString()}`);
    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao listar credenciais:", error);
    return jsonResponse(
      { error: "Erro interno ao listar credenciais" },
      500
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { nm_credencial, ds_prompt, ds_config, st_principal } = body ?? {};

    if (!nm_credencial || typeof nm_credencial !== "string" || !nm_credencial.trim()) {
      return jsonResponse({ error: "nm_credencial is required" }, 400);
    }

    if (!ds_prompt || typeof ds_prompt !== "string" || !ds_prompt.trim()) {
      return jsonResponse({ error: "ds_prompt is required" }, 400);
    }

    if (ds_prompt.length > 10000) {
      return jsonResponse(
        { error: "ds_prompt não pode exceder 10.000 caracteres" },
        400
      );
    }

    const payload = {
      nm_credencial: nm_credencial.trim(),
      ds_prompt: ds_prompt.trim(),
      ds_config: ds_config ?? null,
      st_principal: Boolean(st_principal),
    };

    const response = await aiServiceFetch("/credenciais/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data, 201);
  } catch (error) {
    console.error("Erro ao criar credencial:", error);
    return jsonResponse(
      { error: "Erro interno ao criar credencial" },
      500
    );
  }
}
