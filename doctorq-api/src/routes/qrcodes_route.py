"""
Rotas para Geração e Validação de QR Codes de Avaliação
"""

import uuid
import secrets
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/qrcodes", tags=["qrcodes"])

# ============================================
# Models
# ============================================

class QRCodeCreateRequest(BaseModel):
    id_agendamento: str
    id_paciente: str
    id_clinica: Optional[str] = None
    id_profissional: Optional[str] = None
    id_procedimento: Optional[str] = None
    dias_validade: int = Field(default=30, ge=1, le=90, description="Dias de validade do QR Code")

class QRCodeResponse(BaseModel):
    id_qrcode: str
    tk_codigo: str
    ds_qrcode_url: Optional[str]
    dt_expiracao: datetime
    st_utilizado: bool

class QRCodeValidateRequest(BaseModel):
    tk_codigo: str

class QRCodeValidateResponse(BaseModel):
    valido: bool
    motivo: Optional[str] = None
    id_agendamento: Optional[str] = None
    id_paciente: Optional[str] = None
    id_clinica: Optional[str] = None
    id_profissional: Optional[str] = None
    id_procedimento: Optional[str] = None

# ============================================
# QR Code - Geração
# ============================================

@router.post("/gerar", response_model=QRCodeResponse)
async def gerar_qrcode_avaliacao(
    request: QRCodeCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Gera um QR Code único para avaliação pós-procedimento.
    Deve ser chamado após a conclusão de um agendamento.
    """
    try:
        # Verificar se já existe QR Code para este agendamento
        check_query = text("""
            SELECT id_qrcode, tk_codigo, st_utilizado
            FROM tb_qrcodes_avaliacao
            WHERE id_agendamento = :id_agendamento
            ORDER BY dt_geracao DESC
            LIMIT 1
        """)

        result = await db.execute(check_query, {"id_agendamento": request.id_agendamento})
        existing = result.fetchone()

        if existing and not existing[2]:  # Se existe e não foi utilizado
            logger.info(f"QR Code já existe para agendamento {request.id_agendamento}")
            return QRCodeResponse(
                id_qrcode=str(existing[0]),
                tk_codigo=existing[1],
                ds_qrcode_url=None,
                dt_expiracao=datetime.now() + timedelta(days=request.dias_validade),
                st_utilizado=False
            )

        # Gerar token único
        tk_codigo = f"VER-{secrets.token_urlsafe(32)}"

        # Calcular data de expiração
        dt_expiracao = datetime.now() + timedelta(days=request.dias_validade)

        # Inserir novo QR Code
        insert_query = text("""
            INSERT INTO tb_qrcodes_avaliacao (
                id_agendamento,
                id_paciente,
                id_clinica,
                id_profissional,
                id_procedimento,
                tk_codigo,
                dt_expiracao
            ) VALUES (
                :id_agendamento,
                :id_paciente,
                :id_clinica,
                :id_profissional,
                :id_procedimento,
                :tk_codigo,
                :dt_expiracao
            )
            RETURNING id_qrcode, tk_codigo, dt_expiracao, st_utilizado
        """)

        result = await db.execute(insert_query, {
            "id_agendamento": request.id_agendamento,
            "id_paciente": request.id_paciente,
            "id_clinica": request.id_clinica,
            "id_profissional": request.id_profissional,
            "id_procedimento": request.id_procedimento,
            "tk_codigo": tk_codigo,
            "dt_expiracao": dt_expiracao,
        })

        await db.commit()

        row = result.fetchone()

        logger.info(f"QR Code gerado para agendamento {request.id_agendamento}: {tk_codigo}")

        # TODO: Aqui você pode integrar com uma biblioteca de QR Code
        # para gerar a imagem e fazer upload para S3/storage
        # Exemplo: qrcode_url = gerar_imagem_qrcode(tk_codigo)

        return QRCodeResponse(
            id_qrcode=str(row[0]),
            tk_codigo=row[1],
            ds_qrcode_url=None,  # Adicionar URL real da imagem do QR Code
            dt_expiracao=row[2],
            st_utilizado=row[3]
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao gerar QR Code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar QR Code: {str(e)}")


@router.post("/validar", response_model=QRCodeValidateResponse)
async def validar_qrcode(
    request: QRCodeValidateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Valida um token de QR Code.
    Retorna se é válido e as informações associadas.
    """
    try:
        query = text("""
            SELECT
                id_qrcode,
                id_agendamento,
                id_paciente,
                id_clinica,
                id_profissional,
                id_procedimento,
                st_utilizado,
                dt_expiracao,
                nr_tentativas_uso
            FROM tb_qrcodes_avaliacao
            WHERE tk_codigo = :tk_codigo
        """)

        result = await db.execute(query, {"tk_codigo": request.tk_codigo})
        row = result.fetchone()

        if not row:
            return QRCodeValidateResponse(
                valido=False,
                motivo="QR Code inválido ou não encontrado"
            )

        id_qrcode = row[0]
        st_utilizado = row[6]
        dt_expiracao = row[7]
        nr_tentativas = row[8]

        # Incrementar tentativas de uso
        await db.execute(
            text("UPDATE tb_qrcodes_avaliacao SET nr_tentativas_uso = nr_tentativas_uso + 1 WHERE id_qrcode = :id_qrcode"),
            {"id_qrcode": id_qrcode}
        )
        await db.commit()

        # Verificar se já foi utilizado
        if st_utilizado:
            return QRCodeValidateResponse(
                valido=False,
                motivo="QR Code já foi utilizado"
            )

        # Verificar se expirou
        if datetime.now() > dt_expiracao:
            return QRCodeValidateResponse(
                valido=False,
                motivo=f"QR Code expirado em {dt_expiracao.strftime('%d/%m/%Y')}"
            )

        # QR Code válido
        return QRCodeValidateResponse(
            valido=True,
            id_agendamento=str(row[1]),
            id_paciente=str(row[2]),
            id_clinica=str(row[3]) if row[3] else None,
            id_profissional=str(row[4]) if row[4] else None,
            id_procedimento=str(row[5]) if row[5] else None,
        )

    except Exception as e:
        logger.error(f"Erro ao validar QR Code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao validar QR Code: {str(e)}")


@router.get("/{id_agendamento}", response_model=QRCodeResponse)
async def obter_qrcode_por_agendamento(
    id_agendamento: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Busca o QR Code gerado para um agendamento específico.
    """
    try:
        # ⚠️ FILTRO OBRIGATÓRIO: Apenas QR Codes da empresa do usuário logado
        query = text("""
            SELECT
                q.id_qrcode,
                q.tk_codigo,
                q.ds_qrcode_url,
                q.dt_expiracao,
                q.st_utilizado
            FROM tb_qrcodes_avaliacao q
            INNER JOIN tb_clinicas c ON q.id_clinica = c.id_clinica
            WHERE q.id_agendamento = :id_agendamento
              AND c.id_empresa = :id_empresa
            ORDER BY q.dt_geracao DESC
            LIMIT 1
        """)

        result = await db.execute(query, {
            "id_agendamento": id_agendamento,
            "id_empresa": str(current_user.id_empresa)
        })
        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="QR Code não encontrado para este agendamento"
            )

        return QRCodeResponse(
            id_qrcode=str(row[0]),
            tk_codigo=row[1],
            ds_qrcode_url=row[2],
            dt_expiracao=row[3],
            st_utilizado=row[4]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar QR Code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar QR Code: {str(e)}")


@router.delete("/{id_qrcode}")
async def invalidar_qrcode(
    id_qrcode: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Invalida (marca como utilizado) um QR Code.
    Útil para cancelamento manual.
    """
    try:
        query = text("""
            UPDATE tb_qrcodes_avaliacao
            SET st_utilizado = TRUE, dt_utilizacao = NOW()
            WHERE id_qrcode = :id_qrcode
            RETURNING id_qrcode
        """)

        result = await db.execute(query, {"id_qrcode": id_qrcode})
        await db.commit()

        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="QR Code não encontrado")

        logger.info(f"QR Code {id_qrcode} invalidado")

        return {"message": "QR Code invalidado com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao invalidar QR Code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao invalidar QR Code: {str(e)}")
