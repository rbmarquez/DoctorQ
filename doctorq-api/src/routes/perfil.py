# src/routes/perfil.py
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.perfil import PerfilCreate, PerfilResponse, PerfilUpdate
from src.models.user import User
from src.services.perfil_service import PerfilService, get_perfil_service
from src.utils.auth import get_current_user
from src.utils.auth_helpers import get_user_empresa_id

logger = get_logger(__name__)

router = APIRouter(prefix="/perfis", tags=["perfis"])


# ==========================================
# ENDPOINTS
# ==========================================


@router.get("/", response_model=dict)
async def list_perfis(
    request: Request,
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(10, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por nome ou descrição"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo (system, custom)"),
    ativo: Optional[str] = Query(None, description="Filtrar por status (S/N)"),
    order_by: str = Query("dt_criacao", description="Campo para ordenação"),
    order_desc: bool = Query(True, description="Ordenação descendente"),
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """Listar perfis com paginação e filtros"""
    try:
        # 🔒 SEGURANÇA: Obter ID da empresa do usuário autenticado (JWT ou API Key)
        empresa_uuid = get_user_empresa_id(request)

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas perfis da empresa do usuário + perfis globais (templates)

        perfis, total = await perfil_service.list_perfis(
            page=page,
            size=size,
            search=search,
            tipo_filter=tipo,
            empresa_id=empresa_uuid,
            ativo_filter=ativo,
            order_by=order_by,
            order_desc=order_desc,
            include_empresa=True,
        )

        # Adicionar contagem de usuários para cada perfil
        items = []
        for perfil in perfis:
            perfil_dict = PerfilResponse.model_validate(perfil).model_dump()
            perfil_dict["nr_usuarios_com_perfil"] = await perfil_service.count_usuarios_com_perfil(
                perfil.id_perfil
            )
            if perfil.empresa:
                perfil_dict["nm_empresa"] = perfil.empresa.nm_empresa
            items.append(perfil_dict)

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
        logger.error(f"Erro ao listar perfis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/disponiveis", response_model=List[PerfilResponse])
async def get_perfis_disponiveis(
    current_user: User = Depends(get_current_user),
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """Obter perfis disponíveis para seleção (perfis da empresa + perfis globais)"""
    try:
        # 🔒 SEGURANÇA: Validar que o usuário tem empresa associada
        if not current_user.id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada. Entre em contato com o suporte."
            )

        # Usar empresa do usuário logado
        empresa_uuid = current_user.id_empresa
        perfis = await perfil_service.get_perfis_disponiveis_para_empresa(empresa_uuid)

        return [PerfilResponse.model_validate(p) for p in perfis]

    except Exception as e:
        logger.error(f"Erro ao buscar perfis disponíveis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{perfil_id}", response_model=PerfilResponse)
async def get_perfil(
    perfil_id: str,
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """Obter um perfil por ID"""
    try:
        perfil_uuid = uuid.UUID(perfil_id)
        perfil = await perfil_service.get_perfil_by_id(perfil_uuid, include_empresa=True)

        if not perfil:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")

        perfil_dict = PerfilResponse.model_validate(perfil).model_dump()
        perfil_dict["nr_usuarios_com_perfil"] = await perfil_service.count_usuarios_com_perfil(
            perfil.id_perfil
        )
        if perfil.empresa:
            perfil_dict["nm_empresa"] = perfil.empresa.nm_empresa

        return perfil_dict

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de perfil inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=PerfilResponse, status_code=201)
async def create_perfil(
    perfil_data: PerfilCreate,
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """
    Criar um novo perfil.

    Campos obrigatórios:
    - nm_perfil: Nome do perfil

    Campos opcionais:
    - ds_perfil: Descrição do perfil
    - id_empresa: ID da empresa (null = perfil global)
    - nm_tipo: Tipo (system/custom, padrão: custom)
    - ds_permissoes: Permissões legadas (compatibilidade)
    - ds_grupos_acesso: Lista de grupos que o perfil pode acessar (admin, clinica, profissional, paciente, fornecedor)
    - ds_permissoes_detalhadas: Permissões detalhadas por grupo e recurso
    - st_ativo: Status (S/N, padrão: S)
    """
    try:
        perfil = await perfil_service.create_perfil(perfil_data)
        return PerfilResponse.model_validate(perfil)

    except Exception as e:
        logger.error(f"Erro ao criar perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{perfil_id}", response_model=PerfilResponse)
async def update_perfil(
    perfil_id: str,
    perfil_update: PerfilUpdate,
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """
    Atualizar um perfil existente.

    Campos atualizáveis:
    - nm_perfil: Nome do perfil
    - ds_perfil: Descrição do perfil
    - ds_permissoes: Permissões legadas (compatibilidade)
    - ds_grupos_acesso: Lista de grupos que o perfil pode acessar (admin, clinica, profissional, paciente, fornecedor)
    - ds_permissoes_detalhadas: Permissões detalhadas por grupo e recurso
    - st_ativo: Status (S/N)
    """
    try:
        perfil_uuid = uuid.UUID(perfil_id)
        perfil = await perfil_service.update_perfil(perfil_uuid, perfil_update)

        if not perfil:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")

        return PerfilResponse.model_validate(perfil)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{perfil_id}", status_code=200)
async def delete_perfil(
    perfil_id: str,
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """Desativar um perfil"""
    try:
        perfil_uuid = uuid.UUID(perfil_id)
        success = await perfil_service.delete_perfil(perfil_uuid)

        if not success:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")

        return {"message": "Perfil desativado com sucesso"}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clone/{id_perfil_template}", response_model=PerfilResponse, status_code=201)
async def clone_perfil_template(
    id_perfil_template: str,
    id_empresa: str = Query(..., description="UUID da empresa para a qual clonar o perfil"),
    nm_perfil_novo: Optional[str] = Query(None, description="Nome customizado para o perfil clonado (opcional)"),
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """
    Clonar um perfil template global para uma empresa específica.

    Este endpoint permite que administradores clonem perfis templates globais
    (fg_template=true, id_empresa=NULL) para empresas específicas, criando
    perfis customizáveis para cada organização.

    Args:
        id_perfil_template: UUID do perfil template a ser clonado
        id_empresa: UUID da empresa para a qual clonar o perfil
        nm_perfil_novo: Nome customizado para o clone (opcional, usa nome do template se omitido)

    Returns:
        Perfil clonado com id_empresa definido

    Raises:
        400: ID inválido ou perfil não é template
        404: Perfil template não encontrado
        409: Perfil já existe para esta empresa (retorna existente)
        500: Erro interno

    Example:
        POST /perfis/clone/fd2bb1d1-51aa-4b96-a17c-c880260621cc?id_empresa=123e4567-e89b-12d3-a456-426614174000

        Response 201:
        {
            "id_perfil": "new-uuid",
            "id_empresa": "123e4567-e89b-12d3-a456-426614174000",
            "nm_perfil": "Gestor de Clínica",
            "fg_template": false,
            "ds_grupos_acesso": ["clinica"],
            "ds_permissoes_detalhadas": {...}
        }
    """
    try:
        # Validar UUIDs
        template_uuid = uuid.UUID(id_perfil_template)
        empresa_uuid = uuid.UUID(id_empresa)

        # Clonar perfil
        perfil_clone = await perfil_service.clone_perfil_template(
            id_perfil_template=template_uuid,
            id_empresa=empresa_uuid,
            nm_perfil_novo=nm_perfil_novo
        )

        if not perfil_clone:
            raise HTTPException(status_code=404, detail="Perfil template não encontrado")

        return PerfilResponse.model_validate(perfil_clone)

    except ValueError as e:
        # Validation errors (não é template, etc.)
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao clonar perfil template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# NOVOS ENDPOINTS - GESTÃO HIERÁRQUICA
# ==========================================


@router.get("/hierarquia/tree", response_model=dict)
async def get_perfis_tree(
    tipo_acesso: Optional[str] = Query(None, description="Filtrar por tipo de acesso (admin, parceiro, fornecedor, paciente)"),
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """
    Obter perfis em estrutura de árvore hierárquica.

    Retorna perfis raiz com seus sub-perfis aninhados.
    """
    try:
        tree = await perfil_service.get_perfis_tree(tipo_acesso_filter=tipo_acesso)
        return {"tree": tree, "total": len(tree)}

    except Exception as e:
        logger.error(f"Erro ao buscar árvore de perfis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hierarquia/stats", response_model=dict)
async def get_perfis_stats(
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """
    Obter estatísticas de perfis por tipo de acesso.

    Retorna contagem de perfis, sub-perfis e usuários por tipo.
    """
    try:
        stats = await perfil_service.get_perfis_stats_by_tipo()
        return stats

    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas de perfis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{perfil_id}/permissoes-completas", response_model=dict)
async def get_permissoes_com_heranca(
    perfil_id: str,
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """
    Obter permissões completas de um perfil com herança do perfil pai.

    Combina permissões do perfil pai (se houver) com permissões próprias.
    """
    try:
        perfil_uuid = uuid.UUID(perfil_id)
        permissoes = await perfil_service.get_permissoes_com_heranca(perfil_uuid)

        if permissoes is None:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")

        return permissoes

    except ValueError:
        raise HTTPException(status_code=400, detail="ID de perfil inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar permissões com herança: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tipo-acesso/{tipo}", response_model=dict)
async def list_perfis_by_tipo_acesso(
    tipo: str,
    perfil_service: PerfilService = Depends(get_perfil_service),
):
    """
    Listar perfis por tipo de acesso (admin, parceiro, fornecedor, paciente).

    Retorna perfis raiz e sub-perfis agrupados.
    """
    try:
        perfis = await perfil_service.get_perfis_by_tipo_acesso(tipo)

        # Agrupar perfis raiz e sub-perfis
        perfis_raiz = [p for p in perfis if p.id_perfil_pai is None]
        sub_perfis = [p for p in perfis if p.id_perfil_pai is not None]

        return {
            "tipo_acesso": tipo,
            "perfis_raiz": [PerfilResponse.model_validate(p).model_dump() for p in perfis_raiz],
            "sub_perfis": [PerfilResponse.model_validate(p).model_dump() for p in sub_perfis],
            "total": len(perfis),
        }

    except Exception as e:
        logger.error(f"Erro ao buscar perfis por tipo de acesso: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# RECURSOS DE PERMISSÕES
# ==========================================


@router.get("/permissoes/recursos/", response_model=dict)
async def get_recursos_permissoes():
    """
    Obter estrutura completa de recursos e ações de permissões.

    Retorna todos os recursos disponíveis no sistema e suas ações possíveis.

    Returns:
        dict: Estrutura de recursos com ações

    Example Response:
        {
            "recursos": [
                {
                    "key": "agendamentos",
                    "label": "Agendamentos",
                    "description": "Gestão de agendamentos de consultas e procedimentos",
                    "icon": "calendar",
                    "acoes": [
                        {"key": "visualizar", "label": "Visualizar", "description": "Ver agendamentos"},
                        {"key": "criar", "label": "Criar", "description": "Criar novos agendamentos"},
                        {"key": "editar", "label": "Editar", "description": "Modificar agendamentos"},
                        {"key": "excluir", "label": "Excluir", "description": "Remover agendamentos"}
                    ]
                },
                ...
            ]
        }
    """
    recursos = [
        {
            "key": "agendamentos",
            "label": "Agendamentos",
            "description": "Gestão de agendamentos de consultas e procedimentos",
            "icon": "calendar",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver agendamentos"},
                {"key": "criar", "label": "Criar", "description": "Criar novos agendamentos"},
                {"key": "editar", "label": "Editar", "description": "Modificar agendamentos existentes"},
                {"key": "excluir", "label": "Excluir", "description": "Remover agendamentos"},
            ],
        },
        {
            "key": "pacientes",
            "label": "Pacientes",
            "description": "Cadastro e gestão de pacientes",
            "icon": "users",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver dados de pacientes"},
                {"key": "criar", "label": "Criar", "description": "Cadastrar novos pacientes"},
                {"key": "editar", "label": "Editar", "description": "Alterar dados de pacientes"},
                {"key": "excluir", "label": "Excluir", "description": "Remover cadastros"},
            ],
        },
        {
            "key": "profissionais",
            "label": "Profissionais",
            "description": "Cadastro e gestão de profissionais",
            "icon": "user-plus",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver profissionais"},
                {"key": "criar", "label": "Criar", "description": "Adicionar profissionais"},
                {"key": "editar", "label": "Editar", "description": "Alterar dados"},
                {"key": "excluir", "label": "Excluir", "description": "Remover profissionais"},
            ],
        },
        {
            "key": "procedimentos",
            "label": "Procedimentos",
            "description": "Catálogo de procedimentos e serviços",
            "icon": "briefcase",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver procedimentos"},
                {"key": "criar", "label": "Criar", "description": "Adicionar procedimentos"},
                {"key": "editar", "label": "Editar", "description": "Alterar procedimentos"},
                {"key": "excluir", "label": "Excluir", "description": "Remover procedimentos"},
            ],
        },
        {
            "key": "financeiro",
            "label": "Financeiro",
            "description": "Gestão financeira e faturamento",
            "icon": "dollar-sign",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver dados financeiros"},
                {"key": "criar", "label": "Criar", "description": "Criar lançamentos"},
                {"key": "editar", "label": "Editar", "description": "Alterar lançamentos"},
                {"key": "excluir", "label": "Excluir", "description": "Remover lançamentos"},
            ],
        },
        {
            "key": "relatorios",
            "label": "Relatórios",
            "description": "Relatórios e análises",
            "icon": "file-text",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver relatórios"},
                {"key": "criar", "label": "Criar", "description": "Gerar relatórios"},
                {"key": "editar", "label": "Editar", "description": "Customizar relatórios"},
                {"key": "excluir", "label": "Excluir", "description": "Remover relatórios"},
            ],
        },
        {
            "key": "configuracoes",
            "label": "Configurações",
            "description": "Configurações do sistema",
            "icon": "settings",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver configurações"},
                {"key": "criar", "label": "Criar", "description": "Criar configurações"},
                {"key": "editar", "label": "Editar", "description": "Alterar configurações"},
                {"key": "excluir", "label": "Excluir", "description": "Remover configurações"},
            ],
        },
        {
            "key": "equipe",
            "label": "Equipe",
            "description": "Gestão de usuários e equipe",
            "icon": "users",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver membros da equipe"},
                {"key": "criar", "label": "Criar", "description": "Adicionar membros"},
                {"key": "editar", "label": "Editar", "description": "Alterar dados"},
                {"key": "excluir", "label": "Excluir", "description": "Remover membros"},
            ],
        },
        {
            "key": "perfis",
            "label": "Perfis e Permissões",
            "description": "Gestão de perfis de acesso e permissões",
            "icon": "shield",
            "acoes": [
                {"key": "visualizar", "label": "Visualizar", "description": "Ver perfis"},
                {"key": "criar", "label": "Criar", "description": "Criar perfis"},
                {"key": "editar", "label": "Editar", "description": "Alterar perfis"},
                {"key": "excluir", "label": "Excluir", "description": "Remover perfis"},
            ],
        },
    ]

    return {
        "recursos": recursos,
        "total_recursos": len(recursos),
        "acoes_padrao": ["visualizar", "criar", "editar", "excluir"],
    }
