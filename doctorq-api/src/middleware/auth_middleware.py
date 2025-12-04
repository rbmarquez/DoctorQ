"""
Middleware de autenticação e autorização
Fornece funções auxiliares para validação de usuários e roles
"""
from typing import List, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import ORMConfig
from src.models.user import User

logger = get_logger(__name__)


def get_current_user(request: Request) -> dict:
    """
    Função helper para obter dados do usuário autenticado via JWT.
    Lança exceção se não houver JWT validado.

    Returns:
        dict: JWT payload contendo 'sub' (email), 'uid' (id_user), 'role'
    """
    jwt_payload = getattr(request.state, "jwt_payload", None)
    if not jwt_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação JWT requerida",
        )
    return jwt_payload


def require_role(allowed_roles: List[str]):
    """
    Dependency factory que valida se o usuário tem um dos roles permitidos.

    Args:
        allowed_roles: Lista de roles permitidos (ex: ["admin", "gestor_clinica"])

    Returns:
        Callable: Dependency function que retorna User se autorizado

    Raises:
        HTTPException 401: Se não autenticado
        HTTPException 403: Se não possui role necessário

    Usage:
        @router.post("/endpoint/")
        async def endpoint(
            current_user: User = Depends(require_role(["admin", "gestor_clinica"]))
        ):
            pass
    """
    async def _check_role(
        request: Request,
        db: AsyncSession = Depends(ORMConfig.get_session)
    ) -> User:
        # Obter JWT payload
        jwt_payload = get_current_user(request)

        # Extrair user_id do payload
        user_id = jwt_payload.get("uid")
        if not user_id:
            logger.error("JWT payload não contém 'uid'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: user_id não encontrado"
            )

        # Buscar usuário no banco
        try:
            user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id

            stmt = select(User).where(
                User.id_user == user_uuid,
                User.st_ativo == "S"
            )
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                logger.warning(f"Usuário não encontrado ou inativo: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuário não encontrado ou inativo"
                )

            # Verificar role
            user_role = user.nm_papel  # Campo que armazena o role do usuário

            if user_role not in allowed_roles:
                logger.warning(
                    f"Acesso negado: user={user_id}, role={user_role}, "
                    f"allowed_roles={allowed_roles}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "Permissão negada",
                        "message": f"Role '{user_role}' não autorizado. Roles permitidos: {', '.join(allowed_roles)}",
                        "user_role": user_role,
                        "allowed_roles": allowed_roles
                    }
                )

            logger.debug(
                f"✅ Role válido: user={user_id}, role={user_role}, "
                f"endpoint requer: {allowed_roles}"
            )

            return user

        except ValueError as e:
            logger.error(f"Erro ao converter user_id para UUID: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id inválido"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erro ao validar role: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao validar autorização"
            )

    return _check_role


async def get_current_user_full(
    request: Request,
    db: AsyncSession = Depends(ORMConfig.get_session)
) -> User:
    """
    Dependency que retorna o objeto User completo do usuário autenticado.

    Returns:
        User: Objeto completo do usuário

    Raises:
        HTTPException 401: Se não autenticado
    """
    jwt_payload = get_current_user(request)

    user_id = jwt_payload.get("uid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: user_id não encontrado"
        )

    try:
        user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id

        stmt = select(User).where(
            User.id_user == user_uuid,
            User.st_ativo == "S"
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não encontrado ou inativo"
            )

        return user

    except ValueError as e:
        logger.error(f"Erro ao converter user_id para UUID: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id inválido"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar usuário: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar usuário"
        )
