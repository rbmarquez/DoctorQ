"""
Entidade Message - Domain Layer
Contém regras de negócio de mensagens
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4


@dataclass
class Message:
    """
    Entidade Message - Representa uma mensagem em uma conversa.

    Regras de negócio:
    - Mensagem deve ter conteúdo
    - Role deve ser válido (user, assistant, system, function, tool)
    - Tokens deve ser >= 0
    - Mensagem pode ter metadados
    """

    # Identificadores
    id_message: UUID = field(default_factory=uuid4)
    id_conversa: UUID = field(default_factory=uuid4)

    # Conteúdo
    ds_role: str = "user"  # user, assistant, system, function, tool
    ds_content: str = ""
    ds_name: Optional[str] = None

    # Tokens e custo
    nr_tokens: int = 0
    nr_tokens_prompt: int = 0
    nr_tokens_completion: int = 0
    nr_custo: float = 0.0

    # Metadados
    metadata: Optional[Dict[str, Any]] = None

    # Feedback
    fl_feedback_positivo: Optional[bool] = None
    ds_feedback_comentario: Optional[str] = None

    # Timestamps
    dt_criacao: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self):
        """Validações após inicialização"""
        self._validar()

    def _validar(self) -> None:
        """Valida as regras de negócio da mensagem"""
        if not self.id_conversa:
            raise ValueError("Mensagem deve ter uma conversa associada")

        roles_validos = ["user", "assistant", "system", "function", "tool"]
        if self.ds_role not in roles_validos:
            raise ValueError(f"Role inválido. Roles válidos: {', '.join(roles_validos)}")

        if not self.ds_content or len(self.ds_content.strip()) == 0:
            raise ValueError("Conteúdo da mensagem é obrigatório")

        if self.nr_tokens < 0:
            raise ValueError("Tokens deve ser >= 0")

        if self.nr_tokens_prompt < 0:
            raise ValueError("Tokens prompt deve ser >= 0")

        if self.nr_tokens_completion < 0:
            raise ValueError("Tokens completion deve ser >= 0")

        if self.nr_custo < 0:
            raise ValueError("Custo deve ser >= 0")

    def eh_do_usuario(self) -> bool:
        """Verifica se mensagem é do usuário"""
        return self.ds_role == "user"

    def eh_do_assistente(self) -> bool:
        """Verifica se mensagem é do assistente"""
        return self.ds_role == "assistant"

    def eh_do_sistema(self) -> bool:
        """Verifica se mensagem é do sistema"""
        return self.ds_role == "system"

    def adicionar_feedback_positivo(self, comentario: Optional[str] = None) -> None:
        """Adiciona feedback positivo à mensagem"""
        self.fl_feedback_positivo = True
        if comentario:
            self.ds_feedback_comentario = comentario

    def adicionar_feedback_negativo(self, comentario: Optional[str] = None) -> None:
        """Adiciona feedback negativo à mensagem"""
        self.fl_feedback_positivo = False
        if comentario:
            self.ds_feedback_comentario = comentario

    def remover_feedback(self) -> None:
        """Remove feedback da mensagem"""
        self.fl_feedback_positivo = None
        self.ds_feedback_comentario = None

    def calcular_tokens_total(self) -> int:
        """Calcula total de tokens (prompt + completion)"""
        return self.nr_tokens_prompt + self.nr_tokens_completion

    def atualizar_tokens(
        self,
        tokens_prompt: int = 0,
        tokens_completion: int = 0
    ) -> None:
        """Atualiza contagem de tokens"""
        if tokens_prompt < 0:
            raise ValueError("Tokens prompt deve ser >= 0")

        if tokens_completion < 0:
            raise ValueError("Tokens completion deve ser >= 0")

        self.nr_tokens_prompt = tokens_prompt
        self.nr_tokens_completion = tokens_completion
        self.nr_tokens = tokens_prompt + tokens_completion

    def atualizar_custo(self, custo: float) -> None:
        """Atualiza o custo da mensagem"""
        if custo < 0:
            raise ValueError("Custo deve ser >= 0")

        self.nr_custo = custo

    def adicionar_metadata(self, chave: str, valor: Any) -> None:
        """Adiciona metadado à mensagem"""
        if not self.metadata:
            self.metadata = {}

        self.metadata[chave] = valor

    def obter_metadata(self, chave: str) -> Optional[Any]:
        """Obtém metadado da mensagem"""
        if not self.metadata:
            return None

        return self.metadata.get(chave)

    def tem_feedback(self) -> bool:
        """Verifica se mensagem tem feedback"""
        return self.fl_feedback_positivo is not None

    def feedback_eh_positivo(self) -> bool:
        """Verifica se feedback é positivo"""
        return self.fl_feedback_positivo is True

    def to_dict(self) -> dict:
        """Converte entidade para dicionário"""
        return {
            "id_message": str(self.id_message),
            "id_conversa": str(self.id_conversa),
            "ds_role": self.ds_role,
            "ds_content": self.ds_content,
            "ds_name": self.ds_name,
            "nr_tokens": self.nr_tokens,
            "nr_tokens_prompt": self.nr_tokens_prompt,
            "nr_tokens_completion": self.nr_tokens_completion,
            "nr_custo": self.nr_custo,
            "metadata": self.metadata,
            "fl_feedback_positivo": self.fl_feedback_positivo,
            "ds_feedback_comentario": self.ds_feedback_comentario,
            "dt_criacao": self.dt_criacao.isoformat() if self.dt_criacao else None,
        }

    def to_openai_format(self) -> Dict[str, str]:
        """
        Converte mensagem para formato OpenAI Chat API.

        Returns:
            Dicionário com role e content
        """
        message_dict = {
            "role": self.ds_role,
            "content": self.ds_content,
        }

        if self.ds_name:
            message_dict["name"] = self.ds_name

        return message_dict
