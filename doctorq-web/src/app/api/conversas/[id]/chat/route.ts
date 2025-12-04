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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Permitir acesso sem autenticação (público + logado)
    const session = await auth();

    const { id } = await params;
    const body = await request.json();

    // Construir URL com user_id se disponível
    let url = `/conversas/${id}/chat`;
    if (session?.user?.id) {
      url += `?user_id=${session.user.id}`;
    }

    // Enviar mensagem para o backend (com streaming SSE)
    const response = await aiServiceFetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    // Retornar o stream diretamente
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return jsonResponse(
      { error: "Erro interno ao enviar mensagem" },
      500
    );
  }
}
