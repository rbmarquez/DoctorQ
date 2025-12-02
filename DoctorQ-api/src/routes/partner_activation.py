# DoctorQ-api/src/routes/partner_activation.py
"""
Rotas para ativação automática de parceiros (estilo iFood).
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from src.config.logger_config import get_logger
from src.services.partner_activation_service import (
    PartnerActivationService,
    get_partner_activation_service,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/partner-activation", tags=["partner-activation"])


# =====================================================
# Schemas
# =====================================================


class ServiceSelection(BaseModel):
    """Serviço selecionado."""

    service_code: str = Field(..., description="Código do serviço")


class PartnerActivationRequest(BaseModel):
    """Request para ativação automática de parceiro."""

    # Informações de contato
    partner_type: str = Field(..., description="Tipo de parceiro (clinic, supplier, etc.)")
    contact_name: str = Field(..., min_length=3, max_length=255, description="Nome do responsável")
    contact_email: EmailStr = Field(..., description="Email do responsável")
    contact_phone: str = Field(..., min_length=10, max_length=20, description="Telefone")

    # Informações da empresa
    business_name: str = Field(..., min_length=3, max_length=255, description="Nome da empresa")
    cnpj: Optional[str] = Field(None, max_length=18, description="CNPJ")
    city: Optional[str] = Field(None, max_length=100, description="Cidade")
    state: Optional[str] = Field(None, max_length=2, description="Estado (UF)")

    # Serviços e plano
    selected_services: List[str] = Field(
        default_factory=lambda: ["core_platform"],
        description="Códigos dos serviços selecionados",
    )
    plan_type: Optional[str] = Field(
        "professional", description="Tipo de plano (starter, professional, enterprise)"
    )
    billing_cycle: str = Field("monthly", description="Ciclo de cobrança (monthly, yearly)")

    # Opcionais
    needs: Optional[str] = Field(None, description="Descrição das necessidades")
    accept_terms: bool = Field(..., description="Aceite dos termos de uso")


class PartnerActivationResponse(BaseModel):
    """Response da ativação de parceiro."""

    success: bool
    message: str
    partner: dict
    credentials: dict
    package: dict
    licenses: list
    access_info: dict


# =====================================================
# Rotas
# =====================================================


@router.post("/", response_model=dict, status_code=201)
async def activate_partner(
    payload: PartnerActivationRequest,
    activation_service: PartnerActivationService = Depends(get_partner_activation_service),
):
    """
    Ativa um parceiro automaticamente com acesso imediato à plataforma.

    Fluxo estilo iFood:
    1. Cria o lead do parceiro
    2. Cria empresa e usuário
    3. Cria pacote de licenças
    4. Atribui licenças ao usuário
    5. Retorna credenciais de acesso imediato

    ## Exemplo de payload:
    ```json
    {
      "partner_type": "clinic",
      "contact_name": "Dr. João Silva",
      "contact_email": "joao@clinica.com",
      "contact_phone": "(11) 98765-4321",
      "business_name": "Clínica Estética Silva",
      "cnpj": "12.345.678/0001-90",
      "city": "São Paulo",
      "state": "SP",
      "selected_services": ["core_platform", "marketplace", "ai_assistant"],
      "plan_type": "professional",
      "billing_cycle": "monthly",
      "accept_terms": true
    }
    ```

    ## Response:
    - **partner**: Dados do parceiro criado
    - **credentials**: Email e senha temporária para acesso
    - **package**: Informações do pacote de licenças
    - **licenses**: Lista de licenças ativadas
    - **access_info**: URLs para login e dashboard
    """
    if not payload.accept_terms:
        raise HTTPException(
            status_code=400, detail="É necessário aceitar os termos de uso para continuar"
        )

    try:
        result = await activation_service.activate_partner(
            partner_type=payload.partner_type,
            contact_name=payload.contact_name,
            contact_email=payload.contact_email,
            contact_phone=payload.contact_phone,
            business_name=payload.business_name,
            cnpj=payload.cnpj,
            city=payload.city,
            state=payload.state,
            selected_services=payload.selected_services,
            plan_type=payload.plan_type,
            billing_cycle=payload.billing_cycle,
        )

        logger.info(
            f"✅ Parceiro {payload.business_name} ativado automaticamente via {payload.contact_email}"
        )

        return result

    except ValueError as exc:
        logger.error(f"Erro de validação ao ativar parceiro: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"Erro ao ativar parceiro: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Erro ao ativar parceiro. Tente novamente mais tarde.",
                "error": str(exc),
                "error_type": exc.__class__.__name__,
            },
        )


@router.get("/health", response_model=dict)
async def health_check():
    """
    Health check do serviço de ativação.
    """
    return {
        "status": "healthy",
        "service": "partner-activation",
        "message": "Serviço de ativação automática de parceiros operacional",
    }
