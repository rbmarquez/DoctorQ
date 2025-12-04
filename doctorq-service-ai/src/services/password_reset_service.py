# src/services/password_reset_service.py

import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, Request
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.password_reset import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    PasswordResetToken,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ValidateResetTokenRequest,
    ValidateResetTokenResponse,
)
from src.models.user import User
from src.services.email_service import email_service
from src.utils.security import hash_password

logger = get_logger(__name__)


class PasswordResetService:
    """Serviço para recuperação de senha"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.token_expiry_hours = 1  # Token expira em 1 hora

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        """Busca usuário por email"""
        try:
            normalized_email = email.strip().lower()
            stmt = select(User).where(User.nm_email == normalized_email)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar usuário por email: {e}")
            return None

    async def _generate_token(self) -> str:
        """Gera token único seguro"""
        return secrets.token_urlsafe(32)

    async def _create_reset_token(
        self,
        user_id: uuid.UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> str:
        """Cria novo token de recuperação"""
        try:
            # Gerar token único
            token = await self._generate_token()

            # Calcular data de expiração
            expiration = datetime.utcnow() + timedelta(hours=self.token_expiry_hours)

            # Criar registro no banco
            reset_token = PasswordResetToken(
                id_user=user_id,
                ds_token=token,
                dt_expiration=expiration,
                st_used="N",
                ds_ip_address=ip_address,
                ds_user_agent=user_agent,
            )

            self.db.add(reset_token)
            await self.db.commit()
            await self.db.refresh(reset_token)

            logger.info(f"Token de reset criado para usuário {user_id}")
            return token

        except Exception as e:
            logger.error(f"Erro ao criar token de reset: {e}")
            await self.db.rollback()
            raise

    async def _invalidate_old_tokens(self, user_id: uuid.UUID) -> None:
        """Invalida tokens antigos do usuário"""
        try:
            stmt = (
                select(PasswordResetToken)
                .where(
                    and_(
                        PasswordResetToken.id_user == user_id,
                        PasswordResetToken.st_used == "N",
                    )
                )
            )
            result = await self.db.execute(stmt)
            old_tokens = result.scalars().all()

            for token in old_tokens:
                token.st_used = "S"
                token.dt_used = datetime.utcnow()

            await self.db.commit()
            logger.info(f"Tokens antigos invalidados para usuário {user_id}")

        except Exception as e:
            logger.error(f"Erro ao invalidar tokens antigos: {e}")
            await self.db.rollback()

    async def forgot_password(
        self, request_data: ForgotPasswordRequest, request: Optional[Request] = None
    ) -> ForgotPasswordResponse:
        """
        Processa solicitação de recuperação de senha

        Args:
            request_data: Dados da requisição
            request: Request do FastAPI para obter IP e User-Agent

        Returns:
            ForgotPasswordResponse

        Raises:
            HTTPException: Em caso de erro
        """
        try:
            # Buscar usuário
            user = await self._get_user_by_email(request_data.email)

            # Por segurança, sempre retornar sucesso mesmo se email não existir
            # Isso evita enumeration attacks
            if not user:
                logger.warning(
                    f"Tentativa de reset para email não cadastrado: {request_data.email}"
                )
                return ForgotPasswordResponse(
                    message="Se o email existir, você receberá um link de recuperação",
                    email=request_data.email,
                )

            # Verificar se usuário está ativo
            if user.st_ativo != "S":
                logger.warning(
                    f"Tentativa de reset para usuário inativo: {request_data.email}"
                )
                return ForgotPasswordResponse(
                    message="Se o email existir, você receberá um link de recuperação",
                    email=request_data.email,
                )

            # Invalidar tokens antigos
            await self._invalidate_old_tokens(user.id_user)

            # Obter informações da requisição
            ip_address = None
            user_agent = None
            if request:
                ip_address = request.client.host if request.client else None
                user_agent = request.headers.get("User-Agent")

            # Criar novo token
            token = await self._create_reset_token(
                user_id=user.id_user,
                ip_address=ip_address,
                user_agent=user_agent,
            )

            # Enviar email
            email_sent = email_service.send_password_reset_email(
                email=user.nm_email,
                token=token,
                user_name=user.nm_completo,
            )

            if not email_sent:
                logger.error(f"Falha ao enviar email para {user.nm_email}")
                raise HTTPException(
                    status_code=500,
                    detail="Erro ao enviar email. Tente novamente mais tarde.",
                )

            logger.info(f"Email de recuperação enviado para {user.nm_email}")

            return ForgotPasswordResponse(
                message="Email enviado com sucesso",
                email=request_data.email,
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erro ao processar forgot password: {e}")
            raise HTTPException(
                status_code=500,
                detail="Erro ao processar solicitação. Tente novamente.",
            )

    async def validate_reset_token(
        self, request_data: ValidateResetTokenRequest
    ) -> ValidateResetTokenResponse:
        """
        Valida se token de reset é válido

        Args:
            request_data: Dados da requisição

        Returns:
            ValidateResetTokenResponse
        """
        try:
            # Buscar token
            stmt = select(PasswordResetToken).where(
                PasswordResetToken.ds_token == request_data.token
            )
            result = await self.db.execute(stmt)
            reset_token = result.scalar_one_or_none()

            # Token não existe
            if not reset_token:
                return ValidateResetTokenResponse(valid=False, expires_at=None)

            # Token já foi usado
            if reset_token.st_used == "S":
                return ValidateResetTokenResponse(valid=False, expires_at=None)

            # Token expirado
            if datetime.utcnow() > reset_token.dt_expiration:
                return ValidateResetTokenResponse(valid=False, expires_at=None)

            # Token válido
            return ValidateResetTokenResponse(
                valid=True,
                expires_at=reset_token.dt_expiration,
            )

        except Exception as e:
            logger.error(f"Erro ao validar token: {e}")
            return ValidateResetTokenResponse(valid=False, expires_at=None)

    async def reset_password(
        self, request_data: ResetPasswordRequest
    ) -> ResetPasswordResponse:
        """
        Redefine senha do usuário

        Args:
            request_data: Dados da requisição

        Returns:
            ResetPasswordResponse

        Raises:
            HTTPException: Se token inválido ou erro ao resetar
        """
        try:
            # Buscar token
            stmt = select(PasswordResetToken).where(
                PasswordResetToken.ds_token == request_data.token
            )
            result = await self.db.execute(stmt)
            reset_token = result.scalar_one_or_none()

            # Validar token
            if not reset_token:
                raise HTTPException(
                    status_code=400,
                    detail="Token inválido ou expirado",
                )

            if reset_token.st_used == "S":
                raise HTTPException(
                    status_code=400,
                    detail="Este token já foi usado",
                )

            if datetime.utcnow() > reset_token.dt_expiration:
                raise HTTPException(
                    status_code=400,
                    detail="Token expirado",
                )

            # Buscar usuário
            stmt_user = select(User).where(User.id_user == reset_token.id_user)
            result_user = await self.db.execute(stmt_user)
            user = result_user.scalar_one_or_none()

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="Usuário não encontrado",
                )

            # Atualizar senha
            user.nm_password_hash = hash_password(request_data.password)

            # Marcar token como usado
            reset_token.st_used = "S"
            reset_token.dt_used = datetime.utcnow()

            await self.db.commit()

            logger.info(f"Senha redefinida para usuário {user.id_user}")

            # Enviar email de confirmação
            try:
                email_service.send_password_changed_notification(
                    email=user.nm_email,
                    user_name=user.nm_completo,
                )
            except Exception as e:
                logger.error(f"Erro ao enviar email de confirmação: {e}")
                # Não falhar se email de confirmação falhar

            return ResetPasswordResponse(
                message="Senha alterada com sucesso",
                user_id=str(user.id_user),
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erro ao resetar senha: {e}")
            await self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Erro ao resetar senha. Tente novamente.",
            )

    async def cleanup_expired_tokens(self) -> int:
        """
        Remove tokens expirados do banco de dados
        Pode ser executado por um cron job

        Returns:
            Número de tokens removidos
        """
        try:
            stmt = select(PasswordResetToken).where(
                PasswordResetToken.dt_expiration < datetime.utcnow()
            )
            result = await self.db.execute(stmt)
            expired_tokens = result.scalars().all()

            count = len(expired_tokens)
            for token in expired_tokens:
                await self.db.delete(token)

            await self.db.commit()

            logger.info(f"Removidos {count} tokens expirados")
            return count

        except Exception as e:
            logger.error(f"Erro ao limpar tokens expirados: {e}")
            await self.db.rollback()
            return 0
