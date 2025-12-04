import { auth } from "@/auth";
import { NextRequest } from "next/server";
import {
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

// Backend específico para AI Service (porta 8082)
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8082";
const AI_API_KEY = process.env.API_DOCTORQ_API_KEY || process.env.NEXT_PUBLIC_API_KEY || "";

async function aiServiceFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const url = `${AI_SERVICE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(init.headers || {});

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (AI_API_KEY && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${AI_API_KEY}`);
  }

  return fetch(url, { ...init, headers });
}

const ADMIN_ROLES = new Set(["administrador", "admin"]);

function hasRole(session: Awaited<ReturnType<typeof auth>>) {
  const role = session?.user?.role;
  return role ? role.toString().trim().toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const role = hasRole(session);
    if (!ADMIN_ROLES.has(role)) {
      return jsonResponse(
        { error: "Forbidden - Admin access required" },
        403
      );
    }

    const body = await request.json();
    const { id_tool, parameters } = body ?? {};

    if (!id_tool) {
      return jsonResponse({ error: "id_tool is required" }, 400);
    }

    const payload = {
      id_tool,
      parameters: parameters || {},
    };

    const response = await aiServiceFetch("/tools/execute", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return buildErrorResponse(response);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Erro ao executar tool:", error);
    return jsonResponse(
      { error: "Erro interno ao executar tool" },
      500
    );
  }
}
