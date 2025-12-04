from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# Enums
class StatusCandidatura(str):
    ENVIADA = "enviada"
    EM_ANALISE = "em_analise"
    ENTREVISTA_AGENDADA = "entrevista_agendada"
    APROVADO = "aprovado"
    REPROVADO = "reprovado"
    DESISTIU = "desistiu"


# Request Schemas
class CriarCandidaturaRequest(BaseModel):
    id_vaga: str
    ds_carta_apresentacao: str = Field(..., min_length=100, max_length=5000)

    class Config:
        json_schema_extra = {
            "example": {
                "id_vaga": "123e4567-e89b-12d3-a456-426614174000",
                "ds_carta_apresentacao": "Prezados, tenho grande interesse nesta vaga porque..."
            }
        }


class AtualizarCandidaturaRequest(BaseModel):
    ds_status: str = Field(..., pattern="^(enviada|em_analise|entrevista_agendada|aprovado|reprovado|desistiu)$")
    dt_entrevista: Optional[datetime] = None
    ds_feedback_empresa: Optional[str] = Field(None, max_length=2000)

    @validator("dt_entrevista")
    def validate_dt_entrevista(cls, v, values):
        if "ds_status" in values and values["ds_status"] == "entrevista_agendada" and not v:
            raise ValueError("Data de entrevista é obrigatória para status 'entrevista_agendada'")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "ds_status": "em_analise",
                "ds_feedback_empresa": "Candidato interessante, vamos agendar entrevista."
            }
        }


class AvaliarCandidaturaRequest(BaseModel):
    ds_feedback_candidato: str = Field(..., min_length=10, max_length=1000)
    nr_avaliacao_candidato: int = Field(..., ge=1, le=5)

    class Config:
        json_schema_extra = {
            "example": {
                "ds_feedback_candidato": "Processo seletivo bem organizado e profissional.",
                "nr_avaliacao_candidato": 5
            }
        }


# Response Schemas
class CandidaturaResponse(BaseModel):
    id_candidatura: str
    id_vaga: str
    id_curriculo: str
    id_candidato: str
    ds_carta_apresentacao: str
    ds_status: str
    nr_match_score: Optional[int]
    dt_candidatura: datetime
    dt_visualizacao_empresa: Optional[datetime]
    dt_entrevista: Optional[datetime]
    dt_finalizacao: Optional[datetime]
    ds_feedback_empresa: Optional[str]
    ds_feedback_candidato: Optional[str]
    nr_avaliacao_candidato: Optional[int]
    nm_candidato: Optional[str]
    ds_email_candidato: Optional[str]
    nr_telefone_candidato: Optional[str]
    nm_cargo_vaga: Optional[str]
    nm_empresa: Optional[str]
    dt_atualizacao: Optional[datetime]

    class Config:
        from_attributes = True


class CandidaturaDetailResponse(CandidaturaResponse):
    """Response com informações completas da candidatura, vaga e currículo"""
    vaga: Optional[dict] = None  # VagaResponse
    curriculo: Optional[dict] = None  # CurriculoResponse

    class Config:
        from_attributes = True


class CandidaturaListResponse(BaseModel):
    candidaturas: List[CandidaturaResponse]
    total: int
    page: int
    size: int
    total_pages: int


class CandidaturasFiltros(BaseModel):
    id_vaga: Optional[str] = None
    id_candidato: Optional[str] = None
    ds_status: Optional[str] = None
    nr_match_score_min: Optional[int] = Field(None, ge=0, le=100)
    dt_candidatura_inicio: Optional[datetime] = None
    dt_candidatura_fim: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    ordenar_por: Optional[str] = Field(default="dt_candidatura", pattern="^(dt_candidatura|nr_match_score|nm_candidato)$")
    ordem: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")


class VerificarCandidaturaResponse(BaseModel):
    ja_candidatou: bool
    id_candidatura: Optional[str] = None
    ds_status: Optional[str] = None
    dt_candidatura: Optional[datetime] = None


class EstatisticasCandidaturasResponse(BaseModel):
    """Estatísticas de candidaturas para uma vaga"""
    id_vaga: str
    nm_cargo: str
    total_candidatos: int
    por_status: dict  # {"enviada": 10, "em_analise": 5, ...}
    match_score_medio: Optional[float]
    dt_primeira_candidatura: Optional[datetime]
    dt_ultima_candidatura: Optional[datetime]


class DashboardCandidatoResponse(BaseModel):
    """Dashboard de estatísticas do candidato"""
    id_candidato: str
    total_candidaturas: int
    por_status: dict
    entrevistas_agendadas: int
    aprovacoes: int
    taxa_sucesso: float  # % de aprovações
    candidaturas_recentes: List[CandidaturaResponse]


class VagaAnalytics(BaseModel):
    """Analytics de uma vaga específica"""
    id_vaga: str
    nm_cargo: str
    ds_status: str
    total_candidatos: int
    candidatos_novos_ultimos_7dias: int
    candidatos_novos_ultimos_30dias: int
    por_status: dict  # {"enviada": 10, "em_analise": 5, ...}
    match_score_medio: Optional[float]
    dt_primeira_candidatura: Optional[datetime]
    dt_ultima_candidatura: Optional[datetime]
    taxa_conversao: Optional[float]  # % de candidatos aprovados
    tempo_medio_processo_dias: Optional[float]  # Tempo médio até aprovação/reprovação
    dt_criacao_vaga: datetime


class AnalyticsEmpresaResponse(BaseModel):
    """Analytics geral da empresa sobre vagas e candidaturas"""
    id_empresa: str

    # KPIs Gerais
    total_vagas_abertas: int
    total_vagas_fechadas: int
    total_candidatos: int
    total_contratacoes: int  # Aprovados
    taxa_conversao_geral: Optional[float]  # % de aprovações do total
    tempo_medio_contratacao_dias: Optional[float]

    # Performance por Vaga (top 10 com mais candidatos)
    vagas_com_mais_candidatos: List[VagaAnalytics]

    # Tendências (últimos 30 dias)
    tendencia_candidaturas_30dias: dict  # {data: count}
    tendencia_contratacoes_30dias: dict  # {data: count}

    # Funil de Conversão (agregado)
    funil_conversao: dict  # {"enviada": 100, "em_analise": 80, ...}

    # Scores de Match
    match_score_medio_geral: Optional[float]
    distribuicao_match_scores: dict  # {"0-20": 5, "21-40": 10, ...}
