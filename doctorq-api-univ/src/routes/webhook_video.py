"""
Webhook routes para notificações do Video Service
"""
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

from src.config import get_db
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.curso import Aula
from src.config import logger


router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


class VideoWebhookPayload(BaseModel):
    """Payload do webhook de vídeo"""
    event: str
    video_id: str
    timestamp: str
    data: Dict


async def process_video_completed(video_id: str, data: Dict, db: AsyncSession):
    """
    Processa webhook de vídeo completo
    Atualiza a aula no banco de dados
    """
    try:
        logger.info(f"📢 Processing video.completed webhook: video_id={video_id}")

        # Extrair metadata
        metadata = data.get("metadata", {})
        id_aula = metadata.get("id_aula")

        if not id_aula:
            logger.warning(f"⚠️ Webhook sem id_aula: video_id={video_id}")
            return

        # Atualizar aula no banco
        stmt = (
            update(Aula)
            .where(Aula.id_aula == id_aula)
            .values(
                video_status="completed",
                video_processing_progress=100,
                video_metadata={
                    "hls_master_playlist": metadata.get("hls_master_playlist"),
                    "qualities": metadata.get("qualities", []),
                    "duration_seconds": metadata.get("duration_seconds", 0),
                    "width": metadata.get("width", 0),
                    "height": metadata.get("height", 0),
                    "thumbnail_object": metadata.get("thumbnail_object"),
                    "completed_at": datetime.utcnow().isoformat()
                }
            )
        )

        result = await db.execute(stmt)
        await db.commit()

        if result.rowcount > 0:
            logger.info(f"✅ Aula atualizada com sucesso: id_aula={id_aula}, video_id={video_id}")
        else:
            logger.warning(f"⚠️ Aula não encontrada: id_aula={id_aula}")

        # Aqui você pode adicionar lógica adicional:
        # - Enviar notificação para o usuário
        # - Criar evento no sistema de analytics
        # - Atualizar cache
        # etc.

    except Exception as e:
        logger.error(f"❌ Erro ao processar webhook video.completed: {e}")
        raise


async def process_video_failed(video_id: str, data: Dict, db: AsyncSession):
    """
    Processa webhook de vídeo falhado
    Atualiza status de falha na aula
    """
    try:
        logger.info(f"📢 Processing video.failed webhook: video_id={video_id}")

        error_message = data.get("message", "Unknown error")

        # Buscar aula pelo video_id
        stmt = select(Aula).where(Aula.video_id == video_id)
        result = await db.execute(stmt)
        aula = result.scalar_one_or_none()

        if not aula:
            logger.warning(f"⚠️ Aula não encontrada para video_id: {video_id}")
            return

        # Atualizar com status de falha
        aula.video_status = "failed"
        aula.video_processing_progress = 0
        aula.video_metadata = {
            "error": error_message,
            "failed_at": datetime.utcnow().isoformat()
        }

        await db.commit()

        logger.info(f"✅ Aula marcada como failed: id_aula={aula.id_aula}, video_id={video_id}")

        # Aqui você pode adicionar lógica adicional:
        # - Enviar notificação de erro para admin
        # - Criar log de erro no sistema
        # etc.

    except Exception as e:
        logger.error(f"❌ Erro ao processar webhook video.failed: {e}")
        raise


async def process_video_progress(video_id: str, data: Dict, db: AsyncSession):
    """
    Processa webhook de progresso do vídeo
    Atualiza progresso na aula
    """
    try:
        progress_percent = data.get("progress_percent", 0)
        current_step = data.get("current_step", "Processing")

        logger.debug(f"📊 Video progress: video_id={video_id}, progress={progress_percent}%")

        # Buscar aula pelo video_id
        stmt = select(Aula).where(Aula.video_id == video_id)
        result = await db.execute(stmt)
        aula = result.scalar_one_or_none()

        if not aula:
            return

        # Atualizar progresso
        aula.video_processing_progress = progress_percent

        await db.commit()

    except Exception as e:
        logger.error(f"❌ Erro ao processar webhook video.progress: {e}")
        # Não fazer raise aqui para não bloquear o processamento


@router.post("/video")
async def receive_video_webhook(
    payload: VideoWebhookPayload,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Recebe notificações webhook do Video Service

    **Eventos suportados:**
    - video.completed - Processamento completo
    - video.failed - Processamento falhou
    - video.progress - Progresso do processamento

    **Headers esperados:**
    - X-Video-Service-Event: Tipo do evento
    - X-Video-ID: UUID do vídeo
    """
    try:
        logger.info(
            f"📬 Webhook received: event={payload.event}, "
            f"video_id={payload.video_id}, "
            f"timestamp={payload.timestamp}"
        )

        # Verificar headers
        event_header = request.headers.get("X-Video-Service-Event")
        video_id_header = request.headers.get("X-Video-ID")

        if event_header != payload.event or video_id_header != payload.video_id:
            logger.warning("⚠️ Webhook headers mismatch")

        # Processar webhook baseado no evento
        if payload.event == "video.completed":
            await process_video_completed(payload.video_id, payload.data, db)

        elif payload.event == "video.failed":
            await process_video_failed(payload.video_id, payload.data, db)

        elif payload.event == "video.progress":
            # Processar em background para não bloquear
            background_tasks.add_task(
                process_video_progress,
                payload.video_id,
                payload.data,
                db
            )

        else:
            logger.warning(f"⚠️ Unknown webhook event: {payload.event}")

        return {
            "success": True,
            "message": "Webhook processed successfully",
            "event": payload.event,
            "video_id": payload.video_id
        }

    except Exception as e:
        logger.error(f"❌ Erro ao processar webhook: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing webhook: {str(e)}"
        )


@router.get("/video/test")
async def test_webhook_endpoint():
    """
    Endpoint de teste para verificar se o webhook está ativo
    """
    return {
        "status": "active",
        "service": "doctorq-api-univ",
        "webhook_endpoint": "/api/webhooks/video",
        "supported_events": [
            "video.completed",
            "video.failed",
            "video.progress"
        ]
    }
