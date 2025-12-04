# src/central_atendimento/services/metricas_service.py
"""
Serviço para métricas e analytics da Central de Atendimento.

Fornece métricas históricas, agregações e dados para dashboard.
"""

import uuid
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum

from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, text, extract
from sqlalchemy.sql import label

from src.config.logger_config import get_logger
from src.central_atendimento.models.conversa_omni import ConversaOmni, MensagemOmni
from src.central_atendimento.models.campanha import Campanha, CampanhaStatus
from src.central_atendimento.models.fila_atendimento import FilaAtendimento, AtendimentoItem
from src.central_atendimento.models.canal import CanalTipo

logger = get_logger(__name__)


class PeriodoMetricas(str, Enum):
    """Períodos disponíveis para métricas."""
    HOJE = "hoje"
    ONTEM = "ontem"
    ULTIMAS_24H = "24h"
    ULTIMOS_7D = "7d"
    ULTIMOS_30D = "30d"
    ULTIMOS_90D = "90d"
    MES_ATUAL = "mes_atual"
    MES_ANTERIOR = "mes_anterior"


# ============================================================================
# Schemas de Resposta
# ============================================================================

class MetricasDashboard(BaseModel):
    """Métricas principais do dashboard."""
    model_config = ConfigDict(from_attributes=True)

    # Conversas
    conversas_total: int = 0
    conversas_abertas: int = 0
    conversas_fechadas: int = 0
    conversas_aguardando_humano: int = 0
    conversas_com_bot: int = 0

    # Período
    conversas_periodo: int = 0
    conversas_periodo_anterior: int = 0
    variacao_conversas: float = 0.0

    # Tempos
    tempo_medio_resposta_segundos: int = 0
    tempo_medio_atendimento_segundos: int = 0
    tempo_medio_espera_segundos: int = 0

    # Satisfação
    satisfacao_media: float = 0.0
    total_avaliacoes: int = 0

    # Taxa de resolução
    taxa_resolucao: float = 0.0

    # Atendentes
    atendentes_online: int = 0
    atendimentos_por_atendente: float = 0.0


class ConversasPorDia(BaseModel):
    """Conversas agregadas por dia."""
    model_config = ConfigDict(from_attributes=True)

    data: date
    total: int = 0
    abertas: int = 0
    fechadas: int = 0
    tempo_medio_resposta: int = 0


class ConversasPorCanal(BaseModel):
    """Conversas agregadas por canal."""
    model_config = ConfigDict(from_attributes=True)

    canal: str
    total: int = 0
    percentual: float = 0.0


class ConversasPorHora(BaseModel):
    """Conversas agregadas por hora do dia."""
    model_config = ConfigDict(from_attributes=True)

    hora: int
    total: int = 0


class MetricasAtendente(BaseModel):
    """Métricas por atendente."""
    model_config = ConfigDict(from_attributes=True)

    id_atendente: uuid.UUID
    nm_atendente: str
    conversas_atendidas: int = 0
    tempo_medio_resposta: int = 0
    satisfacao_media: float = 0.0
    conversas_abertas: int = 0


class MetricasFila(BaseModel):
    """Métricas por fila."""
    model_config = ConfigDict(from_attributes=True)

    id_fila: uuid.UUID
    nm_fila: str
    total_atendimentos: int = 0
    em_espera: int = 0
    em_atendimento: int = 0
    tempo_medio_espera: int = 0


class RelatorioCompleto(BaseModel):
    """Relatório completo para exportação."""
    model_config = ConfigDict(from_attributes=True)

    periodo_inicio: datetime
    periodo_fim: datetime
    dashboard: MetricasDashboard
    conversas_por_dia: List[ConversasPorDia]
    conversas_por_canal: List[ConversasPorCanal]
    conversas_por_hora: List[ConversasPorHora]
    metricas_filas: List[MetricasFila]
    metricas_atendentes: List[MetricasAtendente]


class MetricasService:
    """Serviço para métricas da Central de Atendimento."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    def _get_date_range(self, periodo: PeriodoMetricas) -> Tuple[datetime, datetime]:
        """Retorna intervalo de datas baseado no período."""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        if periodo == PeriodoMetricas.HOJE:
            return today_start, now
        elif periodo == PeriodoMetricas.ONTEM:
            yesterday = today_start - timedelta(days=1)
            return yesterday, today_start
        elif periodo == PeriodoMetricas.ULTIMAS_24H:
            return now - timedelta(hours=24), now
        elif periodo == PeriodoMetricas.ULTIMOS_7D:
            return now - timedelta(days=7), now
        elif periodo == PeriodoMetricas.ULTIMOS_30D:
            return now - timedelta(days=30), now
        elif periodo == PeriodoMetricas.ULTIMOS_90D:
            return now - timedelta(days=90), now
        elif periodo == PeriodoMetricas.MES_ATUAL:
            month_start = today_start.replace(day=1)
            return month_start, now
        elif periodo == PeriodoMetricas.MES_ANTERIOR:
            month_start = today_start.replace(day=1)
            prev_month_end = month_start - timedelta(days=1)
            prev_month_start = prev_month_end.replace(day=1)
            return prev_month_start, month_start
        else:
            return now - timedelta(days=7), now

    async def obter_metricas_dashboard(
        self,
        periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_7D,
    ) -> MetricasDashboard:
        """
        Obtém métricas principais para o dashboard.

        Args:
            periodo: Período para calcular métricas

        Returns:
            MetricasDashboard com todas as métricas
        """
        dt_inicio, dt_fim = self._get_date_range(periodo)

        # Calcular período anterior para comparação
        delta = dt_fim - dt_inicio
        dt_inicio_anterior = dt_inicio - delta
        dt_fim_anterior = dt_inicio

        # Query principal para conversas
        stmt_total = select(func.count()).select_from(ConversaOmni).where(
            ConversaOmni.id_empresa == self.id_empresa
        )
        result = await self.db.execute(stmt_total)
        total = result.scalar() or 0

        # Conversas abertas
        stmt_abertas = select(func.count()).select_from(ConversaOmni).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.st_aberta == True
        )
        result = await self.db.execute(stmt_abertas)
        abertas = result.scalar() or 0

        # Conversas aguardando humano
        stmt_aguardando = select(func.count()).select_from(ConversaOmni).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.st_aguardando_humano == True,
            ConversaOmni.st_aberta == True
        )
        result = await self.db.execute(stmt_aguardando)
        aguardando = result.scalar() or 0

        # Conversas com bot ativo
        stmt_bot = select(func.count()).select_from(ConversaOmni).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.st_bot_ativo == True,
            ConversaOmni.st_aberta == True
        )
        result = await self.db.execute(stmt_bot)
        com_bot = result.scalar() or 0

        # Conversas no período
        stmt_periodo = select(func.count()).select_from(ConversaOmni).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.dt_criacao >= dt_inicio,
            ConversaOmni.dt_criacao <= dt_fim
        )
        result = await self.db.execute(stmt_periodo)
        conversas_periodo = result.scalar() or 0

        # Conversas período anterior
        stmt_anterior = select(func.count()).select_from(ConversaOmni).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.dt_criacao >= dt_inicio_anterior,
            ConversaOmni.dt_criacao < dt_fim_anterior
        )
        result = await self.db.execute(stmt_anterior)
        conversas_anterior = result.scalar() or 0

        # Calcular variação
        variacao = 0.0
        if conversas_anterior > 0:
            variacao = ((conversas_periodo - conversas_anterior) / conversas_anterior) * 100

        # Tempo médio de resposta (baseado em nr_tempo_resposta_medio das conversas)
        stmt_tempo = select(func.avg(ConversaOmni.nr_tempo_resposta_medio)).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.nr_tempo_resposta_medio > 0,
            ConversaOmni.dt_criacao >= dt_inicio
        )
        result = await self.db.execute(stmt_tempo)
        tempo_medio = result.scalar() or 0

        # Satisfação média
        stmt_satisfacao = select(
            func.avg(ConversaOmni.nr_avaliacao),
            func.count(ConversaOmni.nr_avaliacao)
        ).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.nr_avaliacao.isnot(None),
            ConversaOmni.dt_criacao >= dt_inicio
        )
        result = await self.db.execute(stmt_satisfacao)
        row = result.one()
        satisfacao = row[0] or 0.0
        total_avaliacoes = row[1] or 0

        # Taxa de resolução
        fechadas = total - abertas
        taxa_resolucao = (fechadas / total * 100) if total > 0 else 0.0

        return MetricasDashboard(
            conversas_total=total,
            conversas_abertas=abertas,
            conversas_fechadas=fechadas,
            conversas_aguardando_humano=aguardando,
            conversas_com_bot=com_bot,
            conversas_periodo=conversas_periodo,
            conversas_periodo_anterior=conversas_anterior,
            variacao_conversas=round(variacao, 1),
            tempo_medio_resposta_segundos=int(tempo_medio),
            satisfacao_media=round(satisfacao, 2),
            total_avaliacoes=total_avaliacoes,
            taxa_resolucao=round(taxa_resolucao, 1),
        )

    async def obter_conversas_por_dia(
        self,
        periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    ) -> List[ConversasPorDia]:
        """
        Obtém conversas agregadas por dia.

        Returns:
            Lista de ConversasPorDia
        """
        dt_inicio, dt_fim = self._get_date_range(periodo)

        stmt = select(
            func.date(ConversaOmni.dt_criacao).label("data"),
            func.count().label("total"),
            func.sum(case((ConversaOmni.st_aberta == True, 1), else_=0)).label("abertas"),
            func.sum(case((ConversaOmni.st_aberta == False, 1), else_=0)).label("fechadas"),
            func.avg(ConversaOmni.nr_tempo_resposta_medio).label("tempo_medio"),
        ).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.dt_criacao >= dt_inicio,
            ConversaOmni.dt_criacao <= dt_fim
        ).group_by(
            func.date(ConversaOmni.dt_criacao)
        ).order_by(
            func.date(ConversaOmni.dt_criacao)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            ConversasPorDia(
                data=row.data,
                total=row.total,
                abertas=row.abertas or 0,
                fechadas=row.fechadas or 0,
                tempo_medio_resposta=int(row.tempo_medio or 0),
            )
            for row in rows
        ]

    async def obter_conversas_por_canal(
        self,
        periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    ) -> List[ConversasPorCanal]:
        """
        Obtém distribuição de conversas por canal.

        Returns:
            Lista de ConversasPorCanal
        """
        dt_inicio, dt_fim = self._get_date_range(periodo)

        stmt = select(
            ConversaOmni.tp_canal,
            func.count().label("total"),
        ).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.dt_criacao >= dt_inicio,
            ConversaOmni.dt_criacao <= dt_fim
        ).group_by(
            ConversaOmni.tp_canal
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        total_geral = sum(row.total for row in rows)

        return [
            ConversasPorCanal(
                canal=row.tp_canal.value if row.tp_canal else "desconhecido",
                total=row.total,
                percentual=round((row.total / total_geral * 100) if total_geral > 0 else 0, 1),
            )
            for row in rows
        ]

    async def obter_conversas_por_hora(
        self,
        periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_7D,
    ) -> List[ConversasPorHora]:
        """
        Obtém distribuição de conversas por hora do dia.

        Returns:
            Lista de ConversasPorHora (0-23)
        """
        dt_inicio, dt_fim = self._get_date_range(periodo)

        stmt = select(
            extract("hour", ConversaOmni.dt_criacao).label("hora"),
            func.count().label("total"),
        ).where(
            ConversaOmni.id_empresa == self.id_empresa,
            ConversaOmni.dt_criacao >= dt_inicio,
            ConversaOmni.dt_criacao <= dt_fim
        ).group_by(
            extract("hour", ConversaOmni.dt_criacao)
        ).order_by(
            extract("hour", ConversaOmni.dt_criacao)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        # Preencher horas faltantes com 0
        horas_dict = {int(row.hora): row.total for row in rows}
        return [
            ConversasPorHora(hora=h, total=horas_dict.get(h, 0))
            for h in range(24)
        ]

    async def obter_metricas_filas(self) -> List[MetricasFila]:
        """
        Obtém métricas por fila de atendimento.

        Returns:
            Lista de MetricasFila
        """
        # Buscar filas
        stmt_filas = select(FilaAtendimento).where(
            FilaAtendimento.id_empresa == self.id_empresa,
            FilaAtendimento.st_ativa == True
        )
        result = await self.db.execute(stmt_filas)
        filas = result.scalars().all()

        metricas = []
        for fila in filas:
            # Contar atendimentos por status
            stmt_espera = select(func.count()).select_from(AtendimentoItem).where(
                AtendimentoItem.id_fila == fila.id_fila,
                AtendimentoItem.st_atendimento == "aguardando"
            )
            result = await self.db.execute(stmt_espera)
            em_espera = result.scalar() or 0

            stmt_atendimento = select(func.count()).select_from(AtendimentoItem).where(
                AtendimentoItem.id_fila == fila.id_fila,
                AtendimentoItem.st_atendimento == "em_atendimento"
            )
            result = await self.db.execute(stmt_atendimento)
            em_atendimento = result.scalar() or 0

            metricas.append(MetricasFila(
                id_fila=fila.id_fila,
                nm_fila=fila.nm_fila,
                total_atendimentos=em_espera + em_atendimento,
                em_espera=em_espera,
                em_atendimento=em_atendimento,
                tempo_medio_espera=0,  # TODO: calcular
            ))

        return metricas

    async def gerar_relatorio_completo(
        self,
        periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    ) -> RelatorioCompleto:
        """
        Gera relatório completo para exportação.

        Returns:
            RelatorioCompleto com todos os dados
        """
        dt_inicio, dt_fim = self._get_date_range(periodo)

        dashboard = await self.obter_metricas_dashboard(periodo)
        por_dia = await self.obter_conversas_por_dia(periodo)
        por_canal = await self.obter_conversas_por_canal(periodo)
        por_hora = await self.obter_conversas_por_hora(periodo)
        filas = await self.obter_metricas_filas()

        return RelatorioCompleto(
            periodo_inicio=dt_inicio,
            periodo_fim=dt_fim,
            dashboard=dashboard,
            conversas_por_dia=por_dia,
            conversas_por_canal=por_canal,
            conversas_por_hora=por_hora,
            metricas_filas=filas,
            metricas_atendentes=[],  # TODO: implementar métricas por atendente
        )

    async def exportar_csv(
        self,
        periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    ) -> str:
        """
        Exporta relatório em formato CSV.

        Returns:
            String com conteúdo CSV
        """
        import csv
        import io

        relatorio = await self.gerar_relatorio_completo(periodo)

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(["Relatório Central de Atendimento"])
        writer.writerow([f"Período: {relatorio.periodo_inicio} a {relatorio.periodo_fim}"])
        writer.writerow([])

        # Métricas principais
        writer.writerow(["MÉTRICAS PRINCIPAIS"])
        writer.writerow(["Métrica", "Valor"])
        writer.writerow(["Total de Conversas", relatorio.dashboard.conversas_total])
        writer.writerow(["Conversas Abertas", relatorio.dashboard.conversas_abertas])
        writer.writerow(["Conversas Fechadas", relatorio.dashboard.conversas_fechadas])
        writer.writerow(["Taxa de Resolução (%)", relatorio.dashboard.taxa_resolucao])
        writer.writerow(["Satisfação Média", relatorio.dashboard.satisfacao_media])
        writer.writerow(["Tempo Médio Resposta (s)", relatorio.dashboard.tempo_medio_resposta_segundos])
        writer.writerow([])

        # Conversas por dia
        writer.writerow(["CONVERSAS POR DIA"])
        writer.writerow(["Data", "Total", "Abertas", "Fechadas"])
        for dia in relatorio.conversas_por_dia:
            writer.writerow([dia.data, dia.total, dia.abertas, dia.fechadas])
        writer.writerow([])

        # Conversas por canal
        writer.writerow(["CONVERSAS POR CANAL"])
        writer.writerow(["Canal", "Total", "Percentual (%)"])
        for canal in relatorio.conversas_por_canal:
            writer.writerow([canal.canal, canal.total, canal.percentual])
        writer.writerow([])

        # Conversas por hora
        writer.writerow(["CONVERSAS POR HORA"])
        writer.writerow(["Hora", "Total"])
        for hora in relatorio.conversas_por_hora:
            writer.writerow([f"{hora.hora:02d}:00", hora.total])

        return output.getvalue()

    async def exportar_pdf_data(
        self,
        periodo: PeriodoMetricas = PeriodoMetricas.ULTIMOS_30D,
    ) -> Dict[str, Any]:
        """
        Retorna dados estruturados para geração de PDF no frontend.

        Returns:
            Dicionário com dados formatados para PDF
        """
        relatorio = await self.gerar_relatorio_completo(periodo)

        return {
            "titulo": "Relatório Central de Atendimento",
            "periodo": {
                "inicio": relatorio.periodo_inicio.isoformat(),
                "fim": relatorio.periodo_fim.isoformat(),
            },
            "metricas_principais": {
                "total_conversas": relatorio.dashboard.conversas_total,
                "conversas_abertas": relatorio.dashboard.conversas_abertas,
                "conversas_fechadas": relatorio.dashboard.conversas_fechadas,
                "taxa_resolucao": f"{relatorio.dashboard.taxa_resolucao}%",
                "satisfacao_media": relatorio.dashboard.satisfacao_media,
                "tempo_medio_resposta": f"{relatorio.dashboard.tempo_medio_resposta_segundos}s",
            },
            "graficos": {
                "conversas_por_dia": [
                    {"data": str(d.data), "total": d.total}
                    for d in relatorio.conversas_por_dia
                ],
                "conversas_por_canal": [
                    {"canal": c.canal, "total": c.total, "percentual": c.percentual}
                    for c in relatorio.conversas_por_canal
                ],
                "conversas_por_hora": [
                    {"hora": h.hora, "total": h.total}
                    for h in relatorio.conversas_por_hora
                ],
            },
            "filas": [
                {
                    "nome": f.nm_fila,
                    "em_espera": f.em_espera,
                    "em_atendimento": f.em_atendimento,
                }
                for f in relatorio.metricas_filas
            ],
        }
