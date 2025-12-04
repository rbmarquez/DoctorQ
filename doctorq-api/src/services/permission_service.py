# src/services/permission_service.py
"""
Serviço para verificação de permissões em dois níveis:
- Nível 1 (Grupos): Verifica se o usuário tem acesso a um grupo (/admin, /clinica, etc)
- Nível 2 (Funcionalidades): Verifica se o usuário tem permissão para ações específicas

Autor: Claude
Data: 2025-11-05
"""

import uuid
from typing import List, Optional

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.perfil import Perfil
from src.models.user import User

logger = get_logger(__name__)


class PermissionService:
    """Serviço para verificação de permissões de usuários"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_permissions(self, user_id: uuid.UUID) -> Optional[dict]:
        """
        Retorna as permissões completas de um usuário

        Args:
            user_id: ID do usuário

        Returns:
            Dict com:
            - grupos_acesso: List[str] - Grupos que o usuário pode acessar
            - permissoes_detalhadas: Dict - Permissões por grupo/recurso/ação
            - is_admin: bool - Se o usuário é administrador total
        """
        try:
            # Buscar usuário com perfil
            stmt = select(User).where(User.id_user == user_id)
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user or not user.id_perfil:
                logger.warning(f"Usuário {user_id} não encontrado ou sem perfil")
                return None

            # Buscar perfil do usuário
            stmt = select(Perfil).where(Perfil.id_perfil == user.id_perfil)
            result = await self.db.execute(stmt)
            perfil = result.scalar_one_or_none()

            if not perfil:
                logger.warning(f"Perfil {user.id_perfil} não encontrado")
                return None

            # Retornar permissões
            grupos_acesso = perfil.ds_grupos_acesso or []
            permissoes = perfil.ds_permissoes_detalhadas or {}

            # Verificar se é admin total
            is_admin = "admin" in grupos_acesso and permissoes.get("admin", {}).get(
                "dashboard", {}
            ).get("visualizar", False)

            return {
                "grupos_acesso": grupos_acesso,
                "permissoes_detalhadas": permissoes,
                "is_admin": is_admin,
                "nm_perfil": perfil.nm_perfil,
                "id_perfil": perfil.id_perfil,
            }

        except Exception as e:
            logger.error(f"Erro ao buscar permissões do usuário {user_id}: {str(e)}")
            return None

    async def check_group_access(self, user_id: uuid.UUID, grupo: str) -> bool:
        """
        Verifica se um usuário tem acesso a um grupo específico (Nível 1)

        Args:
            user_id: ID do usuário
            grupo: Nome do grupo (admin, clinica, profissional, paciente, fornecedor)

        Returns:
            True se o usuário tem acesso ao grupo, False caso contrário
        """
        try:
            permissions = await self.get_user_permissions(user_id)
            if not permissions:
                return False

            return grupo in permissions["grupos_acesso"]

        except Exception as e:
            logger.error(
                f"Erro ao verificar acesso ao grupo {grupo} para usuário {user_id}: {str(e)}"
            )
            return False

    async def check_feature_permission(
        self, user_id: uuid.UUID, grupo: str, recurso: str, acao: str
    ) -> bool:
        """
        Verifica se um usuário tem permissão para uma ação específica (Nível 2)

        Args:
            user_id: ID do usuário
            grupo: Nome do grupo (admin, clinica, profissional, etc)
            recurso: Nome do recurso (usuarios, agenda, pacientes, etc)
            acao: Nome da ação (criar, editar, excluir, visualizar)

        Returns:
            True se o usuário tem a permissão, False caso contrário

        Example:
            >>> await check_feature_permission(user_id, "clinica", "agenda", "criar")
            True
        """
        try:
            permissions = await self.get_user_permissions(user_id)
            if not permissions:
                return False

            # Verificar se tem acesso ao grupo primeiro
            if grupo not in permissions["grupos_acesso"]:
                return False

            # Verificar permissão específica
            permissoes_detalhadas = permissions["permissoes_detalhadas"]
            recurso_permissoes = (
                permissoes_detalhadas.get(grupo, {}).get(recurso, {})
            )

            return recurso_permissoes.get(acao, False)

        except Exception as e:
            logger.error(
                f"Erro ao verificar permissão {grupo}/{recurso}/{acao} para usuário {user_id}: {str(e)}"
            )
            return False

    async def get_user_groups(self, user_id: uuid.UUID) -> List[str]:
        """
        Retorna a lista de grupos que o usuário pode acessar

        Args:
            user_id: ID do usuário

        Returns:
            Lista de strings com os grupos (ex: ["admin", "clinica"])
        """
        try:
            permissions = await self.get_user_permissions(user_id)
            if not permissions:
                return []

            return permissions["grupos_acesso"]

        except Exception as e:
            logger.error(f"Erro ao buscar grupos do usuário {user_id}: {str(e)}")
            return []

    async def get_group_resources(
        self, user_id: uuid.UUID, grupo: str
    ) -> List[str]:
        """
        Retorna a lista de recursos que o usuário pode acessar em um grupo específico

        Args:
            user_id: ID do usuário
            grupo: Nome do grupo

        Returns:
            Lista de strings com os recursos (ex: ["agenda", "pacientes", "procedimentos"])
        """
        try:
            permissions = await self.get_user_permissions(user_id)
            if not permissions:
                return []

            # Verificar se tem acesso ao grupo
            if grupo not in permissions["grupos_acesso"]:
                return []

            # Retornar recursos do grupo
            permissoes_grupo = permissions["permissoes_detalhadas"].get(grupo, {})
            return list(permissoes_grupo.keys())

        except Exception as e:
            logger.error(
                f"Erro ao buscar recursos do grupo {grupo} para usuário {user_id}: {str(e)}"
            )
            return []

    async def get_resource_actions(
        self, user_id: uuid.UUID, grupo: str, recurso: str
    ) -> List[str]:
        """
        Retorna a lista de ações que o usuário pode executar em um recurso específico

        Args:
            user_id: ID do usuário
            grupo: Nome do grupo
            recurso: Nome do recurso

        Returns:
            Lista de ações permitidas (ex: ["criar", "editar", "visualizar"])
        """
        try:
            permissions = await self.get_user_permissions(user_id)
            if not permissions:
                return []

            # Verificar se tem acesso ao grupo
            if grupo not in permissions["grupos_acesso"]:
                return []

            # Buscar permissões do recurso
            recurso_permissoes = (
                permissions["permissoes_detalhadas"]
                .get(grupo, {})
                .get(recurso, {})
            )

            # Retornar apenas as ações com valor True
            return [
                acao for acao, permitido in recurso_permissoes.items() if permitido
            ]

        except Exception as e:
            logger.error(
                f"Erro ao buscar ações do recurso {grupo}/{recurso} para usuário {user_id}: {str(e)}"
            )
            return []

    async def is_admin(self, user_id: uuid.UUID) -> bool:
        """
        Verifica se o usuário é administrador total do sistema

        Args:
            user_id: ID do usuário

        Returns:
            True se é admin, False caso contrário
        """
        try:
            permissions = await self.get_user_permissions(user_id)
            if not permissions:
                return False

            return permissions.get("is_admin", False)

        except Exception as e:
            logger.error(f"Erro ao verificar se usuário {user_id} é admin: {str(e)}")
            return False


# Dependency para injeção no FastAPI
def get_permission_service(db: AsyncSession = Depends(get_db)) -> PermissionService:
    """FastAPI dependency para obter o PermissionService"""
    return PermissionService(db)
