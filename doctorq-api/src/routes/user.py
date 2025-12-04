import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer

from typing import Optional

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import (
    User,
    PapelUsuario,
    UserResponse,
    UserRegister,
    UserLoginLocal,
    UserOAuthLogin,
    UserOAuthResponse,
    UserUpdate,
    UserListResponse,
    UserChangePassword,
)
from src.models.password_reset import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ValidateResetTokenRequest,
    ValidateResetTokenResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
from src.services.user_service import UserService, get_user_service
from src.services.password_reset_service import PasswordResetService
from src.utils.auth import get_current_apikey, get_current_user
from src.utils.auth_helpers import get_user_empresa_id
from src.utils.security import decode_access_token
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()


# ========== Papéis (Roles) Endpoints ==========


@router.get("/papeis/", response_model=list[dict])
async def list_papeis(_: object = Depends(get_current_apikey)):
    """
    Lista todos os papéis (roles) disponíveis no sistema.

    Returns:
        Lista de papéis com informações detalhadas

    Example Response:
        [
            {
                "value": "admin",
                "label": "Administrador",
                "description": "Acesso total ao sistema",
                "color": "red",
                "permissions": ["all"]
            },
            {
                "value": "gestor_clinica",
                "label": "Gestor de Clínica",
                "description": "Gestão completa da clínica",
                "color": "blue",
                "permissions": ["manage_clinic", "view_reports"]
            }
        ]
    """
    papeis = [
        {
            "value": "admin",
            "label": "Administrador",
            "description": "Acesso total ao sistema e gerenciamento de todas as empresas",
            "color": "red",
            "permissions": ["all"],
        },
        {
            "value": "gestor_clinica",
            "label": "Gestor de Clínica",
            "description": "Gestão completa da clínica incluindo equipe e configurações",
            "color": "blue",
            "permissions": [
                "manage_clinic",
                "manage_team",
                "view_reports",
                "manage_schedules",
                "manage_patients",
                "manage_professionals",
                "manage_procedures",
                "manage_financial",
            ],
        },
        {
            "value": "profissional",
            "label": "Profissional",
            "description": "Profissional de saúde estética (médico, esteticista, etc.)",
            "color": "green",
            "permissions": [
                "view_own_schedule",
                "manage_own_patients",
                "view_own_procedures",
                "view_own_financial",
            ],
        },
        {
            "value": "recepcionista",
            "label": "Recepcionista",
            "description": "Atendimento e agendamento de pacientes",
            "color": "purple",
            "permissions": [
                "manage_schedules",
                "view_patients",
                "create_patients",
            ],
        },
        {
            "value": "secretaria",
            "label": "Secretária",
            "description": "Suporte administrativo e atendimento ao cliente",
            "color": "pink",
            "permissions": [
                "manage_schedules",
                "view_patients",
                "view_procedures",
            ],
        },
        {
            "value": "financeiro",
            "label": "Financeiro",
            "description": "Gestão financeira e faturamento",
            "color": "yellow",
            "permissions": [
                "manage_financial",
                "view_reports",
                "manage_invoices",
            ],
        },
        {
            "value": "auxiliar",
            "label": "Auxiliar",
            "description": "Suporte aos profissionais durante procedimentos",
            "color": "gray",
            "permissions": [
                "view_schedules",
                "view_procedures",
            ],
        },
        {
            "value": "paciente",
            "label": "Paciente",
            "description": "Cliente/paciente da clínica",
            "color": "teal",
            "permissions": [
                "view_own_data",
                "book_appointments",
                "view_own_procedures",
                "manage_own_profile",
            ],
        },
        {
            "value": "usuario",
            "label": "Usuário Padrão",
            "description": "Acesso básico ao sistema",
            "color": "slate",
            "permissions": [
                "view_own_data",
            ],
        },
        {
            "value": "analista",
            "label": "Analista",
            "description": "Análise de dados e relatórios",
            "color": "cyan",
            "permissions": [
                "view_reports",
                "export_data",
            ],
        },
    ]

    return papeis


@router.post("/register", response_model=UserResponse, status_code=201)
async def register_user(
    register_data: UserRegister,
    user_service: UserService = Depends(get_user_service),
):
    """
    Endpoint para cadastro local de usuário
    """
    try:
        user = await user_service.register_local_user(register_data)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erro ao registrar usuário: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/login-local")
async def login_local(
    login_data: UserLoginLocal,
    user_service: UserService = Depends(get_user_service),
):
    """
    Endpoint para login local por email/senha. Retorna JWT.
    """
    try:
        token = await user_service.login_local(login_data)
        user = await user_service.get_user_by_email(login_data.nm_email)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user) if user else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no login local: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/oauth-login", response_model=UserOAuthResponse)
async def oauth_login(
    oauth_data: UserOAuthLogin,
    user_service: UserService = Depends(get_user_service),
):
    """
    Endpoint para login/registro via OAuth (Google, Microsoft, Apple).
    Cria usuário automaticamente se não existir.
    """
    try:
        user, access_token = await user_service.oauth_login(oauth_data)

        return UserOAuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token,
            token_type="bearer",
        )
    except Exception as e:
        logger.error(f"Erro no login OAuth ({oauth_data.provider}): {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar autenticação OAuth: {str(e)}",
        ) from e


@router.get("/me")
async def get_me(
    token_credentials: object = Depends(security),
    user_service: UserService = Depends(get_user_service),
):
    """
    Retorna dados do usuário autenticado pelo JWT.
    """
    try:
        token = token_credentials.credentials  # type: ignore[attr-defined]
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(status_code=401, detail="Token inválido")
        email = payload["sub"]
        user = await user_service.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        return UserResponse.model_validate(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter perfil: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/", response_model=dict)
async def list_users(
    request: Request,
    page: int = 1,
    size: int = 10,
    search: Optional[str] = None,
    papel: Optional[str] = None,
    ativo: Optional[str] = None,
    order_by: str = "dt_criacao",
    order_desc: bool = True,
    user_service: UserService = Depends(get_user_service),
):
    """
    Lista usuários com paginação e filtros.
    ⚠️ FILTRO OBRIGATÓRIO: Apenas usuários da empresa do usuário logado.
    """
    try:
        # 🔒 SEGURANÇA: Validar que o usuário tem empresa associada
        # Obter ID da empresa do usuário autenticado (JWT ou API Key)
        user_empresa_uuid = get_user_empresa_id(request)

        if not user_empresa_uuid:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada. Entre em contato com o suporte."
            )

        # Usar id_empresa do usuário logado (obrigatório)
        empresa_filter = str(user_empresa_uuid)

        # Validar e converter papel se fornecido
        papel_filter = None
        if papel:
            try:
                papel_filter = PapelUsuario(papel.lower())
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Papel inválido. Opções: {[p.value for p in PapelUsuario]}",
                )

        # Validar status ativo
        if ativo and ativo not in ["S", "N"]:
            raise HTTPException(
                status_code=400, detail="Status ativo inválido. Use 'S' ou 'N'"
            )

        # Buscar usuários
        users, total = await user_service.list_users(
            page=page,
            size=size,
            search=search,
            papel_filter=papel_filter,
            ativo_filter=ativo,
            empresa_filter=empresa_filter,
            order_by=order_by,
            order_desc=order_desc,
        )

        # Retornar resposta paginada
        response = UserListResponse.create_response(users, total, page, size)
        return response.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar usuários: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id_endpoint(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    """
    Busca um usuário específico por ID
    """
    try:
        # Validar UUID
        try:
            uuid_obj = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Buscar usuário
        user = await user_service.get_user_by_id(uuid_obj)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        return UserResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar usuário {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: str,
    user_update: UserUpdate,
    user_service: UserService = Depends(get_user_service),
):
    """
    Atualiza um usuário existente
    """
    try:
        # Validar UUID
        try:
            uuid_obj = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Garantir que o ID no payload seja igual ao ID da URL
        user_update.id_user = uuid_obj

        # Atualizar usuário
        updated_user = await user_service.update_user(uuid_obj, user_update)
        if not updated_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        return UserResponse.model_validate(updated_user)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar usuário {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.delete("/{user_id}")
async def deactivate_user_endpoint(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    """
    Desativa um usuário (soft delete - st_ativo = 'N')
    """
    try:
        # Validar UUID
        try:
            uuid_obj = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Desativar usuário
        deactivated_user = await user_service.deactivate_user(uuid_obj)
        if not deactivated_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        return {"message": "Usuário desativado com sucesso", "user_id": user_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao desativar usuário {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.get("/{user_id}/sei")
async def get_user_sei_unidades(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    """
    Lista unidades SEI do usuÃ¡rio
    """
    try:
        logger.debug(f"Buscando unidades SEI para usuÃ¡rio {user_id}")

        # Validar UUID
        try:
            uuid_obj = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuÃ¡rio invÃ¡lido")

        # Verificar se usuÃ¡rio existe
        user = await user_service.get_user_by_id(uuid_obj)
        if not user:
            raise HTTPException(status_code=404, detail="UsuÃ¡rio nÃ£o encontrado")

        # Buscar unidades SEI
        data = await user_service.get_unidade_sei(user_id)

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar unidades SEI do usuÃ¡rio {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.post("/{user_id}/sei/sync")
async def force_sync_user_sei_unidades(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    """
    ForÃ§a sincronizaÃ§Ã£o imediata das unidades SEI do usuÃ¡rio (retry manual)
    """
    try:
        logger.debug(f"SincronizaÃ§Ã£o SEI forÃ§ada para usuÃ¡rio {user_id}")

        # Validar UUID
        try:
            uuid_obj = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuÃ¡rio invÃ¡lido")

        # Verificar se usuÃ¡rio existe
        user = await user_service.get_user_by_id(uuid_obj)
        if not user:
            raise HTTPException(status_code=404, detail="UsuÃ¡rio nÃ£o encontrado")

        # ForÃ§ar sincronizaÃ§Ã£o SEI
        result = await user_service.force_sei_sync(user.nm_email, user_id)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao forÃ§ar sincronizaÃ§Ã£o SEI do usuÃ¡rio {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


@router.put("/{user_id}/password")
async def change_user_password(
    user_id: str,
    password_data: UserChangePassword,
    user_service: UserService = Depends(get_user_service),
):
    """
    Endpoint para mudança de senha do usuário

    Args:
        user_id: ID do usuário
        password_data: Dados da mudança de senha (senha_atual, senha_nova, senha_nova_confirmacao)

    Returns:
        dict: Mensagem de sucesso

    Raises:
        HTTPException 400: ID inválido ou senhas não coincidem
        HTTPException 401: Senha atual incorreta
        HTTPException 404: Usuário não encontrado
        HTTPException 500: Erro interno

    Example:
        PUT /users/{user_id}/password
        {
            "senha_atual": "senhaAntiga123",
            "senha_nova": "senhaNova456",
            "senha_nova_confirmacao": "senhaNova456"
        }
    """
    try:
        # Validar UUID
        try:
            uuid_obj = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Alterar senha
        success = await user_service.change_password(
            user_id=uuid_obj,
            senha_atual=password_data.senha_atual,
            senha_nova=password_data.senha_nova,
        )

        if success:
            return {
                "message": "Senha alterada com sucesso",
                "success": True,
            }
        else:
            raise HTTPException(status_code=500, detail="Erro ao alterar senha")

    except ValueError as e:
        error_msg = str(e)
        if "não encontrado" in error_msg:
            raise HTTPException(status_code=404, detail=error_msg)
        elif "incorreta" in error_msg:
            raise HTTPException(status_code=401, detail=error_msg)
        else:
            raise HTTPException(status_code=400, detail=error_msg)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao alterar senha do usuário {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e


# ========== Password Reset Endpoints ==========


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint para solicitar recuperação de senha.
    Envia email com link de recuperação.

    Args:
        request_data: Email do usuário
        request: Request do FastAPI
        db: Sessão do banco de dados

    Returns:
        ForgotPasswordResponse: Confirmação de envio

    Example:
        POST /users/forgot-password
        {
            "email": "usuario@exemplo.com"
        }

    Response:
        {
            "message": "Email enviado com sucesso",
            "email": "usuario@exemplo.com"
        }
    """
    service = PasswordResetService(db)
    return await service.forgot_password(request_data, request)


@router.post("/validate-reset-token", response_model=ValidateResetTokenResponse)
async def validate_reset_token(
    request_data: ValidateResetTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint para validar token de recuperação de senha.

    Args:
        request_data: Token de recuperação
        db: Sessão do banco de dados

    Returns:
        ValidateResetTokenResponse: Status de validade do token

    Example:
        POST /users/validate-reset-token
        {
            "token": "abc123def456..."
        }

    Response:
        {
            "valid": true,
            "expires_at": "2025-10-30T12:30:00Z"
        }
    """
    service = PasswordResetService(db)
    return await service.validate_reset_token(request_data)


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request_data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint para redefinir senha com token válido.

    Args:
        request_data: Token e nova senha
        db: Sessão do banco de dados

    Returns:
        ResetPasswordResponse: Confirmação de sucesso

    Raises:
        HTTPException 400: Token inválido ou senhas não coincidem
        HTTPException 404: Usuário não encontrado
        HTTPException 500: Erro interno

    Example:
        POST /users/reset-password
        {
            "token": "abc123def456...",
            "password": "NovaSenha123",
            "password_confirmation": "NovaSenha123"
        }

    Response:
        {
            "message": "Senha alterada com sucesso",
            "user_id": "uuid-do-usuario"
        }
    """
    service = PasswordResetService(db)
    return await service.reset_password(request_data)


@router.post("/{user_id}/reset-password", response_model=ForgotPasswordResponse)
async def admin_reset_user_password(
    user_id: str,
    request: Request,
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint para admin forçar reset de senha de outro usuário.
    Envia email com link de recuperação de senha.

    Args:
        user_id: ID do usuário que terá senha resetada
        request: Request do FastAPI
        user_service: Serviço de usuários
        db: Sessão do banco de dados

    Returns:
        ForgotPasswordResponse: Confirmação de envio de email

    Raises:
        HTTPException 400: ID de usuário inválido
        HTTPException 404: Usuário não encontrado
        HTTPException 500: Erro ao enviar email

    Example:
        POST /users/{user_id}/reset-password
        Authorization: Bearer {API_KEY}

    Response:
        {
            "message": "Email de redefinição enviado com sucesso",
            "email": "usuario@exemplo.com"
        }
    """
    try:
        # Validar UUID
        try:
            uuid_obj = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuário inválido")

        # Buscar usuário
        user = await user_service.get_user_by_id(uuid_obj)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        # Verificar se usuário está ativo
        if not user.st_ativo:
            raise HTTPException(
                status_code=400,
                detail="Usuário inativo. Ative o usuário antes de resetar a senha.",
            )

        # Criar requisição de forgot password
        forgot_request = ForgotPasswordRequest(email=user.nm_email)

        # Usar serviço de password reset para gerar token e enviar email
        password_reset_service = PasswordResetService(db)
        response = await password_reset_service.forgot_password(forgot_request, request)

        logger.info(f"Admin solicitou reset de senha para usuário {user_id}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao resetar senha do usuário {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor") from e
