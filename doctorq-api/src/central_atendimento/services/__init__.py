# src/central_atendimento/services/__init__.py
"""
Services do módulo Central de Atendimento Omnichannel.

Este módulo contém todos os serviços para:
- Integração WhatsApp Business API (Meta Cloud API)
- Gerenciamento de canais, contatos e conversas
- Processamento de fila de atendimento
- Lead scoring e campanhas
- WebSocket em tempo real
- Transcrição de áudio
- Gerenciamento de sessões IA/Humano
"""

# === Services Base ===
from src.central_atendimento.services.whatsapp_service import WhatsAppService
from src.central_atendimento.services.canal_service import CanalService
from src.central_atendimento.services.contato_service import ContatoOmniService
from src.central_atendimento.services.conversa_service import ConversaOmniService
from src.central_atendimento.services.campanha_service import CampanhaService
from src.central_atendimento.services.lead_scoring_service import LeadScoringService
from src.central_atendimento.services.fila_service import FilaAtendimentoService
from src.central_atendimento.services.routing_service import RoutingService

# === Services de Background (Inspirados no Maua) ===
from src.central_atendimento.services.fila_processor_service import (
    FilaProcessorService,
    get_fila_processor,
    start_fila_processor,
    stop_fila_processor,
)

# === Services de WebSocket/Real-time ===
from src.central_atendimento.services.websocket_notification_service import (
    WebSocketNotificationService,
    NotificationType,
    ServiceMode,
    get_ws_notification_service,
    start_notification_service,
    stop_notification_service,
)
from src.central_atendimento.services.websocket_chat_gateway import (
    WebSocketChatGateway,
    ChatEventType,
    ParticipantRole,
    GatewayMode,
    get_websocket_chat_gateway,
    start_chat_gateway,
    stop_chat_gateway,
)

# === Services de Processamento de Mensagens ===
from src.central_atendimento.services.message_queue_processor import (
    MessageQueueProcessor,
    MessageSource,
    QueuedMessage,
    get_message_queue_processor,
    start_message_queue_processor,
    stop_message_queue_processor,
)

# === Services de IA/Transcricao ===
from src.central_atendimento.services.audio_transcription_service import (
    AudioTranscriptionService,
    TranscriptionProvider,
    get_audio_transcription_service,
)

# === Services de Gerenciamento de Sessão ===
from src.central_atendimento.services.session_manager import (
    SessionManager,
    TipoAtendimento,
    AcaoColeta,
    MotivoTransferencia,
    SessaoAtendimento,
    get_session_manager,
)

# === Services de Horário de Atendimento ===
from src.central_atendimento.services.horario_atendimento_service import (
    HorarioAtendimentoService,
    HorarioConfig,
    StatusAtendimento,
    DiaSemana,
    get_horario_atendimento_service,
)

# === Service de Orquestração (Integra Todos os Outros) ===
from src.central_atendimento.services.message_orchestrator_service import (
    MessageOrchestratorService,
    ProcessingResult,
    ProcessedMessage,
    get_message_orchestrator,
    start_message_orchestrator,
    stop_message_orchestrator,
)

__all__ = [
    # Services Base
    "WhatsAppService",
    "CanalService",
    "ContatoOmniService",
    "ConversaOmniService",
    "CampanhaService",
    "LeadScoringService",
    "FilaAtendimentoService",
    "RoutingService",
    # Fila Processor
    "FilaProcessorService",
    "get_fila_processor",
    "start_fila_processor",
    "stop_fila_processor",
    # WebSocket Notification
    "WebSocketNotificationService",
    "NotificationType",
    "ServiceMode",
    "get_ws_notification_service",
    "start_notification_service",
    "stop_notification_service",
    # WebSocket Chat Gateway
    "WebSocketChatGateway",
    "ChatEventType",
    "ParticipantRole",
    "GatewayMode",
    "get_websocket_chat_gateway",
    "start_chat_gateway",
    "stop_chat_gateway",
    # Message Queue Processor
    "MessageQueueProcessor",
    "MessageSource",
    "QueuedMessage",
    "get_message_queue_processor",
    "start_message_queue_processor",
    "stop_message_queue_processor",
    # Audio Transcription
    "AudioTranscriptionService",
    "TranscriptionProvider",
    "get_audio_transcription_service",
    # Session Manager
    "SessionManager",
    "TipoAtendimento",
    "AcaoColeta",
    "MotivoTransferencia",
    "SessaoAtendimento",
    "get_session_manager",
    # Horário Atendimento
    "HorarioAtendimentoService",
    "HorarioConfig",
    "StatusAtendimento",
    "DiaSemana",
    "get_horario_atendimento_service",
    # Message Orchestrator
    "MessageOrchestratorService",
    "ProcessingResult",
    "ProcessedMessage",
    "get_message_orchestrator",
    "start_message_orchestrator",
    "stop_message_orchestrator",
]
