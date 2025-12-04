from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# Enums
class NivelExperiencia(str):
    ESTAGIARIO = "estagiario"
    JUNIOR = "junior"
    PLENO = "pleno"
    SENIOR = "senior"
    ESPECIALISTA = "especialista"


class TipoContrato(str):
    CLT = "clt"
    PJ = "pj"
    ESTAGIO = "estagio"
    TEMPORARIO = "temporario"
    FREELANCE = "freelance"


class RegimeTrabalho(str):
    PRESENCIAL = "presencial"
    REMOTO = "remoto"
    HIBRIDO = "hibrido"


class StatusCurriculo(str):
    ATIVO = "ativo"
    INATIVO = "inativo"
    PAUSADO = "pausado"


# Sub-schemas
class IdiomaSchema(BaseModel):
    nm_idioma: str
    nm_nivel: str  # basico, intermediario, avancado, fluente, nativo


class ExperienciaProfissionalSchema(BaseModel):
    nm_empresa: str
    nm_cargo: str
    dt_inicio: str
    dt_fim: Optional[str] = None
    fg_atual: bool = False
    ds_atividades: str


class FormacaoAcademicaSchema(BaseModel):
    nm_instituicao: str
    nm_curso: str
    nm_nivel: str  # tecnico, graduacao, pos-graduacao, mestrado, doutorado
    dt_inicio: str
    dt_conclusao: Optional[str] = None
    fg_cursando: bool = False


class CertificacaoSchema(BaseModel):
    nm_certificacao: str
    nm_instituicao: str
    dt_obtencao: str
    dt_validade: Optional[str] = None


# Request Schemas
class CriarCurriculoRequest(BaseModel):
    # Dados Pessoais
    nm_completo: str = Field(..., min_length=3, max_length=255)
    ds_email: EmailStr
    nr_telefone: str = Field(..., min_length=10, max_length=20)
    ds_linkedin: Optional[str] = Field(None, max_length=500)
    ds_portfolio: Optional[str] = Field(None, max_length=500)
    ds_foto_url: Optional[str] = Field(None, max_length=500)

    # Localização
    nm_cidade: str = Field(..., min_length=2, max_length=100)
    nm_estado: str = Field(..., min_length=2, max_length=2)
    ds_cep: Optional[str] = Field(None, max_length=10)

    # Perfil Profissional
    nm_cargo_desejado: str = Field(..., min_length=3, max_length=255)
    ds_resumo_profissional: str = Field(..., min_length=50, max_length=2000)
    nm_nivel_experiencia: str
    nr_anos_experiencia: int = Field(ge=0, le=50)

    # Habilidades
    habilidades: List[str] = Field(..., min_items=1)
    idiomas: Optional[List[IdiomaSchema]] = []

    # Experiências e Formação
    experiencias: Optional[List[ExperienciaProfissionalSchema]] = []
    formacoes: Optional[List[FormacaoAcademicaSchema]] = []
    certificacoes: Optional[List[CertificacaoSchema]] = []

    # Preferências de Trabalho
    tipos_contrato_aceitos: List[str] = Field(..., min_items=1)
    regimes_trabalho_aceitos: List[str] = Field(..., min_items=1)
    vl_pretensao_salarial_min: Optional[Decimal] = None
    vl_pretensao_salarial_max: Optional[Decimal] = None
    fg_disponibilidade_viagem: bool = False
    fg_disponibilidade_mudanca: bool = False

    # Status
    fg_visivel_recrutadores: bool = True

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

    class Config:
        json_schema_extra = {
            "example": {
                "nm_completo": "Maria Silva",
                "ds_email": "maria.silva@email.com",
                "nr_telefone": "11987654321",
                "nm_cidade": "São Paulo",
                "nm_estado": "SP",
                "nm_cargo_desejado": "Esteticista Facial",
                "ds_resumo_profissional": "Profissional com 5 anos de experiência em tratamentos faciais...",
                "nm_nivel_experiencia": "pleno",
                "nr_anos_experiencia": 5,
                "habilidades": ["Limpeza de Pele", "Microagulhamento", "Peeling"],
                "tipos_contrato_aceitos": ["clt", "pj"],
                "regimes_trabalho_aceitos": ["presencial", "hibrido"],
            }
        }


class AtualizarCurriculoRequest(BaseModel):
    # Todos os campos opcionais para PATCH
    nm_completo: Optional[str] = Field(None, min_length=3, max_length=255)
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = Field(None, min_length=10, max_length=20)
    ds_linkedin: Optional[str] = Field(None, max_length=500)
    ds_portfolio: Optional[str] = Field(None, max_length=500)
    ds_foto_url: Optional[str] = Field(None, max_length=500)
    nm_cidade: Optional[str] = Field(None, min_length=2, max_length=100)
    nm_estado: Optional[str] = Field(None, min_length=2, max_length=2)
    ds_cep: Optional[str] = Field(None, max_length=10)
    nm_cargo_desejado: Optional[str] = Field(None, min_length=3, max_length=255)
    ds_resumo_profissional: Optional[str] = Field(None, min_length=50, max_length=2000)
    nm_nivel_experiencia: Optional[str] = None
    nr_anos_experiencia: Optional[int] = Field(None, ge=0, le=50)
    habilidades: Optional[List[str]] = None
    idiomas: Optional[List[IdiomaSchema]] = None
    experiencias: Optional[List[ExperienciaProfissionalSchema]] = None
    formacoes: Optional[List[FormacaoAcademicaSchema]] = None
    certificacoes: Optional[List[CertificacaoSchema]] = None
    tipos_contrato_aceitos: Optional[List[str]] = None
    regimes_trabalho_aceitos: Optional[List[str]] = None
    vl_pretensao_salarial_min: Optional[Decimal] = None
    vl_pretensao_salarial_max: Optional[Decimal] = None
    fg_disponibilidade_viagem: Optional[bool] = None
    fg_disponibilidade_mudanca: Optional[bool] = None
    ds_status: Optional[str] = None
    fg_visivel_recrutadores: Optional[bool] = None


# Response Schemas
class CurriculoResponse(BaseModel):
    id_curriculo: str
    id_usuario: Optional[str]
    nm_completo: str
    ds_email: str
    nr_telefone: str
    ds_linkedin: Optional[str]
    ds_portfolio: Optional[str]
    ds_foto_url: Optional[str]
    nm_cidade: str
    nm_estado: str
    ds_cep: Optional[str]
    nm_cargo_desejado: str
    ds_resumo_profissional: str
    nm_nivel_experiencia: str
    nr_anos_experiencia: int
    habilidades: List[str]
    idiomas: List[dict]
    experiencias: List[dict]
    formacoes: List[dict]
    certificacoes: List[dict]
    tipos_contrato_aceitos: List[str]
    regimes_trabalho_aceitos: List[str]
    vl_pretensao_salarial_min: Optional[Decimal]
    vl_pretensao_salarial_max: Optional[Decimal]
    fg_disponibilidade_viagem: bool
    fg_disponibilidade_mudanca: bool
    ds_status: str
    fg_visivel_recrutadores: bool
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]
    nr_visualizacoes: int
    nr_candidaturas: int

    class Config:
        from_attributes = True


class CurriculoListResponse(BaseModel):
    curriculos: List[CurriculoResponse]
    total: int
    page: int
    size: int
    total_pages: int


class CurriculoFiltros(BaseModel):
    nm_cargo: Optional[str] = None
    nm_cidade: Optional[str] = None
    nm_estado: Optional[str] = None
    nm_nivel: Optional[str] = None
    habilidades: Optional[List[str]] = None
    tipos_contrato: Optional[List[str]] = None
    regimes_trabalho: Optional[List[str]] = None
    vl_salario_min: Optional[Decimal] = None
    vl_salario_max: Optional[Decimal] = None
    fg_visivel_recrutadores: Optional[bool] = True
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
