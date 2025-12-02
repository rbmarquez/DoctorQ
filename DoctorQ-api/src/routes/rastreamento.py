"""
Rotas de Rastreamento de Pedidos - UC054
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import get_db
from src.middleware.auth_middleware import get_current_user, require_role
from src.models.rastreamento import (
    RastreamentoTimelineResponse,
    RastreamentoEventoResponse,
    RastreamentoConsulta,
    RastreamentoAtualizacaoManual,
    WebhookRastreamento,
    RastreamentoResumo,
    RastreamentoEstatisticas
)
from src.models.user import User
from src.services.rastreamento_service import RastreamentoService
from src.config.logger_config import get_logger

router = APIRouter(prefix="/rastreamento", tags=["Rastreamento"])
logger = get_logger("rastreamento_routes")


@router.get("/{id_pedido}/", response_model=RastreamentoTimelineResponse)
async def obter_timeline_rastreamento(
    id_pedido: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém timeline completa de rastreamento de um pedido

    **Permissões:** Qualquer usuário autenticado (próprios pedidos)

    **Retorna:**
    - Dados do pedido
    - Eventos de rastreamento da transportadora
    - Histórico de status interno
    - Datas importantes
    """
    from src.models.pedido import TbPedido, TbPedidoHistorico

    # Buscar pedido
    query = select(TbPedido).where(TbPedido.id_pedido == id_pedido)
    result = await db.execute(query)
    pedido = result.scalar_one_or_none()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )

    # Verificar permissão (usuário pode ver apenas seus pedidos, admin pode ver todos)
    if current_user.id_user != pedido.id_user and current_user.ds_perfil not in ["admin", "gestor_clinica"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para visualizar este pedido"
        )

    # Buscar eventos de rastreamento
    eventos = await RastreamentoService.listar_eventos(db, id_pedido)
    eventos_response = [RastreamentoEventoResponse.model_validate(e) for e in eventos]

    # Buscar histórico de status
    query_historico = (
        select(TbPedidoHistorico)
        .where(TbPedidoHistorico.id_pedido == id_pedido)
        .order_by(TbPedidoHistorico.dt_criacao.desc())
    )
    result_historico = await db.execute(query_historico)
    historico = result_historico.scalars().all()

    historico_response = [
        {
            "ds_status_anterior": h.ds_status_anterior,
            "ds_status_novo": h.ds_status_novo,
            "ds_observacao": h.ds_observacao,
            "ds_observacao_cliente": h.ds_observacao_cliente,
            "nm_usuario": h.nm_usuario,
            "dt_criacao": h.dt_criacao,
        }
        for h in historico
    ]

    # Detectar transportadora se tiver código de rastreio
    ds_transportadora = None
    if pedido.ds_codigo_rastreio:
        ds_transportadora = RastreamentoService._detectar_transportadora(pedido.ds_codigo_rastreio)

    return RastreamentoTimelineResponse(
        id_pedido=pedido.id_pedido,
        nr_pedido=pedido.nr_pedido,
        ds_codigo_rastreio=pedido.ds_codigo_rastreio,
        ds_transportadora=ds_transportadora,
        ds_status_atual=pedido.ds_status,
        dt_entrega_estimada=pedido.dt_entrega_estimada,
        dt_pedido=pedido.dt_pedido,
        dt_confirmacao=pedido.dt_confirmacao,
        dt_pagamento=pedido.dt_pagamento,
        dt_envio=pedido.dt_envio,
        dt_entrega=pedido.dt_entrega,
        eventos=eventos_response,
        historico_status=historico_response,
    )


@router.post("/{id_pedido}/atualizar/", status_code=status.HTTP_200_OK)
async def atualizar_rastreamento(
    id_pedido: UUID,
    transportadora: Optional[str] = Query(None, description="correios | jadlog | total_express"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "recepcionista"]))
):
    """
    Força atualização de rastreamento consultando API da transportadora

    **Permissões:** admin, gestor_clinica, recepcionista

    **Processo:**
    1. Consulta API da transportadora
    2. Salva novos eventos
    3. Atualiza status do pedido
    4. Envia notificações se houver mudança
    """
    from src.models.pedido import TbPedido

    # Buscar pedido
    query = select(TbPedido).where(TbPedido.id_pedido == id_pedido)
    result = await db.execute(query)
    pedido = result.scalar_one_or_none()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )

    if not pedido.ds_codigo_rastreio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pedido não possui código de rastreio"
        )

    try:
        # Consultar rastreamento
        eventos = await RastreamentoService.consultar_rastreamento(
            db=db,
            id_pedido=id_pedido,
            codigo_rastreio=pedido.ds_codigo_rastreio,
            transportadora=transportadora
        )

        return {
            "message": "Rastreamento atualizado com sucesso",
            "total_eventos": len(eventos),
            "ultimo_evento": eventos[0].ds_descricao if eventos else None,
        }

    except Exception as e:
        logger.error(f"Erro ao atualizar rastreamento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar transportadora: {str(e)}"
        )


@router.post("/consultar/", response_model=RastreamentoTimelineResponse)
async def consultar_por_codigo(
    data: RastreamentoConsulta,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Consulta rastreamento por código de rastreio

    **Permissões:** Qualquer usuário autenticado

    **Útil para:**
    - Cliente acompanhar pedido sem fazer login
    - Buscar pedido por código externo
    """
    from src.models.pedido import TbPedido

    # Buscar pedido pelo código de rastreio
    query = select(TbPedido).where(TbPedido.ds_codigo_rastreio == data.ds_codigo_rastreio)
    result = await db.execute(query)
    pedido = result.scalar_one_or_none()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado com este código de rastreio"
        )

    # Verificar permissão
    if current_user.id_user != pedido.id_user and current_user.ds_perfil not in ["admin", "gestor_clinica"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para visualizar este pedido"
        )

    # Redirecionar para endpoint de timeline
    return await obter_timeline_rastreamento(pedido.id_pedido, db, current_user)


@router.post("/webhook/", status_code=status.HTTP_200_OK)
async def receber_webhook_transportadora(
    webhook: WebhookRastreamento,
    db: AsyncSession = Depends(get_db)
):
    """
    Webhook para receber atualizações de transportadoras

    **Autenticação:** Token específico por transportadora (configurar no header)

    **Transportadoras suportadas:**
    - Correios
    - Jadlog
    - Total Express

    **Processo:**
    1. Valida webhook
    2. Busca pedido pelo código
    3. Processa evento
    4. Atualiza status
    5. Envia notificação
    """
    try:
        evento = await RastreamentoService.processar_webhook(
            db=db,
            codigo_rastreio=webhook.ds_codigo_rastreio,
            transportadora=webhook.ds_transportadora,
            dados_webhook=webhook.model_dump()
        )

        if not evento:
            logger.warning(f"Webhook ignorado: {webhook.ds_codigo_rastreio}")
            return {"message": "Webhook recebido mas pedido não encontrado"}

        return {
            "message": "Webhook processado com sucesso",
            "id_evento": evento.id_evento,
            "ds_status": evento.ds_status_mapeado,
        }

    except Exception as e:
        logger.error(f"Erro ao processar webhook: {str(e)}")
        # Não retornar erro 500 para não quebrar integração
        return {"message": f"Erro ao processar webhook: {str(e)}"}


@router.put("/{id_pedido}/atualizar-manual/", status_code=status.HTTP_200_OK)
async def atualizar_status_manual(
    id_pedido: UUID,
    data: RastreamentoAtualizacaoManual,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica", "recepcionista"]))
):
    """
    Atualiza status do pedido manualmente

    **Permissões:** admin, gestor_clinica, recepcionista

    **Usado para:**
    - Correções manuais
    - Pedidos sem rastreamento automático
    - Ajustes de data estimada
    """
    from src.models.pedido import TbPedido

    query = select(TbPedido).where(TbPedido.id_pedido == id_pedido)
    result = await db.execute(query)
    pedido = result.scalar_one_or_none()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )

    # Atualizar status
    pedido.ds_status = data.ds_status

    # Atualizar data estimada se fornecida
    if data.dt_entrega_estimada:
        pedido.dt_entrega_estimada = data.dt_entrega_estimada

    # Registrar no histórico (trigger faz isso automaticamente)

    await db.commit()

    logger.info(f"Status do pedido {id_pedido} atualizado manualmente por {current_user.nm_user}")

    return {
        "message": "Status atualizado com sucesso",
        "ds_status_novo": data.ds_status,
    }


@router.get("/estatisticas/", response_model=RastreamentoEstatisticas)
async def obter_estatisticas_rastreamento(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
):
    """
    Obtém estatísticas de rastreamento e entregas

    **Permissões:** admin, gestor_clinica

    **Métricas:**
    - Total de pedidos em trânsito
    - Total entregues
    - Total atrasados
    - Tempo médio de entrega
    - Taxa de entrega no prazo
    """
    from src.models.pedido import TbPedido
    from datetime import datetime, timedelta

    # Total de pedidos
    query_total = select(func.count(TbPedido.id_pedido)).where(
        TbPedido.id_user == current_user.id_user
    )
    total_pedidos = await db.scalar(query_total)

    # Em trânsito
    query_transito = select(func.count(TbPedido.id_pedido)).where(
        and_(
            TbPedido.id_user == current_user.id_user,
            TbPedido.ds_status.in_(["enviado", "em_transito", "saiu_para_entrega"])
        )
    )
    total_em_transito = await db.scalar(query_transito)

    # Entregues
    query_entregues = select(func.count(TbPedido.id_pedido)).where(
        and_(
            TbPedido.id_user == current_user.id_user,
            TbPedido.ds_status == "entregue"
        )
    )
    total_entregues = await db.scalar(query_entregues)

    # Atrasados (entrega estimada passou e não entregue)
    query_atrasados = select(func.count(TbPedido.id_pedido)).where(
        and_(
            TbPedido.id_user == current_user.id_user,
            TbPedido.dt_entrega_estimada < datetime.now(),
            TbPedido.ds_status != "entregue"
        )
    )
    total_atrasados = await db.scalar(query_atrasados)

    # Com problema
    query_problemas = select(func.count(TbPedido.id_pedido)).where(
        and_(
            TbPedido.id_user == current_user.id_user,
            TbPedido.ds_status.in_(["problema_entrega", "cancelado", "devolvido"])
        )
    )
    total_com_problema = await db.scalar(query_problemas)

    # Tempo médio de entrega (em dias)
    query_tempo_medio = select(
        func.avg(func.extract("epoch", TbPedido.dt_entrega - TbPedido.dt_envio) / 86400)
    ).where(
        and_(
            TbPedido.id_user == current_user.id_user,
            TbPedido.dt_entrega.isnot(None),
            TbPedido.dt_envio.isnot(None)
        )
    )
    tempo_medio = await db.scalar(query_tempo_medio)

    # Taxa de entrega no prazo
    query_no_prazo = select(func.count(TbPedido.id_pedido)).where(
        and_(
            TbPedido.id_user == current_user.id_user,
            TbPedido.ds_status == "entregue",
            TbPedido.dt_entrega <= TbPedido.dt_entrega_estimada
        )
    )
    total_no_prazo = await db.scalar(query_no_prazo)
    taxa_entrega_no_prazo = (total_no_prazo / total_entregues * 100) if total_entregues > 0 else 0

    return RastreamentoEstatisticas(
        total_pedidos=total_pedidos or 0,
        total_em_transito=total_em_transito or 0,
        total_entregues=total_entregues or 0,
        total_atrasados=total_atrasados or 0,
        total_com_problema=total_com_problema or 0,
        tempo_medio_entrega_dias=float(tempo_medio) if tempo_medio else None,
        taxa_entrega_no_prazo=float(taxa_entrega_no_prazo),
    )
