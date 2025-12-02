"""
Service para gerenciamento de Favoritos (Vagas)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
import uuid

from src.models.favorito import TbFavoritos
from src.models.vaga import TbVagas
from src.schemas.favorito_schema import CriarFavoritoRequest


class FavoritoService:
    """Service para operações com favoritos"""

    @staticmethod
    async def adicionar_favorito(
        db: AsyncSession, id_user: str, data: CriarFavoritoRequest
    ) -> TbFavoritos:
        """
        Adiciona uma vaga aos favoritos do usuário

        Args:
            db: Sessão do banco
            id_user: ID do usuário
            data: Dados do favorito (id_vaga)

        Returns:
            Favorito criado

        Raises:
            ValueError: Se a vaga não existe ou já está favoritada
        """
        # Verificar se a vaga existe
        result = await db.execute(
            select(TbVagas).where(TbVagas.id_vaga == data.id_vaga)
        )
        vaga = result.scalar_one_or_none()

        if not vaga:
            raise ValueError("Vaga não encontrada")

        # Verificar se já está favoritado
        result = await db.execute(
            select(TbFavoritos).where(
                and_(
                    TbFavoritos.id_user == uuid.UUID(id_user),
                    TbFavoritos.id_vaga == data.id_vaga,
                )
            )
        )
        favorito_existente = result.scalar_one_or_none()

        if favorito_existente:
            raise ValueError("Vaga já está nos favoritos")

        # Criar favorito
        favorito = TbFavoritos(
            id_user=uuid.UUID(id_user),
            id_vaga=data.id_vaga,
            ds_tipo_item="vaga"
        )

        db.add(favorito)
        await db.commit()
        await db.refresh(favorito)

        return favorito

    @staticmethod
    async def remover_favorito(
        db: AsyncSession, id_user: str, id_vaga: str
    ) -> None:
        """
        Remove uma vaga dos favoritos do usuário

        Args:
            db: Sessão do banco
            id_user: ID do usuário
            id_vaga: ID da vaga

        Raises:
            ValueError: Se o favorito não existe
        """
        result = await db.execute(
            select(TbFavoritos).where(
                and_(
                    TbFavoritos.id_user == uuid.UUID(id_user),
                    TbFavoritos.id_vaga == uuid.UUID(id_vaga),
                )
            )
        )
        favorito = result.scalar_one_or_none()

        if not favorito:
            raise ValueError("Favorito não encontrado")

        await db.delete(favorito)
        await db.commit()

    @staticmethod
    async def verificar_favorito(
        db: AsyncSession, id_user: str, id_vaga: str
    ) -> bool:
        """
        Verifica se uma vaga está nos favoritos do usuário

        Args:
            db: Sessão do banco
            id_user: ID do usuário
            id_vaga: ID da vaga

        Returns:
            True se está favoritado, False caso contrário
        """
        result = await db.execute(
            select(TbFavoritos).where(
                and_(
                    TbFavoritos.id_user == uuid.UUID(id_user),
                    TbFavoritos.id_vaga == uuid.UUID(id_vaga),
                )
            )
        )
        favorito = result.scalar_one_or_none()

        return favorito is not None

    @staticmethod
    async def listar_favoritos(
        db: AsyncSession, id_user: str
    ) -> List[TbFavoritos]:
        """
        Lista todos os favoritos de um usuário

        Args:
            db: Sessão do banco
            id_user: ID do usuário

        Returns:
            Lista de favoritos com dados das vagas
        """
        result = await db.execute(
            select(TbFavoritos)
            .where(TbFavoritos.id_user == uuid.UUID(id_user))
            .order_by(TbFavoritos.dt_criacao.desc())
        )
        favoritos = result.scalars().all()

        return list(favoritos)
