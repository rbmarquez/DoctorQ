"""
Entidade Conversa - Domain Layer
Contém regras de negócio de conversas com agentes
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4


@dataclass
class Conversa:
    """
    Entidade Conversa - Representa uma conversa/sessão com um agente de IA.

    Regras de negócio:
    - Conversa deve ter um agente associado
    - Usuário é opcional (conversas anônimas permitidas)
    - Total de mensagens deve ser >= 0
    - Conversa pode ser arquivada
    - Título pode ser gerado automaticamente
    """

    # Identificadores
    id_conversa: UUID = field(default_factory=uuid4)
    id_agente: UUID = field(default_factory=uuid4)
    id_usuario: Optional[UUID] = None
    id_empresa: Optional[UUID] = None

    # Informações
    nm_titulo: Optional[str] = None
    ds_contexto: Optional[str] = None

    # Estatísticas
    nr_total_mensagens: int = 0
    nr_tokens_usados: int = 0
    nr_tokens_usuario: int = 0
    nr_tokens_assistente: int = 0

    # Estado
    fl_arquivada: bool = False
    dt_ultima_mensagem: Optional[datetime] = None

    # Metadados
    dt_criacao: datetime = field(default_factory=datetime.utcnow)
    dt_atualizacao: Optional[datetime] = None

    def __post_init__(self):
        """Validações após inicialização"""
        self._validar()

    def _validar(self) -> None:
        """Valida as regras de negócio da conversa"""
        if not self.id_agente:
            raise ValueError("Conversa deve ter um agente associado")

        if self.nr_total_mensagens < 0:
            raise ValueError("Total de mensagens deve ser >= 0")

        if self.nr_tokens_usados < 0:
            raise ValueError("Total de tokens deve ser >= 0")

        if self.nm_titulo and len(self.nm_titulo) > 200:
            raise ValueError("Título não pode ter mais de 200 caracteres")

    def adicionar_mensagem(
        self,
        nr_tokens_mensagem: int,
        eh_usuario: bool = True
    ) -> None:
        """
        Adiciona uma mensagem à conversa e atualiza estatísticas.

        Args:
            nr_tokens_mensagem: Quantidade de tokens da mensagem
            eh_usuario: True se mensagem do usuário, False se do assistente
        """
        if nr_tokens_mensagem < 0:
            raise ValueError("Tokens da mensagem deve ser >= 0")

        self.nr_total_mensagens += 1
        self.nr_tokens_usados += nr_tokens_mensagem

        if eh_usuario:
            self.nr_tokens_usuario += nr_tokens_mensagem
        else:
            self.nr_tokens_assistente += nr_tokens_mensagem

        self.dt_ultima_mensagem = datetime.utcnow()
        self.dt_atualizacao = datetime.utcnow()

    def arquivar(self) -> None:
        """Arquiva a conversa (regra de negócio)"""
        if self.fl_arquivada:
            raise ValueError("Conversa já está arquivada")

        self.fl_arquivada = True
        self.dt_atualizacao = datetime.utcnow()

    def desarquivar(self) -> None:
        """Desarquiva a conversa"""
        if not self.fl_arquivada:
            raise ValueError("Conversa não está arquivada")

        self.fl_arquivada = False
        self.dt_atualizacao = datetime.utcnow()

    def atualizar_titulo(self, novo_titulo: str) -> None:
        """Atualiza o título da conversa"""
        if not novo_titulo or len(novo_titulo.strip()) == 0:
            raise ValueError("Título não pode ser vazio")

        if len(novo_titulo) > 200:
            raise ValueError("Título não pode ter mais de 200 caracteres")

        self.nm_titulo = novo_titulo.strip()
        self.dt_atualizacao = datetime.utcnow()

    def atualizar_contexto(self, novo_contexto: Optional[str]) -> None:
        """Atualiza o contexto da conversa"""
        self.ds_contexto = novo_contexto
        self.dt_atualizacao = datetime.utcnow()

    def calcular_custo_estimado(self, preco_por_1k_tokens: float = 0.002) -> float:
        """
        Calcula o custo estimado da conversa baseado nos tokens usados.

        Args:
            preco_por_1k_tokens: Preço por 1000 tokens (default: $0.002 para GPT-4)

        Returns:
            Custo estimado em dólares
        """
        if preco_por_1k_tokens < 0:
            raise ValueError("Preço por 1k tokens deve ser >= 0")

        return (self.nr_tokens_usados / 1000) * preco_por_1k_tokens

    def eh_ativa(self, minutos_inatividade: int = 30) -> bool:
        """
        Verifica se a conversa está ativa (teve mensagens recentes).

        Args:
            minutos_inatividade: Minutos sem mensagens para considerar inativa

        Returns:
            True se ativa, False se inativa
        """
        if not self.dt_ultima_mensagem:
            return False

        tempo_inativo = datetime.utcnow() - self.dt_ultima_mensagem
        return tempo_inativo.total_seconds() < (minutos_inatividade * 60)

    def to_dict(self) -> dict:
        """Converte entidade para dicionário"""
        return {
            "id_conversa": str(self.id_conversa),
            "id_agente": str(self.id_agente),
            "id_usuario": str(self.id_usuario) if self.id_usuario else None,
            "id_empresa": str(self.id_empresa) if self.id_empresa else None,
            "nm_titulo": self.nm_titulo,
            "ds_contexto": self.ds_contexto,
            "nr_total_mensagens": self.nr_total_mensagens,
            "nr_tokens_usados": self.nr_tokens_usados,
            "nr_tokens_usuario": self.nr_tokens_usuario,
            "nr_tokens_assistente": self.nr_tokens_assistente,
            "fl_arquivada": self.fl_arquivada,
            "dt_ultima_mensagem": self.dt_ultima_mensagem.isoformat() if self.dt_ultima_mensagem else None,
            "dt_criacao": self.dt_criacao.isoformat() if self.dt_criacao else None,
            "dt_atualizacao": self.dt_atualizacao.isoformat() if self.dt_atualizacao else None,
        }
