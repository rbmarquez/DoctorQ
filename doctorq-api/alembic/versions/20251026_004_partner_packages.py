"""Add partner service recommended flag and seed catalog"""

from __future__ import annotations

import json

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251026_004_partner_packages"
down_revision = "20250123_003_chat_module"
branch_labels = None
depends_on = None


SERVICE_DEFINITIONS = [
    {
        "service_code": "PLATAFORMA",
        "service_name": "Acesso à Plataforma",
        "description": "Painel completo de gestão de agenda, pacientes e marketplace.",
        "price_value": 149.0,
        "price_label": "R$ 149/mês por unidade",
        "features": [
            "Agenda inteligente com confirmações automáticas",
            "Perfil destacado no marketplace DoctorQ",
            "Relatórios financeiros e de performance em tempo real",
        ],
        "recommended": True,
    },
    {
        "service_code": "CENTRAL_ATENDIMENTO",
        "service_name": "Central de Atendimento 360º",
        "description": "Equipe DoctorQ atende seus clientes 7 dias por semana.",
        "price_value": 199.0,
        "price_label": "R$ 199/mês por equipe",
        "features": [
            "Atendimento telefônico, chat e e-mail com scripts personalizados",
            "Follow-up automático de orçamentos e ausências",
            "Integração com campanhas de marketing e CRM",
        ],
        "recommended": False,
    },
    {
        "service_code": "WHATSAPP_INTELIGENTE",
        "service_name": "WhatsApp Inteligente",
        "description": "Fluxos automatizados, catálogo de serviços e integrações.",
        "price_value": 89.0,
        "price_label": "R$ 89/mês por linha",
        "features": [
            "Chatbot com pré-venda e avaliação de perfil do cliente",
            "Envio em massa segmentado e campanhas de retorno",
            "Integração com agenda e disparo de lembretes",
        ],
        "recommended": False,
    },
    {
        "service_code": "CHATBOT_DOCTORQ",
        "service_name": "Chatbot DoctorQ",
        "description": "Assistente virtual com conhecimento sobre seus serviços.",
        "price_value": 59.0,
        "price_label": "R$ 59/mês por canal",
        "features": [
            "Treinamento com base no site e materiais da sua operação",
            "Captação e qualificação de leads em tempo real",
            "Handoff para equipe humana dentro da plataforma",
        ],
        "recommended": False,
    },
    {
        "service_code": "DOCTORQ_ACADEMY",
        "service_name": "Academy & Treinamentos",
        "description": "Capacite sua equipe com trilhas exclusivas DoctorQ.",
        "price_value": 39.0,
        "price_label": "R$ 39/mês por usuário",
        "features": [
            "Cursos certificados sobre marketing, vendas e gestão estética",
            "Atualizações mensais com tendências de mercado",
            "Mentorias em grupo com especialistas DoctorQ",
        ],
        "recommended": False,
    },
]


def upgrade() -> None:
    op.add_column(
        "tb_partner_service_definitions",
        sa.Column(
            "st_recomendado",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.alter_column(
        "tb_partner_service_definitions",
        "id_service",
        server_default=sa.text("uuid_generate_v4()"),
    )

    conn = op.get_bind()
    insert_stmt = sa.text(
        """
        INSERT INTO tb_partner_service_definitions (
            cd_service,
            nm_service,
            ds_resumo,
            vl_preco_base,
            ds_preco_label,
            ds_features,
            st_ativo,
            st_recomendado
        ) VALUES (
            :code,
            :name,
            :description,
            :price_value,
            :price_label,
            CAST(:features AS JSONB),
            'S',
            :recommended
        )
        ON CONFLICT (cd_service) DO UPDATE SET
            nm_service = EXCLUDED.nm_service,
            ds_resumo = EXCLUDED.ds_resumo,
            vl_preco_base = EXCLUDED.vl_preco_base,
            ds_preco_label = EXCLUDED.ds_preco_label,
            ds_features = EXCLUDED.ds_features,
            st_ativo = EXCLUDED.st_ativo,
            st_recomendado = EXCLUDED.st_recomendado
        """
    )

    for service in SERVICE_DEFINITIONS:
        conn.execute(
            insert_stmt,
            {
                "code": service["service_code"],
                "name": service["service_name"],
                "description": service.get("description"),
                "price_value": service.get("price_value"),
                "price_label": service.get("price_label"),
                "features": json.dumps(service.get("features", [])),
                "recommended": service.get("recommended", False),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    for code in [service["service_code"] for service in SERVICE_DEFINITIONS]:
        conn.execute(
            sa.text(
                "DELETE FROM tb_partner_service_definitions WHERE cd_service = :code"
            ),
            {"code": code},
        )
    op.alter_column(
        "tb_partner_service_definitions",
        "id_service",
        server_default=None,
    )
    op.drop_column("tb_partner_service_definitions", "st_recomendado")
