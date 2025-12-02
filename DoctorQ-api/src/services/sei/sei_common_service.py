import asyncio
import logging
import os
import re
import tempfile
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from src.config.logger_config import get_logger
from src.services.sei.sei_service import SeiProcesso, SeiService
from src.utils.docling import DoclingProcessor

logger = get_logger(__name__)


class SeiCommonService:
    """
    ServiÃ§o comum para operaÃ§Ãµes SEI
    """

    def __init__(
        self,
        sei_service: Optional[SeiService] = None,
        docling_processor: Optional[DoclingProcessor] = None,
    ):
        """Inicializa o serviÃ§o comum do SEI"""
        self.sei_service = sei_service
        self.docling_processor = docling_processor
        logger.debug("Inicializando SeiCommonService")

    async def get_documento(self, numero_documento: str) -> Dict[str, Any]:
        logger.info(f"Processando documento SEI: {numero_documento}")
        processo = await self.sei_service.consultar_documento_interno(numero_documento)

        return processo

    async def get_processo(
        self,
        filtros: SeiService.ParamsListarProcesso,
        nivel_acesso_publico: bool = True,
        limit: Optional[int] = 5,
    ) -> Dict[str, Any]:
        params = SeiService.ParamsListarProcesso(
            limit=limit,
            **filtros,
        )

        result = await self.sei_service.listar_processos(params)

        if not result or not result.success or not result.data:
            return {"success": False, "data": [], "total": 0}

        # Processar cada documento do resultado
        documentos_processados = []
        for processo in result.data:
            try:
                documento_processado = await self._processar_documento_processo(
                    processo, nivel_acesso_publico
                )
                if documento_processado:
                    documentos_processados.append(documento_processado)
            except Exception as e:
                logger.error(
                    f"Erro ao processar processo {getattr(processo, 'id_procedimento', 'N/A')}: {e}"
                )
                continue

        return {
            "success": result.success,
            "data": documentos_processados,
            "total": len(documentos_processados),
        }

    def _extrair_numero_protocolo(
        self, protocolo_formatado: Optional[str]
    ) -> Optional[str]:
        """Extrai apenas nÃºmeros do protocolo formatado"""
        if not protocolo_formatado:
            return None
        numero_apenas = re.sub(r"[^\d]", "", protocolo_formatado)
        return numero_apenas if numero_apenas else None

    async def _obter_info_documento(
        self, id_documento: Optional[int]
    ) -> Tuple[str, Optional[str]]:
        """ObtÃ©m informaÃ§Ãµes de nÃ­vel de acesso e nome do documento"""
        if not id_documento or not self.sei_service:
            return "Desconhecido", None

        try:
            logger.debug(f"Consultando documento interno {id_documento}")
            documento_interno = await self.sei_service.consultar_documento_interno(
                id_documento
            )

            if (
                documento_interno
                and documento_interno.success
                and documento_interno.data
            ):
                doc_info = documento_interno.data[0]
                nivel_acesso = (
                    doc_info.nivel_acesso.to_display()
                    if doc_info.nivel_acesso
                    else "Desconhecido"
                )
                nome_documento = doc_info.nome_documento
                logger.debug(
                    f"Documento {id_documento} - NÃ­vel de acesso: {nivel_acesso}"
                )
                return nivel_acesso, nome_documento

        except Exception as e:
            logger.warning(
                f"Erro ao consultar documento interno {id_documento}: {str(e)}"
            )
            logger.warning(f"  - Tipo do erro: {type(e).__name__}")

            # Log detalhes especÃ­ficos para HTTPErrors
            if hasattr(e, "response") and e.response is not None:
                logger.warning(f"  - Status HTTP: {e.response.status_code}")
                try:
                    response_text = (
                        e.response.text[:200] if e.response.text else "Resposta vazia"
                    )
                    logger.warning(
                        f"  - Response body (primeiros 200 chars): {response_text}"
                    )
                except Exception:
                    logger.warning("  - Erro ao ler response body")

        return "Desconhecido", None

    async def criar_documento_processado(
        self,
        processo: SeiProcesso,
        id_documento: Optional[str] = None,
        nome_serie: Optional[str] = None,
        content: str = "",
        nome_anexo: Optional[str] = None,
        mimetype: Optional[str] = None,
        tamanho: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cria documento processado com informaÃ§Ãµes do processo SEI"""
        nivel_acesso_descricao, nome_documento = await self._obter_info_documento(
            int(id_documento) if id_documento else None
        )

        protocolo_procedimento = getattr(
            processo, "protocolo_formatado_procedimento", None
        )

        # Pegar numero_documento de forma segura
        numero_documento = None
        if processo.documento:
            numero_documento = processo.documento.protocolo_formatado_documento

        return {
            "id_documento": id_documento,
            "numero_documento": numero_documento,
            "id_unidade": processo.id_unidade_geradora,
            "id_procedimento": getattr(processo, "id_procedimento", None),
            "nome_tipo_procedimento": getattr(processo, "nome_tipo_procedimento", None),
            "sigla_unidade_geradora": getattr(processo, "sigla_unidade_geradora", None),
            "id_unidade_geradora": getattr(processo, "id_unidade_geradora", None),
            "data_geracao": getattr(processo, "data_geracao", None),
            "nome_serie_documento": nome_serie,
            "protocolo_formatado_procedimento": protocolo_procedimento,
            "protocolo_formatado_procedimento_numero": self._extrair_numero_protocolo(
                protocolo_procedimento
            ),
            "nome": nome_anexo,
            "mimetype": mimetype,
            "tamanho": tamanho,
            "content": content,
            "nivel_acesso": nivel_acesso_descricao,
            "nome_documento": nome_documento,
        }

    async def processar_anexo(self, processo: Any, id_documento: int) -> Dict[str, Any]:
        """Processa anexo de um processo SEI"""
        if not self.sei_service or not self.docling_processor:
            raise ValueError(
                "SeiService e DoclingProcessor sÃ£o obrigatÃ³rios para processar anexos"
            )

        try:
            # Permitir cancelamento antes de operaÃ§Ã£o demorada
            await asyncio.sleep(0)

            # Baixar anexo
            anexo_bytes = await self.sei_service.baixar_anexo(int(id_documento))
            logger.debug(f"Anexo baixado: {len(anexo_bytes)} bytes")

            # Verificar se o arquivo foi baixado corretamente
            if not anexo_bytes or len(anexo_bytes) == 0:
                raise ValueError("Arquivo vazio")

            # Obter extensÃ£o do arquivo original
            nome_anexo = (
                getattr(processo.documento.dados_anexo, "nome", None)
                if hasattr(processo.documento, "dados_anexo")
                and processo.documento.dados_anexo
                else None
            )
            extensao = Path(nome_anexo).suffix if nome_anexo else ".bin"

            with tempfile.NamedTemporaryFile(
                delete=False, suffix=extensao
            ) as temp_file:
                temp_file.write(anexo_bytes)
                temp_path = temp_file.name

            # Validar se Ã© um PDF vÃ¡lido (se a extensÃ£o for PDF)
            if extensao.lower() == ".pdf":
                # Verificar se o arquivo tem o cabeÃ§alho PDF
                if not anexo_bytes.startswith(b"%PDF-"):
                    logger.warning(
                        f"Anexo {id_documento} nÃ£o Ã© um PDF vÃ¡lido (sem cabeÃ§alho PDF)"
                    )
                    logger.debug(f"Primeiros 20 bytes: {anexo_bytes[:20]}")

            try:
                # Temporariamente suprimir logs de erro do Docling para arquivos corrompidos
                docling_logger = logging.getLogger("docling")
                pypdfium2_logger = logging.getLogger("pypdfium2")
                original_docling_level = docling_logger.level
                original_pypdfium2_level = pypdfium2_logger.level
                docling_logger.setLevel(logging.CRITICAL)
                pypdfium2_logger.setLevel(logging.CRITICAL)

                try:
                    # Processar arquivo com Docling - extraÃ§Ã£o completa sem truncamentos
                    markdown = await self.docling_processor.extract_full_content(
                        temp_path
                    )
                finally:
                    # Restaurar nÃ­veis de log originais
                    docling_logger.setLevel(original_docling_level)
                    pypdfium2_logger.setLevel(original_pypdfium2_level)

                # Log detalhado para debug
                mimetype = (
                    getattr(processo.documento.dados_anexo, "mimetype", None)
                    if hasattr(processo.documento, "dados_anexo")
                    and processo.documento.dados_anexo
                    else None
                )
                tamanho = (
                    getattr(processo.documento.dados_anexo, "tamanho", None)
                    if hasattr(processo.documento, "dados_anexo")
                    and processo.documento.dados_anexo
                    else None
                )

                logger.debug(f"Anexo {id_documento} ({nome_anexo})")
                logger.debug(f"  - Tamanho do arquivo: {len(anexo_bytes)} bytes")
                logger.debug(f"  - ConteÃºdo extraÃ­do: {len(markdown)} caracteres")
                logger.debug("  - ExtraÃ§Ã£o completa sem truncamentos")

                logger.debug(f"Anexo convertido: {len(markdown)} caracteres finais")

                # Criar objeto de metadados para anexo
                return await self.criar_documento_processado(
                    processo=processo,
                    id_documento=str(id_documento),
                    nome_serie="Anexo",
                    content=markdown,
                    nome_anexo=nome_anexo,
                    mimetype=mimetype,
                    tamanho=tamanho,
                )

            except Exception as docling_error:
                logger.debug(f"Erro ao processar anexo com Docling: {docling_error}")
                # Anexo pode ser imagem ou formato nÃ£o suportado
                nome_anexo = (
                    getattr(processo.documento.dados_anexo, "nome", None)
                    if hasattr(processo.documento, "dados_anexo")
                    and processo.documento.dados_anexo
                    else None
                )
                mimetype = (
                    getattr(processo.documento.dados_anexo, "mimetype", None)
                    if hasattr(processo.documento, "dados_anexo")
                    and processo.documento.dados_anexo
                    else None
                )
                tamanho = (
                    getattr(processo.documento.dados_anexo, "tamanho", None)
                    if hasattr(processo.documento, "dados_anexo")
                    and processo.documento.dados_anexo
                    else None
                )

                return await self.criar_documento_processado(
                    processo=processo,
                    id_documento=str(id_documento),
                    nome_serie="Anexo",
                    content="",
                    nome_anexo=nome_anexo,
                    mimetype=mimetype,
                    tamanho=tamanho,
                )
            finally:
                # Limpar arquivo temporÃ¡rio
                if os.path.exists(temp_path):
                    os.unlink(temp_path)

        except Exception as e:
            logger.error(f"Erro ao processar anexo {id_documento}: {e}")
            # Retornar documento com erro em vez de fazer raise
            nome_anexo = (
                getattr(processo.documento.dados_anexo, "nome", None)
                if hasattr(processo.documento, "dados_anexo")
                and processo.documento.dados_anexo
                else None
            )
            mimetype = (
                getattr(processo.documento.dados_anexo, "mimetype", None)
                if hasattr(processo.documento, "dados_anexo")
                and processo.documento.dados_anexo
                else None
            )
            tamanho = (
                getattr(processo.documento.dados_anexo, "tamanho", None)
                if hasattr(processo.documento, "dados_anexo")
                and processo.documento.dados_anexo
                else None
            )

            return await self.criar_documento_processado(
                processo=processo,
                id_documento=str(id_documento),
                nome_serie="Anexo",
                content="",
                nome_anexo=nome_anexo,
                mimetype=mimetype,
                tamanho=tamanho,
            )

    async def processar_documento_nao_anexo(
        self, processo: Any, id_documento: int
    ) -> Dict[str, Any]:
        """Processa documento nÃ£o-anexo de um processo SEI"""
        if not self.sei_service or not self.docling_processor:
            raise ValueError(
                "SeiService e DoclingProcessor sÃ£o obrigatÃ³rios para processar documentos"
            )

        try:
            # Permitir cancelamento antes de operaÃ§Ã£o demorada
            await asyncio.sleep(0)

            documento = await self.sei_service.visualizar_documento(int(id_documento))
            markdown_content = None
            nome_serie = (
                getattr(processo.documento, "nome_serie_documento", None)
                if hasattr(processo, "documento") and processo.documento
                else None
            )

            if documento and documento.data:
                primeiro_documento = documento.data[0] if documento.data else None
                if primeiro_documento and hasattr(primeiro_documento, "conteudo"):
                    try:
                        # Converte HTML para Markdown sem truncamentos
                        markdown_content = self.docling_processor.html_para_markdown(
                            primeiro_documento.conteudo, truncate=False
                        )
                    except Exception as e:
                        logger.error(
                            f"Erro ao converter HTML para Markdown do documento {id_documento}: {e}"
                        )
                        # Usar o HTML original como fallback em caso de erro
                        markdown_content = primeiro_documento.conteudo or ""
                else:
                    logger.debug(f"Documento: {primeiro_documento}")
            else:
                logger.debug(
                    f"Documento success: {documento.success if documento else 'None'}"
                )

            # Criar objeto de metadados para documento nÃ£o-anexo
            return await self.criar_documento_processado(
                processo=processo,
                id_documento=str(id_documento),
                nome_serie=nome_serie,
                content=markdown_content or "",
            )

        except Exception as e:
            logger.error(f"Erro ao visualizar documento {id_documento}: {str(e)}")
            logger.error(f"  - Tipo do erro: {type(e).__name__}")

            # Log detalhes especÃ­ficos para HTTPErrors
            if hasattr(e, "response") and e.response is not None:
                logger.error(f"  - Status HTTP: {e.response.status_code}")
                try:
                    response_text = (
                        e.response.text[:200] if e.response.text else "Resposta vazia"
                    )
                    logger.error(
                        f"  - Response body (primeiros 200 chars): {response_text}"
                    )
                except Exception:
                    logger.error("  - Erro ao ler response body")

            # Log informaÃ§Ãµes do documento que causou erro
            nome_serie = (
                getattr(processo.documento, "nome_serie_documento", None)
                if hasattr(processo, "documento") and processo.documento
                else None
            )
            logger.error(f"  - SÃ©rie do documento: {nome_serie}")
            logger.error(
                f"  - ID do procedimento: {getattr(processo, 'id_procedimento', 'N/A')}"
            )

            return await self.criar_documento_processado(
                processo=processo,
                id_documento=str(id_documento),
                nome_serie=nome_serie,
                content="",
            )

    async def get_processo_by_numero_documento(
        self, numero_documento: str
    ) -> Optional[SeiProcesso]:
        """ObtÃ©m processo SEI baseado no nÃºmero do documento"""
        if not self.sei_service:
            raise ValueError("SeiService Ã© obrigatÃ³rio para obter processo")

        try:
            processo = await self.sei_service.consultar_processo_by_numero_documento(
                numero_documento
            )

            print(processo)
            return processo
        except Exception as e:
            logger.error(
                f"Erro ao obter processo por nÃºmero do documento {numero_documento}: {str(e)}"
            )
            return None

    async def _processar_documento_processo(
        self, processo: SeiProcesso, nivel_acesso_publico: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Processa um documento de um processo SEI, verificando se Ã© anexo ou nÃ£o"""
        try:
            if not processo.documento:
                logger.debug(
                    f"Processo {processo.id_procedimento} nÃ£o possui documento"
                )
                return None

            id_documento = processo.documento.id_documento
            nome_serie = getattr(processo.documento, "nome_serie_documento", None)

            logger.debug(
                f"Documento encontrado - ID: {id_documento}, SÃ©rie: {nome_serie}"
            )

            # Verificar se Ã© anexo ou documento regular
            if (
                hasattr(processo.documento, "dados_anexo")
                and processo.documento.dados_anexo
            ):
                # Ã‰ um anexo - processar como anexo
                documento_processado = await self.processar_anexo(
                    processo, id_documento
                )
            else:
                # Ã‰ um documento regular - processar como documento nÃ£o anexo
                documento_processado = await self.processar_documento_nao_anexo(
                    processo, id_documento
                )

            # Verificar se o documento tem conteÃºdo vÃ¡lido
            if documento_processado and documento_processado.get("content", "").strip():
                # Verificar nÃ­vel de acesso se solicitado
                if nivel_acesso_publico:
                    # Verificar se o documento tem acesso pÃºblico
                    if not await self._verificar_acesso_publico(id_documento):
                        logger.debug(
                            f"Documento {id_documento} nÃ£o possui nÃ­vel de acesso pÃºblico"
                        )
                        return None

                return self._normalizar_processo_to_texto(documento_processado)

            # Se nÃ£o tem conteÃºdo, nÃ£o retornar nada
            return None

        except Exception as e:
            logger.error(
                f"Erro ao processar documento/anexo {getattr(processo.documento, 'id_documento', 'N/A')} (sÃ©rie: {getattr(processo.documento, 'nome_serie_documento', 'N/A')}): {e}"
            )
            logger.info("Retornando None devido ao erro...")
            # Em caso de erro, nÃ£o retornar nada
            return None

    def _normalizar_processo_to_texto(self, processo: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza o processo retornando apenas campos com valores limpos"""

        if not processo:
            return {}

        # Criar dicionÃ¡rio com valores normalizados
        processo_normalizado = {}
        for campo, valor in processo.items():
            if valor is not None:
                # Converter valor para string
                valor_str = str(valor).strip()

                if valor_str:
                    # Limpar caracteres especiais e normalizar espaÃ§os apenas no valor
                    # Esta linha substitui qualquer caractere que nÃ£o seja letra, nÃºmero, espaÃ§o, hÃ­fen, ponto, barra ou vÃ­rgula por espaÃ§o.
                    # Serve para remover caracteres especiais indesejados do valor do campo do processo.
                    valor_limpo = re.sub(r"[^\w\s\-\./,]", " ", valor_str)
                    valor_limpo = re.sub(
                        r"-{3,}", " ", valor_limpo
                    )  # Remove sequÃªncias de 3+ hÃ­fens
                    valor_limpo = re.sub(
                        r"_{3,}", " ", valor_limpo
                    )  # Remove sequÃªncias de 3+ underscores
                    valor_limpo = re.sub(r"\s+", " ", valor_limpo).strip()

                    # Adicionar campo com valor normalizado
                    processo_normalizado[campo] = valor_limpo

        return processo_normalizado

    def _gerar_informacoes_processo(self, processo: Dict[str, Any]) -> str:
        """Normaliza o processo para texto markdown"""
        processo_normalizado = self._normalizar_processo_to_texto(processo)

        if not processo_normalizado:
            return ""

        # Gera markdown no formato campo: valor
        linhas_markdown = []
        for campo, valor in processo_normalizado.items():
            linhas_markdown.append(f"**{campo}**: {valor}")

        return "\n".join(linhas_markdown)

    async def _verificar_acesso_publico(self, id_documento: int) -> bool:
        """Verifica se documento tem acesso pÃºblico (nÃ­vel 0)"""
        try:
            documento_interno = await self.sei_service.consultar_documento_interno(
                id_documento
            )
            # Verifica se o resultado tem dados e se Ã© pÃºblico
            if (
                documento_interno
                and documento_interno.success
                and documento_interno.data
            ):
                doc_info = documento_interno.data[0]
                # Verificar se tem nÃ­vel de acesso e se Ã© pÃºblico (nÃ­vel 0)
                if hasattr(doc_info, "nivel_acesso") and doc_info.nivel_acesso:
                    return (
                        doc_info.nivel_acesso.value == "0"
                        if hasattr(doc_info.nivel_acesso, "value")
                        else str(doc_info.nivel_acesso) == "0"
                    )
                if hasattr(doc_info, "nivel_acesso_raw"):
                    return str(doc_info.nivel_acesso_raw) == "0"

            # Se nÃ£o conseguir verificar, considera como nÃ£o pÃºblico por seguranÃ§a
            return False
        except Exception as e:
            logger.error(
                f"Erro ao verificar nÃ­vel de acesso do documento {id_documento}: {e}"
            )
            return False

    async def listar_atividades_sei(self, id_procedimento: str) -> Dict[str, Any]:
        """Lista todas as atividades SEI de um procedimento especÃ­fico"""
        if not self.sei_service:
            logger.error("SeiService nÃ£o disponÃ­vel")
            return {"success": False, "data": [], "total": 0}

        try:
            result = await self.sei_service.listar_atividades_sei(id_procedimento)

            if not result.success:
                return {"success": False, "data": [], "total": 0}

            # Converter atividades para dicionÃ¡rios
            atividades_dict = (
                [atividade.to_dict() for atividade in result.data]
                if result.data
                else []
            )

            return {
                "success": result.success,
                "data": atividades_dict,
                "total": result.total or 0,
            }
        except Exception as e:
            logger.error(
                f"Erro ao listar atividades SEI para procedimento {id_procedimento}: {str(e)}"
            )
            return {"success": False, "data": [], "total": 0}


def get_sei_common_service(db_session=None) -> SeiCommonService:
    """Factory function para criar instÃ¢ncia do SeiCommonService"""
    sei_service = SeiService(db_session=db_session)
    docling_processor = DoclingProcessor()
    return SeiCommonService(sei_service, docling_processor)
