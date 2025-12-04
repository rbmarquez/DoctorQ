import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.API_DOCTORQ_API_KEY || "";

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
    const configData = await request.json();

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
      nm_profissional: configData.nm_profissional,
      ds_email: configData.ds_email,
      nr_telefone: configData.nr_telefone,
      nr_whatsapp: configData.nr_whatsapp,
      ds_especialidades: configData.ds_especialidades,
      nr_registro_profissional: configData.nr_registro_profissional,
      ds_bio: configData.ds_bio,
      ds_formacao: configData.ds_formacao,
      nr_anos_experiencia: configData.nr_anos_experiencia,
      ds_foto_perfil: configData.ds_foto_perfil,

      // Horários de atendimento
      ds_horarios_atendimento: configData.ds_horarios_atendimento,
      nr_tempo_consulta: configData.nr_tempo_consulta,

      // Serviços (converter para JSON string se necessário)
      ds_procedimentos_realizados: Array.isArray(configData.ds_procedimentos_realizados)
        ? JSON.stringify(configData.ds_procedimentos_realizados)
        : configData.ds_procedimentos_realizados,

      // Configurações de atendimento
      st_aceita_online: configData.st_aceita_online,
      st_primeira_consulta: configData.st_primeira_consulta,
      st_aceita_convenio: configData.st_aceita_convenio,
      nr_antecedencia_cancelamento: configData.nr_antecedencia_cancelamento,
      nr_tolerancia_atraso: configData.nr_tolerancia_atraso,
      st_lembrete_agendamento: configData.st_lembrete_agendamento,
      nr_horas_lembrete: configData.nr_horas_lembrete,

      // Privacidade
      st_mostrar_precos: configData.st_mostrar_precos,
      st_aceitar_avaliacao: configData.st_aceitar_avaliacao,
      st_compartilhar_fotos: configData.st_compartilhar_fotos,

      // Pagamento
      st_aceita_dinheiro: configData.st_aceita_dinheiro,
      st_aceita_pix: configData.st_aceita_pix,
      st_aceita_credito: configData.st_aceita_credito,
      st_aceita_debito: configData.st_aceita_debito,
      pc_desconto_pix: configData.pc_desconto_pix,
      nr_parcelas_maximo: configData.nr_parcelas_maximo,
    };

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
      return NextResponse.json(
        { error: errorData.detail || "Erro ao salvar configurações" },
        { status: updateResponse.status }
      );
    }

    const updatedProfessional = await updateResponse.json();

    // Também atualizar preferências do usuário (tema, notificações)
    const userPrefsPayload = {
      ds_preferencias: {
        tema: configData.ds_tema,
        notificacoes_email: configData.st_notificacao_email,
        notificacoes_whatsapp: configData.st_notificacao_whatsapp,
        perfil_publico: configData.st_perfil_publico,
      },
    };

    // Atualizar usuário (ignora erros nessa parte)
    try {
      await fetch(`${API_URL}/users/${session.user.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(userPrefsPayload),
      });
    } catch (userError) {
      console.warn("Erro ao atualizar preferências do usuário:", userError);
    }

    return NextResponse.json({
      message: "Configurações salvas com sucesso",
      data: updatedProfessional,
    });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar configurações" },
      { status: 500 }
    );
  }
}
