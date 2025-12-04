"""
Rotas de Notificações (Email)
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional
from datetime import datetime

from src.services.email_service import email_service
from src.middleware.auth_middleware import get_current_user_id
from src.config import logger

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])


class EmailCursoConcluido(BaseModel):
    """Request para notificar conclusão de curso"""
    to_email: EmailStr
    nome_aluno: str
    curso_titulo: str
    certificado_url: str
    nota_final: float


class EmailNovoEvento(BaseModel):
    """Request para notificar novo evento"""
    to_email: EmailStr
    nome_aluno: str
    evento_titulo: str
    evento_data: datetime
    evento_url: str


class EmailLembreteAula(BaseModel):
    """Request para lembrete de aula"""
    to_email: EmailStr
    nome_aluno: str
    curso_titulo: str
    aula_titulo: str
    aula_url: str
    progresso_percentual: int


class EmailMissaoDiaria(BaseModel):
    """Request para missões diárias"""
    to_email: EmailStr
    nome_aluno: str
    missoes: List[Dict]  # [{"titulo": "...", "xp_recompensa": 100}]
    xp_disponivel: int


@router.post("/curso-concluido/")
async def notificar_curso_concluido(
    request: EmailCursoConcluido,
    background_tasks: BackgroundTasks,
    id_usuario: str = Depends(get_current_user_id)
):
    """
    Envia email de conclusão de curso com certificado

    **Uso:** Chamado automaticamente quando aluno conclui curso

    **Exemplo:**
    ```json
    {
      "to_email": "aluno@example.com",
      "nome_aluno": "Dr. João Silva",
      "curso_titulo": "Toxina Botulínica Avançada",
      "certificado_url": "https://api.doctorq.app/certificados/abc123/download",
      "nota_final": 9.5
    }
    ```
    """
    try:
        # Envia email em background task (não bloqueia resposta)
        background_tasks.add_task(
            email_service.send_curso_concluido,
            request.to_email,
            request.nome_aluno,
            request.curso_titulo,
            request.certificado_url,
            request.nota_final
        )

        logger.info(f"📧 Email de conclusão agendado para {request.to_email}")

        return {
            "success": True,
            "message": f"Email de conclusão agendado para {request.to_email}",
            "tipo": "curso_concluido"
        }

    except Exception as e:
        logger.error(f"❌ Erro ao agendar email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/novo-evento/")
async def notificar_novo_evento(
    request: EmailNovoEvento,
    background_tasks: BackgroundTasks,
    id_usuario: str = Depends(get_current_user_id)
):
    """
    Envia email de novo evento/webinar

    **Uso:** Chamado quando novo evento é criado

    **Exemplo:**
    ```json
    {
      "to_email": "aluno@example.com",
      "nome_aluno": "Dr. João Silva",
      "evento_titulo": "Live: Preenchimento Labial",
      "evento_data": "2026-02-01T19:00:00",
      "evento_url": "https://doctorq.app/eventos/abc123"
    }
    ```
    """
    try:
        background_tasks.add_task(
            email_service.send_novo_evento,
            request.to_email,
            request.nome_aluno,
            request.evento_titulo,
            request.evento_data,
            request.evento_url
        )

        logger.info(f"📧 Email de evento agendado para {request.to_email}")

        return {
            "success": True,
            "message": f"Email de evento agendado para {request.to_email}",
            "tipo": "novo_evento"
        }

    except Exception as e:
        logger.error(f"❌ Erro ao agendar email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lembrete-aula/")
async def enviar_lembrete_aula(
    request: EmailLembreteAula,
    background_tasks: BackgroundTasks,
    id_usuario: str = Depends(get_current_user_id)
):
    """
    Envia lembrete de aula não assistida

    **Uso:** Chamado por cron job ou manualmente

    **Exemplo:**
    ```json
    {
      "to_email": "aluno@example.com",
      "nome_aluno": "Dr. João Silva",
      "curso_titulo": "Toxina Botulínica Avançada",
      "aula_titulo": "Anatomia Facial",
      "aula_url": "https://doctorq.app/aula/abc123",
      "progresso_percentual": 35
    }
    ```
    """
    try:
        background_tasks.add_task(
            email_service.send_lembrete_aula,
            request.to_email,
            request.nome_aluno,
            request.curso_titulo,
            request.aula_titulo,
            request.aula_url,
            request.progresso_percentual
        )

        logger.info(f"📧 Lembrete de aula agendado para {request.to_email}")

        return {
            "success": True,
            "message": f"Lembrete agendado para {request.to_email}",
            "tipo": "lembrete_aula"
        }

    except Exception as e:
        logger.error(f"❌ Erro ao agendar email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/missao-diaria/")
async def enviar_missao_diaria(
    request: EmailMissaoDiaria,
    background_tasks: BackgroundTasks,
    id_usuario: str = Depends(get_current_user_id)
):
    """
    Envia notificação de missões diárias

    **Uso:** Chamado por cron job diário (ex: 8h da manhã)

    **Exemplo:**
    ```json
    {
      "to_email": "aluno@example.com",
      "nome_aluno": "Dr. João Silva",
      "missoes": [
        {"titulo": "Assistir 1 aula", "xp_recompensa": 100},
        {"titulo": "Fazer 1 quiz", "xp_recompensa": 50}
      ],
      "xp_disponivel": 150
    }
    ```
    """
    try:
        background_tasks.add_task(
            email_service.send_missao_diaria,
            request.to_email,
            request.nome_aluno,
            request.missoes,
            request.xp_disponivel
        )

        logger.info(f"📧 Email de missões agendado para {request.to_email}")

        return {
            "success": True,
            "message": f"Email de missões agendado para {request.to_email}",
            "tipo": "missao_diaria"
        }

    except Exception as e:
        logger.error(f"❌ Erro ao agendar email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/teste/")
async def enviar_email_teste(
    to_email: EmailStr,
    tipo: str = "curso_concluido",
    id_usuario: str = Depends(get_current_user_id)
):
    """
    Envia email de teste para validar configuração SMTP

    **Tipos disponíveis:**
    - curso_concluido
    - novo_evento
    - lembrete_aula
    - missao_diaria

    **Exemplo:** `/notificacoes/teste/?to_email=test@example.com&tipo=curso_concluido`
    """
    try:
        if tipo == "curso_concluido":
            success = email_service.send_curso_concluido(
                to_email=to_email,
                nome_aluno="Teste Usuário",
                curso_titulo="Toxina Botulínica Avançada (Teste)",
                certificado_url="https://doctorq.app/certificados/teste",
                nota_final=9.5
            )
        elif tipo == "novo_evento":
            success = email_service.send_novo_evento(
                to_email=to_email,
                nome_aluno="Teste Usuário",
                evento_titulo="Live: Preenchimento Labial (Teste)",
                evento_data=datetime.now(),
                evento_url="https://doctorq.app/eventos/teste"
            )
        elif tipo == "lembrete_aula":
            success = email_service.send_lembrete_aula(
                to_email=to_email,
                nome_aluno="Teste Usuário",
                curso_titulo="Toxina Botulínica Avançada (Teste)",
                aula_titulo="Anatomia Facial (Teste)",
                aula_url="https://doctorq.app/aulas/teste",
                progresso_percentual=35
            )
        elif tipo == "missao_diaria":
            success = email_service.send_missao_diaria(
                to_email=to_email,
                nome_aluno="Teste Usuário",
                missoes=[
                    {"titulo": "Assistir 1 aula", "xp_recompensa": 100},
                    {"titulo": "Fazer 1 quiz", "xp_recompensa": 50}
                ],
                xp_disponivel=150
            )
        else:
            raise HTTPException(status_code=400, detail=f"Tipo inválido: {tipo}")

        if success:
            return {
                "success": True,
                "message": f"Email de teste enviado para {to_email}",
                "tipo": tipo
            }
        else:
            raise HTTPException(status_code=500, detail="Falha ao enviar email")

    except Exception as e:
        logger.error(f"❌ Erro ao enviar email de teste: {e}")
        raise HTTPException(status_code=500, detail=str(e))
