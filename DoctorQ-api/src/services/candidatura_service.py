from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from src.models.candidatura import TbCandidaturas
from src.models.vaga import TbVagas
from src.models.curriculo import TbCurriculos
from src.schemas.candidatura_schema import (
    CriarCandidaturaRequest,
    AtualizarCandidaturaRequest,
    AvaliarCandidaturaRequest,
    CandidaturaResponse,
    CandidaturaDetailResponse,
    CandidaturaListResponse,
    CandidaturasFiltros,
    VerificarCandidaturaResponse,
    EstatisticasCandidaturasResponse,
    DashboardCandidatoResponse,
    AnalyticsEmpresaResponse,
    VagaAnalytics
)
from src.services.curriculo_service import CurriculoService
from src.services.vaga_service import VagaService


class CandidaturaService:
    """Service para gerenciamento de candidaturas"""

    @staticmethod
    def calcular_match_score(vaga: TbVagas, curriculo: TbCurriculos) -> int:
        """
        Calcula score de compatibilidade entre vaga e currículo (0-100)

        Pesos:
        - Habilidades: 40%
        - Experiência: 20%
        - Localização: 15%
        - Tipo de contrato: 10%
        - Regime de trabalho: 10%
        - Nível: 5%
        """
        score = 0

        # Habilidades (peso 40%)
        habilidades_requeridas = set(vaga.habilidades_requeridas or [])
        habilidades_curriculo = set(curriculo.habilidades or [])

        if habilidades_requeridas:
            habilidades_match = len(habilidades_requeridas & habilidades_curriculo)
            total_habilidades = len(habilidades_requeridas)
            score += (habilidades_match / total_habilidades) * 40
        else:
            score += 20  # Se não tem requisitos, dá metade dos pontos

        # Experiência (peso 20%)
        anos_requeridos = vaga.nr_anos_experiencia_min or 0
        anos_candidato = curriculo.nr_anos_experiencia or 0

        if anos_candidato >= anos_requeridos:
            score += 20
        elif anos_candidato >= (anos_requeridos * 0.7):
            score += 10  # 70% da experiência ainda vale

        # Localização (peso 15%)
        if vaga.fg_aceita_remoto:
            score += 15  # Remoto = sempre compatível
        elif vaga.nm_cidade == curriculo.nm_cidade and vaga.nm_estado == curriculo.nm_estado:
            score += 15  # Mesma cidade
        elif vaga.nm_estado == curriculo.nm_estado:
            score += 7  # Mesmo estado

        # Tipo de contrato (peso 10%)
        if vaga.nm_tipo_contrato in (curriculo.tipos_contrato_aceitos or []):
            score += 10

        # Regime de trabalho (peso 10%)
        if vaga.nm_regime_trabalho in (curriculo.regimes_trabalho_aceitos or []):
            score += 10

        # Nível de experiência (peso 5%)
        niveis_ordem = ["estagiario", "junior", "pleno", "senior", "especialista"]
        try:
            nivel_vaga_idx = niveis_ordem.index(vaga.nm_nivel)
            nivel_curriculo_idx = niveis_ordem.index(curriculo.nm_nivel_experiencia)

            if nivel_curriculo_idx == nivel_vaga_idx:
                score += 5  # Nível exato
            elif nivel_curriculo_idx == nivel_vaga_idx - 1 or nivel_curriculo_idx == nivel_vaga_idx + 1:
                score += 2  # Nível próximo
        except (ValueError, AttributeError):
            pass

        return min(int(score), 100)

    @staticmethod
    async def criar_candidatura(
        db: AsyncSession,
        data: CriarCandidaturaRequest,
        id_candidato: str
    ) -> TbCandidaturas:
        """Cria uma nova candidatura"""

        # Verificar se vaga existe e está aberta
        vaga = await VagaService.buscar_por_id(db, data.id_vaga)
        if not vaga:
            raise ValueError("Vaga não encontrada")

        if vaga.ds_status != "aberta":
            raise ValueError("Esta vaga não está mais aberta para candidaturas")

        # Buscar currículo do candidato
        curriculo = await CurriculoService.buscar_por_usuario(db, id_candidato)
        if not curriculo:
            raise ValueError("Você precisa cadastrar um currículo antes de se candidatar")

        # Verificar se já se candidatou
        candidatura_existente = await CandidaturaService.verificar_candidatura(
            db, data.id_vaga, id_candidato
        )
        if candidatura_existente.ja_candidatou:
            raise ValueError("Você já se candidatou para esta vaga")

        # Calcular match score
        match_score = CandidaturaService.calcular_match_score(vaga, curriculo)

        # Criar candidatura com dados desnormalizados
        candidatura = TbCandidaturas(
            id_vaga=uuid.UUID(data.id_vaga),
            id_curriculo=curriculo.id_curriculo,
            id_candidato=uuid.UUID(id_candidato),
            ds_carta_apresentacao=data.ds_carta_apresentacao,
            nr_match_score=match_score,
            ds_status="enviada",
            nm_candidato=curriculo.nm_completo,
            ds_email_candidato=curriculo.ds_email,
            nr_telefone_candidato=curriculo.nr_telefone,
            nm_cargo_vaga=vaga.nm_cargo,
            nm_empresa=vaga.nm_empresa
        )

        db.add(candidatura)

        # Incrementar contadores
        await VagaService.incrementar_candidatos(db, data.id_vaga)
        await CurriculoService.incrementar_candidaturas(db, str(curriculo.id_curriculo))

        await db.commit()
        await db.refresh(candidatura)

        return candidatura

    @staticmethod
    async def buscar_por_id(
        db: AsyncSession,
        id_candidatura: str,
        incluir_relacionamentos: bool = False
    ) -> Optional[TbCandidaturas]:
        """Busca candidatura por ID"""

        query = select(TbCandidaturas).where(
            TbCandidaturas.id_candidatura == uuid.UUID(id_candidatura)
        )

        if incluir_relacionamentos:
            query = query.options(
                joinedload(TbCandidaturas.vaga),
                joinedload(TbCandidaturas.curriculo)
            )

        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def verificar_candidatura(
        db: AsyncSession,
        id_vaga: str,
        id_candidato: str
    ) -> VerificarCandidaturaResponse:
        """Verifica se candidato já se candidatou para vaga"""

        query = select(TbCandidaturas).where(
            and_(
                TbCandidaturas.id_vaga == uuid.UUID(id_vaga),
                TbCandidaturas.id_candidato == uuid.UUID(id_candidato)
            )
        )

        result = await db.execute(query)
        candidatura = result.scalar_one_or_none()

        if candidatura:
            return VerificarCandidaturaResponse(
                ja_candidatou=True,
                id_candidatura=str(candidatura.id_candidatura),
                ds_status=candidatura.ds_status,
                dt_candidatura=candidatura.dt_candidatura
            )

        return VerificarCandidaturaResponse(ja_candidatou=False)

    @staticmethod
    async def listar_candidaturas(
        db: AsyncSession,
        filtros: CandidaturasFiltros
    ) -> CandidaturaListResponse:
        """Lista candidaturas com filtros e paginação"""

        query = select(TbCandidaturas)

        # Aplicar filtros
        conditions = []

        if filtros.id_vaga:
            conditions.append(TbCandidaturas.id_vaga == uuid.UUID(filtros.id_vaga))

        if filtros.id_candidato:
            conditions.append(TbCandidaturas.id_candidato == uuid.UUID(filtros.id_candidato))

        if filtros.ds_status:
            conditions.append(TbCandidaturas.ds_status == filtros.ds_status)

        if filtros.nr_match_score_min:
            conditions.append(TbCandidaturas.nr_match_score >= filtros.nr_match_score_min)

        if filtros.dt_candidatura_inicio:
            conditions.append(TbCandidaturas.dt_candidatura >= filtros.dt_candidatura_inicio)

        if filtros.dt_candidatura_fim:
            conditions.append(TbCandidaturas.dt_candidatura <= filtros.dt_candidatura_fim)

        if conditions:
            query = query.where(and_(*conditions))

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.execute(count_query)
        total = total.scalar()

        # Ordenar
        if filtros.ordenar_por == "nr_match_score":
            order_by = TbCandidaturas.nr_match_score
        elif filtros.ordenar_por == "nm_candidato":
            order_by = TbCandidaturas.nm_candidato
        else:  # dt_candidatura (padrão)
            order_by = TbCandidaturas.dt_candidatura

        if filtros.ordem == "asc":
            query = query.order_by(order_by.asc())
        else:
            query = query.order_by(order_by.desc())

        # Paginação
        offset = (filtros.page - 1) * filtros.size
        query = query.offset(offset).limit(filtros.size)

        result = await db.execute(query)
        candidaturas = result.scalars().all()

        total_pages = (total + filtros.size - 1) // filtros.size

        return CandidaturaListResponse(
            candidaturas=[CandidaturaResponse.from_orm(c) for c in candidaturas],
            total=total,
            page=filtros.page,
            size=filtros.size,
            total_pages=total_pages
        )

    @staticmethod
    async def listar_minhas_candidaturas(
        db: AsyncSession,
        id_candidato: str,
        filtros: CandidaturasFiltros
    ) -> CandidaturaListResponse:
        """Lista candidaturas do candidato logado"""

        filtros.id_candidato = id_candidato
        return await CandidaturaService.listar_candidaturas(db, filtros)

    @staticmethod
    async def listar_candidatos_vaga(
        db: AsyncSession,
        id_vaga: str,
        id_empresa: str,
        filtros: CandidaturasFiltros
    ) -> CandidaturaListResponse:
        """Lista candidatos de uma vaga (para empresa)"""

        # Verificar se vaga pertence à empresa
        vaga = await VagaService.buscar_por_id(db, id_vaga)
        if not vaga or str(vaga.id_empresa) != id_empresa:
            raise PermissionError("Você não tem permissão para ver candidatos desta vaga")

        filtros.id_vaga = id_vaga
        # Ordenar por match score por padrão
        if not filtros.ordenar_por:
            filtros.ordenar_por = "nr_match_score"
            filtros.ordem = "desc"

        return await CandidaturaService.listar_candidaturas(db, filtros)

    @staticmethod
    async def atualizar_candidatura(
        db: AsyncSession,
        id_candidatura: str,
        data: AtualizarCandidaturaRequest,
        id_empresa: str
    ) -> TbCandidaturas:
        """Atualiza status e feedback da candidatura (empresa)"""

        candidatura = await CandidaturaService.buscar_por_id(db, id_candidatura, incluir_relacionamentos=True)

        if not candidatura:
            raise ValueError("Candidatura não encontrada")

        # Verificar se a vaga pertence à empresa
        if str(candidatura.vaga.id_empresa) != id_empresa:
            raise PermissionError("Você não tem permissão para atualizar esta candidatura")

        # Atualizar campos
        candidatura.ds_status = data.ds_status
        candidatura.dt_atualizacao = datetime.utcnow()

        if data.dt_entrevista:
            candidatura.dt_entrevista = data.dt_entrevista

        if data.ds_feedback_empresa:
            candidatura.ds_feedback_empresa = data.ds_feedback_empresa

        # Marcar visualização da empresa (primeira vez)
        if not candidatura.dt_visualizacao_empresa:
            candidatura.dt_visualizacao_empresa = datetime.utcnow()

        # Marcar finalização se aprovado/reprovado
        if data.ds_status in ["aprovado", "reprovado"]:
            candidatura.dt_finalizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(candidatura)

        return candidatura

    @staticmethod
    async def candidato_desistir(
        db: AsyncSession,
        id_candidatura: str,
        id_candidato: str
    ) -> TbCandidaturas:
        """Candidato desiste da candidatura"""

        candidatura = await CandidaturaService.buscar_por_id(db, id_candidatura)

        if not candidatura:
            raise ValueError("Candidatura não encontrada")

        # Verificar se candidatura pertence ao candidato
        if str(candidatura.id_candidato) != id_candidato:
            raise PermissionError("Você não tem permissão para desistir desta candidatura")

        candidatura.ds_status = "desistiu"
        candidatura.dt_finalizacao = datetime.utcnow()
        candidatura.dt_atualizacao = datetime.utcnow()

        # Decrementar contador de candidatos na vaga
        await VagaService.decrementar_candidatos(db, str(candidatura.id_vaga))

        await db.commit()
        await db.refresh(candidatura)

        return candidatura

    @staticmethod
    async def avaliar_processo(
        db: AsyncSession,
        id_candidatura: str,
        data: AvaliarCandidaturaRequest,
        id_candidato: str
    ) -> TbCandidaturas:
        """Candidato avalia o processo seletivo"""

        candidatura = await CandidaturaService.buscar_por_id(db, id_candidatura)

        if not candidatura:
            raise ValueError("Candidatura não encontrada")

        # Verificar se candidatura pertence ao candidato
        if str(candidatura.id_candidato) != id_candidato:
            raise PermissionError("Você não tem permissão para avaliar esta candidatura")

        # Só pode avaliar se processo finalizado
        if candidatura.ds_status not in ["aprovado", "reprovado"]:
            raise ValueError("Só é possível avaliar processos finalizados")

        candidatura.ds_feedback_candidato = data.ds_feedback_candidato
        candidatura.nr_avaliacao_candidato = data.nr_avaliacao_candidato
        candidatura.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(candidatura)

        return candidatura

    @staticmethod
    async def obter_estatisticas_vaga(
        db: AsyncSession,
        id_vaga: str,
        id_empresa: str
    ) -> EstatisticasCandidaturasResponse:
        """Obtém estatísticas de candidaturas de uma vaga"""

        # Verificar se vaga pertence à empresa
        vaga = await VagaService.buscar_por_id(db, id_vaga)
        if not vaga or str(vaga.id_empresa) != id_empresa:
            raise PermissionError("Você não tem permissão para ver estatísticas desta vaga")

        # Contar total
        query_total = select(func.count()).where(TbCandidaturas.id_vaga == uuid.UUID(id_vaga))
        total = await db.execute(query_total)
        total = total.scalar()

        # Contar por status
        query_status = select(
            TbCandidaturas.ds_status,
            func.count(TbCandidaturas.id_candidatura)
        ).where(
            TbCandidaturas.id_vaga == uuid.UUID(id_vaga)
        ).group_by(TbCandidaturas.ds_status)

        result_status = await db.execute(query_status)
        por_status = {row[0]: row[1] for row in result_status}

        # Match score médio
        query_match = select(func.avg(TbCandidaturas.nr_match_score)).where(
            TbCandidaturas.id_vaga == uuid.UUID(id_vaga)
        )
        match_medio = await db.execute(query_match)
        match_medio = match_medio.scalar()

        # Datas primeira e última candidatura
        query_datas = select(
            func.min(TbCandidaturas.dt_candidatura),
            func.max(TbCandidaturas.dt_candidatura)
        ).where(TbCandidaturas.id_vaga == uuid.UUID(id_vaga))

        datas = await db.execute(query_datas)
        dt_primeira, dt_ultima = datas.one()

        return EstatisticasCandidaturasResponse(
            id_vaga=id_vaga,
            nm_cargo=vaga.nm_cargo,
            total_candidatos=total,
            por_status=por_status,
            match_score_medio=match_medio,
            dt_primeira_candidatura=dt_primeira,
            dt_ultima_candidatura=dt_ultima
        )

    @staticmethod
    async def obter_dashboard_candidato(
        db: AsyncSession,
        id_candidato: str
    ) -> DashboardCandidatoResponse:
        """Obtém dashboard do candidato"""

        # Contar total
        query_total = select(func.count()).where(
            TbCandidaturas.id_candidato == uuid.UUID(id_candidato)
        )
        total = await db.execute(query_total)
        total = total.scalar()

        # Contar por status
        query_status = select(
            TbCandidaturas.ds_status,
            func.count(TbCandidaturas.id_candidatura)
        ).where(
            TbCandidaturas.id_candidato == uuid.UUID(id_candidato)
        ).group_by(TbCandidaturas.ds_status)

        result_status = await db.execute(query_status)
        por_status = {row[0]: row[1] for row in result_status}

        # Contadores específicos
        entrevistas = por_status.get("entrevista_agendada", 0)
        aprovacoes = por_status.get("aprovado", 0)
        taxa_sucesso = (aprovacoes / total * 100) if total > 0 else 0

        # Candidaturas recentes (últimas 5)
        query_recentes = select(TbCandidaturas).where(
            TbCandidaturas.id_candidato == uuid.UUID(id_candidato)
        ).order_by(TbCandidaturas.dt_candidatura.desc()).limit(5)

        result_recentes = await db.execute(query_recentes)
        recentes = result_recentes.scalars().all()

        return DashboardCandidatoResponse(
            id_candidato=id_candidato,
            total_candidaturas=total,
            por_status=por_status,
            entrevistas_agendadas=entrevistas,
            aprovacoes=aprovacoes,
            taxa_sucesso=round(taxa_sucesso, 2),
            candidaturas_recentes=[CandidaturaResponse.from_orm(c) for c in recentes]
        )

    @staticmethod
    async def obter_analytics_empresa(
        db: AsyncSession,
        id_empresa: str
    ) -> AnalyticsEmpresaResponse:
        """Obtém analytics completo da empresa"""
        from datetime import timedelta

        id_empresa_uuid = uuid.UUID(id_empresa)
        agora = datetime.utcnow()
        data_30_dias_atras = agora - timedelta(days=30)
        data_7_dias_atras = agora - timedelta(days=7)

        # ========== KPIs GERAIS ==========

        # Total vagas abertas e fechadas
        query_vagas_abertas = select(func.count()).where(
            and_(
                TbVagas.id_empresa == id_empresa_uuid,
                TbVagas.ds_status == "aberta"
            )
        )
        total_vagas_abertas = (await db.execute(query_vagas_abertas)).scalar()

        query_vagas_fechadas = select(func.count()).where(
            and_(
                TbVagas.id_empresa == id_empresa_uuid,
                TbVagas.ds_status.in_(["pausada", "fechada"])
            )
        )
        total_vagas_fechadas = (await db.execute(query_vagas_fechadas)).scalar()

        # Total candidatos (todas as vagas da empresa)
        query_total_candidatos = select(func.count(TbCandidaturas.id_candidatura)).join(
            TbVagas, TbCandidaturas.id_vaga == TbVagas.id_vaga
        ).where(TbVagas.id_empresa == id_empresa_uuid)
        total_candidatos = (await db.execute(query_total_candidatos)).scalar()

        # Total contratações (aprovados)
        query_contratacoes = select(func.count(TbCandidaturas.id_candidatura)).join(
            TbVagas, TbCandidaturas.id_vaga == TbVagas.id_vaga
        ).where(
            and_(
                TbVagas.id_empresa == id_empresa_uuid,
                TbCandidaturas.ds_status == "aprovado"
            )
        )
        total_contratacoes = (await db.execute(query_contratacoes)).scalar()

        # Taxa de conversão geral
        taxa_conversao_geral = (
            (total_contratacoes / total_candidatos * 100) if total_candidatos > 0 else None
        )

        # Tempo médio de contratação (dias entre candidatura e finalização para aprovados)
        query_tempo_medio = select(
            func.avg(
                func.extract('epoch', TbCandidaturas.dt_finalizacao - TbCandidaturas.dt_candidatura) / 86400
            )
        ).join(
            TbVagas, TbCandidaturas.id_vaga == TbVagas.id_vaga
        ).where(
            and_(
                TbVagas.id_empresa == id_empresa_uuid,
                TbCandidaturas.ds_status == "aprovado",
                TbCandidaturas.dt_finalizacao.isnot(None)
            )
        )
        tempo_medio_contratacao = (await db.execute(query_tempo_medio)).scalar()

        # ========== PERFORMANCE POR VAGA (Top 10) ==========

        # Buscar vagas com mais candidatos
        query_top_vagas = select(
            TbVagas.id_vaga,
            TbVagas.nm_cargo,
            TbVagas.ds_status,
            TbVagas.dt_criacao,
            func.count(TbCandidaturas.id_candidatura).label("total_candidatos")
        ).join(
            TbCandidaturas, TbVagas.id_vaga == TbCandidaturas.id_vaga, isouter=True
        ).where(
            TbVagas.id_empresa == id_empresa_uuid
        ).group_by(
            TbVagas.id_vaga, TbVagas.nm_cargo, TbVagas.ds_status, TbVagas.dt_criacao
        ).order_by(
            func.count(TbCandidaturas.id_candidatura).desc()
        ).limit(10)

        result_top_vagas = await db.execute(query_top_vagas)
        top_vagas_rows = result_top_vagas.all()

        vagas_analytics = []
        for row in top_vagas_rows:
            id_vaga = row[0]
            nm_cargo = row[1]
            ds_status = row[2]
            dt_criacao = row[3]
            total_candidatos_vaga = row[4]

            # Candidatos novos (7 dias)
            query_novos_7d = select(func.count()).where(
                and_(
                    TbCandidaturas.id_vaga == id_vaga,
                    TbCandidaturas.dt_candidatura >= data_7_dias_atras
                )
            )
            novos_7d = (await db.execute(query_novos_7d)).scalar()

            # Candidatos novos (30 dias)
            query_novos_30d = select(func.count()).where(
                and_(
                    TbCandidaturas.id_vaga == id_vaga,
                    TbCandidaturas.dt_candidatura >= data_30_dias_atras
                )
            )
            novos_30d = (await db.execute(query_novos_30d)).scalar()

            # Por status
            query_status = select(
                TbCandidaturas.ds_status,
                func.count(TbCandidaturas.id_candidatura)
            ).where(
                TbCandidaturas.id_vaga == id_vaga
            ).group_by(TbCandidaturas.ds_status)
            result_status = await db.execute(query_status)
            por_status = {row[0]: row[1] for row in result_status}

            # Match score médio
            query_match = select(func.avg(TbCandidaturas.nr_match_score)).where(
                and_(
                    TbCandidaturas.id_vaga == id_vaga,
                    TbCandidaturas.nr_match_score.isnot(None)
                )
            )
            match_medio = (await db.execute(query_match)).scalar()

            # Datas primeira e última candidatura
            query_datas = select(
                func.min(TbCandidaturas.dt_candidatura),
                func.max(TbCandidaturas.dt_candidatura)
            ).where(TbCandidaturas.id_vaga == id_vaga)
            result_datas = await db.execute(query_datas)
            dt_primeira, dt_ultima = result_datas.one()

            # Taxa de conversão da vaga
            aprovados_vaga = por_status.get("aprovado", 0)
            taxa_conversao_vaga = (
                (aprovados_vaga / total_candidatos_vaga * 100) if total_candidatos_vaga > 0 else None
            )

            # Tempo médio de processo (aprovados + reprovados)
            query_tempo_vaga = select(
                func.avg(
                    func.extract('epoch', TbCandidaturas.dt_finalizacao - TbCandidaturas.dt_candidatura) / 86400
                )
            ).where(
                and_(
                    TbCandidaturas.id_vaga == id_vaga,
                    TbCandidaturas.ds_status.in_(["aprovado", "reprovado"]),
                    TbCandidaturas.dt_finalizacao.isnot(None)
                )
            )
            tempo_medio_vaga = (await db.execute(query_tempo_vaga)).scalar()

            vagas_analytics.append(
                VagaAnalytics(
                    id_vaga=str(id_vaga),
                    nm_cargo=nm_cargo,
                    ds_status=ds_status,
                    total_candidatos=total_candidatos_vaga,
                    candidatos_novos_ultimos_7dias=novos_7d,
                    candidatos_novos_ultimos_30dias=novos_30d,
                    por_status=por_status,
                    match_score_medio=round(match_medio, 2) if match_medio else None,
                    dt_primeira_candidatura=dt_primeira,
                    dt_ultima_candidatura=dt_ultima,
                    taxa_conversao=round(taxa_conversao_vaga, 2) if taxa_conversao_vaga else None,
                    tempo_medio_processo_dias=round(tempo_medio_vaga, 2) if tempo_medio_vaga else None,
                    dt_criacao_vaga=dt_criacao
                )
            )

        # ========== TENDÊNCIAS (últimos 30 dias) ==========

        # Tendência de candidaturas (por dia)
        query_tendencia_candidaturas = select(
            func.date(TbCandidaturas.dt_candidatura).label("data"),
            func.count(TbCandidaturas.id_candidatura).label("count")
        ).join(
            TbVagas, TbCandidaturas.id_vaga == TbVagas.id_vaga
        ).where(
            and_(
                TbVagas.id_empresa == id_empresa_uuid,
                TbCandidaturas.dt_candidatura >= data_30_dias_atras
            )
        ).group_by(
            func.date(TbCandidaturas.dt_candidatura)
        ).order_by(
            func.date(TbCandidaturas.dt_candidatura)
        )
        result_tendencia_cand = await db.execute(query_tendencia_candidaturas)
        tendencia_candidaturas = {
            row[0].strftime("%Y-%m-%d"): row[1] for row in result_tendencia_cand
        }

        # Tendência de contratações (aprovados por dia)
        query_tendencia_contratacoes = select(
            func.date(TbCandidaturas.dt_finalizacao).label("data"),
            func.count(TbCandidaturas.id_candidatura).label("count")
        ).join(
            TbVagas, TbCandidaturas.id_vaga == TbVagas.id_vaga
        ).where(
            and_(
                TbVagas.id_empresa == id_empresa_uuid,
                TbCandidaturas.ds_status == "aprovado",
                TbCandidaturas.dt_finalizacao >= data_30_dias_atras
            )
        ).group_by(
            func.date(TbCandidaturas.dt_finalizacao)
        ).order_by(
            func.date(TbCandidaturas.dt_finalizacao)
        )
        result_tendencia_cont = await db.execute(query_tendencia_contratacoes)
        tendencia_contratacoes = {
            row[0].strftime("%Y-%m-%d"): row[1] for row in result_tendencia_cont
        }

        # ========== FUNIL DE CONVERSÃO (agregado) ==========

        query_funil = select(
            TbCandidaturas.ds_status,
            func.count(TbCandidaturas.id_candidatura)
        ).join(
            TbVagas, TbCandidaturas.id_vaga == TbVagas.id_vaga
        ).where(
            TbVagas.id_empresa == id_empresa_uuid
        ).group_by(
            TbCandidaturas.ds_status
        )
        result_funil = await db.execute(query_funil)
        funil_conversao = {row[0]: row[1] for row in result_funil}

        # ========== MATCH SCORES ==========

        # Match score médio geral
        query_match_geral = select(
            func.avg(TbCandidaturas.nr_match_score)
        ).join(
            TbVagas, TbCandidaturas.id_vaga == TbVagas.id_vaga
        ).where(
            and_(
                TbVagas.id_empresa == id_empresa_uuid,
                TbCandidaturas.nr_match_score.isnot(None)
            )
        )
        match_score_medio_geral = (await db.execute(query_match_geral)).scalar()

        # Distribuição de match scores (faixas)
        query_distribuicao = select(
            TbCandidaturas.nr_match_score
        ).join(
            TbVagas, TbCandidaturas.id_vaga == TbVagas.id_vaga
        ).where(
            and_(
                TbVagas.id_empresa == id_empresa_uuid,
                TbCandidaturas.nr_match_score.isnot(None)
            )
        )
        result_scores = await db.execute(query_distribuicao)
        scores = [row[0] for row in result_scores]

        distribuicao = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
        for score in scores:
            if score <= 20:
                distribuicao["0-20"] += 1
            elif score <= 40:
                distribuicao["21-40"] += 1
            elif score <= 60:
                distribuicao["41-60"] += 1
            elif score <= 80:
                distribuicao["61-80"] += 1
            else:
                distribuicao["81-100"] += 1

        # ========== RETORNAR ANALYTICS ==========

        return AnalyticsEmpresaResponse(
            id_empresa=id_empresa,
            total_vagas_abertas=total_vagas_abertas,
            total_vagas_fechadas=total_vagas_fechadas,
            total_candidatos=total_candidatos,
            total_contratacoes=total_contratacoes,
            taxa_conversao_geral=round(taxa_conversao_geral, 2) if taxa_conversao_geral else None,
            tempo_medio_contratacao_dias=round(tempo_medio_contratacao, 2) if tempo_medio_contratacao else None,
            vagas_com_mais_candidatos=vagas_analytics,
            tendencia_candidaturas_30dias=tendencia_candidaturas,
            tendencia_contratacoes_30dias=tendencia_contratacoes,
            funil_conversao=funil_conversao,
            match_score_medio_geral=round(match_score_medio_geral, 2) if match_score_medio_geral else None,
            distribuicao_match_scores=distribuicao
        )
