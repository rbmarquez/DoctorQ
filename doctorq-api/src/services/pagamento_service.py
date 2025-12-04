"""
Serviço para gerenciar pagamentos no banco de dados.

Este módulo fornece funcionalidades para:
- Criar e atualizar pagamentos
- Registrar transações
- Consultar histórico
- Gerenciar reembolsos
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.pagamento import (
    EventoOrigemEnum,
    GatewayEnum,
    PagamentoCreate,
    PagamentoResponse,
    PagamentoUpdate,
    StatusPagamentoEnum,
    TbPagamento,
    TbTransacaoPagamento,
    TransacaoPagamentoCreate,
    TransacaoPagamentoResponse,
)


class PagamentoService:
    """Serviço para operações de pagamento no banco de dados."""

    @staticmethod
    async def criar_pagamento(
        db: AsyncSession, data: PagamentoCreate
    ) -> PagamentoResponse:
        """
        Cria um novo pagamento no banco de dados.

        Args:
            db: Sessão do banco de dados
            data: Dados do pagamento

        Returns:
            Pagamento criado
        """
        pagamento = TbPagamento(**data.model_dump())
        db.add(pagamento)
        await db.commit()
        await db.refresh(pagamento)

        # Registrar transação de criação
        await PagamentoService.registrar_transacao(
            db=db,
            id_pagamento=pagamento.id_pagamento,
            evento_tipo=f"payment.created.{data.ds_gateway}",
            origem=EventoOrigemEnum.API,
            status_novo=data.ds_status,
            mensagem="Pagamento criado via API",
        )

        return PagamentoResponse.model_validate(pagamento)

    @staticmethod
    async def buscar_por_id(
        db: AsyncSession, id_pagamento: uuid.UUID
    ) -> Optional[PagamentoResponse]:
        """
        Busca pagamento por ID.

        Args:
            db: Sessão do banco de dados
            id_pagamento: ID do pagamento

        Returns:
            Pagamento encontrado ou None
        """
        result = await db.execute(
            select(TbPagamento).where(TbPagamento.id_pagamento == id_pagamento)
        )
        pagamento = result.scalar_one_or_none()

        if pagamento:
            return PagamentoResponse.model_validate(pagamento)
        return None

    @staticmethod
    async def buscar_por_external_id(
        db: AsyncSession, external_id: str, gateway: str
    ) -> Optional[PagamentoResponse]:
        """
        Busca pagamento por ID externo do gateway.

        Args:
            db: Sessão do banco de dados
            external_id: ID externo (Stripe/MercadoPago)
            gateway: Gateway (stripe/mercadopago)

        Returns:
            Pagamento encontrado ou None
        """
        result = await db.execute(
            select(TbPagamento).where(
                TbPagamento.ds_external_id == external_id,
                TbPagamento.ds_gateway == gateway,
            )
        )
        pagamento = result.scalar_one_or_none()

        if pagamento:
            return PagamentoResponse.model_validate(pagamento)
        return None

    @staticmethod
    async def listar_pagamentos(
        db: AsyncSession,
        id_empresa: Optional[uuid.UUID] = None,
        id_user: Optional[uuid.UUID] = None,
        gateway: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> dict:
        """
        Lista pagamentos com filtros e paginação.

        Args:
            db: Sessão do banco de dados
            id_empresa: Filtrar por empresa
            id_user: Filtrar por usuário
            gateway: Filtrar por gateway
            status: Filtrar por status
            page: Página atual
            size: Tamanho da página

        Returns:
            Dicionário com total, page, size e data
        """
        query = select(TbPagamento).where(TbPagamento.fg_ativo == "S")

        # Aplicar filtros
        if id_empresa:
            query = query.where(TbPagamento.id_empresa == id_empresa)
        if id_user:
            query = query.where(TbPagamento.id_user == id_user)
        if gateway:
            query = query.where(TbPagamento.ds_gateway == gateway)
        if status:
            query = query.where(TbPagamento.ds_status == status)

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Aplicar paginação
        query = query.order_by(desc(TbPagamento.dt_criacao))
        query = query.offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        pagamentos = result.scalars().all()

        return {
            "total": total,
            "page": page,
            "size": size,
            "data": [PagamentoResponse.model_validate(p) for p in pagamentos],
        }

    @staticmethod
    async def atualizar_pagamento(
        db: AsyncSession, id_pagamento: uuid.UUID, data: PagamentoUpdate
    ) -> Optional[PagamentoResponse]:
        """
        Atualiza pagamento existente.

        Args:
            db: Sessão do banco de dados
            id_pagamento: ID do pagamento
            data: Dados para atualizar

        Returns:
            Pagamento atualizado ou None
        """
        result = await db.execute(
            select(TbPagamento).where(TbPagamento.id_pagamento == id_pagamento)
        )
        pagamento = result.scalar_one_or_none()

        if not pagamento:
            return None

        status_anterior = pagamento.ds_status

        # Atualizar campos
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(pagamento, field, value)

        pagamento.dt_atualizacao = datetime.now()

        await db.commit()
        await db.refresh(pagamento)

        # Registrar transação se status mudou
        if data.ds_status and data.ds_status != status_anterior:
            await PagamentoService.registrar_transacao(
                db=db,
                id_pagamento=id_pagamento,
                evento_tipo=f"payment.status_changed",
                origem=EventoOrigemEnum.API,
                status_anterior=status_anterior,
                status_novo=data.ds_status,
                mensagem=f"Status alterado de {status_anterior} para {data.ds_status}",
            )

        return PagamentoResponse.model_validate(pagamento)

    @staticmethod
    async def registrar_transacao(
        db: AsyncSession,
        id_pagamento: uuid.UUID,
        evento_tipo: str,
        origem: EventoOrigemEnum,
        status_novo: str,
        status_anterior: Optional[str] = None,
        evento_data: Optional[dict] = None,
        resposta_data: Optional[dict] = None,
        mensagem: Optional[str] = None,
        codigo_erro: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TransacaoPagamentoResponse:
        """
        Registra uma transação no histórico.

        Args:
            db: Sessão do banco de dados
            id_pagamento: ID do pagamento
            evento_tipo: Tipo do evento
            origem: Origem do evento (api, webhook, manual)
            status_novo: Novo status
            status_anterior: Status anterior (opcional)
            evento_data: Dados do evento (opcional)
            resposta_data: Dados da resposta (opcional)
            mensagem: Mensagem descritiva (opcional)
            codigo_erro: Código de erro (opcional)
            ip_address: Endereço IP (opcional)
            user_agent: User agent (opcional)

        Returns:
            Transação criada
        """
        transacao = TbTransacaoPagamento(
            id_pagamento=id_pagamento,
            ds_evento_tipo=evento_tipo,
            ds_evento_origem=origem,
            ds_status_anterior=status_anterior,
            ds_status_novo=status_novo,
            ds_evento_data=evento_data,
            ds_resposta_data=resposta_data,
            ds_mensagem=mensagem,
            ds_codigo_erro=codigo_erro,
            ds_ip_address=ip_address,
            ds_user_agent=user_agent,
        )

        db.add(transacao)
        await db.commit()
        await db.refresh(transacao)

        return TransacaoPagamentoResponse.model_validate(transacao)

    @staticmethod
    async def listar_transacoes(
        db: AsyncSession, id_pagamento: uuid.UUID
    ) -> List[TransacaoPagamentoResponse]:
        """
        Lista transações de um pagamento.

        Args:
            db: Sessão do banco de dados
            id_pagamento: ID do pagamento

        Returns:
            Lista de transações
        """
        result = await db.execute(
            select(TbTransacaoPagamento)
            .where(TbTransacaoPagamento.id_pagamento == id_pagamento)
            .order_by(TbTransacaoPagamento.dt_criacao)
        )
        transacoes = result.scalars().all()

        return [TransacaoPagamentoResponse.model_validate(t) for t in transacoes]

    @staticmethod
    async def marcar_como_reembolsado(
        db: AsyncSession, id_pagamento: uuid.UUID, valor_reembolsado: float
    ) -> Optional[PagamentoResponse]:
        """
        Marca pagamento como reembolsado.

        Args:
            db: Sessão do banco de dados
            id_pagamento: ID do pagamento
            valor_reembolsado: Valor reembolsado

        Returns:
            Pagamento atualizado ou None
        """
        result = await db.execute(
            select(TbPagamento).where(TbPagamento.id_pagamento == id_pagamento)
        )
        pagamento = result.scalar_one_or_none()

        if not pagamento:
            return None

        status_anterior = pagamento.ds_status

        pagamento.fg_refunded = True
        pagamento.dt_refunded = datetime.now()
        pagamento.vl_refunded = valor_reembolsado
        pagamento.ds_status = StatusPagamentoEnum.REFUNDED
        pagamento.dt_atualizacao = datetime.now()

        await db.commit()
        await db.refresh(pagamento)

        # Registrar transação
        await PagamentoService.registrar_transacao(
            db=db,
            id_pagamento=id_pagamento,
            evento_tipo="payment.refunded",
            origem=EventoOrigemEnum.API,
            status_anterior=status_anterior,
            status_novo=StatusPagamentoEnum.REFUNDED,
            mensagem=f"Reembolso de R$ {valor_reembolsado:.2f}",
        )

        return PagamentoResponse.model_validate(pagamento)

    @staticmethod
    async def obter_estatisticas_empresa(
        db: AsyncSession, id_empresa: uuid.UUID
    ) -> dict:
        """
        Obtém estatísticas de pagamentos de uma empresa.

        Args:
            db: Sessão do banco de dados
            id_empresa: ID da empresa

        Returns:
            Dicionário com estatísticas
        """
        # Total de pagamentos
        total_query = select(func.count()).select_from(TbPagamento).where(
            TbPagamento.id_empresa == id_empresa,
            TbPagamento.fg_ativo == "S",
        )
        total_result = await db.execute(total_query)
        total_pagamentos = total_result.scalar()

        # Valor total
        valor_query = select(func.sum(TbPagamento.vl_amount)).where(
            TbPagamento.id_empresa == id_empresa,
            TbPagamento.ds_status == StatusPagamentoEnum.SUCCEEDED,
            TbPagamento.fg_ativo == "S",
        )
        valor_result = await db.execute(valor_query)
        valor_total = valor_result.scalar() or 0

        # Por status
        status_query = (
            select(TbPagamento.ds_status, func.count(), func.sum(TbPagamento.vl_amount))
            .where(
                TbPagamento.id_empresa == id_empresa,
                TbPagamento.fg_ativo == "S",
            )
            .group_by(TbPagamento.ds_status)
        )
        status_result = await db.execute(status_query)
        por_status = {
            status: {"count": count, "valor": float(valor or 0)}
            for status, count, valor in status_result.fetchall()
        }

        # Por gateway
        gateway_query = (
            select(
                TbPagamento.ds_gateway, func.count(), func.sum(TbPagamento.vl_amount)
            )
            .where(
                TbPagamento.id_empresa == id_empresa,
                TbPagamento.fg_ativo == "S",
            )
            .group_by(TbPagamento.ds_gateway)
        )
        gateway_result = await db.execute(gateway_query)
        por_gateway = {
            gateway: {"count": count, "valor": float(valor or 0)}
            for gateway, count, valor in gateway_result.fetchall()
        }

        return {
            "total_pagamentos": total_pagamentos,
            "valor_total": float(valor_total),
            "por_status": por_status,
            "por_gateway": por_gateway,
        }
