import { auth } from "@/auth";
import { NextRequest } from "next/server";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string; storeId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const response = await backendFetch(
      `/agentes/${params.id}/document-stores/${params.storeId}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    return jsonResponse({ message: "Document store removida do agente" });
  } catch (error) {
    console.error(
      "Erro ao remover document store do agente:",
      error
    );
    return jsonResponse(
      { error: "Erro interno ao remover document store" },
      500
    );
  }
}
