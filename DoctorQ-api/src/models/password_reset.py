# src/models/password_reset.py

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import CHAR, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


class PasswordResetToken(Base):
    """Modelo para a tabela tb_password_reset_tokens"""

    __tablename__ = "tb_password_reset_tokens"

    id_token = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_token",
    )
    id_user = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_users.id_user", ondelete="CASCADE"),
        nullable=False,
        name="id_user",
    )
    ds_token = Column(String(255), nullable=False, unique=True, name="ds_token")
    dt_expiration = Column(DateTime, nullable=False, name="dt_expiration")
    st_used = Column(
        CHAR(1),
        nullable=False,
        default="N",
        name="st_used",
    )
    dt_created = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        name="dt_created",
    )
    dt_used = Column(DateTime, nullable=True, name="dt_used")
    ds_ip_address = Column(String(45), nullable=True, name="ds_ip_address")
    ds_user_agent = Column(Text, nullable=True, name="ds_user_agent")

    # Relacionamento
    user = relationship("User", back_populates="password_reset_tokens")


# ========== Pydantic Schemas ==========


class ForgotPasswordRequest(BaseModel):
    """Schema para solicitar recuperação de senha"""

    email: str = Field(..., description="Email do usuário")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Valida formato de email"""
        if not v or "@" not in v:
            raise ValueError("Email inválido")
        return v.strip().lower()


class ForgotPasswordResponse(BaseModel):
    """Schema de resposta para recuperação de senha"""

    message: str = Field(..., description="Mensagem de confirmação")
    email: str = Field(..., description="Email para onde foi enviado")


class ValidateResetTokenRequest(BaseModel):
    """Schema para validar token de reset"""

    token: str = Field(..., description="Token de recuperação")

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        """Valida formato do token"""
        if not v or len(v) < 32:
            raise ValueError("Token inválido")
        return v.strip()


class ValidateResetTokenResponse(BaseModel):
    """Schema de resposta para validação de token"""

    valid: bool = Field(..., description="Se o token é válido")
    expires_at: Optional[datetime] = Field(None, description="Data de expiração")


class ResetPasswordRequest(BaseModel):
    """Schema para redefinir senha"""

    token: str = Field(..., description="Token de recuperação")
    password: str = Field(..., min_length=8, description="Nova senha")
    password_confirmation: str = Field(..., description="Confirmação da senha")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Valida força da senha"""
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres")

        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)

        if not (has_upper and has_lower and has_digit):
            raise ValueError(
                "A senha deve conter letras maiúsculas, minúsculas e números"
            )

        return v

    @field_validator("password_confirmation")
    @classmethod
    def validate_confirmation(cls, v: str, info) -> str:
        """Valida se as senhas coincidem"""
        password = info.data.get("password")
        if password and v != password:
            raise ValueError("As senhas não coincidem")
        return v


class ResetPasswordResponse(BaseModel):
    """Schema de resposta para reset de senha"""

    message: str = Field(..., description="Mensagem de confirmação")
    user_id: str = Field(..., description="ID do usuário")


# ========== Database Models ==========


class PasswordResetTokenDB(BaseModel):
    """Schema de banco de dados para PasswordResetToken"""

    id_token: uuid.UUID
    id_user: uuid.UUID
    ds_token: str
    dt_expiration: datetime
    st_used: str
    dt_created: datetime
    dt_used: Optional[datetime] = None
    ds_ip_address: Optional[str] = None
    ds_user_agent: Optional[str] = None

    class Config:
        from_attributes = True
