import { NextRequest } from "next/server";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

export async function POST(request: NextRequest) {
  try {
    const { descricao, contexto, tipo_agente } = await request.json();

    const prompt = `Você é um especialista em criação de prompts para agentes de IA. Crie um prompt profissional e estruturado para o seguinte agente:
TIPO: ${tipo_agente?.toString().toUpperCase() || "GERAL"}
DESCRIÇÃO: ${descricao}
${contexto ? `CONTEXTO: ${contexto}` : ""}
Gere um prompt que:
- Defina claramente o papel do agente
- Especifique comportamentos esperados
- Inclua diretrizes de comunicação
- Seja profissional e completo
- Use linguagem natural e fluida
Retorne apenas o prompt final, sem explicações adicionais.`;

    const response = await backendFetch("/agentes/custom", {
      method: "POST",
      body: JSON.stringify({
        texto: prompt,
        nome_agente: "dinamico_agente",
        temperatura: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse({
      prompt: data.result,
      sugestoes: [],
      timestamp: data.timestamp,
      tipo_agente: tipo_agente || "geral",
      qualidade: "alta",
    });
  } catch (error) {
    console.error("Erro ao gerar prompt:", error);
    return jsonResponse({ error: "Erro interno ao gerar prompt" }, 500);
  }
}
