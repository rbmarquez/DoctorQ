from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import pytest
import httpx

from src.main import app
from src.models.partner_lead import (
    PartnerLeadCreate,
    PartnerLeadResponse,
    PartnerLeadServiceResponse,
    PartnerLeadStatus,
    PartnerLeadStatusUpdate,
    PartnerServiceDefinitionResponse,
    PartnerType,
)
from src.models.partner_package import (
    PartnerPackageCreate,
    PartnerPackageItemResponse,
    PartnerPackageLeadInfo,
    PartnerPackageResponse,
    PartnerPackageItemStatus,
    PartnerPackageStatus,
    PartnerPackageStatusUpdate,
)
from src.services.partner_lead_service import get_partner_lead_service
from src.services.partner_package_service import get_partner_package_service


pytestmark = pytest.mark.anyio("asyncio")


class FakePartnerLeadService:
    def __init__(self) -> None:
        now = datetime.now(timezone.utc)
        self._services = [
            PartnerServiceDefinitionResponse(
                id_service=uuid_value("11111111-1111-1111-1111-111111111111"),
                service_code="PLATAFORMA",
                service_name="Acesso à Plataforma",
                description="Painel DoctorQ",
                price_value=149.0,
                price_label="R$ 149/mês",
                features=["Agenda inteligente", "Marketplace"],
                active=True,
                recommended=True,
            )
        ]
        self._lead_response = PartnerLeadResponse(
            id_partner_lead=uuid_value("22222222-2222-2222-2222-222222222222"),
            partner_type=PartnerType.CLINICA,
            status=PartnerLeadStatus.PENDING,
            contact_name="Ana Silva",
            contact_email="ana@example.com",
            contact_phone="+5511999999999",
            business_name="Clínica Ana Prime",
            cnpj="12.345.678/0001-00",
            city="São Paulo",
            state="SP",
            services="Consultas de estética",
            differentiators="Atendimento vip",
            team_size="10",
            catalog_link=None,
            notes="Lead prioritário",
            created_at=now,
            updated_at=now,
            services_selected=[
                PartnerLeadServiceResponse(
                    id_service=uuid_value("11111111-1111-1111-1111-111111111111"),
                    service_code="PLATAFORMA",
                    service_name="Acesso à Plataforma",
                    price_label="R$ 149/mês",
                )
            ],
        )

        self.created_payload: Optional[PartnerLeadCreate] = None
        self.updated_status: Optional[Tuple[str, PartnerLeadStatusUpdate]] = None
        self.raise_on_create: Optional[str] = None

    async def list_service_definitions(self) -> List[PartnerServiceDefinitionResponse]:
        return self._services

    async def create_partner_lead(self, data: PartnerLeadCreate) -> PartnerLeadResponse:
        if self.raise_on_create:
            raise ValueError(self.raise_on_create)
        self.created_payload = data
        return self._lead_response

    async def list_partner_leads(
        self,
        page: int = 1,
        size: int = 10,
        partner_type: Optional[PartnerType] = None,
        status: Optional[PartnerLeadStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[PartnerLeadResponse], int]:
        return [self._lead_response], 1

    async def get_partner_lead(self, lead_id) -> Optional[PartnerLeadResponse]:
        return self._lead_response

    async def update_status(
        self, lead_id, status_update: PartnerLeadStatusUpdate
    ) -> Optional[PartnerLeadResponse]:
        self.updated_status = (str(lead_id), status_update)
        return self._lead_response


class FakePartnerPackageService:
    def __init__(self) -> None:
        now = datetime.now(timezone.utc)
        self.package_response = PartnerPackageResponse(
            id_partner_package=uuid_value("33333333-3333-3333-3333-333333333333"),
            package_code="LICENSE-001",
            package_name="Pacote DoctorQ Premium",
            status=PartnerPackageStatus.PENDING,
            billing_cycle="monthly",
            total_value=149.0,
            currency="BRL",
            contract_url=None,
            notes=None,
            created_at=now,
            updated_at=now,
            activated_at=None,
            expires_at=None,
            lead_id=uuid_value("22222222-2222-2222-2222-222222222222"),
            lead=PartnerPackageLeadInfo(
                id_partner_lead=uuid_value("22222222-2222-2222-2222-222222222222"),
                business_name="Clínica Ana Prime",
                contact_name="Ana Silva",
                contact_email="ana@example.com",
                status=PartnerLeadStatus.PENDING.value,
            ),
            items=[
                PartnerPackageItemResponse(
                    id_partner_package_item=uuid_value("44444444-4444-4444-4444-444444444444"),
                    id_service=uuid_value("11111111-1111-1111-1111-111111111111"),
                    service_code="PLATAFORMA",
                    service_name="Acesso à Plataforma",
                    quantity=1,
                    unit_price_value=149.0,
                    unit_price_label="R$ 149/mês",
                    status=PartnerPackageItemStatus.PENDING,
                    licenses=[],
                )
            ],
        )
        self.created_from_payload: Optional[Tuple[str, Optional[str], Optional[str]]] = None
        self.updated_status: Optional[Tuple[str, PartnerPackageStatusUpdate]] = None
        self.raise_on_create_from_lead: Optional[str] = None

    async def ensure_service_catalog(self) -> None:
        return None

    async def list_packages(
        self,
        page: int = 1,
        size: int = 10,
        status: Optional[PartnerPackageStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[PartnerPackageResponse], int]:
        return [self.package_response], 1

    async def get_package(self, package_id) -> Optional[PartnerPackageResponse]:
        return self.package_response

    async def create_package(self, payload: PartnerPackageCreate) -> PartnerPackageResponse:
        return self.package_response

    async def create_from_lead(
        self,
        lead_id,
        package_code: Optional[str] = None,
        package_name: Optional[str] = None,
    ) -> PartnerPackageResponse:
        if self.raise_on_create_from_lead:
            raise ValueError(self.raise_on_create_from_lead)
        self.created_from_payload = (str(lead_id), package_code, package_name)
        return self.package_response

    async def update_status(
        self, package_id, status_update: PartnerPackageStatusUpdate
    ) -> Optional[PartnerPackageResponse]:
        self.updated_status = (str(package_id), status_update)
        return self.package_response


def uuid_value(value: str):
    import uuid

    return uuid.UUID(value)


@pytest.fixture
async def test_client():
    fake_lead_service = FakePartnerLeadService()
    fake_package_service = FakePartnerPackageService()

    original_overrides = dict(app.dependency_overrides)
    original_lifespan = app.router.lifespan_context

    app.dependency_overrides[get_partner_lead_service] = lambda: fake_lead_service
    app.dependency_overrides[get_partner_package_service] = lambda: fake_package_service

    @asynccontextmanager
    async def noop_lifespan(_app):
        yield

    app.router.lifespan_context = noop_lifespan
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, fake_lead_service, fake_package_service

    app.dependency_overrides = original_overrides
    app.router.lifespan_context = original_lifespan


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def test_list_partner_services_success(test_client):
    client, fake_lead_service, _ = test_client

    response = await client.get("/partner-leads/services")
    assert response.status_code == 200

    payload = response.json()
    assert isinstance(payload, list)
    assert payload[0]["service_code"] == "PLATAFORMA"
    # Ensure seed list comes from fake service
    assert len(await fake_lead_service.list_service_definitions()) == len(payload)


async def test_create_partner_lead_success(test_client):
    client, fake_lead_service, _ = test_client

    new_lead_payload = {
        "partner_type": "clinica",
        "contact_name": "Carlos",
        "contact_email": "carlos@example.com",
        "contact_phone": "5511988887777",
        "business_name": "Clínica Carlos",
        "selected_services": [{"service_code": "PLATAFORMA"}],
    }

    response = await client.post("/partner-leads/", json=new_lead_payload)
    assert response.status_code == 201

    assert fake_lead_service.created_payload is not None
    assert fake_lead_service.created_payload.contact_email == "carlos@example.com"


async def test_create_partner_lead_validation_error(test_client):
    client, fake_lead_service, _ = test_client
    fake_lead_service.raise_on_create = "Serviço inválido"

    response = await client.post(
        "/partner-leads/",
        json={
            "partner_type": "clinica",
            "contact_name": "Carlos",
            "contact_email": "carlos@example.com",
            "contact_phone": "5511988887777",
            "business_name": "Clínica Carlos",
            "selected_services": [{"service_code": "INVALIDO"}],
        },
    )
    assert response.status_code == 400
    assert "Serviço inválido" in response.text


async def test_list_partner_packages_success(test_client):
    client, _, fake_package_service = test_client

    response = await client.get("/partner-packages/?page=1&size=10")
    assert response.status_code == 200

    payload = response.json()
    assert payload["meta"]["totalItems"] == 1
    assert payload["items"][0]["package_code"] == "LICENSE-001"
    assert payload["items"][0]["lead"]["business_name"] == "Clínica Ana Prime"


async def test_update_partner_package_status(test_client):
    client, _, fake_package_service = test_client

    response = await client.put(
        f"/partner-packages/{fake_package_service.package_response.id_partner_package}/status",
        json={"status": "active", "notes": "Liberado"},
    )
    assert response.status_code == 200
    assert fake_package_service.updated_status is not None
    package_id, status_update = fake_package_service.updated_status
    assert status_update.status == PartnerPackageStatus.ACTIVE
    assert package_id == str(fake_package_service.package_response.id_partner_package)


async def test_create_package_from_lead_success(test_client):
    client, _, fake_package_service = test_client

    response = await client.post(
        "/partner-packages/from-lead/22222222-2222-2222-2222-222222222222",
        params={"package_code": "CUSTOM-01", "package_name": "Pacote Custom"},
    )

    assert response.status_code == 201
    assert fake_package_service.created_from_payload is not None
    lead_id, code, name = fake_package_service.created_from_payload
    assert lead_id == "22222222-2222-2222-2222-222222222222"
    assert code == "CUSTOM-01"
    assert name == "Pacote Custom"


async def test_create_package_from_lead_validation_error(test_client):
    client, _, fake_package_service = test_client
    fake_package_service.raise_on_create_from_lead = "Lead sem serviços"

    response = await client.post(
        "/partner-packages/from-lead/22222222-2222-2222-2222-222222222222",
    )

    assert response.status_code == 400
    assert "Lead sem serviços" in response.text


async def test_list_partner_leads_success(test_client):
    client, _, _ = test_client

    response = await client.get("/partner-leads/?page=1&size=5")
    assert response.status_code == 200

    payload = response.json()
    assert payload["meta"]["totalItems"] == 1
    assert payload["items"][0]["business_name"] == "Clínica Ana Prime"


async def test_get_partner_lead_invalid_uuid(test_client):
    client, _, _ = test_client

    response = await client.get("/partner-leads/invalid-uuid")
    assert response.status_code == 400


async def test_update_partner_lead_status_success(test_client):
    client, fake_lead_service, _ = test_client

    response = await client.put(
        "/partner-leads/22222222-2222-2222-2222-222222222222/status",
        json={"status": "approved", "notes": "Aprovado manualmente"},
    )
    assert response.status_code == 200
    assert fake_lead_service.updated_status is not None
    lead_id, status_update = fake_lead_service.updated_status
    assert lead_id == "22222222-2222-2222-2222-222222222222"
    assert status_update.status == PartnerLeadStatus.APPROVED
    assert status_update.notes == "Aprovado manualmente"
