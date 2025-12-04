"""
Schemas Pydantic para Favoritos (Vagas)
"""

from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional


class CriarFavoritoRequest(BaseModel):
    """Request para adicionar vaga aos favoritos"""
    id_vaga: UUID4


class FavoritoResponse(BaseModel):
    """Response de um favorito"""
    id_favorito: UUID4
    id_user: UUID4
    id_vaga: UUID4
    dt_criacao: datetime

    class Config:
        from_attributes = True


class FavoritoComVagaResponse(BaseModel):
    """Response de favorito com dados da vaga"""
    id_favorito: UUID4
    id_user: UUID4
    id_vaga: UUID4
    dt_criacao: datetime

    # Dados da vaga
    nm_cargo: str
    nm_empresa: str
    nm_cidade: str
    nm_estado: str
    ds_status: str
    ds_resumo: Optional[str] = None
    vl_salario_min: Optional[float] = None
    vl_salario_max: Optional[float] = None
    fg_salario_a_combinar: bool = False

    class Config:
        from_attributes = True
