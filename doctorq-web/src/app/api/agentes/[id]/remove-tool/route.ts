import { auth } from "@/auth";
import { NextRequest } from "next/server";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    const response = await backendFetch(`/agentes/${params.id}/remove-tool`, {
      method: "DELETE",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao remover tool do agente:", error);
    return jsonResponse(
      { error: "Erro interno ao remover ferramenta" },
      500
    );
  }
}
