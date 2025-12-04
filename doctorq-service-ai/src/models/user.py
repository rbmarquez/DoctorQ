# src/models/user.py

import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import CHAR, Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text

from src.models.base import Base


class PapelUsuario(str, Enum):
    """Enum para papeis de usuario"""

    ADMIN = "admin"
    USUARIO = "usuario"
    USER = "user"  # Alias para usuario (compatibilidade)
    ANALISTA = "analista"
    GESTOR_CLINICA = "gestor_clinica"
    PROFISSIONAL = "profissional"
    FORNECEDOR = "fornecedor"
    PARCEIRO = "parceiro"
    RECEPCIONISTA = "recepcionista"
    SECRETARIA = "secretaria"
    FINANCEIRO = "financeiro"
    AUXILIAR = "auxiliar"
    PACIENTE = "paciente"


def _parse_role(value: Any, *, allow_none: bool) -> Optional[PapelUsuario]:
    """Normaliza valores enviados para o papel do usuario."""

    if value is None or (isinstance(value, str) and not value.strip()):
        return None if allow_none else PapelUsuario.USUARIO

    if isinstance(value, PapelUsuario):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower()

        # Compatibilidade com valores legados (ex: "user")
        if normalized == "user":
            normalized = PapelUsuario.USUARIO.value

        try:
            return PapelUsuario(normalized)
        except ValueError as exc:
            raise ValueError("nm_papel invalido") from exc

    raise ValueError("nm_papel invalido")


class User(Base):
    """Modelo para a tabela tb_users"""

    __tablename__ = "tb_users"

    id_user = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        name="id_user",
    )
    nm_microsoft_id = Column(
        String(255), nullable=True, unique=True, name="nm_microsoft_id"
    )
    nm_email = Column(String(255), nullable=False, unique=True, name="nm_email")
    nm_completo = Column(String(255), nullable=False, name="nm_completo")
    nm_papel = Column(
        String(20), nullable=False, server_default=text("'usuario'"), name="nm_papel"
    )
    st_ativo = Column(
        CHAR(1), nullable=False, server_default=text("'S'"), name="st_ativo"
    )
    nm_password_hash = Column(
        String(255), nullable=True, name="ds_senha_hash"
    )
    dt_ultimo_login = Column(DateTime, nullable=True, name="dt_ultimo_login")
    nr_total_logins = Column(
        String(10), nullable=False, server_default=text("'0'"), name="nr_total_logins"
    )
    dt_criacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        name="dt_criacao",
    )
    dt_atualizacao = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
        name="dt_atualizacao",
    )

    # Novos campos para empresa e perfil
    id_empresa = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_empresas.id_empresa", ondelete="SET NULL"),
        nullable=True,
        name="id_empresa",
    )
    id_perfil = Column(
        UUID(as_uuid=True),
        ForeignKey("tb_perfis.id_perfil", ondelete="SET NULL"),
        nullable=True,
        name="id_perfil",
    )
    nm_cargo = Column(String(100), nullable=True, name="nm_cargo")
    nr_telefone = Column(String(20), nullable=True, name="nr_telefone")
    ds_foto_url = Column(String(500), nullable=True, name="ds_foto_url")
    ds_preferencias = Column(
        JSONB, nullable=True, server_default=text("'{}'::jsonb"), name="ds_preferencias"
    )

    # Relacionamentos (lazy import para evitar circular imports)
    empresa = relationship("Empresa", back_populates="usuarios", lazy="select")
    perfil = relationship("Perfil", back_populates="usuarios", lazy="select")
    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
        lazy="select",
        cascade="all, delete-orphan",
    )

    # Relacionamentos do Sistema de Carreiras
    curriculo = relationship("TbCurriculos", back_populates="usuario", uselist=False, lazy="select")
    vagas_criadas = relationship("TbVagas", back_populates="criador", foreign_keys="TbVagas.id_criador", lazy="select")
    candidaturas = relationship("TbCandidaturas", back_populates="candidato", foreign_keys="TbCandidaturas.id_candidato", lazy="select")

    def __repr__(self) -> str:
        return (
            f"<User(id_user={self.id_user}, nm_email='{self.nm_email}', "
            f"nm_papel='{self.nm_papel}')>"
        )


# Pydantic Models para API
class UserBase(BaseModel):
    """Schema base para User"""

    nm_email: EmailStr = Field(..., description="Email do usuario")
    nm_completo: str = Field(..., description="Nome completo")
    nm_papel: Optional[PapelUsuario] = Field(
        PapelUsuario.USUARIO, description="Papel do usuario"
    )
    st_ativo: Optional[Literal["S", "N"]] = Field(
        "S", description="Status ativo: 'S' ou 'N'"
    )

    @field_validator("nm_papel", mode="before")
    @classmethod
    def normalize_role(cls, value: Any) -> PapelUsuario:
        role = _parse_role(value, allow_none=False)
        assert role is not None
        return role


class UserCreate(UserBase):
    """Schema para criar um User"""

    nm_email: EmailStr = Field(..., description="Email do usuario")
    nm_completo: str = Field(..., description="Nome completo")


class UserUpdate(BaseModel):
    """Schema para atualizar um User"""

    id_user: uuid.UUID = Field(..., description="ID unico do usuario")
    nm_completo: Optional[str] = Field(None, description="Nome completo")
    nm_papel: Optional[PapelUsuario] = Field(None, description="Papel do usuario")
    st_ativo: Optional[Literal["S", "N"]] = Field(None, description="Status ativo")

    @field_validator("nm_papel", mode="before")
    @classmethod
    def normalize_optional_role(cls, value: Any) -> Optional[PapelUsuario]:
        return _parse_role(value, allow_none=True)


class UserChangePassword(BaseModel):
    """Schema para mudança de senha do usuário"""

    senha_atual: str = Field(..., min_length=1, description="Senha atual do usuário")
    senha_nova: str = Field(..., min_length=8, description="Nova senha (mínimo 8 caracteres)")
    senha_nova_confirmacao: str = Field(..., description="Confirmação da nova senha")

    @field_validator("senha_nova")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        """Valida força da senha"""
        if len(value) < 8:
            raise ValueError("Senha deve ter no mínimo 8 caracteres")

        # Verificar se tem pelo menos um número
        if not any(char.isdigit() for char in value):
            raise ValueError("Senha deve conter pelo menos um número")

        # Verificar se tem pelo menos uma letra
        if not any(char.isalpha() for char in value):
            raise ValueError("Senha deve conter pelo menos uma letra")

        return value

    @field_validator("senha_nova_confirmacao")
    @classmethod
    def passwords_match(cls, value: str, info) -> str:
        """Valida se as senhas são iguais"""
        senha_nova = info.data.get("senha_nova")
        if senha_nova and value != senha_nova:
            raise ValueError("As senhas não coincidem")
        return value


class UserRegister(BaseModel):
    """Schema para registro local de usuario"""

    nm_email: EmailStr = Field(..., description="Email do usuario")
    nm_completo: str = Field(..., description="Nome completo")
    senha: str = Field(..., description="Senha em texto claro")
    nm_papel: Optional[PapelUsuario] = Field(
        PapelUsuario.USUARIO, description="Papel do usuario"
    )

    @field_validator("nm_papel", mode="before")
    @classmethod
    def normalize_register_role(cls, value: Any) -> PapelUsuario:
        role = _parse_role(value, allow_none=False)
        assert role is not None
        return role


class UserLoginLocal(BaseModel):
    """Schema para login local por email e senha"""

    nm_email: EmailStr = Field(..., description="Email do usuario")
    senha: str = Field(..., description="Senha em texto claro")


class UserResponse(UserBase):
    """Schema de resposta para User"""

    id_user: uuid.UUID = Field(..., description="ID unico do usuario")
    nm_email: str = Field(..., description="Email do usuario")
    nm_completo: str = Field(..., description="Nome completo")
    nm_papel: PapelUsuario = Field(..., description="Papel do usuario")
    nm_perfil: Optional[str] = Field(None, description="Nome do perfil (gestor_clinica, medico, etc.)")
    st_ativo: Literal["S", "N"] = Field(..., description="Status ativo")
    id_empresa: Optional[uuid.UUID] = Field(None, description="ID da empresa")
    id_perfil: Optional[uuid.UUID] = Field(None, description="ID do perfil")
    dt_ultimo_login: Optional[datetime] = Field(None, description="Ultimo login")
    nr_total_logins: str = Field(..., description="Total de logins")
    dt_criacao: datetime = Field(..., description="Data de criacao")
    dt_atualizacao: datetime = Field(..., description="Data de atualizacao")

    class Config:
        from_attributes = True


class UserChatInfo(BaseModel):
    """Schema para informacoes do usuario no chat"""

    id_user: uuid.UUID = Field(..., description="ID do usuario")
    nm_display: str = Field(..., description="Nome para exibicao no chat")
    nm_email: str = Field(..., description="Email")
    nm_papel: PapelUsuario = Field(..., description="Papel do usuario")


class UserOAuthLogin(BaseModel):
    """Schema para login/registro via OAuth (Google, Microsoft, Apple)"""

    provider: Literal["google", "azure-ad", "apple"] = Field(
        ..., description="Provedor OAuth (google, azure-ad, apple)"
    )
    provider_id: str = Field(..., description="ID do usuario no provedor OAuth")
    email: EmailStr = Field(..., description="Email retornado pelo provedor")
    name: str = Field(..., description="Nome completo retornado pelo provedor")
    image: Optional[str] = Field(None, description="URL da foto de perfil")


class UserOAuthResponse(BaseModel):
    """Schema de resposta para login OAuth"""

    user: UserResponse
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Tipo de token")


class UserListResponse(BaseModel):
    """Schema para lista de usuarios"""

    items: list[UserResponse]
    meta: Dict[str, int]

    @classmethod
    def create_response(cls, users: List["User"], total: int, page: int, size: int):
        """Criar resposta de paginacao"""
        total_pages = (total + size - 1) // size

        items = [UserResponse.model_validate(user) for user in users]

        return cls(
            items=items,
            meta={
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            },
        )
