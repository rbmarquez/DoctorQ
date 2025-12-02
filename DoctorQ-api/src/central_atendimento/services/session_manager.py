# src/central_atendimento/services/session_manager.py
"""
Gerenciador de sessões de atendimento.

Inspirado no SessaoService do Maua, este serviço:
- Gerencia transições entre IA e atendimento humano
- Mantém contexto da conversa entre transições
- Controla coleta de dados (email, telefone)
- Detecta intenção de falar com humano
"""

import uuid
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import ORMConfig

logger = get_logger(__name__)


class TipoAtendimento(str, Enum):
    """Tipo de atendimento da sessão."""
    ASSISTENTE_VIRTUAL = "assistente_virtual"  # Bot/IA
    ATENDIMENTO_HUMANO = "atendimento_humano"  # Operador
    HIBRIDO = "hibrido"  # IA com supervisão humana


class AcaoColeta(str, Enum):
    """Ações de coleta de dados."""
    COLETA_EMAIL = "coleta_email"
    COLETA_TELEFONE = "coleta_telefone"
    COLETA_NOME = "coleta_nome"
    COLETA_CPF = "coleta_cpf"
    CONFIRMACAO = "confirmacao"
    NENHUMA = "nenhuma"


class MotivoTransferencia(str, Enum):
    """Motivos para transferência para humano."""
    SOLICITACAO_USUARIO = "solicitacao_usuario"
    INTENCAO_DETECTADA = "intencao_detectada"
    LIMITE_INTERACOES = "limite_interacoes"
    ERRO_IA = "erro_ia"
    ASSUNTO_COMPLEXO = "assunto_complexo"
    ESCALACAO_AUTOMATICA = "escalacao_automatica"


@dataclass
class SessaoAtendimento:
    """Estado de uma sessão de atendimento."""
    id_sessao: uuid.UUID
    id_conversa: uuid.UUID
    id_contato: uuid.UUID
    id_empresa: uuid.UUID
    tipo_atendimento: TipoAtendimento = TipoAtendimento.ASSISTENTE_VIRTUAL
    acao_coleta: AcaoColeta = AcaoColeta.NENHUMA
    dados_coletados: Dict[str, Any] = field(default_factory=dict)
    contexto: Dict[str, Any] = field(default_factory=dict)
    historico_tipos: List[Tuple[TipoAtendimento, datetime]] = field(default_factory=list)
    nr_interacoes: int = 0
    nr_erros_ia: int = 0
    dt_inicio: datetime = field(default_factory=datetime.utcnow)
    dt_ultima_mensagem: datetime = field(default_factory=datetime.utcnow)
    fg_ativa: bool = True


class SessionManager:
    """
    Gerenciador de sessões de atendimento.

    Funcionalidades:
    - Criar e gerenciar sessões de atendimento
    - Detectar intenção de falar com humano
    - Gerenciar transições IA ↔ Humano
    - Coletar dados do contato (email, nome, etc)
    - Extrair informações de mensagens
    """

    # Configurações
    MAX_INTERACOES_ANTES_OFERECER_HUMANO = 10
    MAX_ERROS_IA_ANTES_TRANSFERIR = 3
    SESSION_TIMEOUT_MINUTES = 30

    # Padrões para detectar intenção de falar com humano
    PADROES_ATENDIMENTO_HUMANO = [
        r"\bfalar\s*(com)?\s*(um)?\s*(atendente|humano|pessoa|operador)\b",
        r"\batendente\b",
        r"\batendimento\s*humano\b",
        r"\bpessoa\s*real\b",
        r"\boperador\b",
        r"\bsuporte\b.*\bhumano\b",
        r"\bn[aã]o\s*(quero|gosto)\s*(de)?\s*(falar)?\s*(com)?\s*(rob[oô]|bot|ia)\b",
        r"\bpreciso\s*(de)?\s*(um)?\s*humano\b",
        r"\bfale\s*com\s*algu[eé]m\b",
        r"\btransferir\b",
        r"\bescala[çc][aã]o\b",
    ]

    # Padrões para extrair email
    PADRAO_EMAIL = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    # Padrões para extrair telefone
    PADRAO_TELEFONE = r"(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-.\s]?\d{4}"

    # Padrões para extrair CPF
    PADRAO_CPF = r"\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}"

    def __init__(self):
        """Inicializa o gerenciador."""
        self._sessoes: Dict[str, SessaoAtendimento] = {}
        self._compiled_patterns = [
            re.compile(p, re.IGNORECASE)
            for p in self.PADROES_ATENDIMENTO_HUMANO
        ]

    async def obter_ou_criar_sessao(
        self,
        id_conversa: uuid.UUID,
        id_contato: uuid.UUID,
        id_empresa: uuid.UUID,
        tipo_inicial: TipoAtendimento = TipoAtendimento.ASSISTENTE_VIRTUAL,
    ) -> SessaoAtendimento:
        """
        Obtém sessão existente ou cria nova.

        Args:
            id_conversa: ID da conversa
            id_contato: ID do contato
            id_empresa: ID da empresa
            tipo_inicial: Tipo inicial de atendimento

        Returns:
            Sessão de atendimento
        """
        key = str(id_conversa)

        if key in self._sessoes:
            sessao = self._sessoes[key]

            # Verificar timeout
            idade = datetime.utcnow() - sessao.dt_ultima_mensagem
            if idade > timedelta(minutes=self.SESSION_TIMEOUT_MINUTES):
                # Sessão expirada, criar nova
                logger.debug("Sessão expirada, criando nova: %s", id_conversa)
                sessao = self._criar_sessao(
                    id_conversa, id_contato, id_empresa, tipo_inicial
                )
                self._sessoes[key] = sessao
            else:
                sessao.dt_ultima_mensagem = datetime.utcnow()

            return sessao

        # Criar nova sessão
        sessao = self._criar_sessao(
            id_conversa, id_contato, id_empresa, tipo_inicial
        )
        self._sessoes[key] = sessao

        return sessao

    def _criar_sessao(
        self,
        id_conversa: uuid.UUID,
        id_contato: uuid.UUID,
        id_empresa: uuid.UUID,
        tipo_inicial: TipoAtendimento,
    ) -> SessaoAtendimento:
        """Cria nova sessão de atendimento."""
        sessao = SessaoAtendimento(
            id_sessao=uuid.uuid4(),
            id_conversa=id_conversa,
            id_contato=id_contato,
            id_empresa=id_empresa,
            tipo_atendimento=tipo_inicial,
        )
        sessao.historico_tipos.append((tipo_inicial, datetime.utcnow()))

        logger.info(
            "Nova sessão criada: %s (conversa=%s, tipo=%s)",
            sessao.id_sessao,
            id_conversa,
            tipo_inicial.value,
        )

        return sessao

    def detectar_intencao_humano(self, texto: str) -> Tuple[bool, Optional[str]]:
        """
        Detecta se o texto indica intenção de falar com humano.

        Args:
            texto: Texto da mensagem

        Returns:
            Tupla (detectado, padrão_correspondente)
        """
        texto_lower = texto.lower()

        for pattern in self._compiled_patterns:
            match = pattern.search(texto_lower)
            if match:
                return True, match.group()

        return False, None

    async def processar_mensagem(
        self,
        sessao: SessaoAtendimento,
        texto: str,
    ) -> Dict[str, Any]:
        """
        Processa mensagem e atualiza estado da sessão.

        Args:
            sessao: Sessão de atendimento
            texto: Texto da mensagem

        Returns:
            Dict com ações a tomar:
            - transferir_humano: bool
            - motivo_transferencia: str
            - dados_extraidos: dict
            - resposta_coleta: str (se em modo coleta)
        """
        sessao.nr_interacoes += 1
        sessao.dt_ultima_mensagem = datetime.utcnow()

        resultado = {
            "transferir_humano": False,
            "motivo_transferencia": None,
            "dados_extraidos": {},
            "resposta_coleta": None,
            "oferecer_humano": False,
        }

        # Verificar se está em modo de coleta de dados
        if sessao.acao_coleta != AcaoColeta.NENHUMA:
            resultado["resposta_coleta"] = await self._processar_coleta(sessao, texto)
            return resultado

        # Detectar intenção de falar com humano
        detectou, padrao = self.detectar_intencao_humano(texto)
        if detectou:
            resultado["transferir_humano"] = True
            resultado["motivo_transferencia"] = MotivoTransferencia.SOLICITACAO_USUARIO.value
            logger.info(
                "Intenção de humano detectada na sessão %s: '%s'",
                sessao.id_sessao,
                padrao,
            )
            return resultado

        # Extrair dados da mensagem
        resultado["dados_extraidos"] = self._extrair_dados(texto)

        # Atualizar dados coletados
        sessao.dados_coletados.update(resultado["dados_extraidos"])

        # Verificar se deve oferecer atendimento humano
        if sessao.nr_interacoes >= self.MAX_INTERACOES_ANTES_OFERECER_HUMANO:
            if sessao.nr_interacoes == self.MAX_INTERACOES_ANTES_OFERECER_HUMANO:
                resultado["oferecer_humano"] = True

        return resultado

    async def _processar_coleta(
        self,
        sessao: SessaoAtendimento,
        texto: str,
    ) -> Optional[str]:
        """Processa resposta durante coleta de dados."""
        acao = sessao.acao_coleta

        if acao == AcaoColeta.COLETA_EMAIL:
            email = self._extrair_email(texto)
            if email:
                sessao.dados_coletados["email"] = email
                sessao.acao_coleta = AcaoColeta.NENHUMA
                return f"Obrigado! Registramos seu email: {email}"
            else:
                return "Não consegui identificar um email válido. Por favor, digite seu email no formato exemplo@email.com"

        elif acao == AcaoColeta.COLETA_TELEFONE:
            telefone = self._extrair_telefone(texto)
            if telefone:
                sessao.dados_coletados["telefone"] = telefone
                sessao.acao_coleta = AcaoColeta.NENHUMA
                return f"Obrigado! Registramos seu telefone: {telefone}"
            else:
                return "Não consegui identificar um telefone válido. Por favor, digite seu número no formato (11) 99999-9999"

        elif acao == AcaoColeta.COLETA_NOME:
            # Aceitar qualquer texto como nome
            sessao.dados_coletados["nome"] = texto.strip()
            sessao.acao_coleta = AcaoColeta.NENHUMA
            return f"Prazer em conhecê-lo(a), {texto.strip()}!"

        elif acao == AcaoColeta.CONFIRMACAO:
            texto_lower = texto.lower().strip()
            if texto_lower in ("sim", "s", "confirmo", "ok", "correto", "isso"):
                sessao.acao_coleta = AcaoColeta.NENHUMA
                sessao.contexto["confirmado"] = True
                return "Confirmado! Vou dar continuidade ao seu atendimento."
            elif texto_lower in ("não", "nao", "n", "errado", "incorreto"):
                sessao.acao_coleta = AcaoColeta.NENHUMA
                sessao.contexto["confirmado"] = False
                return "Entendi. Vamos corrigir suas informações."
            else:
                return "Por favor, responda 'sim' para confirmar ou 'não' para corrigir."

        sessao.acao_coleta = AcaoColeta.NENHUMA
        return None

    def iniciar_coleta(
        self,
        sessao: SessaoAtendimento,
        acao: AcaoColeta,
    ) -> str:
        """
        Inicia coleta de dado específico.

        Args:
            sessao: Sessão de atendimento
            acao: Tipo de dado a coletar

        Returns:
            Mensagem para solicitar o dado
        """
        sessao.acao_coleta = acao

        mensagens = {
            AcaoColeta.COLETA_EMAIL: "Para darmos continuidade, preciso do seu email. Por favor, digite:",
            AcaoColeta.COLETA_TELEFONE: "Qual é o seu número de telefone com DDD?",
            AcaoColeta.COLETA_NOME: "Qual é o seu nome?",
            AcaoColeta.COLETA_CPF: "Por favor, informe seu CPF:",
            AcaoColeta.CONFIRMACAO: "Por favor, confirme se as informações estão corretas (sim/não):",
        }

        return mensagens.get(acao, "Por favor, informe o dado solicitado:")

    async def transferir_para_humano(
        self,
        sessao: SessaoAtendimento,
        motivo: MotivoTransferencia,
        id_fila: Optional[uuid.UUID] = None,
    ) -> bool:
        """
        Transfere sessão para atendimento humano.

        Args:
            sessao: Sessão de atendimento
            motivo: Motivo da transferência
            id_fila: ID da fila de destino (opcional)

        Returns:
            True se transferido com sucesso
        """
        tipo_anterior = sessao.tipo_atendimento
        sessao.tipo_atendimento = TipoAtendimento.ATENDIMENTO_HUMANO
        sessao.historico_tipos.append(
            (TipoAtendimento.ATENDIMENTO_HUMANO, datetime.utcnow())
        )
        sessao.contexto["motivo_transferencia"] = motivo.value
        sessao.contexto["tipo_anterior"] = tipo_anterior.value

        if id_fila:
            sessao.contexto["id_fila"] = str(id_fila)

        logger.info(
            "Sessão %s transferida para humano (motivo: %s)",
            sessao.id_sessao,
            motivo.value,
        )

        return True

    async def retornar_para_ia(
        self,
        sessao: SessaoAtendimento,
        manter_contexto: bool = True,
    ) -> bool:
        """
        Retorna sessão para atendimento por IA.

        Args:
            sessao: Sessão de atendimento
            manter_contexto: Se deve manter o contexto anterior

        Returns:
            True se retornado com sucesso
        """
        sessao.tipo_atendimento = TipoAtendimento.ASSISTENTE_VIRTUAL
        sessao.historico_tipos.append(
            (TipoAtendimento.ASSISTENTE_VIRTUAL, datetime.utcnow())
        )

        if not manter_contexto:
            sessao.contexto.clear()

        sessao.nr_erros_ia = 0

        logger.info("Sessão %s retornada para IA", sessao.id_sessao)

        return True

    def registrar_erro_ia(self, sessao: SessaoAtendimento) -> bool:
        """
        Registra erro de IA e verifica se deve transferir.

        Args:
            sessao: Sessão de atendimento

        Returns:
            True se deve transferir para humano
        """
        sessao.nr_erros_ia += 1

        if sessao.nr_erros_ia >= self.MAX_ERROS_IA_ANTES_TRANSFERIR:
            logger.warning(
                "Sessão %s atingiu limite de erros de IA (%d)",
                sessao.id_sessao,
                sessao.nr_erros_ia,
            )
            return True

        return False

    def _extrair_dados(self, texto: str) -> Dict[str, str]:
        """Extrai dados automaticamente do texto."""
        dados = {}

        email = self._extrair_email(texto)
        if email:
            dados["email"] = email

        telefone = self._extrair_telefone(texto)
        if telefone:
            dados["telefone"] = telefone

        cpf = self._extrair_cpf(texto)
        if cpf:
            dados["cpf"] = cpf

        return dados

    def _extrair_email(self, texto: str) -> Optional[str]:
        """Extrai email do texto."""
        match = re.search(self.PADRAO_EMAIL, texto)
        return match.group() if match else None

    def _extrair_telefone(self, texto: str) -> Optional[str]:
        """Extrai telefone do texto."""
        match = re.search(self.PADRAO_TELEFONE, texto)
        if match:
            # Limpar e formatar
            telefone = re.sub(r"[^\d]", "", match.group())
            return telefone
        return None

    def _extrair_cpf(self, texto: str) -> Optional[str]:
        """Extrai CPF do texto."""
        match = re.search(self.PADRAO_CPF, texto)
        if match:
            # Limpar
            cpf = re.sub(r"[^\d]", "", match.group())
            if len(cpf) == 11:
                return cpf
        return None

    def encerrar_sessao(self, id_conversa: uuid.UUID):
        """Encerra e remove sessão."""
        key = str(id_conversa)
        if key in self._sessoes:
            sessao = self._sessoes.pop(key)
            sessao.fg_ativa = False
            logger.info("Sessão encerrada: %s", sessao.id_sessao)

    def obter_contexto_para_ia(self, sessao: SessaoAtendimento) -> Dict[str, Any]:
        """
        Obtém contexto da sessão formatado para IA.

        Returns:
            Dict com contexto para prompt da IA
        """
        return {
            "id_sessao": str(sessao.id_sessao),
            "tipo_atendimento": sessao.tipo_atendimento.value,
            "nr_interacoes": sessao.nr_interacoes,
            "dados_contato": sessao.dados_coletados,
            "contexto_conversa": sessao.contexto,
            "tempo_sessao_minutos": (
                datetime.utcnow() - sessao.dt_inicio
            ).total_seconds() / 60,
        }

    def limpar_sessoes_expiradas(self):
        """Remove sessões expiradas da memória."""
        agora = datetime.utcnow()
        timeout = timedelta(minutes=self.SESSION_TIMEOUT_MINUTES * 2)

        expiradas = [
            key for key, sessao in self._sessoes.items()
            if agora - sessao.dt_ultima_mensagem > timeout
        ]

        for key in expiradas:
            self._sessoes.pop(key, None)

        if expiradas:
            logger.debug("Removidas %d sessões expiradas", len(expiradas))


# Singleton do gerenciador
_session_manager: Optional[SessionManager] = None


def get_session_manager() -> SessionManager:
    """Retorna instância singleton do gerenciador."""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager
