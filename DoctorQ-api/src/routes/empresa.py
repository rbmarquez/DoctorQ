# src/routes/empresa.py
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.logger_config import get_logger
from src.models.empresa import EmpresaCreate, EmpresaResponse, EmpresaUpdate
from src.services.empresa_service import EmpresaService, get_empresa_service

logger = get_logger(__name__)

router = APIRouter(prefix="/empresas", tags=["empresas"])


# ==========================================
# ENDPOINTS
# ==========================================


@router.get("/", response_model=dict)
async def list_empresas(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por nome, razão social ou CNPJ"),
    plano: Optional[str] = Query(None, description="Filtrar por plano"),
    ativo: Optional[str] = Query(None, description="Filtrar por status (S/N)"),
    order_by: str = Query("dt_criacao", description="Campo para ordenação"),
    order_desc: bool = Query(True, description="Ordenação descendente"),
    empresa_service: EmpresaService = Depends(get_empresa_service),
):
    """Listar empresas com paginação e filtros"""
    try:
        empresas, total = await empresa_service.list_empresas(
            page=page,
            size=size,
            search=search,
            plano_filter=plano,
            ativo_filter=ativo,
            order_by=order_by,
            order_desc=order_desc,
        )

        # Adicionar estatísticas para cada empresa
        items = []
        for empresa in empresas:
            empresa_dict = EmpresaResponse.model_validate(empresa).model_dump()
            stats = await empresa_service.get_empresa_stats(empresa.id_empresa)
            empresa_dict.update(stats)
            items.append(empresa_dict)

        return {
            "items": items,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": (total + size - 1) // size,
                "currentPage": page,
            },
        }

    except Exception as e:
        logger.error(f"Erro ao listar empresas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def get_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service),
):
    """Obter uma empresa por ID"""
    try:
        empresa_uuid = uuid.UUID(empresa_id)
        empresa = await empresa_service.get_empresa_by_id(empresa_uuid)

        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")

        empresa_dict = EmpresaResponse.model_validate(empresa).model_dump()
        stats = await empresa_service.get_empresa_stats(empresa.id_empresa)
        empresa_dict.update(stats)

        return empresa_dict

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar empresa: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=EmpresaResponse, status_code=201)
async def create_empresa(
    empresa_data: EmpresaCreate,
    empresa_service: EmpresaService = Depends(get_empresa_service),
):
    """Criar uma nova empresa"""
    try:
        empresa = await empresa_service.create_empresa(empresa_data)
        return EmpresaResponse.model_validate(empresa)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao criar empresa: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def update_empresa(
    empresa_id: str,
    empresa_update: EmpresaUpdate,
    empresa_service: EmpresaService = Depends(get_empresa_service),
):
    """Atualizar uma empresa existente"""
    try:
        empresa_uuid = uuid.UUID(empresa_id)
        empresa = await empresa_service.update_empresa(empresa_uuid, empresa_update)

        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")

        return EmpresaResponse.model_validate(empresa)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar empresa: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{empresa_id}", status_code=200)
async def delete_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service),
):
    """Desativar uma empresa"""
    try:
        empresa_uuid = uuid.UUID(empresa_id)
        success = await empresa_service.delete_empresa(empresa_uuid)

        if not success:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")

        return {"message": "Empresa desativada com sucesso"}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar empresa: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
