import { auth } from "@/auth";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const response = await backendFetch("/agentes/custom/available-agents");
    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao buscar agentes customizados:", error);
    return jsonResponse(
      { error: "Erro interno ao buscar agentes customizados" },
      500
    );
  }
}
