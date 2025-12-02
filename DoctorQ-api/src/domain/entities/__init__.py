"""
Domain Entities - Entidades de Domínio

Este módulo contém as entidades de negócio do sistema DoctorQ.
Entidades representam conceitos de domínio com identidade única e ciclo de vida.
"""
from src.domain.entities.agente import Agente
from src.domain.entities.conversa import Conversa
from src.domain.entities.message import Message

__all__ = [
    "Agente",
    "Conversa",
    "Message",
]
