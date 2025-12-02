# src/routes/clinica_team_route.py
"""
Rotas para gestão de equipe (sub-usuários) de clínicas.

Endpoints:
- POST /clinicas/{id_empresa}/usuarios/ - Criar novo membro da equipe
- GET /clinicas/{id_empresa}/usuarios/ - Listar membros da equipe
- DELETE /clinicas/{id_empresa}/usuarios/{id_usuario}/ - Remover membro
- GET /clinicas/{id_empresa}/limites/ - Verificar limites de usuários
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.services.clinica_team_service import ClinicaTeamService
from src.middleware.apikey_auth import get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/clinicas", tags=["clinicas", "equipe"])


# ==========================================
# SCHEMAS PYDANTIC
# ==========================================


class UsuarioEquipeCreate(BaseModel):
    """Schema para criação de usuário de equipe"""

    nm_email: EmailStr = Field(..., description="Email do novo usuário")
    nm_completo: str = Field(..., min_length=3, max_length=255, description="Nome completo")
    nm_perfil: str = Field(
        ...,
        description="Nome do perfil (Recepcionista, Financeiro, Gestor de Clínica)",
    )
    senha: Optional[str] = Field(
        None,
        min_length=6,
        description="Senha (gerada automaticamente se não fornecida)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "nm_email": "joao.recepcionista@clinica.com.br",
                "nm_completo": "João da Silva",
                "nm_perfil": "Recepcionista",
                "senha": "SenhaSegura123",
            }
        }


class UsuarioEquipeResponse(BaseModel):
    """Schema para resposta de usuário de equipe"""

    id_user: str
    nm_email: str
    nm_completo: str
    nm_perfil: Optional[str]
    ds_perfil: Optional[str]
    dt_criacao: Optional[str]
    dt_ultimo_login: Optional[str]
    nr_total_logins: str
    id_usuario_criador: Optional[str]
    nm_criador: Optional[str]
    st_ativo: str

    class Config:
        from_attributes = True


class LimiteUsuariosResponse(BaseModel):
    """Schema para resposta de limites"""

    qt_limite_usuarios: int
    qt_usuarios_atuais: int
    qt_usuarios_disponiveis: int
    fg_limite_atingido: bool


class RemoverUsuarioResponse(BaseModel):
    """Schema para resposta de remoção"""

    message: str
    id_usuario: str


class AlterarPerfilRequest(BaseModel):
    """Schema para alteração de perfil"""

    novo_perfil: str = Field(
        ...,
        description="Nome do novo perfil (Recepcionista, Financeiro, Gestor de Clínica)",
    )


class AlterarPerfilResponse(BaseModel):
    """Schema para resposta de alteração de perfil"""

    message: str
    id_usuario: str
    perfil_anterior: str
    perfil_novo: str


class AjustarLimitesRequest(BaseModel):
    """Schema para ajuste de limites"""

    novo_limite: int = Field(..., ge=1, le=1000, description="Novo limite de usuários (1-1000)")


class AjustarLimitesResponse(BaseModel):
    """Schema para resposta de ajuste de limites"""

    message: str
    qt_limite_anterior: int
    qt_limite_novo: int
    qt_usuarios_atuais: int
    qt_usuarios_disponiveis: int


class ReativarUsuarioResponse(BaseModel):
    """Schema para resposta de reativação"""

    message: str
    id_usuario: str
    nm_email: str
    nm_perfil: Optional[str]


# ==========================================
# DEPENDENCY INJECTION
# ==========================================


async def get_clinica_team_service(db: AsyncSession = Depends(get_db)) -> ClinicaTeamService:
    """Dependency injection para ClinicaTeamService"""
    return ClinicaTeamService(db)


# ==========================================
# ENDPOINTS
# ==========================================


@router.post(
    "/{id_empresa}/usuarios/",
    response_model=UsuarioEquipeResponse,
    status_code=201,
    summary="Criar novo membro da equipe",
    description="""
    Cria novo sub-usuário (membro da equipe) para a clínica.

    **Validações**:
    - Usuário autenticado deve ser admin da clínica
    - Limite de usuários não pode estar atingido
    - Email não pode estar duplicado
    - Perfil deve existir e ser apropriado

    **Perfis disponíveis**:
    - Recepcionista: Gestão de agendamentos e pacientes
    - Financeiro: Gestão financeira e cobranças
    - Gestor de Clínica: Gestão completa da clínica
    """,
)
async def criar_usuario_equipe(
    id_empresa: str,
    usuario_data: UsuarioEquipeCreate,
    request: Request,
    team_service: ClinicaTeamService = Depends(get_clinica_team_service),
):
    """Criar novo membro da equipe"""
    try:
        # Extrair usuário autenticado do JWT
        current_user = get_current_user(request)

        if not current_user or not current_user.get("uid"):
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")

        id_usuario_criador = uuid.UUID(current_user["uid"])
        id_empresa_uuid = uuid.UUID(id_empresa)

        # Validar que usuário pertence à empresa solicitada
        user_empresa_id = current_user.id_empresa
        if not user_empresa_id or str(user_empresa_id) != id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não tem permissão para gerenciar esta empresa"
            )

        # Criar usuário
        novo_usuario = await team_service.criar_usuario_equipe(
            id_empresa=id_empresa_uuid,
            id_usuario_criador=id_usuario_criador,
            nm_email=usuario_data.nm_email,
            nm_completo=usuario_data.nm_completo,
            nm_perfil=usuario_data.nm_perfil,
            senha=usuario_data.senha,
        )

        logger.info(
            f"Novo usuário de equipe criado: {novo_usuario.nm_email} "
            f"(empresa: {id_empresa})"
        )

        # Buscar perfil para retornar informações completas
        return {
            "id_user": str(novo_usuario.id_user),
            "nm_email": novo_usuario.nm_email,
            "nm_completo": novo_usuario.nm_completo,
            "nm_perfil": usuario_data.nm_perfil,
            "ds_perfil": None,
            "dt_criacao": novo_usuario.dt_criacao.isoformat() if novo_usuario.dt_criacao else None,
            "dt_ultimo_login": None,
            "nr_total_logins": "0",
            "id_usuario_criador": str(id_usuario_criador),
            "nm_criador": None,  # Poderia buscar, mas não é essencial na resposta
            "st_ativo": "S",
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao criar usuário de equipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get(
    "/{id_empresa}/usuarios/",
    response_model=List[UsuarioEquipeResponse],
    summary="Listar membros da equipe",
    description="""
    Lista todos os membros da equipe da clínica.

    **Retorna**:
    - Lista de usuários ativos da empresa
    - Informações do perfil de cada usuário
    - Dados de criação e último login
    """,
)
async def listar_equipe(
    id_empresa: str,
    request: Request,
    team_service: ClinicaTeamService = Depends(get_clinica_team_service),
):
    """Listar todos os membros da equipe"""
    try:
        # Extrair usuário autenticado
        current_user = get_current_user(request)

        if not current_user or not current_user.get("uid"):
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")

        id_usuario_solicitante = uuid.UUID(current_user["uid"])
        id_empresa_uuid = uuid.UUID(id_empresa)

        # Validar que usuário pertence à empresa solicitada
        user_empresa_id = current_user.id_empresa
        if not user_empresa_id or str(user_empresa_id) != id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não tem permissão para acessar esta empresa"
            )

        # Listar equipe
        equipe = await team_service.listar_equipe(id_empresa_uuid, id_usuario_solicitante)

        logger.info(f"Listados {len(equipe)} membros da equipe (empresa: {id_empresa})")

        return equipe

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar equipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.delete(
    "/{id_empresa}/usuarios/{id_usuario}/",
    response_model=RemoverUsuarioResponse,
    summary="Remover membro da equipe",
    description="""
    Remove (desativa) membro da equipe.

    **Validações**:
    - Usuário autenticado deve ser admin da clínica
    - Não pode remover a si mesmo
    - Não pode remover admin principal (apenas sub-usuários)
    """,
)
async def remover_usuario_equipe(
    id_empresa: str,
    id_usuario: str,
    request: Request,
    team_service: ClinicaTeamService = Depends(get_clinica_team_service),
):
    """Remover membro da equipe"""
    try:
        # Extrair usuário autenticado
        current_user = get_current_user(request)

        if not current_user or not current_user.get("uid"):
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")

        id_usuario_solicitante = uuid.UUID(current_user["uid"])
        id_empresa_uuid = uuid.UUID(id_empresa)
        id_usuario_remover = uuid.UUID(id_usuario)

        # Validar que usuário pertence à empresa solicitada
        user_empresa_id = current_user.id_empresa
        if not user_empresa_id or str(user_empresa_id) != id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não tem permissão para gerenciar esta empresa"
            )

        # Remover usuário
        result = await team_service.remover_usuario_equipe(
            id_empresa_uuid, id_usuario_solicitante, id_usuario_remover
        )

        logger.info(
            f"Usuário {id_usuario} removido da equipe (empresa: {id_empresa})"
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover usuário da equipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get(
    "/{id_empresa}/limites/",
    response_model=LimiteUsuariosResponse,
    summary="Verificar limites de usuários",
    description="""
    Verifica status do limite de usuários da empresa.

    **Retorna**:
    - qt_limite_usuarios: Limite configurado no pacote
    - qt_usuarios_atuais: Usuários ativos no momento
    - qt_usuarios_disponiveis: Vagas disponíveis
    - fg_limite_atingido: Se limite foi atingido
    """,
)
async def verificar_limite(
    id_empresa: str,
    request: Request,
    team_service: ClinicaTeamService = Depends(get_clinica_team_service),
):
    """Verificar limites de usuários"""
    try:
        # Extrair usuário autenticado
        current_user = get_current_user(request)

        if not current_user or not current_user.get("uid"):
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")

        id_empresa_uuid = uuid.UUID(id_empresa)

        # Validar que usuário pertence à empresa solicitada
        user_empresa_id = current_user.id_empresa
        if not user_empresa_id or str(user_empresa_id) != id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não tem permissão para acessar esta empresa"
            )

        # Verificar limites
        limites = await team_service.verificar_limite(id_empresa_uuid)

        logger.info(f"Limites verificados (empresa: {id_empresa})")

        return limites

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar limites: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.patch(
    "/{id_empresa}/usuarios/{id_usuario}/perfil/",
    response_model=AlterarPerfilResponse,
    summary="Alterar perfil de sub-usuário",
    description="""
    Altera o perfil de um membro da equipe.

    **Validações**:
    - Usuário autenticado deve ser admin da clínica
    - Usuário alvo deve existir e estar ativo
    - Novo perfil deve existir e ser apropriado
    - Não pode alterar perfil de administradores

    **Perfis disponíveis**:
    - Recepcionista
    - Financeiro
    - Gestor de Clínica

    **Uso comum**: Promover Recepcionista a Gestor de Clínica, ou ajustar responsabilidades
    """,
)
async def alterar_perfil_usuario(
    id_empresa: str,
    id_usuario: str,
    perfil_data: AlterarPerfilRequest,
    request: Request,
    team_service: ClinicaTeamService = Depends(get_clinica_team_service),
):
    """Alterar perfil de sub-usuário"""
    try:
        # Extrair usuário autenticado
        current_user = get_current_user(request)

        if not current_user or not current_user.get("uid"):
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")

        id_usuario_solicitante = uuid.UUID(current_user["uid"])
        id_empresa_uuid = uuid.UUID(id_empresa)
        id_usuario_alterar = uuid.UUID(id_usuario)

        # Validar que usuário pertence à empresa solicitada
        user_empresa_id = current_user.id_empresa
        if not user_empresa_id or str(user_empresa_id) != id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não tem permissão para gerenciar esta empresa"
            )

        # Alterar perfil
        result = await team_service.alterar_perfil_usuario(
            id_empresa_uuid,
            id_usuario_solicitante,
            id_usuario_alterar,
            perfil_data.novo_perfil,
        )

        logger.info(
            f"Perfil do usuário {id_usuario} alterado para {perfil_data.novo_perfil} "
            f"(empresa: {id_empresa})"
        )

        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao alterar perfil do usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.put(
    "/{id_empresa}/limites/",
    response_model=AjustarLimitesResponse,
    summary="Ajustar limites de usuários",
    description="""
    Ajusta o limite máximo de usuários da empresa.

    **Validações**:
    - Usuário autenticado deve ser admin da clínica
    - Novo limite deve estar entre 1 e 1000
    - Novo limite não pode ser menor que usuários ativos atuais

    **Uso comum**:
    - Aumentar limite ao crescer a equipe
    - Ajustar após upgrade/downgrade de plano
    - Integração com sistema de billing

    **Observação**: Quando limite atinge 90%, sistema deve enviar notificação
    """,
)
async def ajustar_limites(
    id_empresa: str,
    limites_data: AjustarLimitesRequest,
    request: Request,
    team_service: ClinicaTeamService = Depends(get_clinica_team_service),
):
    """Ajustar limites de usuários"""
    try:
        # Extrair usuário autenticado
        current_user = get_current_user(request)

        if not current_user or not current_user.get("uid"):
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")

        id_usuario_solicitante = uuid.UUID(current_user["uid"])
        id_empresa_uuid = uuid.UUID(id_empresa)

        # Validar que usuário pertence à empresa solicitada
        user_empresa_id = current_user.id_empresa
        if not user_empresa_id or str(user_empresa_id) != id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não tem permissão para gerenciar esta empresa"
            )

        # Ajustar limites
        result = await team_service.ajustar_limites_empresa(
            id_empresa_uuid,
            id_usuario_solicitante,
            limites_data.novo_limite,
        )

        logger.info(
            f"Limites da empresa {id_empresa} ajustados para {limites_data.novo_limite}"
        )

        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao ajustar limites: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post(
    "/{id_empresa}/usuarios/{id_usuario}/reativar/",
    response_model=ReativarUsuarioResponse,
    summary="Reativar usuário removido",
    description="""
    Reativa um usuário previamente desativado da equipe.

    **Validações**:
    - Usuário autenticado deve ser admin da clínica
    - Usuário alvo deve existir e estar inativo
    - Limite de usuários não pode estar atingido
    - Não pode reativar administradores

    **Uso comum**:
    - Usuário foi removido por engano
    - Funcionário retornou após afastamento
    - Reaproveitamento de conta anterior

    **Observação**: Preferível a criar novo usuário para manter histórico
    """,
)
async def reativar_usuario(
    id_empresa: str,
    id_usuario: str,
    request: Request,
    team_service: ClinicaTeamService = Depends(get_clinica_team_service),
):
    """Reativar usuário removido"""
    try:
        # Extrair usuário autenticado
        current_user = get_current_user(request)

        if not current_user or not current_user.get("uid"):
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")

        id_usuario_solicitante = uuid.UUID(current_user["uid"])
        id_empresa_uuid = uuid.UUID(id_empresa)
        id_usuario_reativar = uuid.UUID(id_usuario)

        # Validar que usuário pertence à empresa solicitada
        user_empresa_id = current_user.id_empresa
        if not user_empresa_id or str(user_empresa_id) != id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não tem permissão para gerenciar esta empresa"
            )

        # Reativar usuário
        result = await team_service.reativar_usuario_equipe(
            id_empresa_uuid,
            id_usuario_solicitante,
            id_usuario_reativar,
        )

        logger.info(
            f"Usuário {id_usuario} reativado (empresa: {id_empresa})"
        )

        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao reativar usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
