import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const id = `mock-agendamento-${Date.now()}`;

    return NextResponse.json({
      success: true,
      id,
      receivedAt: new Date().toISOString(),
      payload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Não foi possível registrar o agendamento (mock).",
      },
      { status: 400 }
    );
  }
}
