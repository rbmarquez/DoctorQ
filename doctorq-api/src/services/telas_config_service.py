"""
Service para Configuração de Visibilidade de Telas

Gerencia a visibilidade de telas por tipo de usuário.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.telas_config import (
    TelasConfig,
    TelaConfigCreate,
    TelaConfigBulkItem,
    TipoUsuarioTela,
)

logger = get_logger(__name__)


class TelasConfigService:
    """Service para operações de configuração de telas."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tipo(
        self,
        id_empresa: UUID,
        tp_tipo: TipoUsuarioTela,
    ) -> list[TelasConfig]:
        """
        Obtém todas as configurações de tela para um tipo de usuário.

        Args:
            id_empresa: ID da empresa
            tp_tipo: Tipo de usuário

        Returns:
            Lista de configurações de tela
        """
        stmt = select(TelasConfig).where(
            TelasConfig.id_empresa == id_empresa,
            TelasConfig.tp_tipo == tp_tipo.value,
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all(self, id_empresa: UUID) -> list[TelasConfig]:
        """
        Obtém todas as configurações de tela de uma empresa.

        Args:
            id_empresa: ID da empresa

        Returns:
            Lista de todas as configurações de tela
        """
        stmt = select(TelasConfig).where(
            TelasConfig.id_empresa == id_empresa,
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_tela(
        self,
        id_empresa: UUID,
        cd_tela: str,
        tp_tipo: Optional[TipoUsuarioTela] = None,
    ) -> list[TelasConfig]:
        """
        Obtém configurações de uma tela específica.

        Args:
            id_empresa: ID da empresa
            cd_tela: Código da tela
            tp_tipo: Tipo de usuário (opcional, se não informado retorna todos)

        Returns:
            Lista de configurações da tela
        """
        stmt = select(TelasConfig).where(
            TelasConfig.id_empresa == id_empresa,
            TelasConfig.cd_tela == cd_tela,
        )
        if tp_tipo:
            stmt = stmt.where(TelasConfig.tp_tipo == tp_tipo.value)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def is_tela_visivel(
        self,
        id_empresa: UUID,
        cd_tela: str,
        tp_tipo: TipoUsuarioTela,
    ) -> bool:
        """
        Verifica se uma tela está visível para um tipo de usuário.

        Lógica:
        - Se não existe registro, assume-se visível (true)
        - Se existe registro, retorna o valor de fg_visivel

        Args:
            id_empresa: ID da empresa
            cd_tela: Código da tela
            tp_tipo: Tipo de usuário

        Returns:
            True se a tela está visível, False caso contrário
        """
        stmt = select(TelasConfig).where(
            TelasConfig.id_empresa == id_empresa,
            TelasConfig.cd_tela == cd_tela,
            TelasConfig.tp_tipo == tp_tipo.value,
        )
        result = await self.db.execute(stmt)
        config = result.scalar_one_or_none()

        # Se não existe registro, assume-se visível
        if config is None:
            return True

        return config.fg_visivel

    async def set_visibilidade(
        self,
        id_empresa: UUID,
        cd_tela: str,
        tp_tipo: TipoUsuarioTela,
        fg_visivel: bool,
    ) -> TelasConfig:
        """
        Define a visibilidade de uma tela para um tipo de usuário.

        Se o registro não existe, cria um novo.
        Se existe, atualiza o valor.

        Args:
            id_empresa: ID da empresa
            cd_tela: Código da tela
            tp_tipo: Tipo de usuário
            fg_visivel: Se a tela está visível

        Returns:
            Configuração de tela atualizada/criada
        """
        # Buscar registro existente
        stmt = select(TelasConfig).where(
            TelasConfig.id_empresa == id_empresa,
            TelasConfig.cd_tela == cd_tela,
            TelasConfig.tp_tipo == tp_tipo.value,
        )
        result = await self.db.execute(stmt)
        config = result.scalar_one_or_none()

        if config:
            # Atualizar existente
            config.fg_visivel = fg_visivel
            logger.debug(
                f"Atualizando visibilidade: tela={cd_tela}, tipo={tp_tipo.value}, visivel={fg_visivel}"
            )
        else:
            # Criar novo
            config = TelasConfig(
                id_empresa=id_empresa,
                cd_tela=cd_tela,
                tp_tipo=tp_tipo.value,
                fg_visivel=fg_visivel,
            )
            self.db.add(config)
            logger.debug(
                f"Criando configuração: tela={cd_tela}, tipo={tp_tipo.value}, visivel={fg_visivel}"
            )

        await self.db.commit()
        await self.db.refresh(config)
        return config

    async def bulk_update(
        self,
        id_empresa: UUID,
        tp_tipo: TipoUsuarioTela,
        telas: list[TelaConfigBulkItem],
    ) -> list[TelasConfig]:
        """
        Atualiza múltiplas configurações de tela de uma vez.

        Args:
            id_empresa: ID da empresa
            tp_tipo: Tipo de usuário
            telas: Lista de telas com seus estados de visibilidade

        Returns:
            Lista de configurações atualizadas
        """
        updated_configs = []

        for tela in telas:
            config = await self.set_visibilidade(
                id_empresa=id_empresa,
                cd_tela=tela.cd_tela,
                tp_tipo=tp_tipo,
                fg_visivel=tela.fg_visivel,
            )
            updated_configs.append(config)

        logger.info(
            f"Bulk update: empresa={id_empresa}, tipo={tp_tipo.value}, "
            f"{len(updated_configs)} telas atualizadas"
        )

        return updated_configs

    async def delete_by_tela(
        self,
        id_empresa: UUID,
        cd_tela: str,
        tp_tipo: Optional[TipoUsuarioTela] = None,
    ) -> int:
        """
        Remove configurações de uma tela (volta ao padrão: visível).

        Args:
            id_empresa: ID da empresa
            cd_tela: Código da tela
            tp_tipo: Tipo de usuário (opcional, se não informado remove todos)

        Returns:
            Número de registros removidos
        """
        stmt = delete(TelasConfig).where(
            TelasConfig.id_empresa == id_empresa,
            TelasConfig.cd_tela == cd_tela,
        )
        if tp_tipo:
            stmt = stmt.where(TelasConfig.tp_tipo == tp_tipo.value)

        result = await self.db.execute(stmt)
        await self.db.commit()

        logger.info(
            f"Removidas {result.rowcount} configurações: tela={cd_tela}, tipo={tp_tipo}"
        )

        return result.rowcount

    async def reset_tipo(self, id_empresa: UUID, tp_tipo: TipoUsuarioTela) -> int:
        """
        Remove todas as configurações de um tipo (volta ao padrão: todas visíveis).

        Args:
            id_empresa: ID da empresa
            tp_tipo: Tipo de usuário

        Returns:
            Número de registros removidos
        """
        stmt = delete(TelasConfig).where(
            TelasConfig.id_empresa == id_empresa,
            TelasConfig.tp_tipo == tp_tipo.value,
        )
        result = await self.db.execute(stmt)
        await self.db.commit()

        logger.info(
            f"Reset configurações: empresa={id_empresa}, tipo={tp_tipo.value}, "
            f"{result.rowcount} removidos"
        )

        return result.rowcount
