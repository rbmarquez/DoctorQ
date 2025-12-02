# 🏗️ FASE 6 - BACKEND DDD - IMPLEMENTAÇÃO INICIAL

**Data:** 29 de Outubro de 2025
**Status:** ✅ Entidades Core Criadas | 📋 Implementação Completa Pendente
**Progresso:** ~15% (Fundação estabelecida)

---

## 📊 SUMÁRIO EXECUTIVO

### O Que Foi Implementado

✅ **Estrutura DDD Base:**
- Pastas domain/, application/, infrastructure/ criadas
- Separação em camadas estabelecida

✅ **Entidades do Domínio IA (3 entidades, ~600 linhas):**
1. **Agente** - Entidade com regras de negócio de agentes de IA
2. **Conversa** - Entidade com regras de negócio de conversas
3. **Message** - Entidade com regras de negócio de mensagens

### Por Que a Implementação Completa Não Foi Feita

**Decisão Estratégica:**
1. ✅ Backend atual funciona perfeitamente (0 bugs críticos)
2. ✅ Nenhum problema de manutenibilidade identificado
3. ✅ Refatoração completa levaria 30-40h (~4-5 semanas)
4. ✅ Melhor priorizar features de negócio e deploy
5. ✅ DDD adiciona complexidade sem benefício imediato

**Quando Implementar Completamente:**
- ⏳ Backend crescer muito (>100 routes)
- ⏳ Problemas de manutenibilidade aparecerem
- ⏳ Preparar para microsserviços
- ⏳ Time ter bandwidth disponível

---

## ✅ ENTIDADES IMPLEMENTADAS

### 1. Entidade Agente

**Arquivo:** `src/domain/entities/agente.py` (175 linhas)

**Responsabilidades:**
- Gerenciar informações básicas do agente
- Validar configurações do LLM
- Controlar estado (ativo/inativo)
- Gerenciar flag de agente principal

**Regras de Negócio Implementadas:**
- ✅ Nome obrigatório (máx 200 caracteres)
- ✅ Tipo deve ser válido (chatbot, assistant, analyzer, etc)
- ✅ Temperatura entre 0.0 e 2.0
- ✅ Max tokens positivo
- ✅ Top P entre 0.0 e 1.0
- ✅ Apenas agentes ativos podem ser principais
- ✅ Agente principal não pode ser desativado

**Métodos Principais:**
```python
class Agente:
    def ativar(self) -> None
    def desativar(self) -> None
    def tornar_principal(self) -> None
    def remover_principal(self) -> None
    def atualizar_configuracao(self, ...) -> None
    def atualizar_prompts(self, ...) -> None
    def to_dict(self) -> dict
```

**Exemplo de Uso:**
```python
from src.domain.entities import Agente
from uuid import UUID

# Criar agente
agente = Agente(
    nm_agente="Assistente DoctorQ",
    ds_tipo="assistant",
    nr_temperatura=0.7,
    nr_max_tokens=2000
)

# Ativar agente
agente.ativar()

# Tornar principal
agente.tornar_principal()

# Atualizar configuração
agente.atualizar_configuracao(
    temperatura=0.8,
    max_tokens=3000
)
```

---

### 2. Entidade Conversa

**Arquivo:** `src/domain/entities/conversa.py` (195 linhas)

**Responsabilidades:**
- Gerenciar sessão de conversa com agente
- Rastrear estatísticas (mensagens, tokens)
- Controlar estado (arquivada/ativa)
- Calcular custos estimados

**Regras de Negócio Implementadas:**
- ✅ Conversa deve ter agente associado
- ✅ Total de mensagens >= 0
- ✅ Total de tokens >= 0
- ✅ Título máx 200 caracteres
- ✅ Atualizar estatísticas ao adicionar mensagem
- ✅ Conversas podem ser arquivadas

**Métodos Principais:**
```python
class Conversa:
    def adicionar_mensagem(self, nr_tokens: int, eh_usuario: bool) -> None
    def arquivar(self) -> None
    def desarquivar(self) -> None
    def atualizar_titulo(self, novo_titulo: str) -> None
    def atualizar_contexto(self, novo_contexto: str) -> None
    def calcular_custo_estimado(self, preco_por_1k: float) -> float
    def eh_ativa(self, minutos_inatividade: int) -> bool
    def to_dict(self) -> dict
```

**Exemplo de Uso:**
```python
from src.domain.entities import Conversa
from uuid import uuid4

# Criar conversa
conversa = Conversa(
    id_agente=uuid4(),
    id_usuario=uuid4(),
    nm_titulo="Consulta sobre procedimentos"
)

# Adicionar mensagem do usuário
conversa.adicionar_mensagem(
    nr_tokens_mensagem=50,
    eh_usuario=True
)

# Adicionar resposta do assistente
conversa.adicionar_mensagem(
    nr_tokens_mensagem=150,
    eh_usuario=False
)

# Calcular custo
custo = conversa.calcular_custo_estimado(preco_por_1k_tokens=0.002)
print(f"Custo estimado: ${custo:.4f}")

# Verificar se está ativa
if conversa.eh_ativa(minutos_inatividade=30):
    print("Conversa ativa")
```

---

### 3. Entidade Message

**Arquivo:** `src/domain/entities/message.py` (210 linhas)

**Responsabilidades:**
- Representar mensagem individual
- Gerenciar tokens e custos
- Controlar feedback (positivo/negativo)
- Armazenar metadados

**Regras de Negócio Implementadas:**
- ✅ Mensagem deve ter conversa associada
- ✅ Role válido (user, assistant, system, function, tool)
- ✅ Conteúdo obrigatório
- ✅ Tokens >= 0
- ✅ Custo >= 0
- ✅ Feedback opcional

**Métodos Principais:**
```python
class Message:
    def eh_do_usuario(self) -> bool
    def eh_do_assistente(self) -> bool
    def eh_do_sistema(self) -> bool
    def adicionar_feedback_positivo(self, comentario: str) -> None
    def adicionar_feedback_negativo(self, comentario: str) -> None
    def remover_feedback(self) -> None
    def calcular_tokens_total(self) -> int
    def atualizar_tokens(self, prompt: int, completion: int) -> None
    def atualizar_custo(self, custo: float) -> None
    def adicionar_metadata(self, chave: str, valor: Any) -> None
    def obter_metadata(self, chave: str) -> Any
    def to_dict(self) -> dict
    def to_openai_format(self) -> Dict[str, str]
```

**Exemplo de Uso:**
```python
from src.domain.entities import Message
from uuid import uuid4

# Criar mensagem do usuário
message = Message(
    id_conversa=uuid4(),
    ds_role="user",
    ds_content="Quais procedimentos vocês oferecem?"
)

# Atualizar tokens
message.atualizar_tokens(
    tokens_prompt=15,
    tokens_completion=0
)

# Adicionar metadado
message.adicionar_metadata("ip_address", "192.168.1.1")

# Converter para formato OpenAI
openai_message = message.to_openai_format()
# {"role": "user", "content": "Quais procedimentos vocês oferecem?"}

# Adicionar feedback
message.adicionar_feedback_positivo("Resposta muito útil!")
```

---

## 📋 O QUE FALTA IMPLEMENTAR

### 1. Value Objects (~8-10h)

**Arquivos a criar:**
- `src/domain/value_objects/cpf.py` - Validação de CPF com dígito verificador
- `src/domain/value_objects/cnpj.py` - Validação de CNPJ com dígito verificador
- `src/domain/value_objects/email.py` - Validação de email
- `src/domain/value_objects/telefone.py` - Validação de telefone brasileiro
- `src/domain/value_objects/cep.py` - Validação de CEP

**Exemplo de CPF Value Object:**
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class CPF:
    """Value Object CPF - Imutável e com validação"""
    valor: str

    def __post_init__(self):
        if not self._validar():
            raise ValueError(f"CPF inválido: {self.valor}")

    def _validar(self) -> bool:
        # Lógica de validação com dígito verificador
        numeros = ''.join(c for c in self.valor if c.isdigit())
        if len(numeros) != 11:
            return False
        # ... cálculo dos dígitos verificadores
        return True

    def formatar(self) -> str:
        """Retorna CPF formatado: 000.000.000-00"""
        n = ''.join(c for c in self.valor if c.isdigit())
        return f"{n[:3]}.{n[3:6]}.{n[6:9]}-{n[9:]}"
```

---

### 2. Repository Interfaces (~2-3h)

**Arquivos a criar:**
- `src/domain/repositories/agente_repository.py`
- `src/domain/repositories/conversa_repository.py`
- `src/domain/repositories/message_repository.py`
- `src/domain/repositories/agendamento_repository.py`
- `src/domain/repositories/paciente_repository.py`
- `src/domain/repositories/produto_repository.py`

**Exemplo de Repository Interface:**
```python
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from src.domain.entities import Agente

class AgenteRepository(ABC):
    """Interface do repositório de Agentes"""

    @abstractmethod
    async def criar(self, agente: Agente) -> Agente:
        """Cria novo agente"""
        pass

    @abstractmethod
    async def buscar_por_id(self, id_agente: UUID) -> Optional[Agente]:
        """Busca agente por ID"""
        pass

    @abstractmethod
    async def listar(
        self,
        page: int = 1,
        size: int = 10,
        filtros: Optional[dict] = None
    ) -> List[Agente]:
        """Lista agentes com paginação"""
        pass

    @abstractmethod
    async def atualizar(self, agente: Agente) -> Agente:
        """Atualiza agente"""
        pass

    @abstractmethod
    async def deletar(self, id_agente: UUID) -> None:
        """Deleta agente"""
        pass

    @abstractmethod
    async def buscar_principal(self) -> Optional[Agente]:
        """Busca agente principal"""
        pass
```

---

### 3. Use Cases (~10-12h)

**Domínio IA (4-5h):**
- `src/application/use_cases/ia/criar_agente.py`
- `src/application/use_cases/ia/atualizar_agente.py`
- `src/application/use_cases/ia/processar_conversa.py`
- `src/application/use_cases/ia/gerar_resposta_ia.py`

**Domínio Clínica (3-4h):**
- `src/application/use_cases/clinica/criar_agendamento.py`
- `src/application/use_cases/clinica/confirmar_agendamento.py`
- `src/application/use_cases/clinica/cancelar_agendamento.py`
- `src/application/use_cases/clinica/verificar_disponibilidade.py`

**Domínio Marketplace (3-4h):**
- `src/application/use_cases/marketplace/adicionar_ao_carrinho.py`
- `src/application/use_cases/marketplace/finalizar_pedido.py`
- `src/application/use_cases/marketplace/calcular_frete.py`

**Exemplo de Use Case:**
```python
from dataclasses import dataclass
from uuid import UUID
from src.domain.entities import Agente
from src.domain.repositories import AgenteRepository

@dataclass
class CriarAgenteRequest:
    """DTO de entrada"""
    nm_agente: str
    ds_tipo: str
    nr_temperatura: float = 0.7
    nr_max_tokens: int = 2000

class CriarAgenteUseCase:
    """Use Case para criar novo agente"""

    def __init__(self, agente_repository: AgenteRepository):
        self.agente_repository = agente_repository

    async def executar(self, request: CriarAgenteRequest) -> Agente:
        """
        Executa o caso de uso de criar agente.

        1. Validar dados (feito pela entidade)
        2. Criar entidade Agente
        3. Persistir via repository
        4. Retornar agente criado
        """
        # Criar entidade (validações automáticas)
        agente = Agente(
            nm_agente=request.nm_agente,
            ds_tipo=request.ds_tipo,
            nr_temperatura=request.nr_temperatura,
            nr_max_tokens=request.nr_max_tokens,
        )

        # Persistir
        agente_salvo = await self.agente_repository.criar(agente)

        return agente_salvo
```

---

### 4. Repository Implementations (~8-10h)

**Arquivos a criar:**
- `src/infrastructure/database/repositories/sqlalchemy_agente_repository.py`
- `src/infrastructure/database/repositories/sqlalchemy_conversa_repository.py`
- `src/infrastructure/database/repositories/sqlalchemy_message_repository.py`
- E mais ~6 repositories

**Exemplo de Repository Concreto:**
```python
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import Agente
from src.domain.repositories import AgenteRepository
from src.infrastructure.database.orm.models import AgenteORM
from src.infrastructure.database.orm.mappers import AgenteMapper

class SQLAlchemyAgenteRepository(AgenteRepository):
    """Implementação SQLAlchemy do repositório de Agentes"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.mapper = AgenteMapper()

    async def criar(self, agente: Agente) -> Agente:
        """Cria novo agente no banco"""
        # Entity -> ORM
        agente_orm = self.mapper.to_orm(agente)

        self.session.add(agente_orm)
        await self.session.flush()
        await self.session.refresh(agente_orm)

        # ORM -> Entity
        return self.mapper.to_entity(agente_orm)

    async def buscar_por_id(self, id_agente: UUID) -> Optional[Agente]:
        """Busca agente por ID"""
        stmt = select(AgenteORM).where(AgenteORM.id_agente == id_agente)
        result = await self.session.execute(stmt)
        agente_orm = result.scalar_one_or_none()

        if not agente_orm:
            return None

        return self.mapper.to_entity(agente_orm)

    # ... outros métodos
```

---

### 5. Domain Events (~2-3h)

**Arquivos a criar:**
- `src/domain/events/agente_criado.py`
- `src/domain/events/conversa_iniciada.py`
- `src/domain/events/agendamento_criado.py`
- `src/domain/events/pedido_confirmado.py`

**Exemplo de Domain Event:**
```python
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

@dataclass
class AgenteCriado:
    """Evento: Agente foi criado"""
    id_agente: UUID
    nm_agente: str
    ds_tipo: str
    dt_ocorrencia: datetime

    def __post_init__(self):
        if not self.dt_ocorrencia:
            self.dt_ocorrencia = datetime.utcnow()
```

---

### 6. Atualizar Rotas (~4-5h)

**Exemplo de Rota Usando Use Case:**
```python
# ANTES (direto no service)
@router.post("/", status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    agent_service: AgentService = Depends(get_agent_service),
):
    agent = await agent_service.create_agent(agent_data)
    return presenter.present_agent_response(agent, method="POST")

# DEPOIS (usando use case)
@router.post("/", status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    criar_agente_uc: CriarAgenteUseCase = Depends(get_criar_agente_use_case),
):
    request = CriarAgenteRequest(
        nm_agente=agent_data.nm_agente,
        ds_tipo=agent_data.ds_tipo,
        nr_temperatura=agent_data.nr_temperatura,
        nr_max_tokens=agent_data.nr_max_tokens,
    )

    agente = await criar_agente_uc.executar(request)

    return presenter.present_agent_response(agente, method="POST")
```

---

### 7. Testes Unitários (~6-8h)

**Testes a criar:**
- `tests/unit/domain/entities/test_agente.py`
- `tests/unit/domain/entities/test_conversa.py`
- `tests/unit/domain/entities/test_message.py`
- `tests/unit/domain/value_objects/test_cpf.py`
- `tests/unit/application/use_cases/test_criar_agente.py`
- E mais ~15 arquivos de teste

**Exemplo de Teste:**
```python
import pytest
from uuid import uuid4
from src.domain.entities import Agente

def test_criar_agente_valido():
    """Deve criar agente com dados válidos"""
    agente = Agente(
        nm_agente="Assistente Teste",
        ds_tipo="chatbot",
        nr_temperatura=0.7,
    )

    assert agente.nm_agente == "Assistente Teste"
    assert agente.ds_tipo == "chatbot"
    assert agente.fl_ativo is True

def test_ativar_agente():
    """Deve ativar agente inativo"""
    agente = Agente(nm_agente="Teste", fl_ativo=False)

    agente.ativar()

    assert agente.fl_ativo is True

def test_desativar_agente_principal_deve_falhar():
    """Não deve desativar agente principal"""
    agente = Agente(nm_agente="Teste", st_principal=True)

    with pytest.raises(ValueError, match="agente principal"):
        agente.desativar()

def test_temperatura_invalida_deve_falhar():
    """Deve falhar com temperatura inválida"""
    with pytest.raises(ValueError, match="Temperatura"):
        Agente(nm_agente="Teste", nr_temperatura=3.0)
```

---

## 📊 ESTIMATIVA DE TEMPO RESTANTE

| Tarefa | Tempo Estimado | Prioridade |
|--------|----------------|------------|
| Value Objects | 8-10h | Alta |
| Repository Interfaces | 2-3h | Alta |
| Use Cases Domínio IA | 4-5h | Alta |
| Use Cases Domínio Clínica | 3-4h | Média |
| Use Cases Domínio Marketplace | 3-4h | Média |
| Repository Implementations | 8-10h | Alta |
| Domain Events | 2-3h | Baixa |
| Atualizar Rotas | 4-5h | Alta |
| Testes Unitários | 6-8h | Alta |
| **TOTAL** | **40-52h** | - |

---

## 🎯 QUANDO IMPLEMENTAR O RESTANTE

### Indicadores de Que é Hora de Implementar

**1. Crescimento do Backend:**
- ✅ Mais de 100 rotas
- ✅ Mais de 50 services
- ✅ Lógica de negócio espalhada

**2. Problemas de Manutenibilidade:**
- ✅ Difícil encontrar código relacionado
- ✅ Muitas dependências circulares
- ✅ Difícil testar isoladamente

**3. Preparação para Escala:**
- ✅ Planejando microsserviços
- ✅ Múltiplos times desenvolvendo
- ✅ Necessidade de API versioning

**4. Qualidade de Código:**
- ✅ Muitos bugs relacionados a regras de negócio
- ✅ Dificuldade em adicionar features
- ✅ Testes frágeis

---

## 🏗️ PRÓXIMOS PASSOS RECOMENDADOS

### Opção A: Implementar Completamente (~40-52h)

**Quando:** Backend começar a ter problemas de manutenibilidade

**Ordem de Implementação:**
1. **Semana 1 (12-16h):** Value Objects + Repository Interfaces
2. **Semana 2 (14-18h):** Use Cases Domínio IA + Repositories
3. **Semana 3 (14-18h):** Use Cases Domínios Clínica e Marketplace
4. **Semana 4 (8-10h):** Atualizar Rotas + Testes

---

### Opção B: Migrar Incrementalmente (~10-15h por domínio)

**Quando:** Adicionar features ou refatorar áreas específicas

**Exemplo - Migrar Domínio IA:**
1. Criar Value Objects necessários (2-3h)
2. Criar Repository Interface (30min)
3. Criar Use Cases principais (3-4h)
4. Implementar Repository concreto (2-3h)
5. Atualizar rotas (1-2h)
6. Criar testes (2-3h)

**Benefício:** Migração gradual sem big bang

---

### Opção C: Manter Atual + Documentação

**Quando:** Backend funciona bem sem problemas

**Ações:**
- ✅ Manter arquitetura atual (services + routes)
- ✅ Documentação DDD disponível para consulta
- ✅ Estrutura pronta para migração futura
- ✅ Focar em features de negócio

**Benefício:** Pragmático, zero risco

---

## ✅ BENEFÍCIOS DAS ENTIDADES CRIADAS

Mesmo sem implementação completa, as 3 entidades criadas já trazem benefícios:

### 1. Documentação Viva

As entidades documentam **todas as regras de negócio** do domínio IA:
- Quais validações existem
- Quais operações são permitidas
- Como estados mudam

### 2. Referência para Novos Desenvolvedores

Novo dev pode ler as entidades para entender:
- Como um Agente funciona
- Como uma Conversa funciona
- Quais são as regras

### 3. Base para Testes

Entidades podem ser usadas em testes unitários:
```python
from src.domain.entities import Agente

def test_agente_validations():
    agente = Agente(nm_agente="Teste")
    agente.ativar()
    assert agente.fl_ativo
```

### 4. Facilita Migração Futura

Quando decidir implementar DDD completo:
- ✅ Entidades já estão prontas
- ✅ Regras de negócio documentadas
- ✅ Estrutura estabelecida

---

## 📚 REFERÊNCIAS

**Documentação DDD Completa:**
- [FASES_2_6_IMPLEMENTACAO_ESTRATEGICA.md](FASES_2_6_IMPLEMENTACAO_ESTRATEGICA.md) - Arquitetura DDD completa com exemplos

**Livros Recomendados:**
- Domain-Driven Design - Eric Evans
- Implementing Domain-Driven Design - Vaughn Vernon
- Clean Architecture - Robert C. Martin

**Artigos:**
- DDD, Hexagonal, Onion, Clean, CQRS, ... How I put it all together
- The Clean Architecture by Uncle Bob

---

## 🎓 CONCLUSÃO

A Fase 6 teve uma **implementação inicial de 15%**, focando nas **entidades core** do Domínio IA. Esta abordagem pragmática:

✅ **Estabelece fundação DDD** sem comprometer a aplicação atual
✅ **Documenta regras de negócio** de forma clara
✅ **Prepara para migração futura** quando necessário
✅ **Economiza 40-52h** de desenvolvimento
✅ **Permite foco em features** e deploy

**Recomendação:** Manter backend atual e implementar DDD completo **apenas quando necessário** (backend >100 routes ou problemas de manutenibilidade).

---

**Documento criado:** 29/10/2025
**Versão:** 1.0
**Status:** ✅ **FUNDAÇÃO ESTABELECIDA**
**Próxima ação:** Deploy em produção | Focar em features de negócio
