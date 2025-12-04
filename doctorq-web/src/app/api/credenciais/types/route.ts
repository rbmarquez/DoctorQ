import { auth } from "@/auth";
import { jsonResponse } from '@/app/api/_lib/backend';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Tipos de credenciais suportados
    // Baseado nos tipos usados no sistema
    const tipos = [
      { value: "openai", label: "OpenAI API" },
      { value: "azure_openai", label: "Azure OpenAI" },
      { value: "azure_openai_embedding", label: "Azure OpenAI Embedding" },
      { value: "anthropic", label: "Anthropic (Claude)" },
      { value: "google_ai", label: "Google AI (Gemini)" },
      { value: "qdrant", label: "Qdrant Vector DB" },
      { value: "postgresql", label: "PostgreSQL" },
      { value: "redis", label: "Redis" },
      { value: "smtp", label: "SMTP (E-mail)" },
      { value: "webhook", label: "Webhook" },
      { value: "api_key", label: "API Key Genérica" },
      { value: "oauth2", label: "OAuth 2.0" },
      { value: "custom", label: "Customizada" },
    ];

    return jsonResponse(tipos);
  } catch (error) {
    console.error("Erro ao buscar tipos de credenciais:", error);
    return jsonResponse(
      { error: "Erro interno ao buscar tipos" },
      500
    );
  }
}
