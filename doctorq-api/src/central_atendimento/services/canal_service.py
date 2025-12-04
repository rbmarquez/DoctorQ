# src/central_atendimento/services/canal_service.py
"""
Serviço para gerenciamento de canais de comunicação.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.central_atendimento.models.canal import (
    Canal,
    CanalTipo,
    CanalStatus,
    CanalCreate,
    CanalUpdate,
    CanalResponse,
)

logger = get_logger(__name__)


class CanalService:
    """Serviço para operações CRUD de canais."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    async def criar(self, dados: CanalCreate) -> Canal:
        """
        Cria um novo canal.

        Args:
            dados: Dados do canal

        Returns:
            Canal criado
        """
        canal = Canal(
            id_empresa=self.id_empresa,
            nm_canal=dados.nm_canal,
            tp_canal=dados.tp_canal,
            ds_descricao=dados.ds_descricao,
            ds_credenciais=dados.ds_credenciais or {},
            ds_configuracoes=dados.ds_configuracoes or {},
            id_telefone_whatsapp=dados.id_telefone_whatsapp,
            id_facebook_page=dados.id_facebook_page,
            id_instagram=dados.id_instagram,
            nm_email=dados.nm_email,
            st_canal=CanalStatus.CONFIGURANDO,
        )

        self.db.add(canal)
        await self.db.commit()
        await self.db.refresh(canal)

        logger.info(f"Canal criado: {canal.id_canal} - {canal.nm_canal}")
        return canal

    async def obter(self, id_canal: uuid.UUID) -> Optional[Canal]:
        """
        Obtém um canal pelo ID.

        Args:
            id_canal: ID do canal

        Returns:
            Canal ou None
        """
        stmt = select(Canal).where(
            Canal.id_canal == id_canal,
            Canal.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def listar(
        self,
        tp_canal: Optional[CanalTipo] = None,
        st_canal: Optional[CanalStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Canal], int]:
        """
        Lista canais da empresa.

        Args:
            tp_canal: Filtrar por tipo
            st_canal: Filtrar por status
            page: Página
            page_size: Itens por página

        Returns:
            Tuple (lista de canais, total)
        """
        stmt = select(Canal).where(Canal.id_empresa == self.id_empresa)

        if tp_canal:
            stmt = stmt.where(Canal.tp_canal == tp_canal)
        if st_canal:
            stmt = stmt.where(Canal.st_canal == st_canal)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.execute(count_stmt)
        total_count = total.scalar()

        # Aplicar paginação
        stmt = stmt.order_by(Canal.dt_criacao.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        canais = result.scalars().all()

        return list(canais), total_count

    async def atualizar(
        self,
        id_canal: uuid.UUID,
        dados: CanalUpdate,
    ) -> Optional[Canal]:
        """
        Atualiza um canal.

        Args:
            id_canal: ID do canal
            dados: Dados para atualizar

        Returns:
            Canal atualizado ou None
        """
        canal = await self.obter(id_canal)
        if not canal:
            return None

        update_data = dados.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(canal, key, value)

        await self.db.commit()
        await self.db.refresh(canal)

        logger.info(f"Canal atualizado: {canal.id_canal}")
        return canal

    async def deletar(self, id_canal: uuid.UUID) -> bool:
        """
        Deleta um canal.

        Args:
            id_canal: ID do canal

        Returns:
            True se deletado
        """
        canal = await self.obter(id_canal)
        if not canal:
            return False

        await self.db.delete(canal)
        await self.db.commit()

        logger.info(f"Canal deletado: {id_canal}")
        return True

    async def ativar(self, id_canal: uuid.UUID) -> Optional[Canal]:
        """Ativa um canal."""
        return await self.atualizar(
            id_canal,
            CanalUpdate(st_canal=CanalStatus.ATIVO),
        )

    async def desativar(self, id_canal: uuid.UUID) -> Optional[Canal]:
        """Desativa um canal."""
        return await self.atualizar(
            id_canal,
            CanalUpdate(st_canal=CanalStatus.INATIVO),
        )

    async def obter_canal_ativo(self, tp_canal: CanalTipo) -> Optional[Canal]:
        """
        Obtém o primeiro canal ativo de um tipo.

        Args:
            tp_canal: Tipo do canal

        Returns:
            Canal ativo ou None
        """
        stmt = select(Canal).where(
            Canal.id_empresa == self.id_empresa,
            Canal.tp_canal == tp_canal,
            Canal.st_canal == CanalStatus.ATIVO,
        ).order_by(Canal.dt_criacao)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def validar_credenciais(self, id_canal: uuid.UUID) -> Dict[str, Any]:
        """
        Valida as credenciais de um canal.

        Args:
            id_canal: ID do canal

        Returns:
            Resultado da validação
        """
        canal = await self.obter(id_canal)
        if not canal:
            return {"valid": False, "error": "Canal não encontrado"}

        # Implementar validação específica por tipo de canal
        if canal.tp_canal == CanalTipo.WHATSAPP:
            return await self._validar_whatsapp(canal)
        elif canal.tp_canal == CanalTipo.EMAIL:
            return await self._validar_email(canal)
        # Adicionar outros tipos...

        return {"valid": True, "message": "Validação não implementada para este tipo"}

    async def _validar_whatsapp(self, canal: Canal) -> Dict[str, Any]:
        """Valida credenciais do WhatsApp."""
        from src.central_atendimento.services.whatsapp_service import WhatsAppService

        try:
            whatsapp = WhatsAppService(
                db=self.db,
                id_empresa=self.id_empresa,
            )
            perfil = await whatsapp.obter_perfil_negocio()

            # Atualizar status para ativo
            canal.st_canal = CanalStatus.ATIVO
            await self.db.commit()

            return {"valid": True, "profile": perfil}
        except Exception as e:
            # Atualizar status para erro
            canal.st_canal = CanalStatus.ERRO
            await self.db.commit()

            return {"valid": False, "error": str(e)}

    async def _validar_email(self, canal: Canal) -> Dict[str, Any]:
        """Valida credenciais de email (SMTP)."""
        import smtplib

        try:
            credenciais = canal.ds_credenciais or {}
            host = credenciais.get("smtp_host", "")
            port = credenciais.get("smtp_port", 587)

            if not host:
                return {"valid": False, "error": "SMTP host não configurado"}

            with smtplib.SMTP(host, port, timeout=10) as server:
                server.starttls()
                if credenciais.get("username") and credenciais.get("password"):
                    server.login(credenciais["username"], credenciais["password"])

            canal.st_canal = CanalStatus.ATIVO
            await self.db.commit()

            return {"valid": True}
        except Exception as e:
            canal.st_canal = CanalStatus.ERRO
            await self.db.commit()

            return {"valid": False, "error": str(e)}
