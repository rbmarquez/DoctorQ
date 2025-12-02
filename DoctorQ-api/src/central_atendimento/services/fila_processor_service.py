# src/central_atendimento/services/fila_processor_service.py
"""
Serviço de processamento automático de fila de atendimento.

Inspirado no FilaAtendimentoService do Maua, este serviço:
- Processa a fila de atendimento a cada 15 segundos
- Distribui atendimentos para operadores disponíveis
- Suporta estratégias: round_robin, menos_ocupado
- Notifica via WebSocket sobre posição na fila
- Gerencia SLA e atendimentos abandonados
"""

import asyncio
import uuid
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy import select, update, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import ORMConfig

# Models
from src.central_atendimento.models.fila_atendimento import (
    FilaAtendimento,
    AtendimentoItem,
    AtendimentoStatus,
)
from src.central_atendimento.models.conversa_omni import ConversaOmni
from src.central_atendimento.models.contato_omni import ContatoOmni
from src.models.user import User

logger = get_logger(__name__)


class FilaProcessorService:
    """
    Serviço de processamento automático de filas de atendimento.

    Similar ao FilaAtendimentoService do Maua (NestJS), adaptado para FastAPI.
    """

    # Configurações
    DEFAULT_SIMULTANEOUS_TICKETS = 5
    DEFAULT_ABANDONED_TIMEOUT_SECONDS = 600  # 10 minutos
    PROCESS_INTERVAL_SECONDS = 15

    def __init__(self):
        """Inicializa o serviço."""
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._notification_callbacks: List[callable] = []

    async def start(self):
        """Inicia o processamento automático da fila."""
        if self._is_running:
            logger.warning("Processador de fila já está em execução")
            return

        self._is_running = True
        self._task = asyncio.create_task(self._process_loop())
        logger.info("Processador de fila iniciado - intervalo: %ds", self.PROCESS_INTERVAL_SECONDS)

    async def stop(self):
        """Para o processamento automático da fila."""
        if not self._is_running:
            return

        self._is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Processador de fila parado")

    def register_notification_callback(self, callback: callable):
        """Registra callback para notificações."""
        self._notification_callbacks.append(callback)

    async def _process_loop(self):
        """Loop principal de processamento."""
        while self._is_running:
            try:
                await self._process_queue()
            except Exception as e:
                logger.error("Erro ao processar fila de atendimento: %s", str(e))

            await asyncio.sleep(self.PROCESS_INTERVAL_SECONDS)

    async def _process_queue(self):
        """Processa a fila de atendimento."""
        async with ORMConfig.get_session() as db:
            # Buscar itens aguardando atendimento, ordenados por prioridade e entrada
            stmt = (
                select(AtendimentoItem)
                .where(AtendimentoItem.st_atendimento == AtendimentoStatus.AGUARDANDO)
                .order_by(
                    AtendimentoItem.nr_prioridade.desc(),
                    AtendimentoItem.dt_entrada_fila.asc(),
                )
                .limit(50)  # Processar até 50 por ciclo
            )
            result = await db.execute(stmt)
            items = result.scalars().all()

            if not items:
                return

            logger.debug("Processando %d itens na fila", len(items))

            # Processar cada item
            for index, item in enumerate(items):
                await self._process_item(db, item, index + 1, len(items))

            await db.commit()

    async def _process_item(
        self,
        db: AsyncSession,
        item: AtendimentoItem,
        position: int,
        total: int,
    ):
        """Processa um item individual da fila."""
        try:
            # Verificar se item é válido (não abandonado)
            if await self._is_abandoned(item):
                await self._handle_abandoned(db, item)
                return

            # Notificar posição na fila
            await self._notify_queue_position(item, position, total)

            # Buscar fila para obter configurações
            fila = await self._get_fila(db, item.id_fila)
            if not fila:
                logger.warning("Fila %s não encontrada para item %s", item.id_fila, item.id_item)
                return

            # Buscar operador disponível
            operador = await self._find_available_operator(db, fila, item.id_empresa)

            if not operador:
                # Sem operadores disponíveis, manter na fila
                return

            # Atribuir atendimento ao operador
            await self._assign_to_operator(db, item, operador, fila)

        except Exception as e:
            logger.error("Erro ao processar item %s: %s", item.id_item, str(e))

    async def _is_abandoned(self, item: AtendimentoItem) -> bool:
        """Verifica se o atendimento foi abandonado (timeout)."""
        if not item.dt_entrada_fila:
            return False

        tempo_na_fila = (datetime.utcnow() - item.dt_entrada_fila.replace(tzinfo=None)).total_seconds()
        return tempo_na_fila > self.DEFAULT_ABANDONED_TIMEOUT_SECONDS

    async def _handle_abandoned(self, db: AsyncSession, item: AtendimentoItem):
        """Marca item como abandonado."""
        logger.info(
            "Item %s abandonado após %ds sem atendimento",
            item.id_item,
            self.DEFAULT_ABANDONED_TIMEOUT_SECONDS,
        )

        item.st_atendimento = AtendimentoStatus.ABANDONADO
        item.dt_fim_atendimento = datetime.utcnow()
        item.nr_tempo_espera = int(
            (datetime.utcnow() - item.dt_entrada_fila.replace(tzinfo=None)).total_seconds()
        )

        # Atualizar conversa
        stmt = (
            update(ConversaOmni)
            .where(ConversaOmni.id_conversa == item.id_conversa)
            .values(
                st_aberta=False,
                st_aguardando_humano=False,
                dt_fechamento=datetime.utcnow(),
            )
        )
        await db.execute(stmt)

    async def _notify_queue_position(
        self,
        item: AtendimentoItem,
        position: int,
        total: int,
    ):
        """Notifica o contato sobre sua posição na fila."""
        if position == 1:
            message = "Você é o próximo a ser atendido, aguarde um momento."
        else:
            message = f"Você é o {position}º da fila de atendimento. Em breve um atendente irá entrar em contato."

        # Chamar callbacks registrados
        for callback in self._notification_callbacks:
            try:
                await callback(
                    item_id=str(item.id_item),
                    conversa_id=str(item.id_conversa),
                    contato_id=str(item.id_contato),
                    position=position,
                    total=total,
                    message=message,
                )
            except Exception as e:
                logger.error("Erro ao executar callback de notificação: %s", str(e))

    async def _get_fila(self, db: AsyncSession, id_fila: uuid.UUID) -> Optional[FilaAtendimento]:
        """Obtém a fila pelo ID."""
        stmt = select(FilaAtendimento).where(FilaAtendimento.id_fila == id_fila)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def _find_available_operator(
        self,
        db: AsyncSession,
        fila: FilaAtendimento,
        id_empresa: uuid.UUID,
    ) -> Optional[User]:
        """
        Encontra operador disponível para atendimento.

        Suporta estratégias:
        - round_robin: Distribui igualmente entre operadores
        - menos_ocupado: Prioriza operador com menos atendimentos
        """
        # Obter lista de atendentes da fila
        atendentes_ids = fila.ds_atendentes or []
        if not atendentes_ids:
            # Se não há atendentes na fila, buscar qualquer atendente da empresa
            stmt = (
                select(User)
                .where(
                    User.id_empresa == id_empresa,
                    User.st_ativo == "S",
                )
                .limit(10)
            )
            result = await db.execute(stmt)
            atendentes = result.scalars().all()
            atendentes_ids = [a.id_user for a in atendentes]

        if not atendentes_ids:
            return None

        # Contar atendimentos ativos por operador
        stmt = (
            select(
                AtendimentoItem.id_atendente,
                func.count(AtendimentoItem.id_item).label("total"),
            )
            .where(
                AtendimentoItem.id_atendente.in_(atendentes_ids),
                AtendimentoItem.st_atendimento == AtendimentoStatus.EM_ATENDIMENTO,
            )
            .group_by(AtendimentoItem.id_atendente)
        )
        result = await db.execute(stmt)
        atendimentos_por_operador = {row[0]: row[1] for row in result.all()}

        limite = fila.nr_limite_simultaneo or self.DEFAULT_SIMULTANEOUS_TICKETS
        modo = fila.nm_modo_distribuicao or "round_robin"

        # Filtrar operadores que não atingiram o limite
        disponiveis = [
            op_id for op_id in atendentes_ids
            if atendimentos_por_operador.get(op_id, 0) < limite
        ]

        if not disponiveis:
            return None

        # Selecionar operador baseado na estratégia
        if modo == "menos_ocupado":
            # Ordenar por número de atendimentos (menor primeiro)
            disponiveis.sort(key=lambda x: atendimentos_por_operador.get(x, 0))
            operador_id = disponiveis[0]
        else:
            # Round-robin: seleciona aleatoriamente
            operador_id = secrets.choice(disponiveis)

        # Buscar operador
        stmt = select(User).where(User.id_user == operador_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def _assign_to_operator(
        self,
        db: AsyncSession,
        item: AtendimentoItem,
        operador: User,
        fila: FilaAtendimento,
    ):
        """Atribui o atendimento a um operador."""
        now = datetime.utcnow()

        # Gerar protocolo se não existir
        if not item.nr_protocolo:
            item.nr_protocolo = self._generate_protocol()

        # Atualizar item
        item.id_atendente = operador.id_user
        item.st_atendimento = AtendimentoStatus.EM_ATENDIMENTO
        item.dt_inicio_atendimento = now
        item.nr_tempo_espera = int(
            (now - item.dt_entrada_fila.replace(tzinfo=None)).total_seconds()
        )

        # Calcular SLA
        item.dt_sla_primeira_resposta = now + timedelta(seconds=fila.nr_sla_primeira_resposta)
        item.dt_sla_resolucao = now + timedelta(seconds=fila.nr_sla_resolucao)

        # Atualizar conversa
        stmt = (
            update(ConversaOmni)
            .where(ConversaOmni.id_conversa == item.id_conversa)
            .values(
                id_atendente=operador.id_user,
                st_bot_ativo=False,
                st_aguardando_humano=False,
                dt_atualizacao=now,
            )
        )
        await db.execute(stmt)

        # Atualizar métricas da fila
        stmt = (
            update(FilaAtendimento)
            .where(FilaAtendimento.id_fila == fila.id_fila)
            .values(
                nr_atendimentos_hoje=FilaAtendimento.nr_atendimentos_hoje + 1,
                nr_aguardando=func.greatest(FilaAtendimento.nr_aguardando - 1, 0),
            )
        )
        await db.execute(stmt)

        logger.info(
            "Atendimento %s atribuído ao operador %s (protocolo: %s)",
            item.id_item,
            operador.nm_nome if hasattr(operador, 'nm_nome') else operador.id_user,
            item.nr_protocolo,
        )

        # Notificar operador
        for callback in self._notification_callbacks:
            try:
                await callback(
                    event_type="new_ticket",
                    operador_id=str(operador.id_user),
                    item_id=str(item.id_item),
                    conversa_id=str(item.id_conversa),
                    protocolo=item.nr_protocolo,
                )
            except Exception as e:
                logger.error("Erro ao notificar operador: %s", str(e))

    def _generate_protocol(self) -> str:
        """Gera número de protocolo único."""
        now = datetime.utcnow()
        random_part = secrets.token_hex(3).upper()
        return f"{now.strftime('%Y%m%d')}-{random_part}"


# Singleton do processador
_processor_instance: Optional[FilaProcessorService] = None


def get_fila_processor() -> FilaProcessorService:
    """Retorna instância singleton do processador de fila."""
    global _processor_instance
    if _processor_instance is None:
        _processor_instance = FilaProcessorService()
    return _processor_instance


async def start_fila_processor():
    """Inicia o processador de fila (chamar no lifespan)."""
    processor = get_fila_processor()
    await processor.start()


async def stop_fila_processor():
    """Para o processador de fila (chamar no lifespan)."""
    processor = get_fila_processor()
    await processor.stop()
