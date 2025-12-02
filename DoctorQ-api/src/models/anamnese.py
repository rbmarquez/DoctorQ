"""
Modelos para Anamnese (Questionário Pré-Atendimento)
UC032 - Registrar Anamnese
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


# ========== SQLAlchemy Models ==========

class TbAnamnese(Base):
    """
    Tabela de anamneses preenchidas
    Armazena questionários pré-atendimento de pacientes
    """
    __tablename__ = "tb_anamneses"

    id_anamnese = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=False)
    id_paciente = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=False)
    id_profissional = Column(PG_UUID(as_uuid=True), ForeignKey("tb_users.id_user"), nullable=True)
    id_procedimento = Column(PG_UUID(as_uuid=True), ForeignKey("tb_procedimentos.id_procedimento"), nullable=True)
    id_template = Column(PG_UUID(as_uuid=True), ForeignKey("tb_anamnese_templates.id_template"), nullable=False)

    # Dados da anamnese
    ds_respostas = Column(JSON, nullable=False, comment="Respostas do questionário")
    ds_observacoes = Column(Text, nullable=True, comment="Observações adicionais")

    # Alertas identificados
    fg_alertas_criticos = Column(Boolean, default=False, comment="Possui alertas críticos?")
    ds_alertas = Column(JSON, nullable=True, comment="Lista de alertas identificados")

    # Assinatura
    nm_assinatura_paciente = Column(String(255), nullable=True, comment="Nome para assinatura")
    dt_assinatura_paciente = Column(DateTime, nullable=True)
    nm_assinatura_profissional = Column(String(255), nullable=True)
    dt_assinatura_profissional = Column(DateTime, nullable=True)

    # Auditoria
    fg_ativo = Column(Boolean, default=True)
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    # paciente = relationship("User", foreign_keys=[id_paciente])
    # profissional = relationship("User", foreign_keys=[id_profissional])
    # template = relationship("TbAnamneseTemplate")


class TbAnamneseTemplate(Base):
    """
    Templates de anamnese (questionários)
    Permite criar diferentes templates para diferentes procedimentos
    """
    __tablename__ = "tb_anamnese_templates"

    id_template = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    id_empresa = Column(PG_UUID(as_uuid=True), ForeignKey("tb_empresas.id_empresa"), nullable=True)  # NULL = template global

    nm_template = Column(String(255), nullable=False, comment="Nome do template")
    ds_template = Column(Text, nullable=True, comment="Descrição")
    tp_template = Column(String(50), nullable=False, comment="Tipo: geral, facial, corporal, depilacao, etc")

    # Estrutura do questionário
    ds_perguntas = Column(JSON, nullable=False, comment="Array de perguntas estruturadas")

    # Regras de validação e alertas
    ds_regras_validacao = Column(JSON, nullable=True, comment="Regras de validação")
    ds_regras_alertas = Column(JSON, nullable=True, comment="Regras para gerar alertas")

    # Auditoria
    fg_ativo = Column(Boolean, default=True)
    fg_publico = Column(Boolean, default=False, comment="Template disponível para todas clínicas?")
    dt_criacao = Column(DateTime, nullable=False, default=datetime.utcnow)
    dt_atualizacao = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# ========== Pydantic Models ==========

class PerguntaAnamnese(BaseModel):
    """Estrutura de uma pergunta do questionário"""
    id_pergunta: str = Field(..., description="ID único da pergunta")
    nm_pergunta: str = Field(..., description="Texto da pergunta")
    tp_resposta: str = Field(..., description="text | textarea | select | multiselect | radio | checkbox | date | number | boolean")
    fg_obrigatoria: bool = Field(default=False, description="Pergunta obrigatória?")
    ds_opcoes: Optional[List[str]] = Field(None, description="Opções (para select, radio, etc)")
    ds_ajuda: Optional[str] = Field(None, description="Texto de ajuda")
    vl_minimo: Optional[int] = Field(None, description="Valor mínimo (para number)")
    vl_maximo: Optional[int] = Field(None, description="Valor máximo (para number)")
    nr_ordem: int = Field(default=0, description="Ordem de exibição")


class RespostaAnamnese(BaseModel):
    """Resposta de uma pergunta"""
    id_pergunta: str = Field(..., description="ID da pergunta")
    vl_resposta: Any = Field(..., description="Valor da resposta (pode ser string, number, boolean, array)")


class AlertaAnamnese(BaseModel):
    """Alerta identificado na anamnese"""
    tp_alerta: str = Field(..., description="tipo: critico | atencao | informativo")
    nm_alerta: str = Field(..., description="Nome do alerta")
    ds_alerta: str = Field(..., description="Descrição detalhada")
    id_pergunta: Optional[str] = Field(None, description="Pergunta que gerou o alerta")


# ========== Request/Response Models ==========

class AnamneseTemplateCreate(BaseModel):
    """Criar template de anamnese"""
    nm_template: str = Field(..., min_length=3, max_length=255)
    ds_template: Optional[str] = None
    tp_template: str = Field(..., description="geral | facial | corporal | depilacao | preenchimento | outro")
    ds_perguntas: List[PerguntaAnamnese]
    ds_regras_validacao: Optional[Dict[str, Any]] = None
    ds_regras_alertas: Optional[Dict[str, Any]] = None
    fg_publico: bool = False


class AnamneseTemplateUpdate(BaseModel):
    """Atualizar template de anamnese"""
    nm_template: Optional[str] = Field(None, min_length=3, max_length=255)
    ds_template: Optional[str] = None
    tp_template: Optional[str] = None
    ds_perguntas: Optional[List[PerguntaAnamnese]] = None
    ds_regras_validacao: Optional[Dict[str, Any]] = None
    ds_regras_alertas: Optional[Dict[str, Any]] = None
    fg_ativo: Optional[bool] = None
    fg_publico: Optional[bool] = None


class AnamneseTemplateResponse(BaseModel):
    """Resposta com template de anamnese"""
    id_template: UUID
    id_empresa: Optional[UUID]
    nm_template: str
    ds_template: Optional[str]
    tp_template: str
    ds_perguntas: List[PerguntaAnamnese]
    ds_regras_validacao: Optional[Dict[str, Any]]
    ds_regras_alertas: Optional[Dict[str, Any]]
    fg_ativo: bool
    fg_publico: bool
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


class AnamneseCreate(BaseModel):
    """Criar/Preencher anamnese"""
    id_paciente: UUID
    id_template: UUID
    id_procedimento: Optional[UUID] = None
    ds_respostas: List[RespostaAnamnese]
    ds_observacoes: Optional[str] = None
    nm_assinatura_paciente: Optional[str] = None


class AnamneseUpdate(BaseModel):
    """Atualizar anamnese"""
    ds_respostas: Optional[List[RespostaAnamnese]] = None
    ds_observacoes: Optional[str] = None
    nm_assinatura_profissional: Optional[str] = None


class AnamneseResponse(BaseModel):
    """Resposta com anamnese"""
    id_anamnese: UUID
    id_empresa: UUID
    id_paciente: UUID
    id_profissional: Optional[UUID]
    id_procedimento: Optional[UUID]
    id_template: UUID
    ds_respostas: List[Dict[str, Any]]
    ds_observacoes: Optional[str]
    fg_alertas_criticos: bool
    ds_alertas: Optional[List[AlertaAnamnese]]
    nm_assinatura_paciente: Optional[str]
    dt_assinatura_paciente: Optional[datetime]
    nm_assinatura_profissional: Optional[str]
    dt_assinatura_profissional: Optional[datetime]
    fg_ativo: bool
    dt_criacao: datetime
    dt_atualizacao: datetime

    class Config:
        from_attributes = True


class AnamneseListResponse(BaseModel):
    """Lista paginada de anamneses"""
    total: int
    page: int
    size: int
    items: List[AnamneseResponse]


class AnamneseAssinaturaRequest(BaseModel):
    """Assinar anamnese"""
    nm_assinatura: str = Field(..., min_length=3, max_length=255)


class AnamneseAssinaturaResponse(BaseModel):
    """Resposta de assinatura"""
    id_anamnese: UUID
    nm_assinatura: str
    dt_assinatura: datetime
    tp_assinatura: str  # paciente | profissional


# ========== Templates Padrão ==========

TEMPLATE_ANAMNESE_GERAL = {
    "nm_template": "Anamnese Geral - Estética",
    "tp_template": "geral",
    "ds_template": "Questionário geral para qualquer procedimento estético",
    "ds_perguntas": [
        {
            "id_pergunta": "hist_saude",
            "nm_pergunta": "Como você classifica seu estado geral de saúde?",
            "tp_resposta": "radio",
            "fg_obrigatoria": True,
            "ds_opcoes": ["Excelente", "Bom", "Regular", "Ruim"],
            "nr_ordem": 1
        },
        {
            "id_pergunta": "alergias",
            "nm_pergunta": "Possui alguma alergia conhecida?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": True,
            "ds_ajuda": "Liste todas as alergias a medicamentos, cosméticos, alimentos, etc.",
            "nr_ordem": 2
        },
        {
            "id_pergunta": "medicamentos",
            "nm_pergunta": "Está fazendo uso de algum medicamento atualmente?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": True,
            "ds_ajuda": "Liste todos os medicamentos que está usando, incluindo dosagem",
            "nr_ordem": 3
        },
        {
            "id_pergunta": "gestante",
            "nm_pergunta": "Está grávida ou amamentando?",
            "tp_resposta": "radio",
            "fg_obrigatoria": True,
            "ds_opcoes": ["Não", "Grávida", "Amamentando"],
            "nr_ordem": 4
        },
        {
            "id_pergunta": "doencas_cronicas",
            "nm_pergunta": "Possui alguma doença crônica?",
            "tp_resposta": "multiselect",
            "fg_obrigatoria": True,
            "ds_opcoes": [
                "Nenhuma",
                "Diabetes",
                "Hipertensão",
                "Doenças cardíacas",
                "Doenças autoimunes",
                "Câncer (atual ou histórico)",
                "Epilepsia",
                "Doenças de pele",
                "Outras"
            ],
            "nr_ordem": 5
        },
        {
            "id_pergunta": "cirurgias",
            "nm_pergunta": "Já realizou alguma cirurgia? Quais e quando?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": False,
            "nr_ordem": 6
        },
        {
            "id_pergunta": "tratamentos_anteriores",
            "nm_pergunta": "Já realizou algum tratamento estético anteriormente?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": False,
            "ds_ajuda": "Descreva quais tratamentos, quando e resultados",
            "nr_ordem": 7
        },
        {
            "id_pergunta": "expectativas",
            "nm_pergunta": "Quais são suas expectativas com o tratamento?",
            "tp_resposta": "textarea",
            "fg_obrigatoria": True,
            "nr_ordem": 8
        },
        {
            "id_pergunta": "termo_consentimento",
            "nm_pergunta": "Li e concordo com o termo de consentimento do procedimento",
            "tp_resposta": "boolean",
            "fg_obrigatoria": True,
            "nr_ordem": 9
        }
    ],
    "ds_regras_alertas": {
        "alertas_criticos": [
            {
                "condicao": "gestante != 'Não'",
                "alerta": {
                    "tp_alerta": "critico",
                    "nm_alerta": "Gestação/Amamentação",
                    "ds_alerta": "Paciente grávida ou amamentando. Muitos procedimentos são contraindicados."
                }
            },
            {
                "condicao": "'Câncer' in doencas_cronicas",
                "alerta": {
                    "tp_alerta": "critico",
                    "nm_alerta": "Histórico de Câncer",
                    "ds_alerta": "Paciente com câncer. Necessário avaliação médica prévia."
                }
            }
        ]
    }
}
