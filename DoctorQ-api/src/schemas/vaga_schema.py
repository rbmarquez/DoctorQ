from pydantic import BaseModel, Field, validator, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID


# Enums
class NivelVaga(str):
    ESTAGIARIO = "estagiario"
    JUNIOR = "junior"
    PLENO = "pleno"
    SENIOR = "senior"
    ESPECIALISTA = "especialista"


class TipoContratoVaga(str):
    CLT = "clt"
    PJ = "pj"
    ESTAGIO = "estagio"
    TEMPORARIO = "temporario"
    FREELANCE = "freelance"


class RegimeTrabalhoVaga(str):
    PRESENCIAL = "presencial"
    REMOTO = "remoto"
    HIBRIDO = "hibrido"


class StatusVaga(str):
    ABERTA = "aberta"
    PAUSADA = "pausada"
    FECHADA = "fechada"
    EXPIRADA = "expirada"


# Request Schemas
class CriarVagaRequest(BaseModel):
    # Informações Básicas
    nm_cargo: str = Field(..., min_length=3, max_length=255)
    ds_resumo: str = Field(..., min_length=10, max_length=500)
    ds_responsabilidades: str = Field(..., min_length=10, max_length=5000)
    ds_requisitos: str = Field(..., min_length=10, max_length=5000)
    ds_diferenciais: Optional[str] = Field(None, max_length=2000)

    # Classificação
    nm_area: str = Field(..., min_length=3, max_length=100)
    nm_nivel: str
    nm_tipo_contrato: str
    nm_regime_trabalho: str

    # Localização
    nm_cidade: str = Field(..., min_length=2, max_length=100)
    nm_estado: str = Field(..., min_length=2, max_length=2)
    ds_cep: Optional[str] = Field(None, max_length=10)
    fg_aceita_remoto: bool = False

    # Remuneração
    vl_salario_min: Optional[Decimal] = Field(None, ge=0)
    vl_salario_max: Optional[Decimal] = Field(None, ge=0)
    fg_salario_a_combinar: bool = False
    ds_beneficios: Optional[List[str]] = []

    # Requisitos
    habilidades_requeridas: List[str] = Field(..., min_items=1)
    habilidades_desejaveis: Optional[List[str]] = []
    certificacoes_necessarias: Optional[List[str]] = []
    nr_anos_experiencia_min: int = Field(default=0, ge=0, le=50)

    # Status e Visibilidade
    fg_destaque: bool = False
    dt_expiracao: Optional[date] = None

    # Estatísticas
    nr_vagas: int = Field(default=1, ge=1, le=100)

    @validator("nm_estado")
    def validate_estado(cls, v):
        estados_validos = [
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
            "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
            "RS", "RO", "RR", "SC", "SP", "SE", "TO"
        ]
        if v.upper() not in estados_validos:
            raise ValueError(f"Estado inválido. Use sigla de 2 letras (ex: SP)")
        return v.upper()

    @validator("vl_salario_max")
    def validate_salario_range(cls, v, values):
        if v and "vl_salario_min" in values and values["vl_salario_min"]:
            if v < values["vl_salario_min"]:
                raise ValueError("Salário máximo deve ser maior que o mínimo")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "nm_cargo": "Esteticista Facial Pleno",
                "ds_resumo": "Clínica de estética em Moema busca esteticista facial com experiência...",
                "ds_responsabilidades": "- Realizar limpezas de pele\n- Aplicar peelings químicos\n- Atendimento personalizado",
                "ds_requisitos": "- 3 anos de experiência\n- Curso técnico em estética\n- Conhecimento em microagulhamento",
                "nm_area": "Estética Facial",
                "nm_nivel": "pleno",
                "nm_tipo_contrato": "clt",
                "nm_regime_trabalho": "presencial",
                "nm_cidade": "São Paulo",
                "nm_estado": "SP",
                "vl_salario_min": 3000.00,
                "vl_salario_max": 4500.00,
                "ds_beneficios": ["VR", "VT", "Comissão"],
                "habilidades_requeridas": ["Limpeza de Pele", "Peeling", "Microagulhamento"],
                "nr_anos_experiencia_min": 3,
                "nr_vagas": 2
            }
        }


class AtualizarVagaRequest(BaseModel):
    # Todos os campos opcionais para PATCH
    nm_cargo: Optional[str] = Field(None, min_length=3, max_length=255)
    ds_resumo: Optional[str] = Field(None, min_length=10, max_length=500)
    ds_responsabilidades: Optional[str] = Field(None, min_length=10, max_length=5000)
    ds_requisitos: Optional[str] = Field(None, min_length=10, max_length=5000)
    ds_diferenciais: Optional[str] = Field(None, max_length=2000)
    nm_area: Optional[str] = Field(None, min_length=3, max_length=100)
    nm_nivel: Optional[str] = None
    nm_tipo_contrato: Optional[str] = None
    nm_regime_trabalho: Optional[str] = None
    nm_cidade: Optional[str] = Field(None, min_length=2, max_length=100)
    nm_estado: Optional[str] = Field(None, min_length=2, max_length=2)
    ds_cep: Optional[str] = Field(None, max_length=10)
    fg_aceita_remoto: Optional[bool] = None
    vl_salario_min: Optional[Decimal] = Field(None, ge=0)
    vl_salario_max: Optional[Decimal] = Field(None, ge=0)
    fg_salario_a_combinar: Optional[bool] = None
    ds_beneficios: Optional[List[str]] = None
    habilidades_requeridas: Optional[List[str]] = None
    habilidades_desejaveis: Optional[List[str]] = None
    certificacoes_necessarias: Optional[List[str]] = None
    nr_anos_experiencia_min: Optional[int] = Field(None, ge=0, le=50)
    ds_status: Optional[str] = None
    fg_destaque: Optional[bool] = None
    dt_expiracao: Optional[date] = None
    nr_vagas: Optional[int] = Field(None, ge=1, le=100)


# Response Schemas
class VagaResponse(BaseModel):
    id_vaga: str
    id_empresa: str
    id_criador: str
    nm_cargo: str
    ds_resumo: str
    ds_responsabilidades: str
    ds_requisitos: str
    ds_diferenciais: Optional[str]
    nm_area: str
    nm_nivel: str
    nm_tipo_contrato: str
    nm_regime_trabalho: str
    nm_cidade: str
    nm_estado: str
    ds_cep: Optional[str]
    fg_aceita_remoto: bool
    vl_salario_min: Optional[Decimal]
    vl_salario_max: Optional[Decimal]
    fg_salario_a_combinar: bool
    ds_beneficios: List[str]
    habilidades_requeridas: List[str]
    habilidades_desejaveis: List[str]
    certificacoes_necessarias: List[str]
    nr_anos_experiencia_min: int
    ds_status: str
    fg_destaque: bool
    dt_expiracao: Optional[date]
    nr_vagas: int
    nr_candidatos: int
    nr_visualizacoes: int
    nm_empresa: Optional[str]
    ds_logo_empresa: Optional[str]
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]
    dt_publicacao: Optional[datetime]

    @field_validator('id_vaga', 'id_empresa', 'id_criador', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class VagaListResponse(BaseModel):
    vagas: List[VagaResponse]
    total: int
    page: int
    size: int
    total_pages: int


class VagasFiltros(BaseModel):
    nm_cargo: Optional[str] = None
    nm_area: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = None
    nm_nivel: Optional[str] = None
    nm_tipo_contrato: Optional[str] = None
    nm_regime_trabalho: Optional[str] = None
    fg_aceita_remoto: Optional[bool] = None
    vl_salario_min: Optional[Decimal] = None
    vl_salario_max: Optional[Decimal] = None
    habilidades: Optional[List[str]] = None
    ds_status: Optional[str] = Field(default="aberta")
    fg_destaque: Optional[bool] = None
    id_empresa: Optional[str] = None
    page: int = Field(default=1, ge=1)
    size: int = Field(default=12, ge=1, le=100)


class AtualizarStatusVagaRequest(BaseModel):
    ds_status: str = Field(..., pattern="^(aberta|pausada|fechada|expirada)$")

    class Config:
        json_schema_extra = {
            "example": {
                "ds_status": "pausada"
            }
        }
