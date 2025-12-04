"""
Rotas para Sistema Financeiro e Transações
"""

import uuid
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user
from src.utils.auth_helpers import validate_empresa_access, get_user_empresa_id

logger = get_logger(__name__)

router = APIRouter(prefix="/transacoes", tags=["transacoes"])

# ============================================
# Models
# ============================================

class TransacaoCreateRequest(BaseModel):
    id_empresa: Optional[str] = None
    id_categoria: Optional[str] = None
    id_agendamento: Optional[str] = None
    id_pedido: Optional[str] = None
    ds_tipo: str = Field(..., description="Tipo: entrada, saida, transferencia")
    vl_valor: Decimal = Field(..., gt=0)
    vl_taxa: Decimal = Field(default=Decimal("0.00"), ge=0)
    ds_descricao: str = Field(..., max_length=500)
    ds_observacoes: Optional[str] = None
    ds_forma_pagamento: Optional[str] = Field(None, description="credito, debito, dinheiro, pix, boleto")
    ds_status: str = Field(default="pendente", description="pendente, pago, cancelado, estornado")
    dt_vencimento: Optional[date] = None
    dt_competencia: Optional[date] = None
    nr_parcela: Optional[int] = None
    nr_total_parcelas: Optional[int] = None

class TransacaoResponse(BaseModel):
    id_transacao: str
    id_empresa: Optional[str]
    id_categoria: Optional[str]
    id_agendamento: Optional[str]
    id_pedido: Optional[str]
    ds_tipo: str
    vl_valor: Decimal
    vl_taxa: Decimal
    vl_liquido: Decimal
    ds_descricao: str
    ds_forma_pagamento: Optional[str]
    ds_status: str
    dt_vencimento: Optional[date]
    dt_pagamento: Optional[datetime]
    dt_competencia: Optional[date]
    nr_parcela: Optional[int]
    nr_total_parcelas: Optional[int]
    dt_criacao: datetime

# ============================================
# Transações - CRUD
# ============================================

@router.post("/", response_model=TransacaoResponse)
async def criar_transacao(
    request: TransacaoCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Criar nova transação financeira"""
    try:
        # 🔒 SEGURANÇA: Validar que o usuário só pode criar transações para sua própria empresa
        id_empresa_user = get_user_empresa_id(current_user)

        if request.id_empresa and str(request.id_empresa) != str(id_empresa_user):
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para criar transações para outra empresa"
            )

        # Garantir que id_empresa seja o da empresa do usuário
        request.id_empresa = str(id_empresa_user)

        query = text("""
            INSERT INTO tb_transacoes (
                id_empresa, id_categoria, id_agendamento, id_pedido, ds_tipo,
                vl_valor, vl_taxa, ds_descricao, ds_observacoes, ds_forma_pagamento,
                ds_status, dt_vencimento, dt_competencia, nr_parcela, nr_total_parcelas
            )
            VALUES (
                :id_empresa, :id_categoria, :id_agendamento, :id_pedido, :ds_tipo,
                :vl_valor, :vl_taxa, :ds_descricao, :ds_observacoes, :ds_forma_pagamento,
                :ds_status, :dt_vencimento, :dt_competencia, :nr_parcela, :nr_total_parcelas
            )
            RETURNING id_transacao, vl_liquido, dt_pagamento, dt_criacao
        """)

        result = await db.execute(query, {
            "id_empresa": request.id_empresa,
            "id_categoria": request.id_categoria,
            "id_agendamento": request.id_agendamento,
            "id_pedido": request.id_pedido,
            "ds_tipo": request.ds_tipo,
            "vl_valor": request.vl_valor,
            "vl_taxa": request.vl_taxa,
            "ds_descricao": request.ds_descricao,
            "ds_observacoes": request.ds_observacoes,
            "ds_forma_pagamento": request.ds_forma_pagamento,
            "ds_status": request.ds_status,
            "dt_vencimento": request.dt_vencimento,
            "dt_competencia": request.dt_competencia,
            "nr_parcela": request.nr_parcela,
            "nr_total_parcelas": request.nr_total_parcelas,
        })

        await db.commit()
        row = result.fetchone()

        return {
            "id_transacao": str(row[0]),
            "id_empresa": request.id_empresa,
            "id_categoria": request.id_categoria,
            "id_agendamento": request.id_agendamento,
            "id_pedido": request.id_pedido,
            "ds_tipo": request.ds_tipo,
            "vl_valor": request.vl_valor,
            "vl_taxa": request.vl_taxa,
            "vl_liquido": row[1],
            "ds_descricao": request.ds_descricao,
            "ds_forma_pagamento": request.ds_forma_pagamento,
            "ds_status": request.ds_status,
            "dt_vencimento": request.dt_vencimento,
            "dt_pagamento": row[2],
            "dt_competencia": request.dt_competencia,
            "nr_parcela": request.nr_parcela,
            "nr_total_parcelas": request.nr_total_parcelas,
            "dt_criacao": row[3],
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar transação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar transação: {str(e)}")


@router.get("/", response_model=dict)
async def listar_transacoes(
    ds_tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    ds_status: Optional[str] = Query(None, description="Filtrar por status"),
    dt_inicio: Optional[date] = Query(None, description="Data início"),
    dt_fim: Optional[date] = Query(None, description="Data fim"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar transações com filtros"""
    try:
        conditions = []

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas transações da empresa do usuário logado
        if not current_user.id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada. Entre em contato com o suporte."
            )
        conditions.append(f"id_empresa = '{current_user.id_empresa}'")

        if ds_tipo:
            conditions.append(f"ds_tipo = '{ds_tipo}'")

        if ds_status:
            conditions.append(f"ds_status = '{ds_status}'")

        if dt_inicio:
            conditions.append(f"dt_criacao >= '{dt_inicio}'")

        if dt_fim:
            conditions.append(f"dt_criacao <= '{dt_fim}'")

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        # Count
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_transacoes
            WHERE {where_clause}
        """)

        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        offset = (page - 1) * size

        # List
        query = text(f"""
            SELECT
                id_transacao, ds_tipo, vl_valor, vl_taxa, vl_liquido,
                ds_descricao, ds_forma_pagamento, ds_status, dt_vencimento,
                dt_pagamento, dt_criacao
            FROM tb_transacoes
            WHERE {where_clause}
            ORDER BY dt_criacao DESC
            LIMIT {size} OFFSET {offset}
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        transacoes = []
        for row in rows:
            transacoes.append({
                "id_transacao": str(row[0]),
                "ds_tipo": row[1],
                "vl_valor": float(row[2]),
                "vl_taxa": float(row[3]),
                "vl_liquido": float(row[4]) if row[4] else None,
                "ds_descricao": row[5],
                "ds_forma_pagamento": row[6],
                "ds_status": row[7],
                "dt_vencimento": row[8].isoformat() if row[8] else None,
                "dt_pagamento": row[9].isoformat() if row[9] else None,
                "dt_criacao": row[10].isoformat() if row[10] else None,
            })

        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "items": transacoes,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            }
        }

    except Exception as e:
        logger.error(f"Erro ao listar transações: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar transações: {str(e)}")


@router.get("/stats")
async def estatisticas_financeiras(
    dt_inicio: Optional[date] = Query(None, description="Data início"),
    dt_fim: Optional[date] = Query(None, description="Data fim"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Estatísticas financeiras"""
    try:
        conditions = []

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas transações da empresa do usuário logado
        if not current_user.id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada. Entre em contato com o suporte."
            )
        conditions.append(f"id_empresa = '{current_user.id_empresa}'")

        if dt_inicio:
            conditions.append(f"dt_criacao >= '{dt_inicio}'")

        if dt_fim:
            conditions.append(f"dt_criacao <= '{dt_fim}'")

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        query = text(f"""
            SELECT
                SUM(CASE WHEN ds_tipo = 'entrada' AND ds_status = 'pago' THEN vl_liquido ELSE 0 END) as total_entradas,
                SUM(CASE WHEN ds_tipo = 'saida' AND ds_status = 'pago' THEN vl_liquido ELSE 0 END) as total_saidas,
                SUM(CASE WHEN ds_status = 'pendente' THEN vl_valor ELSE 0 END) as total_pendentes,
                COUNT(CASE WHEN ds_tipo = 'entrada' THEN 1 END) as qtd_entradas,
                COUNT(CASE WHEN ds_tipo = 'saida' THEN 1 END) as qtd_saidas
            FROM tb_transacoes
            WHERE {where_clause}
        """)

        result = await db.execute(query)
        row = result.fetchone()

        total_entradas = float(row[0]) if row[0] else 0
        total_saidas = float(row[1]) if row[1] else 0
        saldo = total_entradas - total_saidas

        return {
            "total_entradas": total_entradas,
            "total_saidas": total_saidas,
            "saldo": saldo,
            "total_pendentes": float(row[2]) if row[2] else 0,
            "qtd_entradas": row[3],
            "qtd_saidas": row[4],
        }

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")


@router.put("/{transacao_id}/status")
async def atualizar_status_transacao(
    transacao_id: str,
    novo_status: str = Query(..., description="Status: pago, cancelado, estornado"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualizar status de uma transação"""
    try:
        # 🔒 SEGURANÇA: Validar que a transação pertence à empresa do usuário
        id_empresa_user = get_user_empresa_id(current_user)

        # Se marcar como pago, definir dt_pagamento
        dt_pagamento_clause = ""
        if novo_status == "pago":
            dt_pagamento_clause = ", dt_pagamento = NOW()"

        query = text(f"""
            UPDATE tb_transacoes
            SET ds_status = :novo_status{dt_pagamento_clause}
            WHERE id_transacao = :id_transacao
              AND id_empresa = :id_empresa
            RETURNING id_transacao
        """)

        result = await db.execute(query, {
            "id_transacao": transacao_id,
            "novo_status": novo_status,
            "id_empresa": str(id_empresa_user)
        })

        await db.commit()

        row = result.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail="Transação não encontrada ou você não tem permissão para atualizá-la"
            )

        return {"message": f"Status atualizado para '{novo_status}'"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao atualizar status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar status: {str(e)}")
