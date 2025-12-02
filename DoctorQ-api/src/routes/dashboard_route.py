"""
Rotas para Dashboard de Métricas de Clínicas Estéticas
"""

from datetime import date, datetime, timedelta
from typing import Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# ============================================
# Models
# ============================================

class AgendamentosMetrics(BaseModel):
    """Métricas de agendamentos"""
    total_agendamentos: int
    agendamentos_confirmados: int
    agendamentos_pendentes: int
    agendamentos_cancelados: int
    agendamentos_concluidos: int
    taxa_confirmacao: float  # %
    taxa_cancelamento: float  # %
    taxa_conclusao: float  # %
    agendamentos_hoje: int
    agendamentos_semana: int
    agendamentos_mes: int

class ProfissionaisMetrics(BaseModel):
    """Métricas de profissionais"""
    total_profissionais: int
    profissionais_ativos: int
    profissionais_inativos: int
    total_especialidades: int
    media_anos_experiencia: float
    profissionais_com_foto: int
    taxa_profissionais_ativos: float  # %

class PacientesMetrics(BaseModel):
    """Métricas de pacientes"""
    total_pacientes: int
    pacientes_ativos: int  # Com agendamento nos últimos 90 dias
    pacientes_novos_mes: int
    pacientes_recorrentes: int  # Com mais de 1 agendamento
    taxa_recorrencia: float  # %
    pacientes_por_genero: dict

class ProcedimentosMetrics(BaseModel):
    """Métricas de procedimentos"""
    total_procedimentos: int
    procedimentos_ativos: int
    procedimentos_por_categoria: dict
    procedimento_mais_agendado: Optional[str]
    total_agendamentos_procedimentos: int
    duracao_media_minutos: float
    preco_medio: float

class ReceitaMetrics(BaseModel):
    """Métricas de receita"""
    receita_total: float
    receita_mes_atual: float
    receita_mes_anterior: float
    variacao_mensal: float  # %
    ticket_medio: float
    receita_por_profissional: float
    receita_por_procedimento: float
    top_procedimentos_receita: list

class DashboardSummary(BaseModel):
    """Resumo completo do dashboard"""
    agendamentos: AgendamentosMetrics
    profissionais: ProfissionaisMetrics
    pacientes: PacientesMetrics
    procedimentos: ProcedimentosMetrics
    receita: ReceitaMetrics
    periodo: dict

# ============================================
# Endpoints
# ============================================

@router.get("/", response_model=DashboardSummary)
async def get_dashboard_summary(
    start_date: Optional[date] = Query(None, description="Data inicial (padrão: 30 dias atrás)"),
    end_date: Optional[date] = Query(None, description="Data final (padrão: hoje)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna resumo completo do dashboard com todas as métricas de negócio

    **Métricas incluídas:**
    - Agendamentos (total, por status, taxas de confirmação/cancelamento)
    - Profissionais (total, ativos, especialidades)
    - Pacientes (total, ativos, novos, recorrentes)
    - Procedimentos (total, por categoria, mais agendados)
    - Receita (total, mensal, variação, ticket médio)

    **Filtros de data:**
    - Se não especificado, usa últimos 30 dias
    - Todas as métricas são calculadas para o período especificado
    """
    try:
        # Validar empresa do usuário
        if not current_user.id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada"
            )

        # Datas padrão: últimos 30 dias
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        id_empresa = str(current_user.id_empresa)

        # ===================
        # MÉTRICAS DE AGENDAMENTOS
        # ===================
        query_agendamentos = text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN ds_status = 'confirmado' THEN 1 ELSE 0 END) as confirmados,
                SUM(CASE WHEN ds_status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
                SUM(CASE WHEN ds_status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
                SUM(CASE WHEN ds_status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
                SUM(CASE WHEN DATE(dt_agendamento) = CURRENT_DATE THEN 1 ELSE 0 END) as hoje,
                SUM(CASE WHEN dt_agendamento >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as semana,
                SUM(CASE WHEN dt_agendamento >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as mes
            FROM tb_agendamentos a
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE c.id_empresa = :id_empresa
              AND a.dt_agendamento BETWEEN :start_date AND :end_date
        """)

        result = await db.execute(query_agendamentos, {
            "id_empresa": id_empresa,
            "start_date": start_date,
            "end_date": end_date
        })
        row_agend = result.fetchone()

        total_agend = row_agend[0] or 0
        confirmados = row_agend[1] or 0
        pendentes = row_agend[2] or 0
        cancelados = row_agend[3] or 0
        concluidos = row_agend[4] or 0

        taxa_confirmacao = (confirmados / total_agend * 100) if total_agend > 0 else 0
        taxa_cancelamento = (cancelados / total_agend * 100) if total_agend > 0 else 0
        taxa_conclusao = (concluidos / total_agend * 100) if total_agend > 0 else 0

        agendamentos_metrics = AgendamentosMetrics(
            total_agendamentos=total_agend,
            agendamentos_confirmados=confirmados,
            agendamentos_pendentes=pendentes,
            agendamentos_cancelados=cancelados,
            agendamentos_concluidos=concluidos,
            taxa_confirmacao=round(taxa_confirmacao, 2),
            taxa_cancelamento=round(taxa_cancelamento, 2),
            taxa_conclusao=round(taxa_conclusao, 2),
            agendamentos_hoje=row_agend[5] or 0,
            agendamentos_semana=row_agend[6] or 0,
            agendamentos_mes=row_agend[7] or 0,
        )

        # ===================
        # MÉTRICAS DE PROFISSIONAIS
        # ===================
        query_profissionais = text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN p.st_ativo = TRUE THEN 1 ELSE 0 END) as ativos,
                SUM(CASE WHEN p.st_ativo = FALSE THEN 1 ELSE 0 END) as inativos,
                COUNT(DISTINCT p.ds_especialidades) as especialidades,
                AVG(p.nr_anos_experiencia) as media_experiencia,
                SUM(CASE WHEN p.ds_foto_perfil IS NOT NULL THEN 1 ELSE 0 END) as com_foto
            FROM tb_profissionais p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE c.id_empresa = :id_empresa
        """)

        result = await db.execute(query_profissionais, {"id_empresa": id_empresa})
        row_prof = result.fetchone()

        total_prof = row_prof[0] or 0
        ativos_prof = row_prof[1] or 0

        profissionais_metrics = ProfissionaisMetrics(
            total_profissionais=total_prof,
            profissionais_ativos=ativos_prof,
            profissionais_inativos=row_prof[2] or 0,
            total_especialidades=row_prof[3] or 0,
            media_anos_experiencia=round(float(row_prof[4] or 0), 1),
            profissionais_com_foto=row_prof[5] or 0,
            taxa_profissionais_ativos=round((ativos_prof / total_prof * 100) if total_prof > 0 else 0, 2),
        )

        # ===================
        # MÉTRICAS DE PACIENTES
        # ===================
        query_pacientes = text("""
            SELECT
                COUNT(DISTINCT p.id_paciente) as total,
                SUM(CASE WHEN EXISTS(
                    SELECT 1 FROM tb_agendamentos a
                    WHERE a.id_paciente = p.id_paciente
                      AND a.dt_agendamento >= CURRENT_DATE - INTERVAL '90 days'
                ) THEN 1 ELSE 0 END) as ativos,
                SUM(CASE WHEN p.dt_criacao >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as novos_mes,
                SUM(CASE WHEN (
                    SELECT COUNT(*) FROM tb_agendamentos a
                    WHERE a.id_paciente = p.id_paciente
                ) > 1 THEN 1 ELSE 0 END) as recorrentes,
                SUM(CASE WHEN p.ds_genero = 'M' THEN 1 ELSE 0 END) as masculino,
                SUM(CASE WHEN p.ds_genero = 'F' THEN 1 ELSE 0 END) as feminino,
                SUM(CASE WHEN p.ds_genero NOT IN ('M', 'F') OR p.ds_genero IS NULL THEN 1 ELSE 0 END) as outros
            FROM tb_pacientes p
            INNER JOIN tb_users u ON p.id_user = u.id_user
            WHERE u.id_empresa = :id_empresa
        """)

        result = await db.execute(query_pacientes, {"id_empresa": id_empresa})
        row_pac = result.fetchone()

        total_pac = row_pac[0] or 0
        recorrentes = row_pac[3] or 0

        pacientes_metrics = PacientesMetrics(
            total_pacientes=total_pac,
            pacientes_ativos=row_pac[1] or 0,
            pacientes_novos_mes=row_pac[2] or 0,
            pacientes_recorrentes=recorrentes,
            taxa_recorrencia=round((recorrentes / total_pac * 100) if total_pac > 0 else 0, 2),
            pacientes_por_genero={
                "masculino": row_pac[4] or 0,
                "feminino": row_pac[5] or 0,
                "outros": row_pac[6] or 0,
            }
        )

        # ===================
        # MÉTRICAS DE PROCEDIMENTOS
        # ===================
        query_procedimentos = text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN p.st_ativo = TRUE THEN 1 ELSE 0 END) as ativos,
                AVG(nr_duracao_minutos) as duracao_media,
                AVG(vl_preco) as preco_medio
            FROM tb_procedimentos p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE c.id_empresa = :id_empresa
        """)

        result = await db.execute(query_procedimentos, {"id_empresa": id_empresa})
        row_proc = result.fetchone()

        # Procedimentos por categoria
        query_categorias = text("""
            SELECT ds_categoria, COUNT(*) as total
            FROM tb_procedimentos p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE c.id_empresa = :id_empresa
              AND p.st_ativo = TRUE
            GROUP BY ds_categoria
            ORDER BY total DESC
        """)
        result = await db.execute(query_categorias, {"id_empresa": id_empresa})
        categorias = {row[0]: row[1] for row in result.fetchall()}

        # Procedimento mais agendado
        query_mais_agendado = text("""
            SELECT p.nm_procedimento, COUNT(*) as total
            FROM tb_agendamentos a
            INNER JOIN tb_procedimentos p ON a.id_procedimento = p.id_procedimento
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE c.id_empresa = :id_empresa
              AND a.dt_agendamento BETWEEN :start_date AND :end_date
            GROUP BY p.nm_procedimento
            ORDER BY total DESC
            LIMIT 1
        """)
        result = await db.execute(query_mais_agendado, {
            "id_empresa": id_empresa,
            "start_date": start_date,
            "end_date": end_date
        })
        mais_agendado_row = result.fetchone()
        mais_agendado = mais_agendado_row[0] if mais_agendado_row else None
        total_agend_proc = mais_agendado_row[1] if mais_agendado_row else 0

        procedimentos_metrics = ProcedimentosMetrics(
            total_procedimentos=row_proc[0] or 0,
            procedimentos_ativos=row_proc[1] or 0,
            procedimentos_por_categoria=categorias,
            procedimento_mais_agendado=mais_agendado,
            total_agendamentos_procedimentos=total_agend_proc,
            duracao_media_minutos=round(float(row_proc[2] or 0), 1),
            preco_medio=round(float(row_proc[3] or 0), 2),
        )

        # ===================
        # MÉTRICAS DE RECEITA
        # ===================
        query_receita = text("""
            SELECT
                SUM(vl_total) as receita_total,
                SUM(CASE WHEN EXTRACT(MONTH FROM dt_agendamento) = EXTRACT(MONTH FROM CURRENT_DATE)
                         AND EXTRACT(YEAR FROM dt_agendamento) = EXTRACT(YEAR FROM CURRENT_DATE)
                    THEN vl_total ELSE 0 END) as receita_mes_atual,
                SUM(CASE WHEN EXTRACT(MONTH FROM dt_agendamento) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                         AND EXTRACT(YEAR FROM dt_agendamento) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
                    THEN vl_total ELSE 0 END) as receita_mes_anterior,
                AVG(vl_total) as ticket_medio
            FROM tb_agendamentos a
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE c.id_empresa = :id_empresa
              AND a.dt_agendamento BETWEEN :start_date AND :end_date
              AND a.ds_status IN ('confirmado', 'concluido')
        """)

        result = await db.execute(query_receita, {
            "id_empresa": id_empresa,
            "start_date": start_date,
            "end_date": end_date
        })
        row_rec = result.fetchone()

        receita_total = float(row_rec[0] or 0)
        receita_mes_atual = float(row_rec[1] or 0)
        receita_mes_anterior = float(row_rec[2] or 0)
        ticket_medio = float(row_rec[3] or 0)

        variacao_mensal = 0
        if receita_mes_anterior > 0:
            variacao_mensal = ((receita_mes_atual - receita_mes_anterior) / receita_mes_anterior) * 100

        # Top procedimentos por receita
        query_top_receita = text("""
            SELECT p.nm_procedimento, SUM(a.vl_total) as receita
            FROM tb_agendamentos a
            INNER JOIN tb_procedimentos p ON a.id_procedimento = p.id_procedimento
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE c.id_empresa = :id_empresa
              AND a.dt_agendamento BETWEEN :start_date AND :end_date
              AND a.ds_status IN ('confirmado', 'concluido')
            GROUP BY p.nm_procedimento
            ORDER BY receita DESC
            LIMIT 5
        """)
        result = await db.execute(query_top_receita, {
            "id_empresa": id_empresa,
            "start_date": start_date,
            "end_date": end_date
        })
        top_receita = [{"procedimento": row[0], "receita": float(row[1])} for row in result.fetchall()]

        receita_por_prof = receita_total / total_prof if total_prof > 0 else 0
        receita_por_proc = receita_total / (row_proc[0] or 1)

        receita_metrics = ReceitaMetrics(
            receita_total=round(receita_total, 2),
            receita_mes_atual=round(receita_mes_atual, 2),
            receita_mes_anterior=round(receita_mes_anterior, 2),
            variacao_mensal=round(variacao_mensal, 2),
            ticket_medio=round(ticket_medio, 2),
            receita_por_profissional=round(receita_por_prof, 2),
            receita_por_procedimento=round(receita_por_proc, 2),
            top_procedimentos_receita=top_receita,
        )

        # ===================
        # RESUMO FINAL
        # ===================
        summary = DashboardSummary(
            agendamentos=agendamentos_metrics,
            profissionais=profissionais_metrics,
            pacientes=pacientes_metrics,
            procedimentos=procedimentos_metrics,
            receita=receita_metrics,
            periodo={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "dias": (end_date - start_date).days + 1,
            }
        )

        return summary

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar métricas do dashboard: {str(e)}")


@router.get("/agendamentos", response_model=AgendamentosMetrics)
async def get_agendamentos_metrics(
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retorna apenas métricas de agendamentos"""
    try:
        if not current_user.id_empresa:
            raise HTTPException(status_code=403, detail="Usuário não possui empresa associada")

        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        query = text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN ds_status = 'confirmado' THEN 1 ELSE 0 END) as confirmados,
                SUM(CASE WHEN ds_status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
                SUM(CASE WHEN ds_status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
                SUM(CASE WHEN ds_status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
                SUM(CASE WHEN DATE(dt_agendamento) = CURRENT_DATE THEN 1 ELSE 0 END) as hoje,
                SUM(CASE WHEN dt_agendamento >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as semana,
                SUM(CASE WHEN dt_agendamento >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as mes
            FROM tb_agendamentos a
            INNER JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE c.id_empresa = :id_empresa
              AND a.dt_agendamento BETWEEN :start_date AND :end_date
        """)

        result = await db.execute(query, {
            "id_empresa": str(current_user.id_empresa),
            "start_date": start_date,
            "end_date": end_date
        })
        row = result.fetchone()

        total = row[0] or 0
        confirmados = row[1] or 0
        cancelados = row[3] or 0
        concluidos = row[4] or 0

        return AgendamentosMetrics(
            total_agendamentos=total,
            agendamentos_confirmados=confirmados,
            agendamentos_pendentes=row[2] or 0,
            agendamentos_cancelados=cancelados,
            agendamentos_concluidos=concluidos,
            taxa_confirmacao=round((confirmados / total * 100) if total > 0 else 0, 2),
            taxa_cancelamento=round((cancelados / total * 100) if total > 0 else 0, 2),
            taxa_conclusao=round((concluidos / total * 100) if total > 0 else 0, 2),
            agendamentos_hoje=row[5] or 0,
            agendamentos_semana=row[6] or 0,
            agendamentos_mes=row[7] or 0,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar métricas de agendamentos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar métricas: {str(e)}")
