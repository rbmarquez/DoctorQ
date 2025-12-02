# src/data/partner_service_seed.py
"""Seed com os serviços/licenças oferecidos para parceiros DoctorQ."""

SERVICE_DEFINITIONS_SEED = [
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
    },
]
