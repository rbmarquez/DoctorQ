# src/models/perfil.py
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import ARRAY, Boolean, Column, ForeignKey, Integer, String, TIMESTAMP, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# ==========================================
# Enums
# ==========================================
class GrupoAcesso(str, Enum):
    """Grupos de acesso disponíveis no sistema (Nível 1)"""
    ADMIN = "admin"
    CLINICA = "clinica"
    PROFISSIONAL = "profissional"
    PACIENTE = "paciente"
    FORNECEDOR = "fornecedor"


# ==========================================
# SQLAlchemy Model (Database)
# ==========================================
class Perfil(Base):
    """
    Modelo SQLAlchemy para perfis personalizados com hierarquia.

    Estrutura hierárquica:
    - Nível 1 (Perfis Principais): admin, parceiro, fornecedor, paciente
    - Nível 2 (Sub-perfis): gestor_clinica, medico, secretaria, etc.

    Exemplos:
    - administrador (perfil raiz) → super_admin, analista, suporte (sub-perfis)
    - parceiro (perfil raiz) → gestor_clinica, medico, secretaria (sub-perfis)
    - fornecedor (perfil raiz) → gestor_fornecedor, vendedor, marketing (sub-perfis)
    """

    __tablename__ = "tb_perfis"

    id_perfil = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_empresa = Column(UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa", ondelete="CASCADE"))
    nm_perfil = Column(String(100), nullable=False)
    ds_perfil = Column(String)
    nm_tipo = Column(String(20), nullable=False, default="custom")  # system, custom

    # Hierarquia de perfis (novo)
    nm_tipo_acesso = Column(String(20))  # admin, parceiro, fornecedor, paciente
    id_perfil_pai = Column(UUID(as_uuid=True), ForeignKey("tb_perfis.id_perfil", ondelete="CASCADE"))
    nr_ordem = Column(Integer, default=0)  # Ordem de exibição

    # Permissões em formato JSONB (legado - ainda usado para compatibilidade)
    ds_permissoes = Column(JSONB, nullable=False, default={})

    # ====== CONTROLE DE ACESSO EM DOIS NÍVEIS ======
    # Nível 1: Grupos que o perfil pode acessar (admin, clinica, profissional, paciente, fornecedor)
    ds_grupos_acesso = Column(ARRAY(Text), nullable=False, default=[])

    # Nível 2: Permissões detalhadas por grupo e recurso
    # Estrutura: {grupo: {recurso: {acao: boolean}}}
    ds_permissoes_detalhadas = Column(JSONB, nullable=False, default={})

    # Nível 3: Controle granular de rotas individuais
    # Lista de paths específicos que o perfil pode acessar
    ds_rotas_permitidas = Column(ARRAY(Text), nullable=False, default=[])

    # Indica se é um perfil template (pode ser clonado)
    fg_template = Column(Boolean, nullable=False, default=False)

    st_ativo = Column(String(1), nullable=False, default="S")
    dt_criacao = Column(TIMESTAMP, nullable=False, default=datetime.now)
    dt_atualizacao = Column(TIMESTAMP, nullable=False, default=datetime.now, onupdate=datetime.now)

    # Relacionamentos (lazy import para evitar circular imports)
    empresa = relationship("Empresa", back_populates="perfis", lazy="select")
    usuarios = relationship("User", back_populates="perfil", lazy="select")

    # Auto-relacionamento para hierarquia (novo)
    perfil_pai = relationship(
        "Perfil",
        remote_side=[id_perfil],
        backref="sub_perfis",
        lazy="select"
    )


# ==========================================
# Pydantic Models (API/Validation)
# ==========================================
class PermissoesRecurso(BaseModel):
    """Model para permissões de um recurso específico"""

    criar: bool = False
    editar: bool = False
    excluir: bool = False
    visualizar: bool = False
    executar: Optional[bool] = None  # Para recursos que podem ser executados (agentes, tools)
    upload: Optional[bool] = None  # Para resources que permitem upload (document stores)
    exportar: Optional[bool] = None  # Para relatórios


class PermissoesCompletas(BaseModel):
    """Model completo de permissões do sistema"""

    usuarios: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    agentes: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    conversas: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    document_stores: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    credenciais: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    variaveis: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    tools: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    empresa: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    perfis: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    relatorios: PermissoesRecurso = Field(default_factory=lambda: PermissoesRecurso())
    admin: bool = False


class PerfilBase(BaseModel):
    """Base model para Perfil"""

    nm_perfil: str = Field(..., min_length=1, max_length=100, description="Nome do perfil")
    ds_perfil: Optional[str] = Field(None, description="Descrição do perfil")
    nm_tipo: Optional[str] = Field("custom", description="Tipo: system ou custom")


class PerfilCreate(PerfilBase):
    """Model para criação de perfil"""

    id_empresa: Optional[uuid.UUID] = Field(None, description="ID da empresa (null = perfil global)")
    ds_permissoes: PermissoesCompletas = Field(
        default_factory=PermissoesCompletas,
        description="Permissões do perfil"
    )
    ds_grupos_acesso: Optional[List[str]] = Field(
        default_factory=list,
        description="Grupos de acesso do perfil (admin, clinica, profissional, paciente, fornecedor)"
    )
    ds_permissoes_detalhadas: Optional[Dict] = Field(
        default_factory=dict,
        description="Permissões detalhadas por grupo e recurso"
    )
    ds_rotas_permitidas: Optional[List[str]] = Field(
        default_factory=list,
        description="Lista de rotas/páginas específicas permitidas (controle granular)"
    )
    st_ativo: Optional[str] = Field("S", description="Status: S=Ativo, N=Inativo")

    @field_validator('ds_grupos_acesso')
    @classmethod
    def validate_grupos_acesso(cls, v):
        """Valida que os grupos informados são válidos"""
        if v:
            valid_grupos = [g.value for g in GrupoAcesso]
            invalid = [g for g in v if g not in valid_grupos]
            if invalid:
                raise ValueError(
                    f"Grupos inválidos: {invalid}. Grupos válidos: {valid_grupos}"
                )
        return v


class PerfilUpdate(BaseModel):
    """Model para atualização de perfil"""

    nm_perfil: Optional[str] = Field(None, min_length=1, max_length=100)
    ds_perfil: Optional[str] = None
    ds_permissoes: Optional[PermissoesCompletas] = None
    ds_grupos_acesso: Optional[List[str]] = Field(
        None,
        description="Grupos de acesso do perfil (admin, clinica, profissional, paciente, fornecedor)"
    )
    ds_permissoes_detalhadas: Optional[Dict] = Field(
        None,
        description="Permissões detalhadas por grupo e recurso"
    )
    ds_rotas_permitidas: Optional[List[str]] = Field(
        None,
        description="Lista de rotas/páginas específicas permitidas (controle granular)"
    )
    st_ativo: Optional[str] = None

    @field_validator('ds_grupos_acesso')
    @classmethod
    def validate_grupos_acesso(cls, v):
        """Valida que os grupos informados são válidos"""
        if v:
            valid_grupos = [g.value for g in GrupoAcesso]
            invalid = [g for g in v if g not in valid_grupos]
            if invalid:
                raise ValueError(
                    f"Grupos inválidos: {invalid}. Grupos válidos: {valid_grupos}"
                )
        return v


class PerfilResponse(PerfilBase):
    """Model para resposta de perfil"""

    id_perfil: uuid.UUID
    id_empresa: Optional[uuid.UUID]
    ds_permissoes: dict
    st_ativo: str
    dt_criacao: datetime
    dt_atualizacao: datetime

    # Campos de hierarquia (novo)
    nm_tipo_acesso: Optional[str] = None  # admin, parceiro, fornecedor, paciente
    id_perfil_pai: Optional[uuid.UUID] = None
    nr_ordem: Optional[int] = 0

    # ====== CONTROLE DE ACESSO EM DOIS NÍVEIS ======
    ds_grupos_acesso: List[str] = Field(default_factory=list, description="Grupos que o perfil pode acessar")
    ds_permissoes_detalhadas: Dict = Field(default_factory=dict, description="Permissões detalhadas por grupo")
    fg_template: bool = Field(default=False, description="É um perfil template?")

    # Informações adicionais (opcionais)
    nr_usuarios_com_perfil: Optional[int] = None
    nm_empresa: Optional[str] = None
    nm_perfil_pai: Optional[str] = None  # Nome do perfil pai (para exibição)

    model_config = {"from_attributes": True}
