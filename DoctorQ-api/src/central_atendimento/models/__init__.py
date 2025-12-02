# src/central_atendimento/models/__init__.py
"""
Models do módulo Central de Atendimento Omnichannel.
"""

from src.central_atendimento.models.canal import Canal, CanalTipo, CanalStatus
from src.central_atendimento.models.contato_omni import ContatoOmni, ContatoStatus
from src.central_atendimento.models.conversa_omni import (
    ConversaOmni,
    MensagemOmni,
    MensagemTipo,
    MensagemStatus,
)
from src.central_atendimento.models.campanha import (
    Campanha,
    CampanhaStatus,
    CampanhaTipo,
    CampanhaDestinatario,
)
from src.central_atendimento.models.lead_scoring import LeadScore, LeadScoreHistorico
from src.central_atendimento.models.fila_atendimento import (
    FilaAtendimento,
    AtendimentoStatus,
    AtendimentoItem,
)

__all__ = [
    # Canal
    "Canal",
    "CanalTipo",
    "CanalStatus",
    # Contato
    "ContatoOmni",
    "ContatoStatus",
    # Conversa
    "ConversaOmni",
    "MensagemOmni",
    "MensagemTipo",
    "MensagemStatus",
    # Campanha
    "Campanha",
    "CampanhaStatus",
    "CampanhaTipo",
    "CampanhaDestinatario",
    # Lead Scoring
    "LeadScore",
    "LeadScoreHistorico",
    # Fila
    "FilaAtendimento",
    "AtendimentoStatus",
    "AtendimentoItem",
]
