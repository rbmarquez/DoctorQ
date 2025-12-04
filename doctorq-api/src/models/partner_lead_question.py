"""
Models para Partner Lead Questions
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.sql import func

from src.config.orm_config import Base


# ============================================================================
# SQLAlchemy ORM Model
# ============================================================================


class TbPartnerLeadQuestion(Base):
    """Tabela de perguntas para leads de parceiros"""

    __tablename__ = "tb_partner_lead_questions"

    id_question = Column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    tp_partner = Column(String(32), nullable=False)  # paciente, profissional, clinica, fornecedor
    nm_question = Column(String(500), nullable=False)
    tp_input = Column(String(32), nullable=False)  # text, textarea, select, radio, checkbox, etc.
    ds_options = Column(JSONB, nullable=True)  # {"options": ["Opção 1", "Opção 2"]}
    ds_placeholder = Column(String(255), nullable=True)
    ds_help_text = Column(Text, nullable=True)
    nr_order = Column(Integer, nullable=False, default=0)
    st_required = Column(Boolean, nullable=False, default=False)
    st_active = Column(Boolean, nullable=False, default=True)
    dt_criacao = Column(DateTime, nullable=False, server_default=func.now())
    dt_atualizacao = Column(DateTime, nullable=True, onupdate=func.now())


# ============================================================================
# Pydantic Schemas
# ============================================================================


# Tipos literais para validação
PartnerTypeEnum = Literal["paciente", "profissional", "clinica", "fornecedor"]
InputTypeEnum = Literal[
    "text",
    "textarea",
    "select",
    "radio",
    "checkbox",
    "number",
    "email",
    "tel",
    "date",
]


class PartnerLeadQuestionBase(BaseModel):
    """Schema base para perguntas de leads"""

    tp_partner: PartnerTypeEnum = Field(..., description="Tipo de parceiro")
    nm_question: str = Field(..., min_length=1, max_length=500, description="Texto da pergunta")
    tp_input: InputTypeEnum = Field(..., description="Tipo de input")
    ds_options: Optional[Dict[str, List[str]]] = Field(
        None,
        description='Opções para select/radio/checkbox: {"options": ["Opção 1", "Opção 2"]}',
    )
    ds_placeholder: Optional[str] = Field(None, max_length=255, description="Placeholder do input")
    ds_help_text: Optional[str] = Field(None, description="Texto de ajuda")
    nr_order: int = Field(0, ge=0, description="Ordem de exibição")
    st_required: bool = Field(False, description="Se é obrigatória")
    st_active: bool = Field(True, description="Se está ativa")

    class Config:
        json_schema_extra = {
            "example": {
                "tp_partner": "paciente",
                "nm_question": "Qual procedimento você procura?",
                "tp_input": "select",
                "ds_options": {
                    "options": ["Botox", "Preenchimento", "Harmonização", "Outro"]
                },
                "ds_placeholder": None,
                "ds_help_text": "Selecione o procedimento de seu interesse",
                "nr_order": 1,
                "st_required": True,
                "st_active": True,
            }
        }


class PartnerLeadQuestionCreate(PartnerLeadQuestionBase):
    """Schema para criar uma pergunta"""

    pass


class PartnerLeadQuestionUpdate(BaseModel):
    """Schema para atualizar uma pergunta (todos os campos opcionais)"""

    tp_partner: Optional[PartnerTypeEnum] = None
    nm_question: Optional[str] = Field(None, min_length=1, max_length=500)
    tp_input: Optional[InputTypeEnum] = None
    ds_options: Optional[Dict[str, List[str]]] = None
    ds_placeholder: Optional[str] = Field(None, max_length=255)
    ds_help_text: Optional[str] = None
    nr_order: Optional[int] = Field(None, ge=0)
    st_required: Optional[bool] = None
    st_active: Optional[bool] = None


class PartnerLeadQuestionResponse(PartnerLeadQuestionBase):
    """Schema de resposta para pergunta"""

    id_question: UUID
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id_question": "550e8400-e29b-41d4-a716-446655440000",
                "tp_partner": "paciente",
                "nm_question": "Qual procedimento você procura?",
                "tp_input": "select",
                "ds_options": {
                    "options": ["Botox", "Preenchimento", "Harmonização", "Outro"]
                },
                "ds_placeholder": None,
                "ds_help_text": "Selecione o procedimento de seu interesse",
                "nr_order": 1,
                "st_required": True,
                "st_active": True,
                "dt_criacao": "2025-01-19T10:00:00",
                "dt_atualizacao": None,
            }
        }


class PartnerLeadQuestionListResponse(BaseModel):
    """Schema para lista paginada de perguntas"""

    items: List[PartnerLeadQuestionResponse]
    total: int
    page: int
    size: int
    pages: int


class PartnerLeadQuestionFilters(BaseModel):
    """Filtros para listagem de perguntas"""

    page: int = Field(1, ge=1, description="Número da página")
    size: int = Field(50, ge=1, le=100, description="Itens por página")
    tp_partner: Optional[PartnerTypeEnum] = Field(None, description="Filtrar por tipo de parceiro")
    st_active: Optional[bool] = Field(None, description="Filtrar por status ativo/inativo")
    search: Optional[str] = Field(None, description="Buscar no texto da pergunta")


class PartnerLeadQuestionReorderRequest(BaseModel):
    """Schema para reordenar perguntas"""

    questions: List[Dict[str, Any]] = Field(
        ...,
        description="Lista de {id_question, nr_order}",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "questions": [
                    {"id_question": "550e8400-e29b-41d4-a716-446655440000", "nr_order": 1},
                    {"id_question": "660e8400-e29b-41d4-a716-446655440001", "nr_order": 2},
                ]
            }
        }
