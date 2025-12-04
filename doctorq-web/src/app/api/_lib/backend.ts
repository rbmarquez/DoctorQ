const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8080";

const API_KEY =
  process.env.API_DOCTORQ_API_KEY ||
  process.env.NEXT_PUBLIC_API_KEY ||
  process.env.API_KEY ||
  "";

/**
 * Helper para chamadas ao backend FastAPI/FastAPI.
 * Garante inclusão do API Key e tratamento de cabeçalhos.
 */
export async function backendFetch(
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(init.headers || {});

  // Define Content-Type quando houver body JSON e não estiver presente.
  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (API_KEY && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${API_KEY}`);
  }

  return fetch(url, {
    ...init,
    headers,
  });
}

/**
 * Converte erros do backend em resposta JSON consistente.
 */
export async function buildErrorResponse(
  response: Response
): Promise<Response> {
  let detail: any = null;
  try {
    detail = await response.json();
  } catch {
    detail = { error: response.statusText || "Erro desconhecido" };
  }

  return new Response(JSON.stringify({
    error: detail.error || detail.detail || "Erro ao comunicar com a API",
    detail,
  }), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Pequena conveniência para respostas JSON.
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
