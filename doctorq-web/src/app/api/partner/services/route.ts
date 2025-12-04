import { NextRequest } from "next/server";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

export async function GET(request: NextRequest) {
  const includeInactive = request.nextUrl.searchParams.get("includeInactive");
  const searchParams = new URLSearchParams();
  if (includeInactive && includeInactive !== "false") {
    searchParams.set("include_inactive", "true");
  }

  const url = `/partner-leads/services/${
    searchParams.size ? `?${searchParams.toString()}` : ""
  }`;

  const response = await backendFetch(url);
  if (!response.ok) {
    return buildErrorResponse(response);
  }

  const data = await response.json();
  return jsonResponse(data);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const response = await backendFetch("/partner-leads/services/", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    return buildErrorResponse(response);
  }

  const data = await response.json();
  return jsonResponse(data, 201);
}
