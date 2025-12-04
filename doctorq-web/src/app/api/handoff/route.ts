// src/app/api/handoff/route.ts
import { auth } from "@/auth";
import { NextRequest } from "next/server";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from "@/app/api/_lib/backend";

/**
 * POST /api/handoff
 *
 * Inicia o handoff do chatbot Gisele para a Central de Atendimento.
 * Cria uma conversa com atendente humano e importa o histórico do chat.
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação opcional (visitantes também podem solicitar handoff)
    const session = await auth();

    const body = await request.json();

    // Se usuário logado, adicionar dados do perfil
    if (session?.user) {
      body.nm_nome = body.nm_nome || session.user.name;
      body.ds_email = body.ds_email || session.user.email;
    }

    // Chamar backend para criar conversa na Central
    const response = await backendFetch("/central-atendimento/handoff/iniciar/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();

    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao iniciar handoff:", error);
    return jsonResponse(
      { error: "Erro interno ao transferir para atendente" },
      500
    );
  }
}

/**
 * GET /api/handoff?mensagem=...
 *
 * Detecta se uma mensagem indica intenção de falar com atendente humano.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mensagem = searchParams.get("mensagem");

    if (!mensagem) {
      return jsonResponse({ error: "Parâmetro 'mensagem' é obrigatório" }, 400);
    }

    // Detectar intenção localmente (para evitar latência de chamada ao backend)
    const isHandoff = detectarIntencaoHandoff(mensagem);

    return jsonResponse({
      is_handoff: isHandoff,
      confidence: isHandoff ? 0.95 : 0.0,
      mensagem_original: mensagem,
    });
  } catch (error) {
    console.error("Erro ao detectar intenção:", error);
    return jsonResponse(
      { error: "Erro interno ao detectar intenção" },
      500
    );
  }
}

// =============================================================================
// Detecção de Intenção Local
// =============================================================================

const HANDOFF_PATTERNS = [
  // Português
  "falar com atendente",
  "falar com humano",
  "atendente humano",
  "atendimento humano",
  "quero falar com alguem",
  "quero falar com alguém",
  "pessoa real",
  "atendente real",
  "falar com pessoa",
  "falar com uma pessoa",
  "preciso de ajuda humana",
  "transferir para atendente",
  "transferir atendimento",
  "sair do bot",
  "nao quero falar com robo",
  "não quero falar com robô",
  "falar com suporte",
  "suporte humano",
  "atendente por favor",
  "me ajude de verdade",
  "voce é um robo",
  "você é um robô",
  "isso é um bot",
  // Inglês (caso alguém use)
  "talk to human",
  "human agent",
  "real person",
  "transfer to agent",
];

/**
 * Detecta se a mensagem indica intenção de falar com atendente humano.
 */
function detectarIntencaoHandoff(mensagem: string): boolean {
  const mensagemLower = mensagem.toLowerCase().trim();

  // Remover acentos para comparação mais flexível
  const mensagemNormalized = mensagemLower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const pattern of HANDOFF_PATTERNS) {
    const patternNormalized = pattern
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (mensagemNormalized.includes(patternNormalized)) {
      return true;
    }
  }

  return false;
}
