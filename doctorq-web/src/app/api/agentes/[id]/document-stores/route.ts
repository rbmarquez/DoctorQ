import { auth } from "@/auth";
import { NextRequest } from "next/server";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const response = await backendFetch(`/agentes/${params.id}/document-stores`);
    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao listar document stores do agente:", error);
    return jsonResponse(
      { error: "Erro interno ao buscar document stores" },
      500
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    const response = await backendFetch(`/agentes/${params.id}/document-stores`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao associar document store ao agente:", error);
    return jsonResponse(
      { error: "Erro interno ao associar document store" },
      500
    );
  }
}
