# src/central_atendimento/__init__.py
"""
Central de Atendimento Omnichannel - Implementação Nativa Completa

Este módulo implementa um sistema completo de atendimento omnichannel com:
- Integração WhatsApp Business API (Meta Cloud API - Oficial)
- Instagram Direct Messaging
- Facebook Messenger
- Email
- SMS

Funcionalidades principais:
- Prospecção proativa de leads
- Lead scoring automático com IA
- Roteamento inteligente de conversas
- Campanhas de marketing automatizadas
- Dashboard de métricas em tempo real
"""

from src.central_atendimento.models import (
    Canal,
    CanalTipo,
    ContatoOmni,
    ConversaOmni,
    MensagemOmni,
    Campanha,
    CampanhaStatus,
    LeadScore,
    FilaAtendimento,
    AtendimentoStatus,
)

__all__ = [
    # Models
    "Canal",
    "CanalTipo",
    "ContatoOmni",
    "ConversaOmni",
    "MensagemOmni",
    "Campanha",
    "CampanhaStatus",
    "LeadScore",
    "FilaAtendimento",
    "AtendimentoStatus",
]

__version__ = "1.0.0"
