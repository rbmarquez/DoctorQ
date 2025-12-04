import { auth } from "@/auth";
import { NextRequest } from "next/server";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

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
    const response = await backendFetch(`/agentes/${params.id}/add-tool`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao adicionar tool ao agente:", error);
    return jsonResponse(
      { error: "Erro interno ao adicionar ferramenta" },
      500
    );
  }
}
