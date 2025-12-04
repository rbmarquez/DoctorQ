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

export async function GET(_request: NextRequest) {
  try {
    // Permitir acesso sem autenticação (público + logado)
    const session = await auth();

    // Buscar agente principal (Gisele)
    const agentesResponse = await aiServiceFetch("/agentes/", {
      method: "GET",
      headers: {
        "st-principal": "true",
      },
    });

    if (!agentesResponse.ok) {
      return buildErrorResponse(agentesResponse);
    }

    const agentId = await agentesResponse.text();

    if (!agentId) {
      return jsonResponse(
        { error: "Agente Gisele não encontrado. Execute o seed primeiro." },
        404
      );
    }

    // Criar conversa (com ou sem usuário logado)
    const payload = {
      id_agente: agentId,
      nm_titulo: "Chat com Gisele",
      id_user: session?.user?.id || null, // Null para usuários anônimos
    };

    const response = await aiServiceFetch("/conversas/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data, 201);
  } catch (error) {
    console.error("Erro ao criar conversa com Gisele (GET):", error);
    return jsonResponse(
      { error: "Erro interno ao criar conversa" },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Permitir acesso sem autenticação (público + logado)
    const session = await auth();

    const body = await request.json();

    // Buscar ID do agente Gisele
    const agentesResponse = await aiServiceFetch("/agentes/?search=Gisele");

    if (!agentesResponse.ok) {
      return buildErrorResponse(agentesResponse);
    }

    const agentesData = await agentesResponse.json();
    const giseleAgent = agentesData.items?.find((a: any) =>
      a.nm_agente.includes("Gisele")
    );

    if (!giseleAgent) {
      return jsonResponse(
        { error: "Agente Gisele não encontrado. Execute o seed primeiro." },
        404
      );
    }

    // Criar conversa (com ou sem usuário logado)
    const payload = {
      id_agente: giseleAgent.id_agente,
      nm_titulo: body.nm_titulo || body.ds_titulo || "Chat com Gisele",
      id_user: session?.user?.id || null, // Null para usuários anônimos
    };

    const response = await aiServiceFetch("/conversas/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data, 201);
  } catch (error) {
    console.error("Erro ao criar conversa com Gisele:", error);
    return jsonResponse(
      { error: "Erro interno ao criar conversa" },
      500
    );
  }
}
