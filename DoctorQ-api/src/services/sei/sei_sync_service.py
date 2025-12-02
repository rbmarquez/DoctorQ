import asyncio
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, cast

from src.config.logger_config import get_logger
from src.config.orm_config import get_db, ORMConfig
from src.services.embedding_service import EmbeddingService
from src.services.sei.sei_common_service import SeiCommonService
from src.services.sei.sei_service import ApiSei, NivelAcesso, SeiProcesso, SeiService
from src.utils.docling import DoclingProcessor

logger = get_logger(__name__)


class SeiSyncService:
    """
    ServiÃ§o para sincronizaÃ§Ã£o de documentos SEI com pipeline de processamento
    """

    def __init__(
        self,
        sei_service: SeiService,
        docling_processor: DoclingProcessor,
        embedding_service: EmbeddingService,
    ):
        self.sei_service = sei_service
        self.docling_processor = docling_processor
        self.embedding_service = embedding_service
        self.sei_common_service = SeiCommonService(sei_service, docling_processor)

        # ConfiguraÃ§Ãµes de sincronizaÃ§Ã£o
        self.batch_size = 10
        self.max_retries = 3
        self.retry_delay = 2.0

        # Cache para otimizaÃ§Ã£o
        self._processos_cache = {}
        self._unidades_cache = {}

    async def close(self):
        """Fecha a sessÃ£o do banco"""
        try:
            if hasattr(self.sei_service, 'db_session') and self.sei_service.db_session:
                await self.sei_service.db_session.close()
            if hasattr(self.embedding_service, 'db_session') and self.embedding_service.db_session:
                await self.embedding_service.db_session.close()
        except Exception as e:
            logger.warning(f"Erro ao fechar sessÃµes: {e}")

    async def _processar_processo(self, processo: Any) -> Dict[str, Any]:
        """Processa um processo SEI e seus documentos/anexos"""
        try:
            if not processo.documento:
                logger.debug(
                    f"Processo {processo.id_procedimento} nÃ£o possui documento"
                )
                return await self.sei_common_service.criar_documento_processado(
                    processo=processo,
                    content="",
                )

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
                # Ã‰ um anexo
                return await self.sei_common_service.processar_anexo(
                    processo, id_documento
                )

            # Ã‰ um documento regular
            return await self.sei_common_service.processar_documento_nao_anexo(
                processo, id_documento
            )

        except Exception as e:
            logger.error(
                f"Erro ao processar documento/anexo {id_documento} (sÃ©rie: {nome_serie}): {e}"
            )
            logger.info("Criando documento processado sem conteÃºdo...")
            # Em caso de erro, criar documento bÃ¡sico sem conteÃºdo
            return await self.sei_common_service.criar_documento_processado(
                processo=processo,
                id_documento=str(id_documento) if id_documento else None,
                content="",
            )

    def _gerar_informacoes_processo(self, resultado: Dict[str, Any]) -> str:
        """Gera texto formatado com informaÃ§Ãµes do processo para embedding"""
        info_parts = []

        # InformaÃ§Ãµes bÃ¡sicas do processo
        if resultado.get("id_procedimento"):
            info_parts.append(f"ID do Procedimento: {resultado['id_procedimento']}")

        if resultado.get("nome_tipo_procedimento"):
            info_parts.append(f"Tipo: {resultado['nome_tipo_procedimento']}")

        if resultado.get("protocolo_formatado_procedimento"):
            info_parts.append(
                f"Protocolo: {resultado['protocolo_formatado_procedimento']}"
            )

        if resultado.get("sigla_unidade_geradora"):
            info_parts.append(f"Unidade: {resultado['sigla_unidade_geradora']}")

        if resultado.get("data_geracao"):
            info_parts.append(f"Data: {resultado['data_geracao']}")

        if resultado.get("nivel_acesso"):
            info_parts.append(f"NÃ­vel de Acesso: {resultado['nivel_acesso']}")

        if resultado.get("nome_serie_documento"):
            info_parts.append(
                f"SÃ©rie do Documento: {resultado['nome_serie_documento']}"
            )

        # ConteÃºdo do documento
        content = resultado.get("content", "").strip()
        if content:
            info_parts.append("---")
            info_parts.append("CONTEÃšDO:")
            info_parts.append(content)

        return "\n".join(info_parts)

    def _salvar_cache(
        self, documentos_processados: List[Dict[str, Any]], id_unidade: int
    ) -> None:
        """Salva documentos processados em cache JSON"""
        try:
            cache_dir = Path("temp/cache/sei/")
            cache_dir.mkdir(parents=True, exist_ok=True)

            cache_file = cache_dir / f"sei_{id_unidade}.json"

            # Salvar no arquivo JSON
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(documentos_processados, f, ensure_ascii=False, indent=2)

            logger.debug(f"Documentos salvos em cache: {cache_file}")

        except Exception as e:
            logger.error(f"Erro ao salvar cache JSON: {e}")

    async def listar_processos_paginado(
        self, id_unidade: Optional[int], page: int = 1, size: int = 10, **filtros
    ) -> ApiSei[SeiProcesso]:
        """
        Lista processos com paginaÃ§Ã£o
        """
        start = (page - 1) * size

        logger.info(
            f"PaginaÃ§Ã£o: id_unidade={id_unidade}, page={page}, size={size}, start={start}"
        )

        params = SeiService.ParamsListarProcesso(
            id_unidade=id_unidade,
            limit=size,
            start=start,
            **filtros,
        )

        return await self.sei_service.listar_processos(params)

    async def buscar_todos_processos(
        self, id_unidade: int, batch_size: int = 50, max_pages: Optional[int] = None
    ) -> List[SeiProcesso]:
        """
        Busca todos os processos iterando pelas pÃ¡ginas atÃ© nÃ£o haver mais dados
        """
        todos_processos = []
        page = 1
        # Limite de seguranÃ§a para evitar loops infinitos
        max_pages_safe = max_pages or 200  # Nunca exceder 200 pÃ¡ginas

        logger.info(
            f"Iniciando busca para unidade {id_unidade} - limite: {max_pages_safe} pÃ¡ginas"
        )

        while True:
            if page > max_pages_safe:
                logger.warning(
                    f"Atingido limite de seguranÃ§a de {max_pages_safe} pÃ¡ginas para unidade {id_unidade}"
                )
                break

            logger.debug(f"Buscando pÃ¡gina {page} com {batch_size} registros")

            try:
                resultado = await self.listar_processos_paginado(
                    id_unidade=id_unidade, page=page, size=batch_size
                )

                # Se nÃ£o retornou dados ou falhou, para
                if not (resultado and resultado.success and resultado.data):
                    logger.info(
                        f"Fim da busca: pÃ¡gina {page} nÃ£o retornou dados para unidade {id_unidade}"
                    )
                    logger.debug(
                        f"Detalhes: resultado={resultado}, success={getattr(resultado, 'success', None)}, data_len={len(resultado.data) if hasattr(resultado, 'data') and resultado.data else 0}"
                    )
                    break
            except Exception as e:
                logger.error(
                    f"Erro ao buscar pÃ¡gina {page} da unidade {id_unidade}: {e}"
                )
                logger.info("Continuando para prÃ³xima pÃ¡gina...")
                page += 1
                continue

            # Adiciona os processos encontrados
            todos_processos.extend(resultado.data)
            logger.debug(f"PÃ¡gina {page}: {len(resultado.data)} processos")

            # Se retornou menos que o batch_size, Ã© a Ãºltima pÃ¡gina
            if len(resultado.data) < batch_size:
                logger.info(f"Ãšltima pÃ¡gina encontrada: {page}")
                break

            page += 1

        logger.info(f"Total de processos encontrados: {len(todos_processos)}")
        return todos_processos

    async def list_processos(self, id_unidade: int) -> Dict[str, Any]:
        """Lista processos de uma unidade SEI - percorre todas as pÃ¡ginas automaticamente"""
        todos_processos = []
        page_size = 20

        logger.info(
            f"Iniciando descoberta do total de processos para unidade {id_unidade}"
        )

        # Primeira busca para descobrir o total de registros
        primeira_pagina = await self.listar_processos_paginado(
            id_unidade=id_unidade, page=1, size=page_size
        )

        if not (primeira_pagina and primeira_pagina.success):
            logger.warning("Erro ao buscar primeira pÃ¡gina ou API retornou erro")
            return {
                "success": False,
                "message": "Erro ao acessar API SEI",
                "total ": 0,
                "documentos_processados": 0,
                "documentos": [],
            }

        # Pega o total de registros da API
        total_registros = getattr(primeira_pagina, "total", 0)
        if total_registros == 0:
            total_registros = len(primeira_pagina.data) if primeira_pagina.data else 0
            logger.warning(
                f"API nÃ£o retornou total, usando dados da primeira pÃ¡gina: {total_registros}"
            )

        # ValidaÃ§Ã£o de seguranÃ§a para evitar cÃ¡lculos absurdos
        max_registros_safe = 50000  # Limite mÃ¡ximo de registros
        if total_registros > max_registros_safe:
            logger.warning(
                f"Total de registros ({total_registros}) excede limite de seguranÃ§a ({max_registros_safe}) para unidade {id_unidade}"
            )
            total_registros = max_registros_safe

        # Calcula o total de pÃ¡ginas
        total_paginas = (
            total_registros + page_size - 1
        ) // page_size  # DivisÃ£o com arredondamento para cima

        # Limite adicional de pÃ¡ginas para evitar requisiÃ§Ãµes excessivas
        max_paginas_safe = 500
        if total_paginas > max_paginas_safe:
            logger.warning(
                f"Total de pÃ¡ginas ({total_paginas}) excede limite de seguranÃ§a ({max_paginas_safe}) para unidade {id_unidade}"
            )
            total_paginas = max_paginas_safe

        logger.info(f"Total de registros: {total_registros}")
        logger.info(f"Total de pÃ¡ginas calculadas: {total_paginas}")
        logger.info(f"Tamanho da pÃ¡gina: {page_size}")

        # Adiciona os dados da primeira pÃ¡gina
        if primeira_pagina.data:
            todos_processos.extend(primeira_pagina.data)
            logger.info(
                f"PÃ¡gina 1/{total_paginas}: {len(primeira_pagina.data)} processos coletados"
            )

        # Processa as pÃ¡ginas restantes (2 atÃ© total_paginas)
        if total_paginas > 1:
            # Se page_size for 20, faz requisiÃ§Ãµes em paralelo
            if page_size == 10:
                logger.info(
                    f"Fazendo requisiÃ§Ãµes em paralelo para {total_paginas - 1} pÃ¡ginas restantes"
                )

                # Cria tasks para todas as pÃ¡ginas restantes
                tasks = []
                for page in range(2, total_paginas + 1):
                    task = self.listar_processos_paginado(
                        id_unidade=id_unidade, page=page, size=page_size
                    )
                    tasks.append(task)

                # Executa todas as requisiÃ§Ãµes em paralelo
                resultados = await asyncio.gather(*tasks, return_exceptions=True)

                # Processa os resultados
                for i, resultado in enumerate(resultados):
                    page = i + 2  # PÃ¡ginas comeÃ§am do 2

                    if isinstance(resultado, Exception):
                        logger.error(f"PÃ¡gina {page}: Erro na requisiÃ§Ã£o - {resultado}")
                        continue

                    # Type guard para garantir que resultado nÃ£o Ã© Exception nem None
                    if resultado is None:
                        logger.warning(f"PÃ¡gina {page}: Resultado Ã© None")
                        continue

                    # Cast para o tipo correto apÃ³s verificaÃ§Ã£o
                    resultado_typed = cast(ApiSei[SeiProcesso], resultado)

                    # Verifica se o resultado Ã© vÃ¡lido e tem os atributos esperados
                    if not resultado_typed.success:
                        logger.warning(f"PÃ¡gina {page}: RequisiÃ§Ã£o falhou")
                        continue

                    if not resultado_typed.data:
                        logger.warning(f"PÃ¡gina {page}: Nenhum processo encontrado")
                        continue

                    logger.info(
                        f"PÃ¡gina {page}/{total_paginas}: {len(resultado_typed.data)} processos coletados"
                    )
                    todos_processos.extend(resultado_typed.data)
            else:
                # RequisiÃ§Ãµes sequenciais para outros tamanhos de pÃ¡gina
                for page in range(2, total_paginas + 1):
                    logger.info(f"Processando pÃ¡gina {page}/{total_paginas}")

                    try:
                        resultado_pagina = await self.listar_processos_paginado(
                            id_unidade=id_unidade, page=page, size=page_size
                        )

                        if not (
                            resultado_pagina
                            and resultado_pagina.success
                            and resultado_pagina.data
                        ):
                            logger.warning(f"PÃ¡gina {page}: Nenhum processo encontrado")
                            continue

                        logger.info(
                            f"PÃ¡gina {page}/{total_paginas}: {len(resultado_pagina.data)} processos coletados"
                        )
                        todos_processos.extend(resultado_pagina.data)
                    except Exception as e:
                        logger.error(
                            f"Erro ao processar pÃ¡gina {page}/{total_paginas}: {e}"
                        )
                        logger.info("Continuando para prÃ³xima pÃ¡gina...")
                        continue

        if not todos_processos:
            logger.warning("Nenhum processo encontrado em todas as pÃ¡ginas")
            return {
                "success": False,
                "message": "Nenhum processo encontrado",
                "total ": 0,
                "documentos_processados": 0,
                "documentos": [],
            }

        logger.info(f"Total de processos coletados: {len(todos_processos)}")

        # Simula um objeto ApiSei para manter compatibilidade com o resto do cÃ³digo
        class MockApiSei:
            def __init__(self, success: bool, data: List[SeiProcesso]):
                self.success = success
                self.data = data

        processos = MockApiSei(success=True, data=todos_processos)
        # processos = await self.sei_service.listar_processos(
        #     SeiService.ParamsListarProcesso(palavrasChave="50000.000044/2025-74")
        # )

        if not (processos and processos.success and processos.data):
            logger.warning("Nenhum processo encontrado.")
            return {
                "success": False,
                "message": "Nenhum processo encontrado",
                "total ": 0,
                "documentos_processados": 0,
                "documentos": [],
            }

        data = processos.data
        total = len(data)
        logger.info(f"Iniciando processamento de {total } processos")
        documentos_processados = []

        # Contadores para estatÃ­sticas
        processos_com_sucesso = 0
        processos_com_erro = 0
        anexos_com_sucesso = 0
        anexos_com_erro = 0

        # Processar em lotes paralelos
        batch_size = 10  # Processar 10 documentos em paralelo

        for i in range(0, total, batch_size):
            batch = data[i : i + batch_size]
            logger.info(
                f"Processando lote {i//batch_size + 1}/{(total  + batch_size - 1)//batch_size} ({len(batch)} processos)"
            )

            # Criar tasks para o lote atual
            tasks = []
            for j, processo in enumerate(batch):
                task = self._processar_processo_com_indice(
                    processo, id_unidade, i + j + 1, total
                )
                tasks.append(task)

            # Executar lote em paralelo
            resultados = await asyncio.gather(*tasks, return_exceptions=True)

            # Processar resultados do lote
            for j, resultado in enumerate(resultados):
                if isinstance(resultado, Exception):
                    logger.error(f"Erro ao processar processo {i + j + 1}: {resultado}")
                    processos_com_erro += 1
                    continue

                # Cast para o tipo correto apÃ³s verificaÃ§Ã£o
                resultado_typed = cast(Dict[str, Any], resultado)
                if resultado_typed.get("content"):
                    documentos_processados.append(resultado_typed)

                # Atualizar contadores baseado no resultado
                if resultado_typed.get("erro"):
                    if resultado_typed.get("nome_serie") == "Anexo":
                        anexos_com_erro += 1
                    else:
                        processos_com_erro += 1
                else:
                    if resultado_typed.get("nome_serie") == "Anexo":
                        anexos_com_sucesso += 1
                    else:
                        processos_com_sucesso += 1

            # Permitir que o event loop processe outros eventos entre lotes
            await asyncio.sleep(0)

        logger.debug(
            f"Processamento concluÃ­do: {total } processos, {processos_com_sucesso + anexos_com_sucesso} sucessos, {processos_com_erro + anexos_com_erro} erros"
        )

        # Salvar documentos em cache
        self._salvar_cache(documentos_processados, id_unidade)

        # Retornar os documentos processados com estatÃ­sticas
        return {
            "success": True,
            "total ": total,
            "documentos_processados": len(documentos_processados),
            "estatisticas": {
                "processos_com_sucesso": processos_com_sucesso,
                "processos_com_erro": processos_com_erro,
                "anexos_com_sucesso": anexos_com_sucesso,
                "anexos_com_erro": anexos_com_erro,
                "total_sucessos": processos_com_sucesso + anexos_com_sucesso,
                "total_erros": processos_com_erro + anexos_com_erro,
            },
        }

    async def _processar_processo_com_indice(
        self, processo: Any, id_unidade: int, indice: int, total: int
    ) -> Dict[str, Any]:
        """Processa um processo SEI individual com logging de progresso"""
        logger.debug(
            f"Processando processo {indice}/{total}: {getattr(processo, 'numero_processo', 'N/A')}"
        )
        return await self._processar_processo(processo, id_unidade)

    async def _processar_processo_individual(
        self, processo: SeiProcesso
    ) -> Dict[str, Any]:
        """Processa um processo SEI individual e retorna o documento processado"""
        documento = getattr(processo, "documento", None)

        if not documento:
            return await self.sei_common_service.criar_documento_processado(processo)

        nome_serie = getattr(documento, "nome_serie_documento", None)
        id_documento = getattr(documento, "id_documento", None)

        logger.debug(f"Documento encontrado - ID: {id_documento}, SÃ©rie: {nome_serie}")

        if not id_documento:
            logger.debug("Documento sem ID vÃ¡lido")
            return None

        try:
            if nome_serie == "Anexo":
                return await self.sei_common_service.processar_anexo(
                    processo, id_documento
                )
            return await self.sei_common_service.processar_documento_nao_anexo(
                processo, id_documento
            )

        except Exception as e:
            logger.error(
                f"Erro ao processar documento/anexo {id_documento} (sÃ©rie: {nome_serie}): {e}"
            )
            logger.info("Criando documento processado sem conteÃºdo...")
            return await self.sei_common_service.criar_documento_processado(processo)

    async def process_sei_files(
        self, batch_size: int, id_unidade: int
    ) -> Dict[str, Any]:
        """Processa arquivos do sei"""
        try:
            # Caminho do arquivo JSON
            cache_file = Path(f"temp/cache/sei/sei_{id_unidade}.json")

            # Verifica se o arquivo existe
            if not cache_file.exists():
                logger.warning(f"Arquivo nÃ£o encontrado: {cache_file}")
                return {"success": False, "message": "Arquivo nÃ£o encontrado"}

            # LÃª o arquivo JSON
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Verifica se Ã© um array e tem pelo menos um elemento
            if not isinstance(data, list) or len(data) == 0:
                logger.warning(
                    f"Arquivo {cache_file} nÃ£o contÃ©m um array vÃ¡lido ou estÃ¡ vazio"
                )
                return {"success": False, "message": "Arquivo invÃ¡lido ou vazio"}

            # Processa elementos em lotes
            all_embeddings = []
            processed_data = []
            # Processa apenas os primeiros batch_size elementos se especificado
            elementos_para_processar = data[:batch_size] if batch_size > 0 else data
            logger.info(
                f"Processando {len(elementos_para_processar)} de {len(data)} elementos"
            )

            for elemento in elementos_para_processar:
                try:
                    content = self._gerar_informacoes_processo(elemento)
                    embeddings = await self.embedding_service.create_embeddings_from_chunks_from_sei(
                        content=content,
                        namespace=f"sei_{id_unidade}",
                        metadata={
                            "id_unidade": id_unidade,
                            "id_procedimento": elemento.get("id_procedimento"),
                            "id_documento": elemento.get("id_documento"),
                            "numero_documento": elemento.get("numero_documento"),
                            "protocolo": elemento.get(
                                "protocolo_formatado_procedimento_numero"
                            ),
                            "nivel_acesso": elemento.get("nivel_acesso"),
                            "protocolo_formatado_procedimento": elemento.get(
                                "protocolo_formatado_procedimento"
                            ),
                            "sigla_unidade_geradora": elemento.get(
                                "sigla_unidade_geradora"
                            ),
                        },
                    )
                    all_embeddings.extend(embeddings)
                    processed_data.append(content)
                except Exception as e:
                    logger.error(
                        f"Erro ao processar elemento {elemento.get('id_procedimento', 'N/A')}: {e}"
                    )
                    logger.info("Continuando para prÃ³ximo elemento...")
                    continue

            return {
                "success": True,
                "data": processed_data,
                "embeddings_created": len(all_embeddings),
            }

        except Exception as e:
            logger.error(f"Erro ao processar arquivo sei: {e}")
            return {"success": False, "message": f"Erro ao processar arquivo: {str(e)}"}

    async def auto_process_sei_files_by_time(
        self,
        tempo_minutos: int,
        id_unidade: Optional[int] = None,
        nivel_acesso_publico: bool = False,
        batch_size: int = 2,
    ) -> Dict[str, Any]:

        # Converter minutos para segundos
        tempo_limite_segundos = tempo_minutos * 60
        tempo_inicio = time.time()

        # Contadores para mÃ©tricas
        novos_processados = 0
        erros = 0
        embeddings_criados = 0
        pagina_atual = 1
        ignorados = 0
        total = 0

        logger.info(f"Iniciando processamento automÃ¡tico por {tempo_minutos} minutos")

        try:
            while True:
                # Verificar se ainda hÃ¡ tempo disponÃ­vel
                tempo_atual = time.time()
                tempo_decorrido = tempo_atual - tempo_inicio

                if tempo_decorrido >= tempo_limite_segundos:
                    logger.info(
                        f"Tempo limite atingido: {tempo_decorrido:.2f} segundos"
                    )
                    break
                # Buscar processos em lotes
                processos = await self.listar_processos_paginado(
                    id_unidade=id_unidade, page=pagina_atual, size=batch_size
                )
                total = processos.total

                if not processos.data:
                    logger.info(
                        "Nenhum processo pÃºblico encontrado, finalizando processamento"
                    )
                    break

                # Log do progresso do lote
                processos_processados_ate_agora = (pagina_atual - 1) * batch_size
                logger.info(
                    f"[{min(processos_processados_ate_agora + len(processos.data), total)}/{total}] Processando lote de {len(processos.data)} processos..."
                )

                # Processar todos os processos do lote em paralelo
                tasks = []
                for processo in processos.data:
                    tasks.append(
                        self._processar_processo_paralelo(
                            processo, nivel_acesso_publico, id_unidade
                        )
                    )

                # Executar todas as tasks em paralelo
                resultados_batch = await asyncio.gather(*tasks, return_exceptions=True)

                # Processar resultados
                for resultado in resultados_batch:
                    if isinstance(resultado, Exception):
                        logger.error(f"Erro ao processar processo: {resultado}")
                        erros += 1
                        continue

                    if resultado is None:
                        ignorados += 1
                        continue

                    if resultado.get("erro"):
                        erros += 1
                        continue

                    if resultado.get("ignorado"):
                        ignorados += 1
                        continue

                    novos_processados += 1
                    embeddings_criados += 1

                pagina_atual += 1

                # Verificar tempo novamente apÃ³s processar lote
                tempo_atual = time.time()
                tempo_decorrido = tempo_atual - tempo_inicio

                if tempo_decorrido >= tempo_limite_segundos:
                    logger.info("Tempo limite atingido apÃ³s processar lote")
                    break

                # Pequena pausa entre lotes para nÃ£o sobrecarregar
                await asyncio.sleep(1)

            # Calcular tempo total de execuÃ§Ã£o
            tempo_total = time.time() - tempo_inicio

            logger.info(f"Processamento concluÃ­do em {tempo_total:.2f} segundos")
            logger.info(
                f"MÃ©tricas: {novos_processados} processos, {erros} erros, {embeddings_criados} embeddings"
            )

            return {
                "success": True,
                "total ": total,
                "novos_processados": novos_processados,
                "erros": erros,
                "embeddings_criados": embeddings_criados,
                "tempo_execucao_minutos": round(tempo_total / 60, 2),
                "ignorados": ignorados,
            }

        except Exception as e:
            tempo_total = time.time() - tempo_inicio
            logger.error(f"Erro durante processamento automÃ¡tico: {e}")
            return {
                "success": False,
                "error": str(e),
                "novos_processados": novos_processados,
                "erros": erros,
                "embeddings_criados": embeddings_criados,
                "tempo_execucao_segundos": round(tempo_total, 2),
                "tempo_execucao_minutos": round(tempo_total / 60, 2),
            }

    async def auto_process_sei_files_by_time_total_unidades(
        self,
        nivel_acesso_publico: bool = False,
        tempo_minutos: int = 5,
    ) -> Dict[str, Any]:
        """Processa todos os processos SEI de todas as unidades com paginaÃ§Ã£o automÃ¡tica"""
        inicio_execucao = time.time()
        tempo_limite_segundos = tempo_minutos * 60

        start = 0
        limit = 1
        total_unidades_processadas = 0

        while True:
            tempo_atual = time.time()
            if (tempo_atual - inicio_execucao) >= tempo_limite_segundos:
                break

            params = self.sei_service.ParamsListarUnidades(limit=limit, start=start)
            result = await self.sei_service.listar_unidades(params)

            if not result.data or len(result.data) == 0:
                break

            unidade = result.data[0]
            procesos = await self.auto_process_sei_files_by_time(
                tempo_minutos=tempo_minutos,
                id_unidade=unidade.id,
                nivel_acesso_publico=nivel_acesso_publico,
            )

            total_unidades_processadas += 1
            start += 1

        tempo_total = time.time() - inicio_execucao
        return {
            "success": True,
            "total_unidades": total_unidades_processadas,
            "tempo_execucao_segundos": round(tempo_total, 2),
            "tempo_execucao_minutos": round(tempo_total / 60, 2),
            "procesos": procesos,
        }

    async def _processar_processo_paralelo(
        self, processo, nivel_acesso_publico: bool, id_unidade: Optional[int]
    ) -> Optional[Dict[str, Any]]:
        """Processa um processo individual de forma assÃ­ncrona para execuÃ§Ã£o em paralelo"""
        try:
            # Pegar numero_documento de forma segura
            numero_documento = None
            if processo.documento:
                numero_documento = processo.documento.protocolo_formatado_documento

            # Buscar por numero_documento se jÃ¡ existe
            existing_documents = await self.embedding_service.search_by_metadata(
                metadata_filter={
                    "numero_documento": numero_documento,
                },
                limit=1,
            )
            if existing_documents:
                logger.debug(
                    f"Documento {processo.id_procedimento} jÃ¡ existe, pulando..."
                )
                return {"ignorado": True}

            resultado = await self._processar_processo_individual(processo)

            # Pular se nivel_acesso_publico for true e nÃ­vel de acesso nÃ£o for pÃºblico
            if (
                nivel_acesso_publico
                and resultado.get("nivel_acesso") != NivelAcesso.PUBLICO.to_display()
            ):
                logger.debug(
                    f"Processo {processo.id_procedimento} nÃ£o possui nivel de acesso pÃºblico"
                )
                return {"ignorado": True}

            if not resultado.get("content"):
                logger.debug(f"Processo {processo.id_procedimento} nÃ£o possui conteÃºdo")
                return {"erro": True}

            metadata = {
                "id_unidade": id_unidade,
                "id_procedimento": resultado.get("id_procedimento"),
                "id_documento": resultado.get("id_documento"),
                "protocolo": resultado.get("protocolo_formatado_procedimento_numero"),
                "numero_documento": resultado.get("numero_documento"),
                "nivel_acesso": resultado.get("nivel_acesso"),
                "protocolo_formatado_procedimento": resultado.get(
                    "protocolo_formatado_procedimento"
                ),
                "sigla_unidade_geradora": resultado.get("sigla_unidade_geradora"),
            }

            content = self._gerar_informacoes_processo(resultado)

            # Definir namespace baseado no nÃ­vel de acesso
            if nivel_acesso_publico:
                namespace = "sei_publico"
            else:
                namespace = f"sei_{id_unidade}"

            await self.embedding_service.create_embeddings_from_chunks_from_sei(
                content=content,
                namespace=namespace,
                metadata=metadata,
            )

            return {"sucesso": True}

        except Exception as e:
            logger.error(f"Erro ao processar processo {processo.id_procedimento}: {e}")
            return {"erro": True}


async def create_sync_sei_service() -> SeiSyncService:
    """Factory function para criar instÃ¢ncia do SyncService"""
    if not ORMConfig.AsyncSessionLocal:
        raise RuntimeError(
            "ORM nÃ£o foi inicializado. Chame ORMConfig.initialize() primeiro."
        )

    # Criar uma sessÃ£o do banco - serÃ¡ gerenciada pelos serviÃ§os internamente
    db_session = get_db()

    try:
        sei_service = SeiService(db_session=db_session)
        docling_processor = DoclingProcessor()
        embedding_service = EmbeddingService(db_session)
        return SeiSyncService(sei_service, docling_processor, embedding_service)
    except Exception:
        # Em caso de erro, fechar a sessÃ£o
        await db_session.close()
        raise
