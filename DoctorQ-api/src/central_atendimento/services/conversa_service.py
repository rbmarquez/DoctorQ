# src/central_atendimento/services/conversa_service.py
"""
Serviço para gerenciamento de conversas omnichannel.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_
from sqlalchemy.orm import joinedload

from src.config.logger_config import get_logger
from src.central_atendimento.models.contato_omni import ContatoOmni
from src.central_atendimento.models.canal import CanalTipo
from src.central_atendimento.models.conversa_omni import (
    ConversaOmni,
    MensagemOmni,
    MensagemTipo,
    MensagemStatus,
    ConversaOmniCreate,
    ConversaOmniUpdate,
    MensagemOmniCreate,
)

logger = get_logger(__name__)


class ConversaOmniService:
    """Serviço para operações de conversas omnichannel."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    # =========================================================================
    # Operações de Conversa
    # =========================================================================

    async def criar_conversa(self, dados: ConversaOmniCreate) -> ConversaOmni:
        """
        Cria uma nova conversa.

        Args:
            dados: Dados da conversa

        Returns:
            Conversa criada
        """
        conversa = ConversaOmni(
            id_empresa=self.id_empresa,
            id_contato=dados.id_contato,
            id_canal=dados.id_canal,
            tp_canal=dados.tp_canal,
            nm_titulo=dados.nm_titulo,
            ds_resumo=dados.ds_resumo,
            id_agente=dados.id_agente,
            st_bot_ativo=dados.st_bot_ativo,
        )

        self.db.add(conversa)
        await self.db.commit()
        await self.db.refresh(conversa)

        logger.info(f"Conversa criada: {conversa.id_conversa}")
        return conversa

    async def obter_conversa(self, id_conversa: uuid.UUID) -> Optional[ConversaOmni]:
        """Obtém uma conversa pelo ID."""
        stmt = select(ConversaOmni).where(
            ConversaOmni.id_conversa == id_conversa,
            ConversaOmni.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_conversa_com_contato(self, id_conversa: uuid.UUID) -> Optional[ConversaOmni]:
        """
        Obtém uma conversa pelo ID com dados do contato carregados.

        Args:
            id_conversa: ID da conversa

        Returns:
            Conversa com contato ou None
        """
        stmt = select(ConversaOmni).where(
            ConversaOmni.id_conversa == id_conversa,
            ConversaOmni.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        conversa = result.scalar_one_or_none()

        if not conversa:
            return None

        # Buscar o contato separadamente
        contato_stmt = select(ContatoOmni).where(
            ContatoOmni.id_contato == conversa.id_contato
        )
        contato_result = await self.db.execute(contato_stmt)
        contato = contato_result.scalar_one_or_none()

        # Adicionar contato ao objeto conversa
        conversa.contato = contato
        return conversa

    async def obter_conversa_ativa(
        self,
        id_contato: uuid.UUID,
        tp_canal: Optional[CanalTipo] = None,
    ) -> Optional[ConversaOmni]:
        """
        Obtém a conversa ativa de um contato.

        Args:
            id_contato: ID do contato
            tp_canal: Tipo do canal (opcional)

        Returns:
            Conversa ativa ou None
        """
        stmt = select(ConversaOmni).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.id_contato == id_contato,
            ConversaOmni.st_aberta == True,
        )

        if tp_canal:
            stmt = stmt.where(ConversaOmni.tp_canal == tp_canal)

        stmt = stmt.order_by(ConversaOmni.dt_ultima_mensagem.desc())
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_ou_criar_conversa(
        self,
        id_contato: uuid.UUID,
        tp_canal: CanalTipo,
        id_canal: Optional[uuid.UUID] = None,
        id_agente: Optional[uuid.UUID] = None,
    ) -> tuple[ConversaOmni, bool]:
        """
        Obtém uma conversa ativa ou cria uma nova.

        Args:
            id_contato: ID do contato
            tp_canal: Tipo do canal
            id_canal: ID do canal (opcional)
            id_agente: ID do agente de IA (opcional)

        Returns:
            Tuple (conversa, criada: bool)
        """
        conversa = await self.obter_conversa_ativa(id_contato, tp_canal)

        if conversa:
            return conversa, False

        # Criar nova conversa
        dados = ConversaOmniCreate(
            id_contato=id_contato,
            tp_canal=tp_canal,
            id_canal=id_canal,
            id_agente=id_agente,
        )
        conversa = await self.criar_conversa(dados)
        return conversa, True

    async def listar_conversas(
        self,
        st_aberta: Optional[bool] = None,
        id_contato: Optional[uuid.UUID] = None,
        id_atendente: Optional[uuid.UUID] = None,
        tp_canal: Optional[CanalTipo] = None,
        st_aguardando_humano: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[ConversaOmni], int]:
        """
        Lista conversas com filtros.

        Returns:
            Tuple (lista de conversas, total)
        """
        stmt = select(ConversaOmni).where(ConversaOmni.id_empresa == self.id_empresa)

        if st_aberta is not None:
            stmt = stmt.where(ConversaOmni.st_aberta == st_aberta)
        if id_contato:
            stmt = stmt.where(ConversaOmni.id_contato == id_contato)
        if id_atendente:
            stmt = stmt.where(ConversaOmni.id_atendente == id_atendente)
        if tp_canal:
            stmt = stmt.where(ConversaOmni.tp_canal == tp_canal)
        if st_aguardando_humano is not None:
            stmt = stmt.where(ConversaOmni.st_aguardando_humano == st_aguardando_humano)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.execute(count_stmt)
        total_count = total.scalar()

        # Ordenação e paginação
        stmt = stmt.order_by(ConversaOmni.dt_ultima_mensagem.desc().nullslast())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        conversas = result.scalars().all()

        return list(conversas), total_count

    async def atualizar_conversa(
        self,
        id_conversa: uuid.UUID,
        dados: ConversaOmniUpdate,
    ) -> Optional[ConversaOmni]:
        """Atualiza uma conversa."""
        conversa = await self.obter_conversa(id_conversa)
        if not conversa:
            return None

        update_data = dados.model_dump(exclude_unset=True)

        # Se está fechando, registrar timestamp
        if update_data.get("st_aberta") is False and conversa.st_aberta:
            update_data["dt_fechamento"] = datetime.utcnow()

        for key, value in update_data.items():
            setattr(conversa, key, value)

        await self.db.commit()
        await self.db.refresh(conversa)

        logger.info(f"Conversa atualizada: {conversa.id_conversa}")
        return conversa

    async def fechar_conversa(
        self,
        id_conversa: uuid.UUID,
        avaliacao: Optional[int] = None,
        feedback: Optional[str] = None,
    ) -> Optional[ConversaOmni]:
        """
        Fecha uma conversa.

        Args:
            id_conversa: ID da conversa
            avaliacao: Avaliação (1-5)
            feedback: Feedback do cliente

        Returns:
            Conversa atualizada
        """
        dados = ConversaOmniUpdate(
            st_aberta=False,
            nr_avaliacao=avaliacao,
            ds_feedback=feedback,
        )
        return await self.atualizar_conversa(id_conversa, dados)

    async def transferir_para_humano(
        self,
        id_conversa: uuid.UUID,
        id_fila: Optional[uuid.UUID] = None,
        motivo: Optional[str] = None,
    ) -> Optional[ConversaOmni]:
        """
        Transfere a conversa para atendimento humano.

        Args:
            id_conversa: ID da conversa
            id_fila: ID da fila de destino (opcional)
            motivo: Motivo da transferência

        Returns:
            Conversa atualizada
        """
        conversa = await self.obter_conversa(id_conversa)
        if not conversa:
            return None

        conversa.st_bot_ativo = False
        conversa.st_aguardando_humano = True
        if id_fila:
            conversa.id_fila = id_fila

        # Adicionar ao contexto o motivo da transferência
        contexto = conversa.ds_contexto or {}
        contexto["motivo_transferencia"] = motivo
        contexto["dt_transferencia"] = datetime.utcnow().isoformat()
        conversa.ds_contexto = contexto

        await self.db.commit()
        await self.db.refresh(conversa)

        logger.info(f"Conversa transferida para humano: {id_conversa}")
        return conversa

    async def favoritar_conversa(
        self,
        id_conversa: uuid.UUID,
        favorito: bool = True
    ) -> Optional[ConversaOmni]:
        """
        Marca ou desmarca uma conversa como favorita.

        Args:
            id_conversa: ID da conversa
            favorito: True para favoritar, False para desfavoritar

        Returns:
            Conversa atualizada ou None se não encontrada
        """
        stmt = (
            update(ConversaOmni)
            .where(
                ConversaOmni.id_conversa == id_conversa,
                ConversaOmni.id_empresa == self.id_empresa,
            )
            .values(st_favorito=favorito)
            .returning(ConversaOmni)
        )

        result = await self.db.execute(stmt)
        await self.db.commit()
        conversa = result.scalar_one_or_none()

        if conversa:
            logger.info(f"Conversa {'favoritada' if favorito else 'desfavoritada'}: {id_conversa}")

        return conversa

    # =========================================================================
    # Operações de Mensagem
    # =========================================================================

    async def criar_mensagem(self, dados: MensagemOmniCreate) -> MensagemOmni:
        """
        Cria uma nova mensagem.

        Args:
            dados: Dados da mensagem

        Returns:
            Mensagem criada
        """
        # Campos sincronizados com schema tb_mensagens_omni em 22/11/2025
        mensagem = MensagemOmni(
            id_conversa=dados.id_conversa,
            st_entrada=dados.st_entrada,
            nm_remetente=dados.nm_remetente,
            tp_mensagem=dados.tp_mensagem,
            ds_conteudo=dados.ds_conteudo or "",
            ds_url_midia=dados.ds_url_midia,
            nm_tipo_midia=dados.nm_tipo_midia,
            ds_metadata=dados.ds_metadata or {},
            st_mensagem=MensagemStatus.PENDENTE,
        )

        self.db.add(mensagem)
        await self.db.commit()
        await self.db.refresh(mensagem)

        # Atualizar métricas da conversa
        await self._atualizar_metricas_conversa(dados.id_conversa, dados.st_entrada)

        logger.debug(f"Mensagem criada: {mensagem.id_mensagem}")
        return mensagem

    async def obter_mensagem(self, id_mensagem: uuid.UUID) -> Optional[MensagemOmni]:
        """Obtém uma mensagem pelo ID."""
        stmt = select(MensagemOmni).where(MensagemOmni.id_mensagem == id_mensagem)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_mensagem_por_id_externo(
        self,
        id_externo: str,
    ) -> Optional[MensagemOmni]:
        """Obtém uma mensagem pelo ID externo (da plataforma)."""
        stmt = select(MensagemOmni).where(MensagemOmni.id_externo == id_externo)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def listar_mensagens(
        self,
        id_conversa: uuid.UUID,
        page: int = 1,
        page_size: int = 50,
        ordem: str = "asc",
    ) -> tuple[List[MensagemOmni], int]:
        """
        Lista mensagens de uma conversa.

        Args:
            id_conversa: ID da conversa
            page: Página
            page_size: Itens por página
            ordem: "asc" ou "desc"

        Returns:
            Tuple (lista de mensagens, total)
        """
        stmt = select(MensagemOmni).where(MensagemOmni.id_conversa == id_conversa)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.execute(count_stmt)
        total_count = total.scalar()

        # Ordenação
        if ordem == "desc":
            stmt = stmt.order_by(MensagemOmni.dt_criacao.desc())
        else:
            stmt = stmt.order_by(MensagemOmni.dt_criacao.asc())

        # Paginação
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        mensagens = result.scalars().all()

        return list(mensagens), total_count

    async def obter_historico_contexto(
        self,
        id_conversa: uuid.UUID,
        limite: int = 20,
    ) -> List[MensagemOmni]:
        """
        Obtém o histórico de mensagens para contexto da IA.

        Retorna as últimas mensagens da conversa para contexto.

        Args:
            id_conversa: ID da conversa
            limite: Número máximo de mensagens

        Returns:
            Lista de mensagens para contexto
        """
        # Sincronizado com schema tb_mensagens_omni em 22/11/2025
        # Coluna st_incluir_contexto não existe - retorna todas as mensagens
        stmt = (
            select(MensagemOmni)
            .where(MensagemOmni.id_conversa == id_conversa)
            .order_by(MensagemOmni.dt_criacao.desc())
            .limit(limite)
        )

        result = await self.db.execute(stmt)
        mensagens = result.scalars().all()

        # Retornar em ordem cronológica
        return list(reversed(mensagens))

    async def atualizar_status_mensagem(
        self,
        id_mensagem: uuid.UUID,
        status: MensagemStatus,
        id_externo: Optional[str] = None,
    ) -> Optional[MensagemOmni]:
        """
        Atualiza o status de uma mensagem.

        Args:
            id_mensagem: ID da mensagem
            status: Novo status
            id_externo: ID externo da mensagem (opcional)

        Returns:
            Mensagem atualizada
        """
        mensagem = await self.obter_mensagem(id_mensagem)
        if not mensagem:
            return None

        mensagem.st_mensagem = status

        if id_externo:
            mensagem.id_externo = id_externo

        # Atualizar timestamps baseado no status
        agora = datetime.utcnow()
        if status == MensagemStatus.ENVIADA:
            mensagem.dt_envio = agora
        elif status == MensagemStatus.ENTREGUE:
            mensagem.dt_entrega = agora
        elif status == MensagemStatus.LIDA:
            mensagem.dt_leitura = agora

        await self.db.commit()
        await self.db.refresh(mensagem)
        return mensagem

    async def atualizar_status_por_id_externo(
        self,
        id_externo: str,
        status: MensagemStatus,
    ) -> Optional[MensagemOmni]:
        """
        Atualiza o status de uma mensagem pelo ID externo.

        Útil para processar webhooks de status.

        Args:
            id_externo: ID externo da mensagem
            status: Novo status

        Returns:
            Mensagem atualizada
        """
        mensagem = await self.obter_mensagem_por_id_externo(id_externo)
        if not mensagem:
            return None

        return await self.atualizar_status_mensagem(mensagem.id_mensagem, status)

    async def _atualizar_metricas_conversa(
        self,
        id_conversa: uuid.UUID,
        entrada: bool,
    ):
        """Atualiza métricas da conversa após nova mensagem."""
        stmt = select(ConversaOmni).where(ConversaOmni.id_conversa == id_conversa)
        result = await self.db.execute(stmt)
        conversa = result.scalar_one_or_none()

        if conversa:
            conversa.nr_mensagens_total += 1
            if entrada:
                conversa.nr_mensagens_entrada += 1
            else:
                conversa.nr_mensagens_saida += 1
            conversa.dt_ultima_mensagem = datetime.utcnow()

            await self.db.commit()
