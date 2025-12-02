# src/middleware/permission_middleware.py
"""
Middleware de controle de permissões detalhadas (Nível 2).

Este middleware implementa o segundo nível do sistema de permissões hierárquico,
verificando se o usuário tem permissões específicas (visualizar, criar, editar, excluir)
para realizar ações em recursos dentro de seu grupo de acesso.

Uso:
    @router.post("/agendamentos/")
    @require_permission(grupo="clinica", recurso="agendamentos", acao="criar")
    async def criar_agendamento(...):
        pass
"""

import uuid
import inspect
from functools import wraps
from typing import Callable, Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.perfil import Perfil
from src.models.user import User

logger = get_logger(__name__)


class PermissionChecker:
    """Classe auxiliar para verificação de permissões."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_user_permission(
        self,
        user_id: uuid.UUID,
        grupo: str,
        recurso: str,
        acao: str
    ) -> tuple[bool, str]:
        """
        Verifica se usuário tem permissão para executar ação em recurso.

        Args:
            user_id: UUID do usuário
            grupo: Grupo de acesso (admin, clinica, profissional, paciente, fornecedor)
            recurso: Recurso a ser acessado (agendamentos, pacientes, etc.)
            acao: Ação a ser realizada (visualizar, criar, editar, excluir)

        Returns:
            tuple[bool, str]: (tem_permissao, mensagem_erro)
        """
        try:
            # 1. Buscar usuário e seu perfil
            stmt = select(User).where(
                User.id_user == user_id,
                User.st_ativo == "S"
            )
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                return False, "Usuário não encontrado ou inativo"

            if not user.id_perfil:
                return False, "Usuário sem perfil atribuído"

            # 2. Buscar perfil com permissões
            stmt = select(Perfil).where(
                Perfil.id_perfil == user.id_perfil,
                Perfil.st_ativo == "S"
            )
            result = await self.db.execute(stmt)
            perfil = result.scalar_one_or_none()

            if not perfil:
                return False, "Perfil não encontrado ou inativo"

            # 3. Verificar se perfil tem acesso ao grupo (Nível 1)
            if not perfil.ds_grupos_acesso or grupo not in perfil.ds_grupos_acesso:
                return False, f"Perfil não tem acesso ao grupo '{grupo}'"

            # 4. Verificar permissão detalhada (Nível 2)
            if not perfil.ds_permissoes_detalhadas:
                return False, "Perfil sem permissões detalhadas configuradas"

            # Navegar na estrutura: {grupo: {recurso: {acao: bool}}}
            grupo_permissions = perfil.ds_permissoes_detalhadas.get(grupo, {})
            if not grupo_permissions:
                return False, f"Sem permissões configuradas para grupo '{grupo}'"

            recurso_permissions = grupo_permissions.get(recurso, {})
            if not recurso_permissions:
                return False, f"Sem permissões configuradas para recurso '{recurso}'"

            tem_permissao = recurso_permissions.get(acao, False)

            if not tem_permissao:
                return False, f"Sem permissão para '{acao}' em '{recurso}'"

            logger.debug(
                f"✅ Permissão concedida: user={user_id}, "
                f"perfil={perfil.nm_perfil}, grupo={grupo}, "
                f"recurso={recurso}, acao={acao}"
            )

            return True, ""

        except Exception as e:
            logger.error(f"Erro ao verificar permissão: {str(e)}", exc_info=True)
            return False, f"Erro ao verificar permissão: {str(e)}"


def require_permission(
    grupo: str,
    recurso: str,
    acao: str,
    allow_admin_bypass: bool = True
):
    """
    Decorator para verificar permissões detalhadas antes de executar endpoint.

    Args:
        grupo: Grupo de acesso necessário (admin, clinica, profissional, paciente, fornecedor)
        recurso: Recurso a ser acessado (agendamentos, pacientes, procedimentos, etc.)
        acao: Ação a ser realizada (visualizar, criar, editar, excluir)
        allow_admin_bypass: Se True, usuários com grupo 'admin' podem acessar sem verificar permissões detalhadas

    Usage:
        @router.post("/agendamentos/")
        @require_permission(grupo="clinica", recurso="agendamentos", acao="criar")
        async def criar_agendamento(
            data: AgendamentoCreate,
            db: AsyncSession = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            # Código do endpoint...
            pass

    Raises:
        HTTPException 401: Usuário não autenticado
        HTTPException 403: Sem permissão para realizar a ação
        HTTPException 500: Erro ao verificar permissão
    """

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 🔧 FIX: Extrair dependências dos kwargs E args usando inspect
            # Obter assinatura da função original para mapear parâmetros
            sig = inspect.signature(func)
            bound_args = sig.bind_partial(*args, **kwargs)
            bound_args.apply_defaults()

            # Extrair dependências injetadas pelo FastAPI
            request: Optional[Request] = bound_args.arguments.get("request") or kwargs.get("request")
            db: Optional[AsyncSession] = bound_args.arguments.get("db") or kwargs.get("db")
            current_user: Optional[User] = bound_args.arguments.get("current_user") or kwargs.get("current_user")

            # Validar dependências obrigatórias
            if not current_user:
                logger.error(f"❌ Decorator @require_permission: current_user não encontrado. Args: {len(args)}, Kwargs: {list(kwargs.keys())}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuário não autenticado. Endpoint deve ter dependência get_current_user."
                )

            if not db:
                logger.error("❌ Decorator @require_permission: db não encontrado")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Erro de configuração: sessão de banco não encontrada"
                )

            # Bypass para administradores (se habilitado)
            if allow_admin_bypass and current_user.nm_papel == "admin":
                logger.debug(f"✅ Admin bypass: user={current_user.id_user}, papel={current_user.nm_papel}")
                return await func(*args, **kwargs)

            # Verificar permissão
            checker = PermissionChecker(db)
            tem_permissao, mensagem_erro = await checker.check_user_permission(
                user_id=current_user.id_user,
                grupo=grupo,
                recurso=recurso,
                acao=acao
            )

            if not tem_permissao:
                logger.warning(
                    f"❌ Permissão negada: user={current_user.id_user}, "
                    f"grupo={grupo}, recurso={recurso}, acao={acao} | "
                    f"Razão: {mensagem_erro}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "Permissão negada",
                        "message": mensagem_erro,
                        "required_permission": {
                            "grupo": grupo,
                            "recurso": recurso,
                            "acao": acao
                        }
                    }
                )

            # Permissão concedida, executar endpoint
            return await func(*args, **kwargs)

        return wrapper

    return decorator


# Funções auxiliares para uso direto (sem decorator)

async def check_permission(
    db: AsyncSession,
    user_id: uuid.UUID,
    grupo: str,
    recurso: str,
    acao: str
) -> bool:
    """
    Verifica permissão sem usar decorator (para uso em lógica de negócio).

    Args:
        db: Sessão do banco de dados
        user_id: UUID do usuário
        grupo: Grupo de acesso
        recurso: Recurso a ser acessado
        acao: Ação a ser realizada

    Returns:
        bool: True se tem permissão, False caso contrário
    """
    checker = PermissionChecker(db)
    tem_permissao, _ = await checker.check_user_permission(user_id, grupo, recurso, acao)
    return tem_permissao


async def get_user_permissions(
    db: AsyncSession,
    user_id: uuid.UUID
) -> dict:
    """
    Retorna todas as permissões do usuário.

    Args:
        db: Sessão do banco de dados
        user_id: UUID do usuário

    Returns:
        dict: {
            "grupos_acesso": ["admin", "clinica"],
            "permissoes_detalhadas": {...}
        }
    """
    try:
        # Buscar usuário e perfil
        stmt = select(User).where(User.id_user == user_id, User.st_ativo == "S")
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.id_perfil:
            return {"grupos_acesso": [], "permissoes_detalhadas": {}}

        stmt = select(Perfil).where(Perfil.id_perfil == user.id_perfil, Perfil.st_ativo == "S")
        result = await db.execute(stmt)
        perfil = result.scalar_one_or_none()

        if not perfil:
            return {"grupos_acesso": [], "permissoes_detalhadas": {}}

        return {
            "grupos_acesso": perfil.ds_grupos_acesso or [],
            "permissoes_detalhadas": perfil.ds_permissoes_detalhadas or {}
        }

    except Exception as e:
        logger.error(f"Erro ao buscar permissões do usuário: {str(e)}")
        return {"grupos_acesso": [], "permissoes_detalhadas": {}}
