import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    // Obter sessão do usuário
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar profissional pelo id_user
    const response = await fetch(
      `${API_URL}/profissionais/?id_user=${session.user.id}`,
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
        { error: errorData.detail || "Erro ao buscar profissional" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extrair do formato paginado {items: [...], meta: {...}} ou array direto
    let professional = null;

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      // Formato paginado do backend
      professional = data.items[0];
    } else if (Array.isArray(data) && data.length > 0) {
      // Array direto
      professional = data[0];
    } else if (data && !Array.isArray(data) && !data.items) {
      // Objeto direto
      professional = data;
    }

    if (professional) {
      return NextResponse.json(professional);
    } else {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Erro ao buscar profissional:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar profissional" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Obter sessão do usuário
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    const profileData = await request.json();

    // Primeiro, buscar o profissional pelo id_user
    const profissionalResponse = await fetch(
      `${API_URL}/profissionais/?id_user=${session.user.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    if (!profissionalResponse.ok) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    const profData = await profissionalResponse.json();

    // Extrair o profissional
    let profissional = null;
    if (profData.items && Array.isArray(profData.items) && profData.items.length > 0) {
      profissional = profData.items[0];
    } else if (Array.isArray(profData) && profData.length > 0) {
      profissional = profData[0];
    }

    if (!profissional || !profissional.id_profissional) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    const id_profissional = profissional.id_profissional;

    // Preparar dados para atualização no backend
    const updatePayload = {
      // Informações profissionais
      nm_profissional: profileData.nm_profissional,
      ds_email: profileData.ds_email,
      nr_telefone: profileData.nr_telefone,
      nr_whatsapp: profileData.nr_whatsapp,
      ds_especialidades: profileData.ds_especialidades,
      nr_registro_profissional: profileData.nr_registro_profissional,
      ds_biografia: profileData.ds_bio, // Campo correto no banco é ds_biografia
      ds_formacao: profileData.ds_formacao,
      nr_anos_experiencia: profileData.nr_anos_experiencia,
      ds_foto: profileData.ds_foto_perfil, // Campo correto no banco é ds_foto

      // Horários de atendimento
      ds_horarios_atendimento: profileData.ds_horarios_atendimento,
      nr_tempo_consulta: profileData.nr_tempo_consulta,

      // Serviços (converter para JSON string se necessário)
      ds_procedimentos_realizados: Array.isArray(profileData.ds_procedimentos_realizados)
        ? JSON.stringify(profileData.ds_procedimentos_realizados)
        : profileData.ds_procedimentos_realizados,

      // Configurações
      st_ativo: profileData.st_ativo,
      st_aceita_online: profileData.st_aceita_online,
      st_primeira_consulta: profileData.st_primeira_consulta,
      st_aceita_convenio: profileData.st_aceita_convenio,

      // Nota: ds_idiomas e ds_redes_sociais não existem na tabela tb_profissionais
      // Esses campos foram removidos do payload para evitar erros de SQL
    };

    // Log payload for debugging
    console.log("Updating professional:", id_profissional);
    console.log("Payload keys:", Object.keys(updatePayload));

    // Atualizar profissional no backend
    const updateResponse = await fetch(
      `${API_URL}/profissionais/${id_profissional}/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.error("Backend error:", {
        status: updateResponse.status,
        error: errorData,
      });
      return NextResponse.json(
        { error: errorData.detail || "Erro ao atualizar perfil" },
        { status: updateResponse.status }
      );
    }

    const updatedProfessional = await updateResponse.json();

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      data: updatedProfessional,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar perfil" },
      { status: 500 }
    );
  }
}
