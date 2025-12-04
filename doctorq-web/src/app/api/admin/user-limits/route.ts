import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se usuário tem permissão (admin ou gestor_clinica)
    const userRole = session.user.role?.toString().toLowerCase();
    const isAuthorized = ['administrador', 'gestor_clinica', 'admin'].includes(userRole || '');

    if (!isAuthorized) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const apiKey = process.env.API_DOCTORQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    // Buscar empresa do usuário
    const empresaId = session.user.id_empresa;

    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    // Buscar dados de limite da empresa
    const response = await fetch(`${backendUrl}/clinicas/${empresaId}/limites/`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Erro ao buscar limites: ${response.status}`);
      // Retornar dados temporários em caso de erro
      return NextResponse.json({
        qt_usuarios_atuais: 0,
        qt_limite_usuarios: 10,
        qt_usuarios_disponiveis: 10,
        percentual_uso: 0,
      });
    }

    const data = await response.json();

    // Calcular percentual de uso
    const qt_usuarios_atuais = data.qt_usuarios_atuais || 0;
    const qt_limite_usuarios = data.qt_limite_usuarios || 10;
    const qt_usuarios_disponiveis = Math.max(0, qt_limite_usuarios - qt_usuarios_atuais);
    const percentual_uso = qt_limite_usuarios > 0 ? (qt_usuarios_atuais / qt_limite_usuarios) * 100 : 0;

    return NextResponse.json({
      qt_usuarios_atuais,
      qt_limite_usuarios,
      qt_usuarios_disponiveis,
      percentual_uso: Number(percentual_uso.toFixed(1)),
    });
  } catch (error) {
    console.error("Erro ao buscar limites de usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar limites" },
      { status: 500 }
    );
  }
}
