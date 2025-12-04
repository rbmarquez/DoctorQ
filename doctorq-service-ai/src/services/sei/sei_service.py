import asyncio
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, Generic, List, Optional, TypeVar

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.services.credencial_service import CredencialService
from src.services.variable_service import VariableService

logger = get_logger(__name__)

T = TypeVar("T")


class NivelAcesso(Enum):
    """Enum para representar os nÃ­veis de acesso no SEI"""

    PUBLICO = "0"
    RESTRITO = "1"
    SIGILOSO = "2"

    @classmethod
    def from_value(cls, value: str) -> Optional["NivelAcesso"]:
        """Converte string para enum, retorna None se invÃ¡lido"""
        for nivel in cls:
            if nivel.value == str(value):
                return nivel
        return None

    def to_display(self) -> str:
        """Retorna descriÃ§Ã£o legÃ­vel do nÃ­vel de acesso"""
        descriptions = {
            NivelAcesso.PUBLICO: "PÃºblico",
            NivelAcesso.RESTRITO: "Restrito",
            NivelAcesso.SIGILOSO: "Sigiloso",
        }
        return descriptions.get(self, "Desconhecido")


class ApiSei(Generic[T]):
    """Classe genÃ©rica para respostas da API SEI"""

    def __init__(self, data: Dict[str, Any]):
        self.success: bool = data.get("success", False)
        self.data: Optional[List[T]] = data.get("data")
        self.total: Optional[int] = data.get("total")


class ApiSeiSimples(Generic[T]):
    """Classe genÃ©rica para respostas da API SEI"""

    def __init__(self, data: Dict[str, Any]):
        self.success: bool = data.get("success", False)
        self.data: Optional[List[T]] = data.get("data")


class SeiUsuario:
    """Classe para representar um usuÃ¡rio SEI"""

    def __init__(self, data: Dict[str, Any]):
        self.id_usuario = data.get("idUsuario")
        self.sigla = data.get("sigla")
        self.nome = data.get("nome")

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionÃ¡rio"""
        return {"id_usuario": self.id_usuario, "sigla": self.sigla, "nome": self.nome}


class SeiUsuarioUnidade:
    """Classe para representar um usuÃ¡rio SEI"""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.sigla = data.get("sigla")
        self.nome = data.get("nome")

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionÃ¡rio"""
        return {"od": self.id, "sigla": self.sigla, "nome": self.nome}


class SeiUsuarioPesquisa:
    """Classe para representar um usuÃ¡rio SEI pesquisado"""

    def __init__(self, data: Dict[str, Any]):
        # O campo id_usuario deve vir de "id_usuario" se existir, senÃ£o de "id_contato"
        self.id_usuario = data.get("id_usuario") or data.get("id_contato")
        self.id_contato = data.get("id_contato")
        self.sigla = data.get("sigla")
        self.nome = data.get("nome")

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionÃ¡rio"""
        return {
            "id_usuario": self.id_usuario,
            "id_contato": self.id_contato,
            "sigla": self.sigla,
            "nome": self.nome,
        }


class SeiUnidade:
    """Classe para representar uma unidade SEI"""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.sigla = data.get("sigla")
        self.descricao = data.get("descricao")

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionÃ¡rio"""
        return {"id": self.id, "sigla": self.sigla, "descricao": self.descricao}


class SeiProcesso:
    """Classe para representar um processo SEI"""

    def __init__(self, data: Dict[str, Any]):
        # Atualizado para usar id_procedimento como exemplo de chave
        self.id_procedimento = data.get("idProcedimento")
        self.id_tipo_procedimento = data.get("idTipoProcedimento")
        self.nome_tipo_procedimento = data.get("nomeTipoProcedimento")
        self.sigla_unidade_geradora = data.get("siglaUnidadeGeradora")
        self.id_unidade_geradora = data.get("idUnidadeGeradora")
        self.protocolo_formatado_procedimento = data.get(
            "protocoloFormatadoProcedimento"
        )
        self.id_usuario_gerador = data.get("idUsuarioGerador")
        self.nome_usuario_gerador = data.get("nomeUsuarioGerador")
        self.sigla_usuario_gerador = data.get("siglaUsuarioGerador")
        self.data_geracao = data.get("dataGeracao")

        # Lidar com campo "documento" (singular) da API
        documento_data = data.get("documento")
        if documento_data:
            if isinstance(documento_data, dict) and documento_data:
                # Documento como objeto com dados
                self.documento = SeiDocumento(documento_data)
            elif isinstance(documento_data, list):
                # Documento como array
                if documento_data:
                    # Array com dados - pega o primeiro
                    self.documento = SeiDocumento(documento_data[0])
                else:
                    # Array vazio []
                    self.documento = None
            else:
                self.documento = None
        else:
            self.documento = None

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionÃ¡rio"""
        return {
            "id_procedimento": self.id_procedimento,
            "id_tipo_procedimento": self.id_tipo_procedimento,
            "nome_tipo_procedimento": self.nome_tipo_procedimento,
            "sigla_unidade_geradora": self.sigla_unidade_geradora,
            "id_unidade_geradora": self.id_unidade_geradora,
            "protocolo_formatado_procedimento": self.protocolo_formatado_procedimento,
            "id_usuario_gerador": self.id_usuario_gerador,
            "nome_usuario_gerador": self.nome_usuario_gerador,
            "sigla_usuario_gerador": self.sigla_usuario_gerador,
            "data_geracao": self.data_geracao,
            "documento": self.documento.to_dict() if self.documento else None,
        }


class SeiAnexo:
    """Classe para representar um anexo SEI no novo formato"""

    def __init__(self, data: Dict[str, Any]):
        self.nome = data.get("nome")
        self.mimetype = data.get("mimetype")
        self.tamanho = data.get("tamanho")

    def to_dict(self):
        return {
            "nome": self.nome,
            "mimetype": self.mimetype,
            "tamanho": self.tamanho,
        }


class SeiDocumento:
    """Classe para representar um documento SEI (compatÃ­vel com novo formato)"""

    def __init__(self, data: Dict[str, Any]):
        # Novo formato
        self.id_documento = data.get("idDocumento")
        self.id_serie_documento = data.get("idSerieDocumento")
        self.nome_serie_documento = data.get("nomeSerieDocumento")
        self.protocolo_formatado_documento = data.get("protocoloFormatadoDocumento")
        self.numero_documento = data.get("numeroDocumento")
        self.sta_documento = data.get("staDocumento")
        self.dta_geracao = data.get("dtaGeracao")
        self.conteudo = data.get("conteudo")
        self.dados_anexo = None
        if data.get("dadosAnexo"):
            self.dados_anexo = SeiAnexo(data["dadosAnexo"])

    def to_dict(self) -> Dict[str, Any]:
        return {
            # Novo formato
            "id_documento": self.id_documento,
            "id_serie_documento": self.id_serie_documento,
            "nome_serie_documento": self.nome_serie_documento,
            "protocolo_formatado_documento": self.protocolo_formatado_documento,
            "numero_documento": self.numero_documento,
            "sta_documento": self.sta_documento,
            "dta_geracao": self.dta_geracao,
            "conteudo": self.conteudo,
            "dados_anexo": self.dados_anexo.to_dict() if self.dados_anexo else None,
        }


class SeiInteressado:
    """Classe para representar um interessado no documento SEI"""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.nome = data.get("nome")
        self.nome_formatado = data.get("nomeformatado")
        self.sigla = data.get("sigla")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "nome": self.nome,
            "nome_formatado": self.nome_formatado,
            "sigla": self.sigla,
        }


class SeiDocumentoInterno:
    """Classe para representar um documento interno SEI com dados detalhados"""

    def __init__(self, data: Dict[str, Any]):
        self.nome_documento = data.get("nomeDocumento")
        self.protocolo = data.get("protocolo")
        self.id_documento = data.get("idDocumento")
        self.id_serie = data.get("idSerie")
        self.nome_serie = data.get("nomeSerie")
        self.numero = data.get("numero")
        self.id_tipo_conferencia = data.get("idTipoConferencia")
        self.descricao_tipo_conferencia = data.get("descricaoTipoConferencia")

        # Converte nÃ­vel de acesso para enum
        nivel_acesso_raw = data.get("nivelAcesso")
        self.nivel_acesso = (
            NivelAcesso.from_value(nivel_acesso_raw)
            if nivel_acesso_raw is not None
            else None
        )
        self.nivel_acesso_raw = (
            nivel_acesso_raw  # MantÃ©m valor original para referÃªncia
        )

        self.id_hipotese_legal = data.get("idHipoteseLegal")
        self.nome_hipotese_legal = data.get("nomeHipoteseLegal")
        self.base_legal = data.get("baseLegal")
        self.grau_sigilo = data.get("grauSigilo")
        self.descricao = data.get("descricao")
        self.data_elaboracao = data.get("dataElaboracao")
        self.observacao = data.get("observacao")
        self.assuntos = data.get("assuntos", [])
        self.interessados = [
            SeiInteressado(interessado_data)
            for interessado_data in data.get("interessados", [])
        ]
        self.destinatarios = data.get("destinatarios", [])
        self.observacoes_unidades = data.get("observacoesUnidades", [])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nome_documento": self.nome_documento,
            "protocolo": self.protocolo,
            "id_documento": self.id_documento,
            "id_serie": self.id_serie,
            "nome_serie": self.nome_serie,
            "numero": self.numero,
            "id_tipo_conferencia": self.id_tipo_conferencia,
            "descricao_tipo_conferencia": self.descricao_tipo_conferencia,
            "nivel_acesso": self.nivel_acesso_raw,  # Valor original
            "nivel_acesso_enum": (
                self.nivel_acesso.value if self.nivel_acesso else None
            ),  # Enum value
            "nivel_acesso_descricao": (
                self.nivel_acesso.to_display() if self.nivel_acesso else None
            ),  # DescriÃ§Ã£o
            "id_hipotese_legal": self.id_hipotese_legal,
            "nome_hipotese_legal": self.nome_hipotese_legal,
            "base_legal": self.base_legal,
            "grau_sigilo": self.grau_sigilo,
            "descricao": self.descricao,
            "data_elaboracao": self.data_elaboracao,
            "observacao": self.observacao,
            "assuntos": self.assuntos,
            "interessados": [
                interessado.to_dict() for interessado in self.interessados
            ],
            "destinatarios": self.destinatarios,
            "observacoes_unidades": self.observacoes_unidades,
        }


class SeiAtividade:
    """Classe para representar uma atividade SEI"""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        atributos = data.get("atributos", {})
        self.id_processo = atributos.get("idProcesso")
        self.usuario = atributos.get("usuario")
        self.data = atributos.get("data")
        self.hora = atributos.get("hora")
        self.unidade = atributos.get("unidade")
        self.informacao = atributos.get("informacao")

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionÃ¡rio"""
        return {
            "id": self.id,
            "id_processo": self.id_processo,
            "usuario": self.usuario,
            "data": self.data,
            "hora": self.hora,
            "unidade": self.unidade,
            "informacao": self.informacao,
        }


class SeiService:
    """
    ServiÃ§o para integraÃ§Ã£o com SEI (Sistema EletrÃ´nico de InformaÃ§Ãµes) via Web Services

    Carrega automaticamente o ID da credencial da variÃ¡vel 'SEI_CREDENCIAL_ID'
    """

    _instance = None
    _initialized = False

    def __new__(
        cls,
        db_session: Optional[AsyncSession] = None,
        id_credencial: Optional[str] = None,
    ):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self,
        db_session: Optional[AsyncSession] = None,
        id_credencial: Optional[str] = None,
    ):
        if self._initialized:
            return

        self.db_session = db_session
        self.variable_service = VariableService(db_session) if db_session else None
        self.id_credencial = id_credencial
        self.credencial_service = CredencialService()

        # ConfiguraÃ§Ãµes carregadas da credencial
        self.url = None
        self.usuario = None
        self.senha = None
        # Token de autenticaÃ§Ã£o
        self._token = None
        self._token_expiry = None
        self.crendencial = None

        # Cache
        # self._orgaos_cache = None
        # self._unidades_cache = {}
        # self._contextos_cache = None
        self.tempo_cache = 3600

        # ConfiguraÃ§Ãµes de retry
        self.max_retries = 3
        self.retry_delay_base = 1.0

        self._initialized = True

    async def _load_credential_id(self):
        """Carrega o ID da credencial da variÃ¡vel"""
        if not self.variable_service:
            logger.warning("VariableService nÃ£o disponÃ­vel para SEI")
            return

        try:
            # Buscar ID da credencial na variÃ¡vel
            variable = await self.variable_service.get_variable_by_vl_variavel(
                "SEI_CREDENCIAL_ID"
            )

            if variable:
                self.id_credencial = variable.vl_variavel
                logger.debug(
                    f"ID da credencial SEI carregado da variÃ¡vel: {self.id_credencial}"
                )
            elif not self.id_credencial:
                logger.error("Nenhuma credencial SEI configurada")

        except Exception as e:
            logger.error(f"Erro ao carregar ID da credencial SEI: {str(e)}")

    async def _get_credentials(self) -> Dict[str, Any]:
        """ObtÃ©m credenciais SEI do sistema de credenciais"""
        try:
            if self.url and self.usuario and self.senha:
                return {
                    "usuario": self.usuario,
                    "senha": self.senha,
                    "url": self.url,
                }
            # Carregar ID da credencial se ainda nÃ£o foi carregado
            if not self.id_credencial:
                await self._load_credential_id()

            if not self.id_credencial:
                logger.error("ID da credencial SEI nÃ£o disponÃ­vel")
                raise ValueError("ID da credencial SEI nÃ£o disponÃ­vel")

            credencial_data = await self.credencial_service.get_credencial_decrypted(
                uuid.UUID(self.id_credencial)
            )

            if not credencial_data:
                logger.error(
                    f"Credencial SEI nÃ£o encontrada no banco: {self.id_credencial}"
                )
                raise ValueError(f"Credencial SEI nÃ£o encontrada: {self.id_credencial}")

            dados = credencial_data.get("dados", {})

            if not dados:
                logger.error("Dados da credencial SEI estÃ£o vazios")
                raise ValueError("Dados da credencial SEI estÃ£o vazios")

            # Verificar se os campos obrigatÃ³rios existem
            required_fields = ["url", "usuario", "senha"]
            missing_fields = [field for field in required_fields if field not in dados]
            if missing_fields:
                logger.error(
                    f"Campos obrigatÃ³rios ausentes na credencial SEI: {missing_fields}"
                )
                raise ValueError(
                    f"Campos obrigatÃ³rios ausentes na credencial SEI: {missing_fields}"
                )

            self.url = dados["url"]
            self.usuario = dados["usuario"]
            self.senha = dados["senha"]

            return dados

        except Exception as e:
            logger.error(f"Erro ao obter credenciais SEI: {str(e)}")
            raise

    async def _get_token(self) -> str:
        """ObtÃ©m token de autenticaÃ§Ã£o SEI"""
        if self._token and self._token_expiry and datetime.now() < self._token_expiry:
            return self._token

        if not self.url or not self.usuario or not self.senha:
            await self._get_credentials()

        try:
            auth_url = f"{self.url}/autenticar"
            form_data = {
                "usuario": self.usuario,
                "senha": self.senha,
            }

            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.post(auth_url, data=form_data)

            if response.status_code != 200:
                logger.error(
                    f"Erro HTTP na autenticaÃ§Ã£o SEI: {response.status_code} - {response.text}"
                )
                response.raise_for_status()
            response_data = response.json()

            if "data" in response_data and "token" in response_data["data"]:
                self._token = response_data["data"]["token"]
                self._token_expiry = datetime.now() + timedelta(
                    seconds=self.tempo_cache
                )
                return self._token

            logger.error(f"Token nÃ£o encontrado na resposta SEI: {response_data}")
            raise ValueError("Token nÃ£o encontrado na resposta de autenticaÃ§Ã£o")

        except Exception as e:
            logger.error(f"Erro ao obter token SEI: {str(e)}")
            raise

    async def _fazer_requisicao_com_retry(
        self, method: str, url: str, **kwargs
    ) -> httpx.Response:
        """Faz requisiÃ§Ã£o HTTP com retry automÃ¡tico para timeouts"""
        last_exception = None

        for tentativa in range(self.max_retries + 1):
            try:
                # Aumentar timeout progressivamente a cada tentativa
                timeout = 60.0 + (tentativa * 15.0)  # 60s, 75s, 90s, 105s

                if tentativa > 0:
                    delay = self.retry_delay_base * (2 ** (tentativa - 1))  # 1s, 2s, 4s
                    logger.info(
                        f"Tentativa {tentativa + 1}/{self.max_retries + 1} apÃ³s {delay}s de delay (timeout: {timeout}s)"
                    )
                    await asyncio.sleep(delay)

                async with httpx.AsyncClient(timeout=timeout, verify=False) as client:
                    if method.upper() == "GET":
                        response = await client.get(url, **kwargs)
                    elif method.upper() == "POST":
                        response = await client.post(url, **kwargs)
                    else:
                        raise ValueError(f"MÃ©todo HTTP nÃ£o suportado: {method}")

                response.raise_for_status()
                return response

            except (httpx.ReadTimeout, httpx.ConnectTimeout) as e:
                last_exception = e
                if tentativa < self.max_retries:
                    logger.warning(
                        f"Timeout na tentativa {tentativa + 1}, tentando novamente..."
                    )
                    continue

                logger.error(
                    f"Todas as {self.max_retries + 1} tentativas falharam com timeout"
                )
                raise
            except Exception as e:
                # Para outros erros, nÃ£o fazer retry
                logger.error(
                    f"Erro nÃ£o relacionado a timeout na tentativa {tentativa + 1}: {type(e).__name__}"
                )
                raise

        # Nunca deve chegar aqui, mas por seguranÃ§a
        raise (
            last_exception if last_exception else Exception("Erro inesperado no retry")
        )

    @dataclass
    class ParamsListarProcesso:
        id_unidade: Optional[int] = None
        limit: Optional[int] = None
        start: Optional[int] = None
        palavras_chave: Optional[str] = None
        descricao: Optional[str] = None
        data_inicio: Optional[str] = None
        data_fim: Optional[str] = None

        def to_dict(self):
            result = {}
            if self.limit is not None:
                result["limit"] = self.limit
            if self.start is not None:
                result["start"] = self.start
            if self.id_unidade is not None:
                result["idUnidadeGeradora"] = self.id_unidade
            if self.palavras_chave is not None:
                result["palavrasChave"] = self.palavras_chave
            if self.descricao is not None:
                result["descricao"] = self.descricao
            if self.data_inicio is not None:
                result["dataInicio"] = self.data_inicio
            if self.data_fim is not None:
                result["dataFim"] = self.data_fim
            return result

    async def listar_processos(
        self, params: ParamsListarProcesso
    ) -> ApiSei[SeiProcesso]:
        """Lista processos de uma unidade especÃ­fica"""
        try:
            token = await self._get_token()
            api_url = f"{self.url}/processo/pesquisar"
            params_dict = params.to_dict()
            headers = {"token": token, "Content-Type": "application/json"}

            response = await self._fazer_requisicao_com_retry(
                "GET", api_url, params=params_dict, headers=headers
            )
            response_data = response.json()

            processos_data = response_data.get("data", [])
            processos = [SeiProcesso(processo_data) for processo_data in processos_data]

            return ApiSei[SeiProcesso](
                {
                    "success": response_data.get("sucesso", False),
                    "data": processos,
                    "total": (
                        int(response_data.get("total", 0))
                        if response_data.get("total")
                        else 0
                    ),
                }
            )

        except Exception as e:
            logger.error(
                f"Erro ao listar processos da unidade {params.id_unidade}: {str(e)}"
            )
            raise e

    async def visualizar_documento(self, id_documento: int) -> ApiSei[SeiDocumento]:
        """Visualiza um documento especÃ­fico"""
        try:
            token = await self._get_token()
            api_url = f"{self.url}/documento/{id_documento}/interno/visualizar"
            headers = {"token": token, "Content-Type": "application/json"}

            response = await self._fazer_requisicao_com_retry(
                "GET", api_url, headers=headers
            )
            response_data = response.json()

            # Verifica se response_data Ã© um dicionÃ¡rio antes de usar .get()
            if not isinstance(response_data, dict):
                logger.error(
                    f"Resposta da API SEI nÃ£o Ã© um dicionÃ¡rio: {type(response_data)} - {response_data}"
                )
                raise ValueError(
                    f"Resposta da API SEI em formato invÃ¡lido para documento {id_documento}"
                )

            documento_data = response_data.get("data", "")
            documento = None

            # Se hÃ¡ conteÃºdo no documento, cria um SeiDocumento com os dados bÃ¡sicos
            if (
                documento_data
                and isinstance(documento_data, str)
                and documento_data.strip()
            ):
                # Cria um documento bÃ¡sico com o conteÃºdo
                documento_dict = {
                    "idDocumento": id_documento,
                    "conteudo": documento_data,
                }
                documento = SeiDocumento(documento_dict)
            elif documento_data:
                logger.debug(
                    f"Documento {id_documento} retornado como string vazia ou sem conteÃºdo"
                )
                documento = None

            return ApiSei[SeiDocumento](
                {
                    "success": response_data.get("sucesso", False),
                    "data": [documento] if documento else [],
                    "total": 1 if documento else 0,
                }
            )

        except Exception as e:
            logger.error(f"Erro ao visualizar documento {id_documento}: {str(e)}")
            logger.error(f"  - Tipo do erro: {type(e).__name__}")
            logger.error(
                f"  - URL tentativa: {self.url}/documento/{id_documento}/interno/visualizar"
            )

            # Log detalhes especÃ­ficos para HTTPErrors
            if hasattr(e, "response") and e.response is not None:
                logger.error(f"  - Status HTTP: {e.response.status_code}")
                logger.error(f"  - Response headers: {dict(e.response.headers)}")
                try:
                    response_text = (
                        e.response.text[:500] if e.response.text else "Resposta vazia"
                    )
                    logger.error(
                        f"  - Response body (primeiros 500 chars): {response_text}"
                    )
                except Exception:
                    logger.error("  - Erro ao ler response body")

            # Log de informaÃ§Ãµes de contexto
            logger.error(f"  - Token vÃ¡lido: {self._token is not None}")
            logger.error(f"  - URL base: {self.url}")
            raise e

    async def listar_anexos_metadados(self, id_protocolo: int) -> ApiSei[SeiAnexo]:
        """Lista metadados dos anexos de um protocolo especÃ­fico"""
        try:
            logger.debug(f"Listando metadados dos anexos do protocolo {id_protocolo}")
            return ApiSei[SeiAnexo]({"success": True, "data": [], "total": 0})

        except Exception as e:
            logger.error(
                f"Erro ao listar metadados dos anexos do protocolo {id_protocolo}: {str(e)}"
            )
            raise e

    async def baixar_anexo(self, id_protocolo: int) -> bytes:
        """Baixa anexo de um protocolo especÃ­fico (retorna dados binÃ¡rios)"""
        try:
            logger.debug(f"Baixando anexo do protocolo {id_protocolo}")
            token = await self._get_token()
            api_url = f"{self.url}/documento/baixar/anexo/{id_protocolo}"
            headers = {"token": token}

            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.get(api_url, headers=headers)
            response.raise_for_status()

            # Retorna dados binÃ¡rios do anexo
            return response.content

        except Exception as e:
            logger.error(f"Erro ao baixar anexo do protocolo {id_protocolo}: {str(e)}")
            raise e

    async def listar_usuarios(self) -> ApiSei[SeiUsuario]:
        """Lista usuÃ¡rios do SEI"""
        try:
            logger.debug("Listando usuÃ¡rios do SEI")
            token = await self._get_token()
            api_url = f"{self.url}/usuario/listar"
            params = {"limit": 1, "start": 1}
            headers = {"token": token, "Content-Type": "application/json"}

            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.get(api_url, headers=headers, params=params)
            response.raise_for_status()
            response_data = response.json()

            usuarios_data = response_data.get("data", [])
            usuarios = [SeiUsuario(usuario_data) for usuario_data in usuarios_data]

            return ApiSei[SeiUsuario](
                {
                    "success": response_data.get("sucesso", False),
                    "data": usuarios,
                    "total": (
                        int(response_data.get("total", 0))
                        if response_data.get("total")
                        else 0
                    ),
                }
            )

        except Exception as e:
            logger.error(f"Erro ao listar usuÃ¡rios do SEI: {str(e)}")
            raise e

    async def pesquisar_usuario(self, palavrachave: str) -> ApiSei[SeiUsuarioPesquisa]:
        try:
            logger.debug(f"Pesquisando usuÃ¡rio {palavrachave}")
            token = await self._get_token()
            api_url = f"{self.url}/usuario/pesquisar"
            headers = {"token": token, "Content-Type": "application/json"}
            params = {"palavrachave": palavrachave}

            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.get(api_url, headers=headers, params=params)
            response.raise_for_status()
            response_data = response.json()

            usuarios_data = response_data.get("data", [])
            usuarios = [
                SeiUsuarioPesquisa(usuario_data) for usuario_data in usuarios_data
            ]

            return ApiSei[SeiUsuarioPesquisa](
                {
                    "success": response_data.get("sucesso", False),
                    "data": usuarios,
                    "total": (
                        int(response_data.get("total", 0))
                        if response_data.get("total")
                        else 0
                    ),
                }
            )

        except Exception as e:
            logger.error(f"Erro ao pesquisar usuÃ¡rio {palavrachave}: {str(e)}")
            raise e

    @dataclass
    class ParamsListarUnidades:
        limit: Optional[int] = None
        start: Optional[int] = None
        filter: Optional[str] = None

        def to_dict(self):
            result = {}
            if self.limit is not None:
                result["limit"] = self.limit
            if self.start is not None:
                result["start"] = self.start
            if self.filter is not None:
                result["filter"] = self.filter
            return result

    async def listar_unidades(
        self, params: ParamsListarUnidades = None
    ) -> ApiSeiSimples[SeiUnidade]:
        """Lista unidades do SEI"""
        try:
            logger.debug("Listando unidades do SEI")
            token = await self._get_token()
            api_url = f"{self.url}/unidade/pesquisar"
            headers = {"token": token, "Content-Type": "application/json"}

            params_dict = params.to_dict() if params else {}

            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.get(
                    api_url, headers=headers, params=params_dict
                )
            response.raise_for_status()
            response_data = response.json()

            unidades_data = response_data.get("data", [])
            unidades = [SeiUnidade(unidade_data) for unidade_data in unidades_data]

            return ApiSeiSimples[SeiUnidade](
                {"success": response_data.get("sucesso", False), "data": unidades}
            )

        except Exception as e:
            logger.error(f"Erro ao listar unidades do SEI: {str(e)}")
            raise e

    async def pesquisar_usuario_unidade(
        self, id_usuario: int
    ) -> ApiSeiSimples[SeiUsuarioUnidade]:
        try:
            logger.debug(f"Pesquisando unidades do usuÃ¡rio {id_usuario}")
            token = await self._get_token()
            api_url = f"{self.url}/usuario/unidades"
            headers = {"token": token, "Content-Type": "application/json"}
            params = {"usuario": id_usuario}

            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.get(api_url, headers=headers, params=params)
            response.raise_for_status()
            response_data = response.json()

            unidades_data = response_data.get("data", [])
            unidades = [
                SeiUsuarioUnidade(unidade_data) for unidade_data in unidades_data
            ]

            return ApiSeiSimples[SeiUsuarioUnidade](
                {"success": response_data.get("sucesso", False), "data": unidades}
            )

        except Exception as e:
            logger.error(
                f"Erro ao pesquisar unidades do usuÃ¡rio {id_usuario}: {str(e)}"
            )
            raise e

    async def consultar_documento_interno(
        self, id_documento: int
    ) -> ApiSeiSimples[SeiDocumentoInterno]:
        """Consulta informaÃ§Ãµes detalhadas de um documento interno"""
        try:
            logger.debug(f"Consultando documento interno {id_documento}")
            token = await self._get_token()
            api_url = f"{self.url}/documento/interno/consultar/{id_documento}"
            headers = {"token": token, "Content-Type": "application/json"}

            async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
                response = await client.get(api_url, headers=headers)
            response.raise_for_status()
            response_data = response.json()

            documento_data = response_data.get("data")
            documento = None

            if documento_data and isinstance(documento_data, dict):
                documento = SeiDocumentoInterno(documento_data)

            return ApiSeiSimples[SeiDocumentoInterno](
                {
                    "success": response_data.get("sucesso", False),
                    "data": [documento] if documento else [],
                }
            )

        except Exception as e:
            logger.error(
                f"Erro ao consultar documento interno {id_documento}: {str(e)}"
            )
            raise e

    async def listar_atividades_sei(self, id_procedimento: str) -> ApiSei[SeiAtividade]:
        """Lista todas as atividades SEI de um procedimento especÃ­fico"""
        try:
            token = await self._get_token()
            api_url = f"{self.url}/atividade/listar"
            headers = {"token": token, "Content-Type": "application/json"}
            params = {"procedimento": id_procedimento}

            response = await self._fazer_requisicao_com_retry(
                "GET", api_url, params=params, headers=headers
            )
            response_data = response.json()

            atividades_data = response_data.get("data", [])
            atividades = [SeiAtividade(item) for item in atividades_data]

            return ApiSei[SeiAtividade](
                {
                    "success": response_data.get("sucesso", False),
                    "data": atividades,
                    "total": len(atividades),
                }
            )

        except Exception as e:
            logger.error(
                f"Erro ao listar atividades do procedimento {id_procedimento}: {str(e)}"
            )
            return ApiSei[SeiAtividade]({"success": False, "data": [], "total": 0})
