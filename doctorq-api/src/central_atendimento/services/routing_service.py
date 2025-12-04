# src/central_atendimento/services/routing_service.py
"""
Serviço de roteamento inteligente de conversas.

Implementa diferentes estratégias de distribuição:
- Round Robin: Distribui igualmente entre atendentes
- Menos Ocupado: Prioriza atendente com menos conversas ativas
- Skill Based: Roteia para atendente com skills específicos
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from src.config.logger_config import get_logger
from src.central_atendimento.models.fila_atendimento import (
    FilaAtendimento,
    AtendimentoItem,
    AtendimentoStatus,
)
from src.central_atendimento.models.conversa_omni import ConversaOmni

logger = get_logger(__name__)


class RoutingService:
    """Serviço para roteamento de conversas."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    async def rotear_conversa(
        self,
        id_conversa: uuid.UUID,
        id_fila: Optional[uuid.UUID] = None,
        prioridade: int = 0,
        motivo: Optional[str] = None,
        contexto: Optional[str] = None,
    ) -> Optional[AtendimentoItem]:
        """
        Roteia uma conversa para uma fila de atendimento.

        Args:
            id_conversa: ID da conversa
            id_fila: ID da fila (se não informado, usa a padrão)
            prioridade: Prioridade do atendimento
            motivo: Motivo da entrada na fila
            contexto: Contexto para o atendente

        Returns:
            Item de atendimento criado
        """
        # Obter fila
        fila = None
        if id_fila:
            fila = await self._obter_fila(id_fila)
        else:
            fila = await self._obter_fila_padrao()

        if not fila:
            logger.error("Nenhuma fila disponível para roteamento")
            return None

        # Verificar se já existe item na fila
        item_existente = await self._obter_item_ativo(id_conversa)
        if item_existente:
            logger.warning(f"Conversa {id_conversa} já está na fila")
            return item_existente

        # Obter conversa
        stmt = select(ConversaOmni).where(ConversaOmni.id_conversa == id_conversa)
        result = await self.db.execute(stmt)
        conversa = result.scalar_one_or_none()

        if not conversa:
            logger.error(f"Conversa não encontrada: {id_conversa}")
            return None

        # Calcular posição na fila
        posicao = await self._calcular_posicao(fila.id_fila)

        # Criar item na fila
        item = AtendimentoItem(
            id_fila=fila.id_fila,
            id_conversa=id_conversa,
            id_contato=conversa.id_contato,
            id_empresa=self.id_empresa,
            nr_prioridade=prioridade,
            nr_posicao_fila=posicao,
            ds_motivo=motivo,  # Corrigido: nm_motivo -> ds_motivo
        )

        self.db.add(item)

        # Atualizar conversa
        conversa.st_aguardando_humano = True
        conversa.id_fila = fila.id_fila

        # Atualizar contador da fila
        fila.nr_aguardando += 1

        await self.db.commit()
        await self.db.refresh(item)

        # Tentar atribuir automaticamente
        await self._tentar_atribuir_automaticamente(item, fila)

        logger.info(f"Conversa {id_conversa} roteada para fila {fila.nm_fila}")
        return item

    async def atribuir_atendente(
        self,
        id_item: uuid.UUID,
        id_atendente: uuid.UUID,
    ) -> Optional[AtendimentoItem]:
        """
        Atribui um atendente a um item da fila.

        Args:
            id_item: ID do item
            id_atendente: ID do atendente

        Returns:
            Item atualizado
        """
        item = await self._obter_item(id_item)
        if not item:
            return None

        if item.st_atendimento != AtendimentoStatus.AGUARDANDO:
            logger.warning(f"Item {id_item} não está aguardando")
            return item

        item.id_atendente = id_atendente
        item.st_atendimento = AtendimentoStatus.EM_ATENDIMENTO
        item.dt_inicio_atendimento = datetime.utcnow()
        item.nr_posicao_fila = None

        # Atualizar conversa
        stmt = select(ConversaOmni).where(ConversaOmni.id_conversa == item.id_conversa)
        result = await self.db.execute(stmt)
        conversa = result.scalar_one_or_none()

        if conversa:
            conversa.id_atendente = id_atendente
            conversa.st_aguardando_humano = False

        # Atualizar contador da fila
        fila = await self._obter_fila(item.id_fila)
        if fila:
            fila.nr_aguardando = max(0, fila.nr_aguardando - 1)

        await self.db.commit()
        await self.db.refresh(item)

        logger.info(f"Atendente {id_atendente} atribuído ao item {id_item}")
        return item

    async def finalizar_atendimento(
        self,
        id_item: uuid.UUID,
        avaliacao: Optional[int] = None,
        feedback: Optional[str] = None,
    ) -> Optional[AtendimentoItem]:
        """
        Finaliza um atendimento.

        Args:
            id_item: ID do item
            avaliacao: Avaliação (1-5)
            feedback: Feedback do cliente

        Returns:
            Item atualizado
        """
        item = await self._obter_item(id_item)
        if not item:
            return None

        item.st_atendimento = AtendimentoStatus.FINALIZADO
        item.dt_fim_atendimento = datetime.utcnow()

        if avaliacao:
            item.nr_avaliacao = avaliacao
        if feedback:
            item.ds_feedback = feedback

        # Atualizar métricas da fila
        fila = await self._obter_fila(item.id_fila)
        if fila and item.dt_inicio_atendimento:
            tempo_atendimento = int(
                (item.dt_fim_atendimento - item.dt_inicio_atendimento).total_seconds()
            )
            # Média móvel simplificada
            if fila.nr_tempo_atendimento_medio == 0:
                fila.nr_tempo_atendimento_medio = tempo_atendimento
            else:
                fila.nr_tempo_atendimento_medio = (
                    fila.nr_tempo_atendimento_medio + tempo_atendimento
                ) // 2

            fila.nr_atendimentos_hoje += 1

        await self.db.commit()
        await self.db.refresh(item)

        logger.info(f"Atendimento {id_item} finalizado")
        return item

    async def transferir_atendimento(
        self,
        id_item: uuid.UUID,
        id_fila_destino: Optional[uuid.UUID] = None,
        id_atendente_destino: Optional[uuid.UUID] = None,
        motivo: Optional[str] = None,
    ) -> Optional[AtendimentoItem]:
        """
        Transfere um atendimento para outra fila ou atendente.

        Args:
            id_item: ID do item
            id_fila_destino: Fila de destino (opcional)
            id_atendente_destino: Atendente de destino (opcional)
            motivo: Motivo da transferência

        Returns:
            Item atualizado
        """
        item = await self._obter_item(id_item)
        if not item:
            return None

        item.st_atendimento = AtendimentoStatus.TRANSFERIDO
        item.nr_transferencias += 1
        item.id_fila_origem = item.id_fila
        item.id_atendente_anterior = item.id_atendente

        # Adicionar motivo às notas
        if motivo:
            notas = item.ds_notas or ""
            item.ds_notas = f"{notas}\n[Transferência] {motivo}".strip()

        await self.db.commit()

        # Criar novo item na fila de destino
        novo_item = await self.rotear_conversa(
            id_conversa=item.id_conversa,
            id_fila=id_fila_destino,
            prioridade=item.nr_prioridade,
            motivo=f"Transferência: {motivo}" if motivo else "Transferência",
            contexto=item.ds_contexto,
        )

        # Se tem atendente específico, atribuir diretamente
        if novo_item and id_atendente_destino:
            novo_item = await self.atribuir_atendente(
                novo_item.id_item,
                id_atendente_destino,
            )

        logger.info(f"Atendimento {id_item} transferido")
        return novo_item

    async def obter_proximo_atendimento(
        self,
        id_atendente: uuid.UUID,
        id_fila: Optional[uuid.UUID] = None,
    ) -> Optional[AtendimentoItem]:
        """
        Obtém o próximo atendimento para um atendente.

        Args:
            id_atendente: ID do atendente
            id_fila: Filtrar por fila específica (opcional)

        Returns:
            Próximo item a atender ou None
        """
        # Verificar limite de atendimentos simultâneos
        atendimentos_ativos = await self._contar_atendimentos_ativos(id_atendente)

        # Obter limite da fila
        if id_fila:
            fila = await self._obter_fila(id_fila)
            limite = fila.nr_limite_simultaneo if fila else 5
        else:
            limite = 5

        if atendimentos_ativos >= limite:
            logger.info(f"Atendente {id_atendente} atingiu limite de {limite}")
            return None

        # Buscar próximo item aguardando
        stmt = (
            select(AtendimentoItem)
            .where(
                AtendimentoItem.id_empresa == self.id_empresa,
                AtendimentoItem.st_atendimento == AtendimentoStatus.AGUARDANDO,
            )
            .order_by(
                AtendimentoItem.nr_prioridade.desc(),
                AtendimentoItem.dt_entrada_fila.asc(),
            )
        )

        if id_fila:
            stmt = stmt.where(AtendimentoItem.id_fila == id_fila)

        result = await self.db.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            # Atribuir automaticamente
            return await self.atribuir_atendente(item.id_item, id_atendente)

        return None

    async def listar_fila(
        self,
        id_fila: uuid.UUID,
        status: Optional[AtendimentoStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[AtendimentoItem], int]:
        """
        Lista itens de uma fila.

        Args:
            id_fila: ID da fila
            status: Filtrar por status
            page: Página
            page_size: Itens por página

        Returns:
            Tuple (lista de itens, total)
        """
        stmt = select(AtendimentoItem).where(
            AtendimentoItem.id_fila == id_fila,
            AtendimentoItem.id_empresa == self.id_empresa,
        )

        if status:
            stmt = stmt.where(AtendimentoItem.st_atendimento == status)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.execute(count_stmt)
        total_count = total.scalar()

        # Ordenar e paginar
        stmt = stmt.order_by(
            AtendimentoItem.nr_prioridade.desc(),
            AtendimentoItem.dt_entrada_fila.asc(),
        )
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        itens = result.scalars().all()

        return list(itens), total_count

    async def _obter_fila(self, id_fila: uuid.UUID) -> Optional[FilaAtendimento]:
        """Obtém uma fila pelo ID."""
        stmt = select(FilaAtendimento).where(
            FilaAtendimento.id_fila == id_fila,
            FilaAtendimento.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _obter_fila_padrao(self) -> Optional[FilaAtendimento]:
        """Obtém a fila padrão da empresa."""
        stmt = select(FilaAtendimento).where(
            FilaAtendimento.id_empresa == self.id_empresa,
            FilaAtendimento.st_padrao == True,
            FilaAtendimento.st_ativa == True,
        )
        result = await self.db.execute(stmt)
        fila = result.scalar_one_or_none()

        # Se não tem padrão, pegar a primeira ativa
        if not fila:
            stmt = select(FilaAtendimento).where(
                FilaAtendimento.id_empresa == self.id_empresa,
                FilaAtendimento.st_ativa == True,
            ).order_by(FilaAtendimento.dt_criacao.asc())
            result = await self.db.execute(stmt)
            fila = result.scalar_one_or_none()

        return fila

    async def _obter_item(self, id_item: uuid.UUID) -> Optional[AtendimentoItem]:
        """Obtém um item da fila pelo ID."""
        stmt = select(AtendimentoItem).where(
            AtendimentoItem.id_item == id_item,
            AtendimentoItem.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _obter_item_ativo(
        self,
        id_conversa: uuid.UUID,
    ) -> Optional[AtendimentoItem]:
        """Obtém item ativo para uma conversa."""
        stmt = select(AtendimentoItem).where(
            AtendimentoItem.id_conversa == id_conversa,
            AtendimentoItem.id_empresa == self.id_empresa,
            AtendimentoItem.st_atendimento.in_([
                AtendimentoStatus.AGUARDANDO,
                AtendimentoStatus.EM_ATENDIMENTO,
            ]),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _calcular_posicao(self, id_fila: uuid.UUID) -> int:
        """Calcula a posição na fila."""
        stmt = select(func.count()).where(
            AtendimentoItem.id_fila == id_fila,
            AtendimentoItem.st_atendimento == AtendimentoStatus.AGUARDANDO,
        )
        result = await self.db.execute(stmt)
        return result.scalar() + 1

    async def _contar_atendimentos_ativos(self, id_atendente: uuid.UUID) -> int:
        """Conta atendimentos ativos de um atendente."""
        stmt = select(func.count()).where(
            AtendimentoItem.id_atendente == id_atendente,
            AtendimentoItem.st_atendimento == AtendimentoStatus.EM_ATENDIMENTO,
        )
        result = await self.db.execute(stmt)
        return result.scalar()

    async def _tentar_atribuir_automaticamente(
        self,
        item: AtendimentoItem,
        fila: FilaAtendimento,
    ):
        """Tenta atribuir o item automaticamente baseado no modo de distribuição."""
        modo = fila.nm_modo_distribuicao

        if modo == "round_robin":
            atendente = await self._selecionar_round_robin(fila)
        elif modo == "menos_ocupado":
            atendente = await self._selecionar_menos_ocupado(fila)
        else:
            # Não atribuir automaticamente
            return

        if atendente:
            await self.atribuir_atendente(item.id_item, atendente)

    async def _selecionar_round_robin(
        self,
        fila: FilaAtendimento,
    ) -> Optional[uuid.UUID]:
        """Seleciona atendente por round robin."""
        atendentes = fila.ds_atendentes or []
        if not atendentes:
            return None

        # Pegar o último atendimento da fila
        stmt = (
            select(AtendimentoItem.id_atendente)
            .where(
                AtendimentoItem.id_fila == fila.id_fila,
                AtendimentoItem.id_atendente.isnot(None),
            )
            .order_by(AtendimentoItem.dt_inicio_atendimento.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        ultimo_atendente = result.scalar_one_or_none()

        # Encontrar próximo na lista
        if ultimo_atendente and ultimo_atendente in atendentes:
            idx = atendentes.index(ultimo_atendente)
            proximo_idx = (idx + 1) % len(atendentes)
        else:
            proximo_idx = 0

        # Verificar se pode atender
        proximo = atendentes[proximo_idx]
        ativos = await self._contar_atendimentos_ativos(proximo)
        if ativos < fila.nr_limite_simultaneo:
            return proximo

        return None

    async def _selecionar_menos_ocupado(
        self,
        fila: FilaAtendimento,
    ) -> Optional[uuid.UUID]:
        """Seleciona atendente menos ocupado."""
        atendentes = fila.ds_atendentes or []
        if not atendentes:
            return None

        menor_carga = float("inf")
        selecionado = None

        for atendente in atendentes:
            ativos = await self._contar_atendimentos_ativos(atendente)
            if ativos < fila.nr_limite_simultaneo and ativos < menor_carga:
                menor_carga = ativos
                selecionado = atendente

        return selecionado
