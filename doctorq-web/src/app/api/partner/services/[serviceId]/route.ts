import { NextRequest } from "next/server";
import {
  backendFetch,
  buildErrorResponse,
  jsonResponse,
} from '@/app/api/_lib/backend';

interface RouteParams {
  params: { serviceId: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const payload = await request.json();
  const response = await backendFetch(
    `/partner-leads/services/${params.serviceId}/`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    return buildErrorResponse(response);
  }

  const data = await response.json();
  return jsonResponse(data);
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  const response = await backendFetch(
    `/partner-leads/services/${params.serviceId}/`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok && response.status !== 204) {
    return buildErrorResponse(response);
  }

  return jsonResponse({ success: true }, 200);
}
