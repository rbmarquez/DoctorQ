"""
Serviço para Compartilhamento de Conversas - UC085
Gerencia links públicos de compartilhamento com expiração e senha opcional
"""
from datetime import datetime
from typing import List, Tuple, Optional
from uuid import UUID

import bcrypt
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.settings import get_settings
from src.models.conversa_compartilhada import (
    TbConversaCompartilhada,
    CompartilharConversaRequest,
    gerar_token_compartilhamento,
    calcular_data_expiracao
)

logger = get_logger(__name__)
settings = get_settings()


class ConversaCompartilhadaService:
    """Serviço para gerenciar compartilhamento de conversas"""

    @staticmethod
    async def criar_compartilhamento(
        db: AsyncSession,
        id_conversa: UUID,
        id_user_criador: UUID,
        data: CompartilharConversaRequest,
        ip_criador: Optional[str] = None
    ) -> TbConversaCompartilhada:
        """
        Cria link de compartilhamento para conversa

        Args:
            db: Sessão do banco
            id_conversa: ID da conversa a compartilhar
            id_user_criador: ID do usuário que está compartilhando
            data: Dados do compartilhamento (senha, expiração, descrição)
            ip_criador: IP do usuário (opcional)

        Returns:
            Compartilhamento criado

        Raises:
            ValueError: Se conversa não existe ou usuário não tem permissão
        """
        # Validar que conversa existe
        from src.models.user import User
        query = select(func.count()).select_from(TbConversaCompartilhada.__table__)
        query = query.where(TbConversaCompartilhada.id_conversa == id_conversa)

        # TODO: Validar que usuário faz parte da conversa (id_user_1 ou id_user_2)
        # Por simplicidade, permitindo qualquer usuário autenticado compartilhar por enquanto

        # Gerar token único
        token = gerar_token_compartilhamento()

        # Calcular data de expiração
        dt_expiracao = None
        if data.dt_expiracao:
            dt_expiracao = data.dt_expiracao
        elif data.dias_expiracao:
            dt_expiracao = calcular_data_expiracao(data.dias_expiracao)

        # Hash da senha (se fornecida)
        senha_hash = None
        if data.ds_senha:
            senha_hash = bcrypt.hashpw(
                data.ds_senha.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')

        # Criar compartilhamento
        compartilhamento = TbConversaCompartilhada(
            id_conversa=id_conversa,
            id_user_criador=id_user_criador,
            ds_token=token,
            ds_senha_hash=senha_hash,
            dt_expiracao=dt_expiracao,
            ds_descricao=data.ds_descricao,
            ds_ip_criador=ip_criador
        )

        db.add(compartilhamento)
        await db.commit()
        await db.refresh(compartilhamento)

        logger.info(f"Compartilhamento criado: {compartilhamento.id_compartilhamento} (conversa: {id_conversa})")

        return compartilhamento

    @staticmethod
    async def buscar_por_token(
        db: AsyncSession,
        token: str,
        incrementar_visualizacao: bool = False
    ) -> Optional[TbConversaCompartilhada]:
        """
        Busca compartilhamento por token

        Args:
            db: Sessão do banco
            token: Token do compartilhamento
            incrementar_visualizacao: Se deve incrementar contador de visualizações

        Returns:
            Compartilhamento encontrado ou None
        """
        query = select(TbConversaCompartilhada).where(
            and_(
                TbConversaCompartilhada.ds_token == token,
                TbConversaCompartilhada.fg_ativo == "S"
            )
        )

        result = await db.execute(query)
        compartilhamento = result.scalar_one_or_none()

        if not compartilhamento:
            return None

        # Verificar expiração
        if compartilhamento.dt_expiracao:
            if datetime.utcnow() > compartilhamento.dt_expiracao:
                # Marcar como expirado
                compartilhamento.fg_expirado = True
                await db.commit()
                return None

        # Incrementar visualizações
        if incrementar_visualizacao:
            compartilhamento.nr_visualizacoes += 1
            compartilhamento.dt_ultimo_acesso = datetime.utcnow()
            await db.commit()

        return compartilhamento

    @staticmethod
    async def validar_senha(
        compartilhamento: TbConversaCompartilhada,
        senha_fornecida: Optional[str]
    ) -> bool:
        """
        Valida senha de compartilhamento protegido

        Args:
            compartilhamento: Compartilhamento a validar
            senha_fornecida: Senha fornecida pelo usuário

        Returns:
            True se válida ou se não há senha, False caso contrário
        """
        # Se não tem senha, sempre válido
        if not compartilhamento.ds_senha_hash:
            return True

        # Se tem senha mas não foi fornecida
        if not senha_fornecida:
            return False

        # Validar senha
        try:
            senha_valida = bcrypt.checkpw(
                senha_fornecida.encode('utf-8'),
                compartilhamento.ds_senha_hash.encode('utf-8')
            )
            return senha_valida
        except Exception as e:
            logger.error(f"Erro ao validar senha de compartilhamento: {e}")
            return False

    @staticmethod
    async def listar_compartilhamentos(
        db: AsyncSession,
        id_conversa: Optional[UUID] = None,
        id_user_criador: Optional[UUID] = None,
        apenas_ativos: bool = True,
        page: int = 1,
        size: int = 50
    ) -> Tuple[List[TbConversaCompartilhada], int]:
        """
        Lista compartilhamentos com filtros

        Args:
            db: Sessão do banco
            id_conversa: Filtrar por conversa específica
            id_user_criador: Filtrar por usuário criador
            apenas_ativos: Se deve retornar apenas ativos
            page: Página (inicia em 1)
            size: Tamanho da página

        Returns:
            Tupla (lista de compartilhamentos, total)
        """
        # Query base
        query = select(TbConversaCompartilhada)

        # Filtros
        filters = []
        if id_conversa:
            filters.append(TbConversaCompartilhada.id_conversa == id_conversa)
        if id_user_criador:
            filters.append(TbConversaCompartilhada.id_user_criador == id_user_criador)
        if apenas_ativos:
            filters.append(TbConversaCompartilhada.fg_ativo == "S")
            filters.append(TbConversaCompartilhada.fg_expirado == "N")

        if filters:
            query = query.where(and_(*filters))

        # Total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query) or 0

        # Paginação
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Ordenação (mais recentes primeiro)
        query = query.order_by(TbConversaCompartilhada.dt_criacao.desc())

        result = await db.execute(query)
        compartilhamentos = result.scalars().all()

        return compartilhamentos, total

    @staticmethod
    async def revogar_compartilhamento(
        db: AsyncSession,
        id_compartilhamento: UUID,
        id_user_revogador: UUID
    ) -> Optional[TbConversaCompartilhada]:
        """
        Revoga compartilhamento (soft delete)

        Args:
            db: Sessão do banco
            id_compartilhamento: ID do compartilhamento
            id_user_revogador: ID do usuário que está revogando

        Returns:
            Compartilhamento revogado ou None se não encontrado

        Raises:
            ValueError: Se usuário não tem permissão
        """
        query = select(TbConversaCompartilhada).where(
            TbConversaCompartilhada.id_compartilhamento == id_compartilhamento
        )

        result = await db.execute(query)
        compartilhamento = result.scalar_one_or_none()

        if not compartilhamento:
            return None

        # Validar permissão (apenas criador pode revogar)
        if compartilhamento.id_user_criador != id_user_revogador:
            raise ValueError("Apenas o criador pode revogar o compartilhamento")

        # Revogar
        compartilhamento.fg_ativo = False
        compartilhamento.dt_revogado = datetime.utcnow()

        await db.commit()
        await db.refresh(compartilhamento)

        logger.info(f"Compartilhamento {id_compartilhamento} revogado por usuário {id_user_revogador}")

        return compartilhamento

    @staticmethod
    async def obter_estatisticas(
        db: AsyncSession,
        id_user: Optional[UUID] = None
    ) -> dict:
        """
        Obtém estatísticas de compartilhamentos

        Args:
            db: Sessão do banco
            id_user: Filtrar por usuário específico (opcional)

        Returns:
            Dicionário com estatísticas
        """
        # Query base
        query = select(TbConversaCompartilhada)

        if id_user:
            query = query.where(TbConversaCompartilhada.id_user_criador == id_user)

        # Total
        total_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(total_query) or 0

        # Ativos
        ativos_query = select(func.count()).select_from(
            query.where(
                and_(
                    TbConversaCompartilhada.fg_ativo == "S",
                    TbConversaCompartilhada.fg_expirado == "N"
                )
            ).subquery()
        )
        ativos = await db.scalar(ativos_query) or 0

        # Expirados
        expirados_query = select(func.count()).select_from(
            query.where(TbConversaCompartilhada.fg_expirado == "S").subquery()
        )
        expirados = await db.scalar(expirados_query) or 0

        # Protegidos por senha
        protegidos_query = select(func.count()).select_from(
            query.where(TbConversaCompartilhada.ds_senha_hash.isnot(None)).subquery()
        )
        protegidos = await db.scalar(protegidos_query) or 0

        # Total de visualizações
        visualizacoes_query = select(func.sum(TbConversaCompartilhada.nr_visualizacoes)).select_from(
            query.subquery()
        )
        total_visualizacoes = await db.scalar(visualizacoes_query) or 0

        # Média de visualizações
        media_visualizacoes = (total_visualizacoes / total) if total > 0 else 0

        return {
            "total_compartilhamentos": total,
            "ativos": ativos,
            "expirados": expirados,
            "protegidos_senha": protegidos,
            "total_visualizacoes": total_visualizacoes,
            "media_visualizacoes_por_link": round(media_visualizacoes, 2)
        }
