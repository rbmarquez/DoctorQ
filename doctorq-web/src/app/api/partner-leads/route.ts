import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    // Extrair query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const page = searchParams.get("page") || "1";
    const size = searchParams.get("size") || "10";

    // Construir URL com parâmetros
    const queryParams = new URLSearchParams({
      page,
      size,
    });

    if (search) {
      queryParams.append("search", search);
    }

    const response = await fetch(
      `${API_URL}/partner-leads/?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Erro ao buscar leads de parceiros" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar leads de parceiros:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar leads de parceiros" },
      { status: 500 }
    );
  }
}
