"""
Serviço de Busca Avançada - Fase 2
Implementa hybrid search, re-ranking e filtros avançados
"""

import csv
import io
import json
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.embedding import DocumentVector
from src.models.search_schemas import (
    DocumentType,
    ExportFormat,
    SearchResponseAdvanced,
    SearchResultAdvanced,
    SortBy,
)
from src.services.embedding_service import EmbeddingService

logger = get_logger(__name__)


class AdvancedSearchService:
    """
    Serviço de Busca Avançada

    Features:
    - Hybrid search (keyword + vector)
    - Re-ranking por relevância contextual
    - Filtros avançados (data, tipo, tags)
    - Exportação em múltiplos formatos
    - Highlights nos resultados
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_service = EmbeddingService(db)

    async def hybrid_search(
        self,
        query: str,
        limit: int = 10,
        vector_weight: float = 0.5,
        threshold: float = 0.3,
        document_types: Optional[List[DocumentType]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        namespace: Optional[str] = None,
        sort_by: SortBy = SortBy.RELEVANCE,
        enable_reranking: bool = True,
    ) -> SearchResponseAdvanced:
        """
        Busca híbrida combinando keyword e vector search

        Args:
            query: Consulta de busca
            limit: Número máximo de resultados
            vector_weight: Peso da busca vetorial (0=só keyword, 1=só vector)
            threshold: Threshold mínimo de similaridade
            document_types: Filtrar por tipos de documento
            date_from: Data inicial
            date_to: Data final
            tags: Filtrar por tags
            namespace: Filtrar por namespace
            sort_by: Critério de ordenação
            enable_reranking: Ativar re-ranking contextual

        Returns:
            SearchResponseAdvanced com resultados
        """
        start_time = time.time()

        try:
            # 1. Busca vetorial (semântica)
            vector_results = []
            if vector_weight > 0:
                logger.debug(f"Executando busca vetorial (peso: {vector_weight})")
                vector_results = await self._vector_search(
                    query=query,
                    limit=limit * 2,  # Buscar mais para depois combinar
                    threshold=threshold,
                    namespace=namespace,
                )

            # 2. Busca por palavras-chave (textual)
            keyword_results = []
            if vector_weight < 1.0:
                keyword_weight = 1.0 - vector_weight
                logger.debug(
                    f"Executando busca por palavras-chave (peso: {keyword_weight})"
                )
                keyword_results = await self._keyword_search(
                    query=query,
                    limit=limit * 2,
                    namespace=namespace,
                )

            # 3. Combinar resultados (Reciprocal Rank Fusion)
            logger.debug("Combinando resultados (RRF)")
            combined_results = self._combine_results_rrf(
                vector_results=vector_results,
                keyword_results=keyword_results,
                vector_weight=vector_weight,
            )

            # 4. Aplicar filtros avançados
            logger.debug("Aplicando filtros avançados")
            filtered_results = await self._apply_filters(
                results=combined_results,
                document_types=document_types,
                date_from=date_from,
                date_to=date_to,
                tags=tags,
            )

            # 5. Re-ranking (se ativado)
            if enable_reranking and filtered_results:
                logger.debug("Aplicando re-ranking contextual")
                filtered_results = await self._rerank_results(
                    query=query, results=filtered_results
                )

            # 6. Ordenar resultados
            sorted_results = self._sort_results(filtered_results, sort_by)

            # 7. Limitar resultados
            final_results = sorted_results[:limit]

            # 8. Adicionar highlights
            for result in final_results:
                result.highlights = self._extract_highlights(result.content, query)

            # 9. Criar resposta
            execution_time = (time.time() - start_time) * 1000  # ms

            filters_applied = {
                "document_types": (
                    [dt.value for dt in document_types] if document_types else None
                ),
                "date_from": date_from.isoformat() if date_from else None,
                "date_to": date_to.isoformat() if date_to else None,
                "tags": tags,
                "namespace": namespace,
            }

            response = SearchResponseAdvanced(
                results=final_results,
                total_found=len(final_results),
                query=query,
                execution_time_ms=execution_time,
                filters_applied=filters_applied,
            )

            logger.info(
                f"Busca híbrida concluída: {len(final_results)} resultados em {execution_time:.2f}ms"
            )
            return response

        except Exception as e:
            logger.error(f"Erro na busca híbrida: {str(e)}")
            raise

    async def _vector_search(
        self, query: str, limit: int, threshold: float, namespace: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Busca vetorial usando embeddings"""
        try:
            results = await self.embedding_service.semantic_search(
                query=query, limit=limit, threshold=threshold, namespace=namespace
            )

            return [
                {
                    "id": str(result.id),
                    "content": result.content,
                    "metadata": result.metadata or {},
                    "score": getattr(result, "similarity", 0.5),
                    "source": "vector",
                }
                for result in results
            ]
        except Exception as e:
            logger.error(f"Erro na busca vetorial: {str(e)}")
            return []

    async def _keyword_search(
        self, query: str, limit: int, namespace: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Busca por palavras-chave usando full-text search"""
        try:
            # Construir query com filtros
            stmt = select(DocumentVector)

            # Filtro de namespace
            if namespace:
                stmt = stmt.where(DocumentVector.namespace == namespace)

            # Full-text search usando ILIKE para PostgreSQL
            search_terms = query.lower().split()
            conditions = [
                DocumentVector.content.ilike(f"%{term}%") for term in search_terms
            ]

            if conditions:
                stmt = stmt.where(or_(*conditions))

            stmt = stmt.limit(limit)

            # Executar query
            result = await self.db.execute(stmt)
            embeddings = result.scalars().all()

            # Calcular score baseado em frequência de termos
            results = []
            for emb in embeddings:
                content_lower = emb.content.lower()
                score = sum(
                    content_lower.count(term) for term in search_terms
                ) / len(search_terms)
                score = min(score / 10, 1.0)  # Normalizar para 0-1

                results.append(
                    {
                        "id": str(emb.id),
                        "content": emb.content,
                        "metadata": emb.metadata or {},
                        "score": score,
                        "source": "keyword",
                    }
                )

            return results

        except Exception as e:
            logger.error(f"Erro na busca por palavras-chave: {str(e)}")
            return []

    def _combine_results_rrf(
        self,
        vector_results: List[Dict],
        keyword_results: List[Dict],
        vector_weight: float,
        k: int = 60,
    ) -> List[Dict]:
        """
        Combina resultados usando Reciprocal Rank Fusion (RRF)

        RRF Score = Σ(1 / (k + rank))
        """
        # Criar dicionário de scores
        combined_scores: Dict[str, Dict] = {}

        # Adicionar scores da busca vetorial
        for rank, result in enumerate(vector_results, start=1):
            doc_id = result["id"]
            rrf_score = vector_weight * (1.0 / (k + rank))

            if doc_id not in combined_scores:
                combined_scores[doc_id] = result.copy()
                combined_scores[doc_id]["score"] = rrf_score
            else:
                combined_scores[doc_id]["score"] += rrf_score

        # Adicionar scores da busca por palavras-chave
        keyword_weight = 1.0 - vector_weight
        for rank, result in enumerate(keyword_results, start=1):
            doc_id = result["id"]
            rrf_score = keyword_weight * (1.0 / (k + rank))

            if doc_id not in combined_scores:
                combined_scores[doc_id] = result.copy()
                combined_scores[doc_id]["score"] = rrf_score
            else:
                combined_scores[doc_id]["score"] += rrf_score

        # Converter para lista e ordenar por score
        combined_results = list(combined_scores.values())
        combined_results.sort(key=lambda x: x["score"], reverse=True)

        return combined_results

    async def _apply_filters(
        self,
        results: List[Dict],
        document_types: Optional[List[DocumentType]],
        date_from: Optional[datetime],
        date_to: Optional[datetime],
        tags: Optional[List[str]],
    ) -> List[SearchResultAdvanced]:
        """Aplica filtros avançados aos resultados"""
        filtered = []

        for rank, result in enumerate(results, start=1):
            metadata = result.get("metadata", {})

            # Filtro por tipo de documento
            if document_types and DocumentType.ALL not in document_types:
                doc_type = metadata.get("document_type", "").lower()
                if not any(dt.value == doc_type for dt in document_types):
                    continue

            # Filtro por data
            upload_date_str = metadata.get("upload_date") or metadata.get(
                "created_at"
            )
            if upload_date_str:
                try:
                    upload_date = datetime.fromisoformat(
                        upload_date_str.replace("Z", "+00:00")
                    )

                    if date_from and upload_date < date_from:
                        continue
                    if date_to and upload_date > date_to:
                        continue
                except (ValueError, TypeError):
                    pass

            # Filtro por tags
            doc_tags = metadata.get("tags", [])
            if tags:
                if not any(tag in doc_tags for tag in tags):
                    continue

            # Criar resultado avançado
            search_result = SearchResultAdvanced(
                id=result["id"],
                content=result["content"],
                metadata=metadata,
                score=result["score"],
                rank=rank,
                document_type=metadata.get("document_type"),
                upload_date=(
                    datetime.fromisoformat(upload_date_str.replace("Z", "+00:00"))
                    if upload_date_str
                    else None
                ),
                tags=doc_tags,
            )

            filtered.append(search_result)

        return filtered

    async def _rerank_results(
        self, query: str, results: List[SearchResultAdvanced]
    ) -> List[SearchResultAdvanced]:
        """
        Re-ranking contextual dos resultados

        Usa heurísticas para melhorar relevância:
        - Proximidade de termos da query
        - Frequência de termos importantes
        - Tamanho do documento
        """
        query_terms = set(query.lower().split())

        for result in results:
            content_lower = result.content.lower()

            # Score original
            base_score = result.score

            # Bonus por proximidade de termos
            proximity_bonus = 0.0
            words = content_lower.split()
            for i, word in enumerate(words):
                if word in query_terms:
                    # Bonus se outros termos da query estão próximos
                    window = words[max(0, i - 5) : min(len(words), i + 6)]
                    matches = sum(1 for w in window if w in query_terms)
                    proximity_bonus += matches * 0.01

            # Bonus por densidade de termos
            density_bonus = (
                sum(1 for word in words if word in query_terms) / max(len(words), 1)
            ) * 0.1

            # Penalidade por documentos muito longos ou muito curtos
            length_factor = 1.0
            if len(result.content) < 100:
                length_factor = 0.8
            elif len(result.content) > 10000:
                length_factor = 0.9

            # Score final
            result.score = (
                base_score + proximity_bonus + density_bonus
            ) * length_factor

        # Re-ordenar por novo score
        results.sort(key=lambda x: x.score, reverse=True)

        # Atualizar ranks
        for rank, result in enumerate(results, start=1):
            result.rank = rank

        return results

    def _sort_results(
        self, results: List[SearchResultAdvanced], sort_by: SortBy
    ) -> List[SearchResultAdvanced]:
        """Ordena resultados segundo critério especificado"""
        if sort_by == SortBy.RELEVANCE:
            # Já ordenado por score
            return results
        elif sort_by == SortBy.DATE_DESC:
            return sorted(
                results,
                key=lambda x: x.upload_date or datetime.min,
                reverse=True,
            )
        elif sort_by == SortBy.DATE_ASC:
            return sorted(
                results,
                key=lambda x: x.upload_date or datetime.min,
            )
        elif sort_by == SortBy.NAME_ASC:
            return sorted(
                results,
                key=lambda x: x.metadata.get("filename", ""),
            )
        elif sort_by == SortBy.NAME_DESC:
            return sorted(
                results,
                key=lambda x: x.metadata.get("filename", ""),
                reverse=True,
            )
        return results

    def _extract_highlights(self, content: str, query: str, max_highlights: int = 3) -> List[str]:
        """Extrai trechos relevantes do conteúdo"""
        highlights = []
        query_terms = query.lower().split()

        # Dividir conteúdo em sentenças
        sentences = content.split(". ")

        # Pontuar sentenças por relevância
        scored_sentences = []
        for sentence in sentences:
            sentence_lower = sentence.lower()
            score = sum(1 for term in query_terms if term in sentence_lower)
            if score > 0:
                scored_sentences.append((score, sentence))

        # Ordenar e pegar top N
        scored_sentences.sort(reverse=True)

        for score, sentence in scored_sentences[:max_highlights]:
            # Limitar tamanho
            if len(sentence) > 200:
                sentence = sentence[:200] + "..."
            highlights.append(sentence.strip())

        return highlights

    async def export_results(
        self,
        query: str,
        format: ExportFormat,
        limit: int,
        document_types: Optional[List[DocumentType]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        namespace: Optional[str] = None,
    ) -> str:
        """Exporta resultados de busca em formato especificado"""
        # Executar busca
        response = await self.hybrid_search(
            query=query,
            limit=limit,
            document_types=document_types,
            date_from=date_from,
            date_to=date_to,
            tags=tags,
            namespace=namespace,
        )

        # Exportar no formato desejado
        if format == ExportFormat.JSON:
            return self._export_json(response)
        elif format == ExportFormat.CSV:
            return self._export_csv(response)
        elif format == ExportFormat.MARKDOWN:
            return self._export_markdown(response)
        elif format == ExportFormat.TXT:
            return self._export_txt(response)

        raise ValueError(f"Formato não suportado: {format}")

    def _export_json(self, response: SearchResponseAdvanced) -> str:
        """Exporta para JSON"""
        data = {
            "query": response.query,
            "total_found": response.total_found,
            "execution_time_ms": response.execution_time_ms,
            "results": [
                {
                    "rank": r.rank,
                    "score": r.score,
                    "content": r.content,
                    "document_type": r.document_type,
                    "upload_date": (
                        r.upload_date.isoformat() if r.upload_date else None
                    ),
                    "tags": r.tags,
                    "highlights": r.highlights,
                    "metadata": r.metadata,
                }
                for r in response.results
            ],
        }
        return json.dumps(data, indent=2, ensure_ascii=False)

    def _export_csv(self, response: SearchResponseAdvanced) -> str:
        """Exporta para CSV"""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(
            [
                "Rank",
                "Score",
                "Document Type",
                "Upload Date",
                "Tags",
                "Content Preview",
                "Highlights",
            ]
        )

        # Rows
        for r in response.results:
            writer.writerow(
                [
                    r.rank,
                    f"{r.score:.4f}",
                    r.document_type or "",
                    r.upload_date.isoformat() if r.upload_date else "",
                    "; ".join(r.tags),
                    r.content[:200] + "..." if len(r.content) > 200 else r.content,
                    " | ".join(r.highlights),
                ]
            )

        return output.getvalue()

    def _export_markdown(self, response: SearchResponseAdvanced) -> str:
        """Exporta para Markdown"""
        lines = [
            f"# Resultados de Busca: {response.query}",
            "",
            f"**Total encontrado:** {response.total_found}",
            f"**Tempo de execução:** {response.execution_time_ms:.2f}ms",
            "",
            "---",
            "",
        ]

        for r in response.results:
            lines.extend(
                [
                    f"## #{r.rank} - Score: {r.score:.4f}",
                    "",
                    f"**Tipo:** {r.document_type or 'N/A'}",
                    f"**Data:** {r.upload_date.strftime('%Y-%m-%d') if r.upload_date else 'N/A'}",
                    f"**Tags:** {', '.join(r.tags) if r.tags else 'N/A'}",
                    "",
                    "**Conteúdo:**",
                    "",
                    r.content[:500] + "..." if len(r.content) > 500 else r.content,
                    "",
                ]
            )

            if r.highlights:
                lines.extend(["**Destaques:**", ""])
                for highlight in r.highlights:
                    lines.append(f"- {highlight}")
                lines.append("")

            lines.extend(["---", ""])

        return "\n".join(lines)

    def _export_txt(self, response: SearchResponseAdvanced) -> str:
        """Exporta para texto plano"""
        lines = [
            f"RESULTADOS DE BUSCA: {response.query}",
            f"Total encontrado: {response.total_found}",
            f"Tempo de execução: {response.execution_time_ms:.2f}ms",
            "",
            "=" * 80,
            "",
        ]

        for r in response.results:
            lines.extend(
                [
                    f"#{r.rank} - Score: {r.score:.4f}",
                    f"Tipo: {r.document_type or 'N/A'}",
                    f"Data: {r.upload_date.strftime('%Y-%m-%d') if r.upload_date else 'N/A'}",
                    f"Tags: {', '.join(r.tags) if r.tags else 'N/A'}",
                    "",
                    "CONTEÚDO:",
                    r.content[:500] + "..." if len(r.content) > 500 else r.content,
                    "",
                ]
            )

            if r.highlights:
                lines.append("DESTAQUES:")
                for highlight in r.highlights:
                    lines.append(f"  - {highlight}")
                lines.append("")

            lines.extend(["-" * 80, ""])

        return "\n".join(lines)

    async def get_available_filters(self) -> Dict[str, Any]:
        """Retorna filtros disponíveis"""
        try:
            # Buscar dados dos embeddings
            stmt = select(
                DocumentVector.metadata,
                func.min(DocumentVector.created_at).label("min_date"),
                func.max(DocumentVector.created_at).label("max_date"),
            )

            result = await self.db.execute(stmt)
            row = result.first()

            # Extrair tipos de documento e tags únicos
            stmt = select(DocumentVector.metadata)
            result = await self.db.execute(stmt)
            all_metadata = [r[0] for r in result.fetchall() if r[0]]

            document_types = set()
            tags = set()

            for metadata in all_metadata:
                if isinstance(metadata, dict):
                    doc_type = metadata.get("document_type")
                    if doc_type:
                        document_types.add(doc_type)

                    doc_tags = metadata.get("tags", [])
                    if isinstance(doc_tags, list):
                        tags.update(doc_tags)

            return {
                "document_types": sorted(list(document_types)),
                "tags": sorted(list(tags)),
                "date_range": {
                    "min": row.min_date.isoformat() if row and row.min_date else None,
                    "max": row.max_date.isoformat() if row and row.max_date else None,
                },
            }

        except Exception as e:
            logger.error(f"Erro ao obter filtros disponíveis: {str(e)}")
            return {"document_types": [], "tags": [], "date_range": {}}

    async def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de documentos"""
        try:
            # Total de documentos
            stmt = select(func.count(DocumentVector.id))
            result = await self.db.execute(stmt)
            total_docs = result.scalar() or 0

            # Documentos por tipo
            stmt = select(DocumentVector.metadata)
            result = await self.db.execute(stmt)
            all_metadata = [r[0] for r in result.fetchall() if r[0]]

            docs_by_type: Dict[str, int] = {}
            tags_count: Dict[str, int] = {}

            for metadata in all_metadata:
                if isinstance(metadata, dict):
                    doc_type = metadata.get("document_type", "unknown")
                    docs_by_type[doc_type] = docs_by_type.get(doc_type, 0) + 1

                    doc_tags = metadata.get("tags", [])
                    for tag in doc_tags:
                        tags_count[tag] = tags_count.get(tag, 0) + 1

            # Top tags
            top_tags = sorted(tags_count.items(), key=lambda x: x[1], reverse=True)[
                :10
            ]

            return {
                "total_documents": total_docs,
                "documents_by_type": docs_by_type,
                "top_tags": [{"tag": tag, "count": count} for tag, count in top_tags],
            }

        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {str(e)}")
            return {"total_documents": 0, "documents_by_type": {}, "top_tags": []}


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================


async def get_advanced_search_service() -> AdvancedSearchService:
    """Dependency para obter instância do serviço"""
    async with get_db() as db:
        yield AdvancedSearchService(db)
