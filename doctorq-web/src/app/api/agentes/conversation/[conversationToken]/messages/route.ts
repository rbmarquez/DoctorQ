import { auth } from "@/auth";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

export async function GET(
  _: Request,
  { params }: { params: { conversationToken: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const response = await backendFetch(
      `/agentes/conversation/${params.conversationToken}/messages`
    );

    if (response.status === 404) {
      // Conversa ainda não possui mensagens
      return jsonResponse([]);
    }

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao buscar mensagens da conversa:", error);
    return jsonResponse(
      { error: "Erro interno ao buscar mensagens" },
      500
    );
  }
}
