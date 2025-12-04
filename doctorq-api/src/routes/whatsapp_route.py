"""
Rotas para Integração WhatsApp Business API - Lembretes e Confirmações
"""

import os
from typing import Optional
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

# ============================================
# Models
# ============================================

class WhatsAppMessageRequest(BaseModel):
    telefone: str = Field(description="Número de telefone com DDD (ex: 5511999999999)")
    mensagem: str
    tipo: str = Field(default="texto", description="texto, imagem, documento")
    midia_url: Optional[str] = None

class LembreteAgendamentoRequest(BaseModel):
    id_agendamento: str
    antecedencia_horas: int = Field(default=24, ge=1, le=168, description="Antecedência em horas (1-168)")

# ============================================
# WhatsApp Business API Integration
# ============================================

async def get_whatsapp_config(db: AsyncSession) -> dict:
    """
    Busca configurações do WhatsApp do banco de dados.
    Fallback para variáveis de ambiente se não encontrar no banco.
    """
    from src.routes.configuracoes_route import get_config_value

    try:
        api_url = await get_config_value("whatsapp_api_url", db) or os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v18.0")
        access_token = await get_config_value("whatsapp_access_token", db) or os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        phone_id = await get_config_value("whatsapp_phone_id", db) or os.getenv("WHATSAPP_PHONE_ID", "")
        habilitado = await get_config_value("whatsapp_habilitado", db) or "false"

        return {
            "api_url": api_url,
            "access_token": access_token,
            "phone_id": phone_id,
            "habilitado": habilitado.lower() == "true"
        }
    except Exception as e:
        logger.error(f"Erro ao buscar configurações do WhatsApp: {str(e)}")
        # Fallback para variáveis de ambiente
        return {
            "api_url": os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v18.0"),
            "access_token": os.getenv("WHATSAPP_ACCESS_TOKEN", ""),
            "phone_id": os.getenv("WHATSAPP_PHONE_ID", ""),
            "habilitado": False
        }


async def enviar_mensagem_whatsapp(telefone: str, mensagem: str, db: AsyncSession, tipo: str = "texto", midia_url: Optional[str] = None):
    """
    Envia mensagem via WhatsApp Business API.

    Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
    """

    # Buscar configurações do banco
    config = await get_whatsapp_config(db)

    # Validar configuração
    if not config["habilitado"] or not config["access_token"] or not config["phone_id"]:
        logger.warning("WhatsApp API não configurada ou desabilitada. Mensagem não enviada (modo simulação)")
        return {
            "success": False,
            "message": "WhatsApp API não configurada ou desabilitada",
            "simulated": True
        }

    # Formatar telefone (remover caracteres especiais)
    telefone_formatado = ''.join(filter(str.isdigit, telefone))

    if not telefone_formatado.startswith('55'):
        telefone_formatado = f'55{telefone_formatado}'

    try:
        # TODO: Implementar chamada real à API do WhatsApp Business
        # import httpx
        #
        # async with httpx.AsyncClient() as client:
        #     payload = {
        #         "messaging_product": "whatsapp",
        #         "to": telefone_formatado,
        #         "type": "text",
        #         "text": {"body": mensagem}
        #     }
        #
        #     headers = {
        #         "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        #         "Content-Type": "application/json"
        #     }
        #
        #     response = await client.post(
        #         f"{WHATSAPP_API_URL}/{WHATSAPP_PHONE_ID}/messages",
        #         json=payload,
        #         headers=headers
        #     )
        #
        #     response.raise_for_status()
        #     return response.json()

        # Simulação (quando API não configurada)
        logger.info(f"[SIMULAÇÃO] Enviando WhatsApp para {telefone_formatado}: {mensagem[:50]}...")

        return {
            "success": True,
            "message_id": f"wamid.simulated_{datetime.now().timestamp()}",
            "simulated": True,
            "to": telefone_formatado
        }

    except Exception as e:
        logger.error(f"Erro ao enviar WhatsApp: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao enviar mensagem: {str(e)}")


# ============================================
# Endpoints
# ============================================

@router.post("/enviar")
async def enviar_mensagem(
    request: WhatsAppMessageRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Envia uma mensagem WhatsApp manualmente.
    """
    try:
        result = await enviar_mensagem_whatsapp(
            telefone=request.telefone,
            mensagem=request.mensagem,
            db=db,
            tipo=request.tipo,
            midia_url=request.midia_url
        )

        logger.info(f"Mensagem WhatsApp enviada para {request.telefone}")

        return {
            "success": True,
            "result": result
        }

    except Exception as e:
        logger.error(f"Erro ao enviar mensagem: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lembrete-agendamento")
async def enviar_lembrete_agendamento(
    request: LembreteAgendamentoRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Envia lembrete de agendamento via WhatsApp.
    Calcula o momento ideal baseado na antecedência configurada.
    """
    try:
        # Buscar agendamento
        query = text("""
            SELECT
                a.id_agendamento,
                a.dt_agendamento,
                a.nr_duracao_minutos,
                a.ds_motivo,
                pac.nm_paciente,
                pac.nr_telefone,
                prof.nm_profissional,
                c.nm_clinica,
                c.ds_endereco,
                proc.nm_procedimento
            FROM tb_agendamentos a
            LEFT JOIN tb_pacientes pac ON a.id_paciente = pac.id_paciente
            LEFT JOIN tb_profissionais prof ON a.id_profissional = prof.id_profissional
            LEFT JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            LEFT JOIN tb_procedimentos proc ON a.id_procedimento = proc.id_procedimento
            WHERE a.id_agendamento = :id_agendamento
              AND a.ds_status = 'agendado'
        """)

        result = await db.execute(query, {"id_agendamento": request.id_agendamento})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado ou não está ativo")

        # Extrair dados
        dt_agendamento = row[1]
        nm_paciente = row[4]
        nr_telefone = row[5]
        nm_profissional = row[6]
        nm_clinica = row[7]
        ds_endereco = row[8]
        nm_procedimento = row[9]

        if not nr_telefone:
            raise HTTPException(status_code=400, detail="Paciente não possui telefone cadastrado")

        # Formatar data/hora
        from dateutil import tz
        timezone_br = tz.gettz('America/Sao_Paulo')
        dt_agendamento_br = dt_agendamento.replace(tzinfo=tz.UTC).astimezone(timezone_br)

        data_formatada = dt_agendamento_br.strftime("%d/%m/%Y")
        hora_formatada = dt_agendamento_br.strftime("%H:%M")
        dia_semana = dt_agendamento_br.strftime("%A")

        # Traduzir dia da semana
        dias_semana_pt = {
            "Monday": "Segunda-feira",
            "Tuesday": "Terça-feira",
            "Wednesday": "Quarta-feira",
            "Thursday": "Quinta-feira",
            "Friday": "Sexta-feira",
            "Saturday": "Sábado",
            "Sunday": "Domingo"
        }
        dia_semana_pt = dias_semana_pt.get(dia_semana, dia_semana)

        # Montar mensagem
        mensagem = f"""🔔 *Lembrete de Agendamento*

Olá, {nm_paciente}!

Você tem um agendamento marcado:

📅 *Data:* {dia_semana_pt}, {data_formatada}
🕐 *Horário:* {hora_formatada}
👨‍⚕️ *Profissional:* {nm_profissional}
💆 *Procedimento:* {nm_procedimento or 'Consulta'}
📍 *Local:* {nm_clinica}
{f'🗺️ *Endereço:* {ds_endereco}' if ds_endereco else ''}

⏰ *Lembre-se de chegar com 10 minutos de antecedência.*

Em caso de imprevistos, entre em contato para remarcar.

Até breve! 💜
"""

        # Enviar mensagem
        result = await enviar_mensagem_whatsapp(
            telefone=nr_telefone,
            mensagem=mensagem,
            db=db
        )

        # Marcar como enviado no banco
        update_query = text("""
            UPDATE tb_agendamentos
            SET st_lembrete_enviado = TRUE,
                dt_lembrete_enviado = NOW()
            WHERE id_agendamento = :id_agendamento
        """)

        await db.execute(update_query, {"id_agendamento": request.id_agendamento})
        await db.commit()

        logger.info(f"Lembrete WhatsApp enviado para agendamento {request.id_agendamento}")

        return {
            "success": True,
            "message": "Lembrete enviado com sucesso",
            "telefone": nr_telefone,
            "agendamento_data": data_formatada,
            "agendamento_hora": hora_formatada,
            "result": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao enviar lembrete: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao enviar lembrete: {str(e)}")


@router.post("/confirmar-agendamento/{id_agendamento}")
async def enviar_confirmacao_agendamento(
    id_agendamento: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Envia mensagem solicitando confirmação de agendamento.
    """
    try:
        # Buscar agendamento
        query = text("""
            SELECT
                a.id_agendamento,
                a.dt_agendamento,
                pac.nm_paciente,
                pac.nr_telefone,
                prof.nm_profissional,
                c.nm_clinica
            FROM tb_agendamentos a
            LEFT JOIN tb_pacientes pac ON a.id_paciente = pac.id_paciente
            LEFT JOIN tb_profissionais prof ON a.id_profissional = prof.id_profissional
            LEFT JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE a.id_agendamento = :id_agendamento
              AND a.ds_status = 'agendado'
              AND a.st_confirmado = FALSE
        """)

        result = await db.execute(query, {"id_agendamento": id_agendamento})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado ou já confirmado")

        nm_paciente = row[2]
        nr_telefone = row[3]
        nm_profissional = row[4]
        nm_clinica = row[5]

        if not nr_telefone:
            raise HTTPException(status_code=400, detail="Paciente não possui telefone cadastrado")

        # Mensagem de confirmação
        mensagem = f"""✅ *Confirmação de Agendamento*

Olá, {nm_paciente}!

Por favor, confirme seu agendamento:

👨‍⚕️ *Profissional:* {nm_profissional}
📍 *Local:* {nm_clinica}

Responda:
✅ SIM - para confirmar
❌ NÃO - para cancelar

Aguardamos seu retorno!
"""

        result = await enviar_mensagem_whatsapp(
            telefone=nr_telefone,
            mensagem=mensagem,
            db=db
        )

        logger.info(f"Confirmação WhatsApp enviada para agendamento {id_agendamento}")

        return {
            "success": True,
            "message": "Solicitação de confirmação enviada",
            "telefone": nr_telefone,
            "result": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao enviar confirmação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao enviar confirmação: {str(e)}")


@router.get("/enviar-lembretes-automaticos")
async def enviar_lembretes_automaticos(
    horas_antecedencia: int = Query(24, ge=1, le=168),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Job para enviar lembretes automáticos.
    Deve ser chamado por um cron job ou scheduler.
    """
    try:
        # ⚠️ FILTRO OBRIGATÓRIO: Apenas agendamentos da empresa do usuário logado
        query = text("""
            SELECT a.id_agendamento
            FROM tb_agendamentos a
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE a.ds_status = 'agendado'
              AND a.st_lembrete_enviado = FALSE
              AND a.dt_agendamento BETWEEN NOW() + INTERVAL ':min_hours hours' AND NOW() + INTERVAL ':max_hours hours'
              AND c.id_empresa = :id_empresa
        """)

        result = await db.execute(query, {
            "min_hours": horas_antecedencia - 1,
            "max_hours": horas_antecedencia + 1,
            "id_empresa": str(current_user.id_empresa)
        })

        rows = result.fetchall()
        enviados = 0
        erros = 0

        for row in rows:
            try:
                id_agendamento = str(row[0])

                # Enviar lembrete (reutilizar endpoint)
                await enviar_lembrete_agendamento(
                    LembreteAgendamentoRequest(
                        id_agendamento=id_agendamento,
                        antecedencia_horas=horas_antecedencia
                    ),
                    BackgroundTasks(),
                    db,
                    _
                )

                enviados += 1

            except Exception as e:
                logger.error(f"Erro ao enviar lembrete para {id_agendamento}: {str(e)}")
                erros += 1

        logger.info(f"Lembretes automáticos: {enviados} enviados, {erros} erros")

        return {
            "success": True,
            "enviados": enviados,
            "erros": erros,
            "total_processados": enviados + erros
        }

    except Exception as e:
        logger.error(f"Erro no job de lembretes automáticos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
