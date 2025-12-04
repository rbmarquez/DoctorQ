# src/models/__init__.py
"""
Models package - importa modelos SQLAlchemy na ordem correta
para evitar circular dependencies
"""

# 1. Base deve vir primeiro
from src.models.base import Base

# 2. Modelos sem dependências externas (core)
from src.models.empresa import Empresa
from src.models.perfil import Perfil
from src.models.vaga import TbVagas  # ✅ Importar antes de User (referenciado em Empresa)

# 3. Modelos que dependem de Empresa/Perfil
from src.models.user import User
from src.models.password_reset import PasswordResetToken

# 4. Outros modelos principais
from src.models.agent import Agent
from src.models.agent_tool import AgentTool
from src.models.apikey import ApiKey
from src.models.credencial import Credencial
from src.models.variable import Variable
from src.models.conversation import Conversation
from src.models.message import Message
from src.models.documento_store import DocumentoStore
from src.models.documento_store_file_chunk import DocumentoStoreFileChunk
from src.models.tool import Tool

# 5. Modelos adicionais do sistema DoctorQ (Tb*)
from src.models.anamnese import TbAnamnese, TbAnamneseTemplate
from src.models.broadcast import TbBroadcastCampanha, TbBroadcastDestinatario, TbBroadcastTemplate
from src.models.candidatura import TbCandidaturas
from src.models.conversa_compartilhada import TbConversaCompartilhada
from src.models.curriculo import TbCurriculos
from src.models.email_log import TbEmailLog
from src.models.estoque import TbMovimentacaoEstoque, TbReservaEstoque
from src.models.export import TbExportAgendamento, TbExportJob
from src.models.lembrete import TbLembrete
from src.models.nota_fiscal import TbNotaFiscal
from src.models.paciente import TbPaciente
from src.models.pagamento import TbPagamento, TbTransacaoPagamento
from src.models.profissional_clinica import TbProfissionalClinica
from src.models.rastreamento import TbRastreamentoEvento

# 6. Export all
__all__ = [
    "Base",
    "Empresa",
    "Perfil",
    "TbVagas",
    "User",
    "PasswordResetToken",
    "Agent",
    "AgentTool",
    "ApiKey",
    "Credencial",
    "Variable",
    "Conversation",
    "Message",
    "DocumentoStore",
    "DocumentoStoreFileChunk",
    "Tool",
    # Modelos adicionais Tb*
    "TbAnamnese",
    "TbAnamneseTemplate",
    "TbBroadcastCampanha",
    "TbBroadcastDestinatario",
    "TbBroadcastTemplate",
    "TbCandidaturas",
    "TbConversaCompartilhada",
    "TbCurriculos",
    "TbEmailLog",
    "TbMovimentacaoEstoque",
    "TbReservaEstoque",
    "TbExportAgendamento",
    "TbExportJob",
    "TbLembrete",
    "TbNotaFiscal",
    "TbPaciente",
    "TbPagamento",
    "TbTransacaoPagamento",
    "TbProfissionalClinica",
    "TbRastreamentoEvento",
]
