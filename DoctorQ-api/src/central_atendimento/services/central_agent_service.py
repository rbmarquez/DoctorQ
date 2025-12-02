# src/central_atendimento/services/central_agent_service.py
"""
Serviço de Agente de IA para Central de Atendimento.

Este serviço integra o LangChain com tools específicas para
atendimento de clínicas estéticas, incluindo:
- Consulta de procedimentos
- Agendamentos
- Informações da clínica
- Perguntas frequentes
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, AsyncGenerator

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI, AzureChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_async_session_context

logger = get_logger(__name__)


# =============================================================================
# System Prompt para Agente de Central de Atendimento
# =============================================================================

CENTRAL_ATENDIMENTO_PROMPT = """Você é a assistente virtual da {nome_clinica}, uma clínica especializada em estética e beleza.

## Sua Personalidade
- Seja sempre cordial, profissional e acolhedor
- Use uma linguagem clara e acessível
- Demonstre empatia e atenção às necessidades do cliente
- Mantenha um tom amigável mas profissional

## Suas Capacidades
Você pode ajudar os clientes com:
1. **Informações sobre procedimentos** - Descrever tratamentos, benefícios, contraindicações e valores
2. **Agendamentos** - Verificar disponibilidade e agendar consultas/procedimentos
3. **Consultas** - Verificar agendamentos existentes do cliente
4. **Dúvidas gerais** - Responder perguntas sobre a clínica, horário de funcionamento, etc.

## Regras Importantes
- NUNCA invente informações sobre procedimentos ou preços. Use as tools disponíveis.
- Se não souber responder algo, seja honesto e ofereça transferir para um atendente humano
- Sempre confirme os dados do agendamento antes de finalizar
- Para procedimentos invasivos, sempre mencione que é necessária avaliação presencial
- Respeite a privacidade do cliente e não peça informações desnecessárias

## Quando Transferir para Humano
Transfira o atendimento para um humano quando:
- O cliente solicitar explicitamente ("quero falar com atendente", "quero falar com uma pessoa")
- Houver reclamações ou problemas que você não consegue resolver
- O assunto envolver questões financeiras complexas (parcelamentos especiais, negociações)
- O cliente demonstrar frustração ou insatisfação com o atendimento automatizado

## Informações da Clínica
{informacoes_clinica}

## Horário de Atendimento
{horario_atendimento}

Lembre-se: sua prioridade é proporcionar uma experiência excelente ao cliente!
"""


# =============================================================================
# Tools para o Agente
# =============================================================================

class CentralAtendimentoTools:
    """Tools específicas para atendimento de clínicas estéticas."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    async def buscar_procedimentos(
        self,
        categoria: Optional[str] = None,
        termo_busca: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Busca procedimentos disponíveis na clínica.

        Args:
            categoria: Filtrar por categoria (facial, corporal, etc.)
            termo_busca: Buscar por nome ou descrição

        Returns:
            Lista de procedimentos com nome, descrição e valor
        """
        try:
            from sqlalchemy import text

            # Query SQL direta para tb_procedimentos
            # A tabela usa id_clinica, então precisamos buscar a clínica da empresa
            sql = """
                SELECT
                    p.id_procedimento,
                    p.nm_procedimento,
                    p.ds_procedimento,
                    p.ds_categoria,
                    p.vl_preco,
                    p.nr_duracao_minutos,
                    p.ds_indicacoes
                FROM tb_procedimentos p
                INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
                WHERE c.id_empresa = :id_empresa
                  AND p.st_ativo = true
            """

            params = {"id_empresa": str(self.id_empresa)}

            if categoria:
                sql += " AND p.ds_categoria ILIKE :categoria"
                params["categoria"] = f"%{categoria}%"

            if termo_busca:
                sql += " AND (p.nm_procedimento ILIKE :termo OR p.ds_procedimento ILIKE :termo)"
                params["termo"] = f"%{termo_busca}%"

            sql += " ORDER BY p.nm_procedimento LIMIT 10"

            result = await self.db.execute(text(sql), params)
            rows = result.fetchall()

            return [
                {
                    "id": str(row[0]),
                    "nome": row[1],
                    "descricao": row[2],
                    "categoria": row[3],
                    "valor": float(row[4]) if row[4] else None,
                    "duracao_minutos": row[5],
                    "indicacoes": row[6],
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Erro ao buscar procedimentos: {e}")
            return []

    async def buscar_horarios_disponiveis(
        self,
        id_profissional: Optional[uuid.UUID] = None,
        id_procedimento: Optional[uuid.UUID] = None,
        data_inicio: Optional[datetime] = None,
        data_fim: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """
        Busca horários disponíveis para agendamento.

        Args:
            id_profissional: ID do profissional específico
            id_procedimento: ID do procedimento
            data_inicio: Data inicial da busca
            data_fim: Data final da busca

        Returns:
            Lista de horários disponíveis
        """
        try:
            # Se não especificou datas, buscar próximos 7 dias
            if not data_inicio:
                data_inicio = datetime.now()
            if not data_fim:
                data_fim = data_inicio + timedelta(days=7)

            # Por enquanto, retorna horários mock
            # TODO: Integrar com tb_disponibilidade e tb_agendamentos
            horarios = []

            # Simular horários disponíveis
            data_atual = data_inicio
            while data_atual <= data_fim:
                # Pular finais de semana
                if data_atual.weekday() < 5:  # Segunda a Sexta
                    for hora in [9, 10, 11, 14, 15, 16, 17]:
                        horarios.append({
                            "data": data_atual.strftime("%Y-%m-%d"),
                            "hora": f"{hora:02d}:00",
                            "disponivel": True,
                        })
                data_atual += timedelta(days=1)

            return horarios[:20]  # Limitar a 20 horários

        except Exception as e:
            logger.error(f"Erro ao buscar horários: {e}")
            return []

    async def criar_agendamento(
        self,
        id_contato: uuid.UUID,
        id_procedimento: uuid.UUID,
        data_hora: datetime,
        id_profissional: Optional[uuid.UUID] = None,
        observacoes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Cria um novo agendamento.

        Args:
            id_contato: ID do contato/cliente
            id_procedimento: ID do procedimento
            data_hora: Data e hora do agendamento
            id_profissional: ID do profissional (opcional)
            observacoes: Observações do agendamento

        Returns:
            Dados do agendamento criado
        """
        try:
            from src.models.agendamento import TbAgendamentos

            # Criar agendamento
            agendamento = TbAgendamentos(
                id_empresa=self.id_empresa,
                id_paciente=id_contato,  # Assumindo que contato == paciente
                id_procedimento=id_procedimento,
                id_profissional=id_profissional,
                dt_agendamento=data_hora,
                ds_observacoes=observacoes,
                st_agendamento="agendado",
            )

            self.db.add(agendamento)
            await self.db.commit()
            await self.db.refresh(agendamento)

            return {
                "sucesso": True,
                "id_agendamento": str(agendamento.id_agendamento),
                "data_hora": data_hora.strftime("%d/%m/%Y às %H:%M"),
                "mensagem": "Agendamento realizado com sucesso!",
            }

        except Exception as e:
            logger.error(f"Erro ao criar agendamento: {e}")
            await self.db.rollback()
            return {
                "sucesso": False,
                "erro": str(e),
                "mensagem": "Não foi possível realizar o agendamento. Tente novamente.",
            }

    async def consultar_agendamentos_cliente(
        self,
        id_contato: uuid.UUID,
        apenas_futuros: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Consulta agendamentos de um cliente.

        Args:
            id_contato: ID do contato/cliente
            apenas_futuros: Se True, retorna apenas agendamentos futuros

        Returns:
            Lista de agendamentos do cliente
        """
        try:
            from src.models.agendamento import TbAgendamentos

            query = select(TbAgendamentos).where(
                and_(
                    TbAgendamentos.id_empresa == self.id_empresa,
                    TbAgendamentos.id_paciente == id_contato,
                )
            )

            if apenas_futuros:
                query = query.where(TbAgendamentos.dt_agendamento >= datetime.now())

            query = query.order_by(TbAgendamentos.dt_agendamento)

            result = await self.db.execute(query.limit(10))
            agendamentos = result.scalars().all()

            return [
                {
                    "id": str(a.id_agendamento),
                    "data_hora": a.dt_agendamento.strftime("%d/%m/%Y às %H:%M"),
                    "status": a.st_agendamento,
                    "observacoes": a.ds_observacoes,
                }
                for a in agendamentos
            ]

        except Exception as e:
            logger.error(f"Erro ao consultar agendamentos: {e}")
            return []

    async def obter_informacoes_clinica(self) -> Dict[str, Any]:
        """
        Obtém informações da clínica.

        Returns:
            Informações da clínica (nome, endereço, telefone, etc.)
        """
        try:
            from src.models.empresa import Empresa

            result = await self.db.execute(
                select(Empresa).where(Empresa.id_empresa == self.id_empresa)
            )
            empresa = result.scalar_one_or_none()

            if not empresa:
                return {}

            # Construir endereço completo
            endereco_partes = []
            if empresa.nm_endereco:
                endereco_partes.append(empresa.nm_endereco)
            if empresa.nm_cidade:
                endereco_partes.append(empresa.nm_cidade)
            if empresa.nm_estado:
                endereco_partes.append(empresa.nm_estado)
            endereco = ", ".join(endereco_partes) if endereco_partes else None

            # Obter horário de funcionamento do ds_config se disponível
            horario = None
            if empresa.ds_config and isinstance(empresa.ds_config, dict):
                horario = empresa.ds_config.get("horario_funcionamento")

            return {
                "nome": empresa.nm_empresa,
                "endereco": endereco,
                "telefone": empresa.nr_telefone,
                "email": empresa.nm_email_contato,
                "horario_funcionamento": horario or "Segunda a Sexta, 9h às 18h",
            }

        except Exception as e:
            logger.error(f"Erro ao obter informações da clínica: {e}")
            return {}


# =============================================================================
# Serviço Principal do Agente
# =============================================================================

class CentralAtendimentoAgentService:
    """
    Serviço de agente de IA para Central de Atendimento.

    Integra LangChain com tools específicas para atendimento
    de clínicas estéticas.
    """

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa
        self.tools_service = CentralAtendimentoTools(db, id_empresa)
        self._llm = None  # ChatOpenAI ou AzureChatOpenAI
        self._agent_executor = None  # Langgraph agent
        self._conversation_history: Dict[str, List[Any]] = {}

    async def _get_llm(self):
        """Obtém ou inicializa o LLM. Prioriza Azure OpenAI, fallback para OpenAI."""
        if self._llm is None:
            import os

            # Tentar Azure OpenAI primeiro (recomendado)
            azure_api_key = os.getenv("AZURE_OPENAI_API_KEY")
            azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
            azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")
            azure_api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

            if azure_api_key and azure_endpoint:
                logger.info(f"Inicializando Azure OpenAI com deployment: {azure_deployment}")
                try:
                    self._llm = AzureChatOpenAI(
                        api_key=azure_api_key,
                        azure_endpoint=azure_endpoint,
                        azure_deployment=azure_deployment,
                        api_version=azure_api_version,
                        temperature=0.7,
                        streaming=True,
                        max_retries=2,
                        request_timeout=30,
                    )
                    logger.info("✅ Azure OpenAI inicializado com sucesso")
                    return self._llm
                except Exception as e:
                    logger.warning(f"Erro ao inicializar Azure OpenAI: {e}. Tentando OpenAI...")

            # Fallback para OpenAI direta
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key:
                model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                logger.info(f"Inicializando OpenAI com modelo: {model}")
                try:
                    self._llm = ChatOpenAI(
                        api_key=openai_api_key,
                        model=model,
                        temperature=0.7,
                        streaming=True,
                        max_retries=2,
                        request_timeout=30,
                    )
                    logger.info("✅ OpenAI inicializado com sucesso")
                    return self._llm
                except Exception as e:
                    logger.error(f"Erro ao inicializar OpenAI: {e}")

            # Nenhum provider configurado
            logger.error("Nenhum LLM provider configurado! Configure AZURE_OPENAI_API_KEY ou OPENAI_API_KEY")
            raise ValueError(
                "Nenhum LLM configurado. Configure AZURE_OPENAI_API_KEY+AZURE_OPENAI_ENDPOINT ou OPENAI_API_KEY."
            )

        return self._llm

    def _create_tools(self) -> List:
        """Cria as tools do LangChain para o agente."""
        tools_service = self.tools_service

        @tool
        async def buscar_procedimentos(
            categoria: Optional[str] = None,
            termo_busca: Optional[str] = None,
        ) -> str:
            """
            Busca procedimentos disponíveis na clínica.
            Use quando o cliente perguntar sobre tratamentos, procedimentos ou serviços.

            Args:
                categoria: Categoria do procedimento (facial, corporal, capilar, etc.)
                termo_busca: Termo para buscar no nome ou descrição
            """
            procedimentos = await tools_service.buscar_procedimentos(
                categoria=categoria,
                termo_busca=termo_busca,
            )

            if not procedimentos:
                return "Não encontrei procedimentos com esses critérios."

            resultado = "Procedimentos encontrados:\n\n"
            for p in procedimentos:
                resultado += f"• **{p['nome']}**\n"
                if p['descricao']:
                    resultado += f"  {p['descricao'][:200]}...\n"
                if p['valor']:
                    resultado += f"  Valor: R$ {p['valor']:.2f}\n"
                if p['duracao_minutos']:
                    resultado += f"  Duração: {p['duracao_minutos']} minutos\n"
                resultado += "\n"

            return resultado

        @tool
        async def buscar_horarios(
            data: Optional[str] = None,
        ) -> str:
            """
            Busca horários disponíveis para agendamento.
            Use quando o cliente quiser agendar ou verificar disponibilidade.

            Args:
                data: Data no formato YYYY-MM-DD (opcional, default próximos 7 dias)
            """
            data_inicio = None
            if data:
                try:
                    data_inicio = datetime.strptime(data, "%Y-%m-%d")
                except ValueError:
                    pass

            horarios = await tools_service.buscar_horarios_disponiveis(
                data_inicio=data_inicio
            )

            if not horarios:
                return "Não há horários disponíveis no momento."

            resultado = "Horários disponíveis:\n\n"

            # Agrupar por data
            horarios_por_data = {}
            for h in horarios:
                if h['data'] not in horarios_por_data:
                    horarios_por_data[h['data']] = []
                horarios_por_data[h['data']].append(h['hora'])

            for data, horas in list(horarios_por_data.items())[:5]:
                data_formatada = datetime.strptime(data, "%Y-%m-%d").strftime("%d/%m/%Y")
                resultado += f"**{data_formatada}**: {', '.join(horas[:5])}\n"

            return resultado

        @tool
        async def informacoes_clinica() -> str:
            """
            Obtém informações sobre a clínica.
            Use quando o cliente perguntar sobre endereço, telefone, horário de funcionamento.
            """
            info = await tools_service.obter_informacoes_clinica()

            if not info:
                return "Desculpe, não consegui obter as informações da clínica no momento."

            resultado = f"**{info.get('nome', 'Clínica')}**\n\n"

            if info.get('endereco'):
                resultado += f"📍 Endereço: {info['endereco']}\n"
            if info.get('telefone'):
                resultado += f"📞 Telefone: {info['telefone']}\n"
            if info.get('email'):
                resultado += f"📧 Email: {info['email']}\n"
            if info.get('horario_funcionamento'):
                resultado += f"🕐 Horário: {info['horario_funcionamento']}\n"

            return resultado

        return [buscar_procedimentos, buscar_horarios, informacoes_clinica]

    async def _get_agent(self):
        """Obtém ou inicializa o agente usando langgraph."""
        if self._agent_executor is None:
            llm = await self._get_llm()
            tools = self._create_tools()

            # Obter informações da clínica para o prompt
            info_clinica = await self.tools_service.obter_informacoes_clinica()

            # Criar system prompt formatado
            system_prompt = CENTRAL_ATENDIMENTO_PROMPT.format(
                nome_clinica=info_clinica.get("nome", "Clínica"),
                informacoes_clinica=str(info_clinica),
                horario_atendimento=info_clinica.get("horario_funcionamento", "Segunda a Sexta, 9h às 18h"),
            )

            # Criar agente usando langgraph
            self._agent_executor = create_react_agent(
                model=llm,
                tools=tools,
                prompt=system_prompt,
            )

        return self._agent_executor

    def _get_history(self, conversation_id: str) -> List:
        """Obtém histórico de conversa."""
        if conversation_id not in self._conversation_history:
            self._conversation_history[conversation_id] = []
        return self._conversation_history[conversation_id]

    def _add_to_history(self, conversation_id: str, role: str, content: str):
        """Adiciona mensagem ao histórico."""
        history = self._get_history(conversation_id)

        if role == "user":
            history.append(HumanMessage(content=content))
        elif role == "assistant":
            history.append(AIMessage(content=content))

        # Manter apenas últimas 20 mensagens
        if len(history) > 20:
            self._conversation_history[conversation_id] = history[-20:]

    async def processar_mensagem(
        self,
        mensagem: str,
        id_conversa: uuid.UUID,
        nome_contato: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Processa uma mensagem do cliente com o agente de IA.

        Args:
            mensagem: Texto da mensagem do cliente
            id_conversa: ID da conversa para manter contexto
            nome_contato: Nome do contato para personalização

        Returns:
            Dict com resposta e metadados
        """
        try:
            agent = await self._get_agent()
            conversation_id = str(id_conversa)

            # Personalizar entrada se tiver nome do contato
            input_text = mensagem
            if nome_contato:
                # Adicionar contexto do nome apenas na primeira interação
                history = self._get_history(conversation_id)
                if len(history) == 0:
                    input_text = f"[Cliente: {nome_contato}] {mensagem}"

            # Adicionar mensagem do usuário ao histórico
            self._add_to_history(conversation_id, "user", input_text)

            # Preparar mensagens para o agente (langgraph usa "messages" como chave)
            messages = self._get_history(conversation_id)

            # Executar agente usando langgraph
            result = await agent.ainvoke({"messages": messages})

            # Extrair resposta do resultado do langgraph
            # O langgraph retorna {"messages": [...]} com todas as mensagens incluindo a resposta
            resposta = "Desculpe, não consegui processar sua mensagem."
            tools_usadas = []

            if "messages" in result and len(result["messages"]) > 0:
                # Pegar a última mensagem (resposta do assistente)
                last_message = result["messages"][-1]
                if hasattr(last_message, "content"):
                    resposta = last_message.content
                elif isinstance(last_message, dict) and "content" in last_message:
                    resposta = last_message["content"]

                # Extrair tools usadas das mensagens intermediárias
                for msg in result["messages"]:
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            if isinstance(tc, dict) and "name" in tc:
                                tools_usadas.append(tc["name"])
                            elif hasattr(tc, "name"):
                                tools_usadas.append(tc.name)

            # Adicionar resposta ao histórico
            self._add_to_history(conversation_id, "assistant", resposta)

            # Verificar se deve transferir para humano
            transferir_humano = any(
                palavra in mensagem.lower()
                for palavra in ["atendente", "humano", "pessoa", "falar com alguém"]
            )

            return {
                "resposta": resposta,
                "transferir_humano": transferir_humano,
                "tools_usadas": tools_usadas,
                "sucesso": True,
            }

        except ValueError as e:
            # Erro de configuração (ex: OPENAI_API_KEY não configurada)
            logger.error(f"Erro de configuração do agente: {e}", exc_info=True)
            return {
                "resposta": (
                    "Olá! No momento estou em manutenção. "
                    "Por favor, entre em contato pelo telefone ou aguarde alguns instantes. "
                    "Desculpe o inconveniente!"
                ),
                "transferir_humano": True,
                "tools_usadas": [],
                "sucesso": False,
                "erro": f"Configuração: {str(e)}",
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Erro ao processar mensagem com agente: {error_msg}", exc_info=True)

            # Mensagem amigável dependendo do tipo de erro
            if "rate_limit" in error_msg.lower() or "429" in error_msg:
                resposta = (
                    "Estou recebendo muitas solicitações no momento. "
                    "Por favor, aguarde alguns segundos e tente novamente."
                )
            elif "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                resposta = (
                    "Desculpe, demorei muito para processar sua mensagem. "
                    "Por favor, tente novamente."
                )
            elif "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
                resposta = (
                    "Estou com uma dificuldade técnica temporária. "
                    "Nosso time já foi notificado. Posso transferir você para um atendente humano?"
                )
            else:
                resposta = (
                    "Desculpe, estou com dificuldades técnicas no momento. "
                    "Posso transferir você para um atendente humano?"
                )

            return {
                "resposta": resposta,
                "transferir_humano": False,
                "tools_usadas": [],
                "sucesso": False,
                "erro": error_msg,
            }

    async def stream_resposta(
        self,
        mensagem: str,
        id_conversa: uuid.UUID,
        nome_contato: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Gera resposta em streaming.

        Args:
            mensagem: Texto da mensagem do cliente
            id_conversa: ID da conversa
            nome_contato: Nome do contato

        Yields:
            Chunks da resposta
        """
        try:
            llm = await self._get_llm()
            conversation_id = str(id_conversa)

            # Adicionar mensagem do usuário ao histórico
            self._add_to_history(conversation_id, "user", mensagem)

            # Obter informações da clínica
            info_clinica = await self.tools_service.obter_informacoes_clinica()

            messages = [
                SystemMessage(content=CENTRAL_ATENDIMENTO_PROMPT.format(
                    nome_clinica=info_clinica.get("nome", "Clínica"),
                    informacoes_clinica=str(info_clinica),
                    horario_atendimento=info_clinica.get("horario_funcionamento", "Segunda a Sexta, 9h às 18h"),
                )),
            ]

            # Adicionar histórico
            messages.extend(self._get_history(conversation_id))

            # Gerar resposta com streaming
            full_response = ""
            async for chunk in llm.astream(messages):
                if hasattr(chunk, "content") and chunk.content:
                    full_response += chunk.content
                    yield chunk.content

            # Adicionar resposta ao histórico
            self._add_to_history(conversation_id, "assistant", full_response)

        except Exception as e:
            logger.error(f"Erro no streaming: {e}")
            yield "Desculpe, ocorreu um erro ao processar sua mensagem."

    async def processar_mensagem_stream(
        self,
        mensagem: str,
        id_conversa: uuid.UUID,
        nome_contato: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Processa mensagem com resposta em streaming formatada para SSE.

        Args:
            mensagem: Texto da mensagem do cliente
            id_conversa: ID da conversa
            nome_contato: Nome do contato

        Yields:
            Dict com chunks da resposta
        """
        try:
            full_response = ""
            tools_usadas = []

            async for chunk in self.stream_resposta(mensagem, id_conversa, nome_contato):
                full_response += chunk
                yield {
                    "type": "content",
                    "content": chunk,
                }

            # Verificar se deve transferir para humano
            transferir_humano = any(
                palavra in mensagem.lower()
                for palavra in ["atendente", "humano", "pessoa", "falar com alguém"]
            )

            # Enviar metadados finais
            yield {
                "type": "done",
                "full_response": full_response,
                "transferir_humano": transferir_humano,
                "tools_usadas": tools_usadas,
            }

        except Exception as e:
            logger.error(f"Erro no streaming: {e}")
            yield {
                "type": "error",
                "error": str(e),
            }


# =============================================================================
# Singleton
# =============================================================================

_agent_service_cache: Dict[str, CentralAtendimentoAgentService] = {}


def get_central_agent_service(
    db: AsyncSession,
    id_empresa: uuid.UUID,
) -> CentralAtendimentoAgentService:
    """
    Obtém instância do serviço de agente.

    Usa cache por empresa para reutilizar instâncias.
    """
    cache_key = str(id_empresa)

    if cache_key not in _agent_service_cache:
        _agent_service_cache[cache_key] = CentralAtendimentoAgentService(db, id_empresa)

    return _agent_service_cache[cache_key]


def clear_agent_cache():
    """Limpa o cache de agentes."""
    global _agent_service_cache
    _agent_service_cache = {}
