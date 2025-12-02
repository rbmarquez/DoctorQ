"""
Rotas para Agenda Inteligente - Sistema de Agendamentos
"""

import uuid
from typing import List, Optional
from datetime import datetime, timedelta, time
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.middleware.permission_middleware import require_permission
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user
from src.utils.auth_helpers import validate_empresa_access, get_user_empresa_id

logger = get_logger(__name__)

router = APIRouter(prefix="/agendamentos", tags=["agendamentos"])

# ============================================
# Models
# ============================================

class AgendamentoCreateRequest(BaseModel):
    id_paciente: str
    id_profissional: str
    id_clinica: Optional[str] = None  # Opcional para profissionais independentes
    id_procedimento: Optional[str] = None
    dt_agendamento: datetime
    nr_duracao_minutos: int = Field(ge=15, le=480)
    ds_motivo: Optional[str] = None
    ds_observacoes: Optional[str] = None
    vl_valor: Optional[Decimal] = None
    ds_forma_pagamento: Optional[str] = None

class AgendamentoUpdateRequest(BaseModel):
    dt_agendamento: Optional[datetime] = None
    nr_duracao_minutos: Optional[int] = None
    ds_motivo: Optional[str] = None
    ds_observacoes: Optional[str] = None
    vl_valor: Optional[Decimal] = None
    ds_forma_pagamento: Optional[str] = None

class AgendamentoResponse(BaseModel):
    id_agendamento: str
    id_paciente: str
    id_profissional: str
    id_clinica: str
    id_procedimento: Optional[str]
    dt_agendamento: datetime
    nr_duracao_minutos: int
    ds_status: str
    ds_motivo: Optional[str]
    ds_observacoes: Optional[str]
    st_confirmado: bool
    dt_confirmacao: Optional[datetime]
    vl_valor: Optional[Decimal]
    st_pago: bool
    st_avaliado: bool
    dt_criacao: datetime

    # Dados relacionados
    nm_paciente: Optional[str] = None
    nm_profissional: Optional[str] = None
    nm_clinica: Optional[str] = None
    nm_procedimento: Optional[str] = None

class HorarioDisponivel(BaseModel):
    dt_horario: datetime
    disponivel: bool
    motivo: Optional[str] = None

# ============================================
# Agendamentos - CRUD
# ============================================

@router.post("/", response_model=AgendamentoResponse)
@require_permission(grupo="clinica", recurso="agendamentos", acao="criar")
async def criar_agendamento(
    request: AgendamentoCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Criar novo agendamento.
    Verifica disponibilidade do profissional antes de confirmar.

    **Permissão necessária**: clinica.agendamentos.criar
    """
    try:
        # Converter datetime para timezone-naive (remover timezone se presente)
        # O banco usa TIMESTAMP WITHOUT TIME ZONE, então precisamos remover timezone
        if request.dt_agendamento.tzinfo is not None:
            request.dt_agendamento = request.dt_agendamento.replace(tzinfo=None)

        # 🔒 SEGURANÇA: Validar que a clínica pertence à empresa do usuário (se fornecida)
        id_empresa_user = current_user.id_empresa

        # Se id_clinica foi fornecido, validar que existe e pertence à empresa
        if request.id_clinica:
            check_clinica_query = text("""
                SELECT id_empresa FROM tb_clinicas WHERE id_clinica = CAST(:id_clinica AS UUID)
            """)
            result_clinica = await db.execute(check_clinica_query, {"id_clinica": request.id_clinica})
            clinica_row = result_clinica.fetchone()

            if not clinica_row:
                raise HTTPException(status_code=404, detail="Clínica não encontrada")

            if str(clinica_row[0]) != str(id_empresa_user):
                raise HTTPException(
                    status_code=403,
                    detail="Você não tem permissão para criar agendamentos nesta clínica"
                )
        else:
            # Sem clínica: Profissional independente
            # Validar que o profissional não tem id_empresa ou pertence à mesma empresa
            logger.info(f"Agendamento para profissional independente (sem clínica)")

        # Verificar se o paciente existe, se não existir, criar automaticamente
        check_paciente_query = text("""
            SELECT id_paciente FROM tb_pacientes WHERE id_paciente = CAST(:id_paciente AS UUID)
        """)

        result_paciente = await db.execute(check_paciente_query, {"id_paciente": request.id_paciente})
        paciente_exists = result_paciente.fetchone()

        if not paciente_exists:
            logger.info(f"Paciente {request.id_paciente} não existe. Tentando criar automaticamente...")

            # Buscar dados do usuário da tabela tb_users
            user_query = text("""
                SELECT nm_completo, nm_email, nr_telefone
                FROM tb_users
                WHERE id_user = CAST(:id_user AS UUID)
            """)
            user_result = await db.execute(user_query, {"id_user": request.id_paciente})
            user_data = user_result.fetchone()

            logger.info(f"Dados do usuário recuperados: {user_data}")

            if user_data:
                # Criar paciente automaticamente com os dados do usuário
                create_paciente_query = text("""
                    INSERT INTO tb_pacientes (
                        id_paciente,
                        id_user,
                        nm_paciente,
                        ds_email,
                        nr_telefone
                    ) VALUES (
                        :id_paciente,
                        :id_user,
                        :nm_paciente,
                        :ds_email,
                        :nr_telefone
                    )
                """)

                await db.execute(create_paciente_query, {
                    "id_paciente": request.id_paciente,
                    "id_user": request.id_paciente,
                    "nm_paciente": user_data[0],  # tb_pacientes usa nm_paciente
                    "ds_email": user_data[1],      # tb_pacientes usa ds_email
                    "nr_telefone": user_data[2]
                })

                # Flush para que o paciente esteja disponível para a foreign key do agendamento
                await db.flush()

                logger.info(f"Paciente criado automaticamente: {request.id_paciente}")
            else:
                logger.warning(f"Usuário {request.id_paciente} não encontrado na tabela tb_users. Não foi possível criar paciente automaticamente.")

        # Verificar disponibilidade do horário
        check_query = text("""
            SELECT COUNT(*)
            FROM tb_agendamentos
            WHERE id_profissional = :id_profissional
              AND ds_status NOT IN ('cancelado', 'nao_compareceu')
              AND (
                (dt_agendamento <= :dt_inicio AND dt_agendamento + (nr_duracao_minutos || ' minutes')::INTERVAL > :dt_inicio)
                OR
                (dt_agendamento < :dt_fim AND dt_agendamento + (nr_duracao_minutos || ' minutes')::INTERVAL >= :dt_fim)
                OR
                (dt_agendamento >= :dt_inicio AND dt_agendamento < :dt_fim)
              )
        """)

        dt_fim = request.dt_agendamento + timedelta(minutes=request.nr_duracao_minutos)

        result = await db.execute(check_query, {
            "id_profissional": request.id_profissional,
            "dt_inicio": request.dt_agendamento,
            "dt_fim": dt_fim
        })

        conflitos = result.scalar()

        if conflitos > 0:
            raise HTTPException(
                status_code=409,
                detail=f"Horário indisponível. Existe {conflitos} agendamento(s) conflitante(s)."
            )

        # Inserir agendamento
        insert_params = {
            "id_paciente": request.id_paciente,
            "id_profissional": request.id_profissional,
            "id_clinica": request.id_clinica,
            "id_procedimento": request.id_procedimento,
            "dt_agendamento": request.dt_agendamento,
            "nr_duracao_minutos": request.nr_duracao_minutos,
            "ds_motivo": request.ds_motivo,
            "ds_observacoes": request.ds_observacoes,
            "vl_valor": request.vl_valor,
            "ds_forma_pagamento": request.ds_forma_pagamento,
        }

        logger.info(f"Criando agendamento com parâmetros: id_clinica={insert_params['id_clinica']}, id_profissional={insert_params['id_profissional']}, id_paciente={insert_params['id_paciente']}")

        insert_query = text("""
            INSERT INTO tb_agendamentos (
                id_paciente,
                id_profissional,
                id_clinica,
                id_procedimento,
                dt_agendamento,
                nr_duracao_minutos,
                ds_motivo,
                ds_observacoes,
                vl_valor,
                ds_forma_pagamento,
                ds_status
            ) VALUES (
                :id_paciente,
                :id_profissional,
                :id_clinica,
                :id_procedimento,
                :dt_agendamento,
                :nr_duracao_minutos,
                :ds_motivo,
                :ds_observacoes,
                :vl_valor,
                :ds_forma_pagamento,
                'agendado'
            )
            RETURNING id_agendamento, dt_criacao
        """)

        result = await db.execute(insert_query, insert_params)
        await db.commit()

        row = result.fetchone()
        id_agendamento = str(row[0])

        logger.info(f"Agendamento criado: {id_agendamento}")

        return await obter_agendamento(id_agendamento, db, current_user)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        error_msg = str(e)
        logger.error(f"Erro ao criar agendamento: {error_msg}")

        # Tratar erros de foreign key violation
        if "foreign key constraint" in error_msg.lower() or "violates foreign key" in error_msg.lower():
            if "tb_pacientes" in error_msg or "id_paciente" in error_msg:
                raise HTTPException(
                    status_code=400,
                    detail="Paciente não encontrado. Certifique-se de que o paciente está cadastrado no sistema."
                )
            elif "tb_profissionais" in error_msg or "id_profissional" in error_msg:
                raise HTTPException(
                    status_code=400,
                    detail="Profissional não encontrado. Certifique-se de que o profissional está cadastrado no sistema."
                )
            elif "tb_clinicas" in error_msg or "id_clinica" in error_msg:
                raise HTTPException(
                    status_code=400,
                    detail="Clínica não encontrada. Certifique-se de que a clínica está cadastrada no sistema."
                )
            elif "tb_procedimentos" in error_msg or "id_procedimento" in error_msg:
                raise HTTPException(
                    status_code=400,
                    detail="Procedimento não encontrado. Certifique-se de que o procedimento está cadastrado no sistema."
                )

        raise HTTPException(status_code=500, detail=f"Erro ao criar agendamento: {error_msg}")


# ============================================
# Disponibilidade de Horários
# ============================================

@router.get("/disponibilidade", response_model=List[HorarioDisponivel])
async def obter_disponibilidade(
    id_profissional: str = Query(..., description="ID do profissional"),
    data: str = Query(..., description="Data no formato YYYY-MM-DD"),
    duracao_minutos: int = Query(60, description="Duração do procedimento em minutos"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna horários disponíveis para um profissional em uma data específica

    Lógica:
    - Horário comercial: 08:00 às 18:00
    - Intervalo de 30 minutos entre slots
    - Verifica conflitos com agendamentos existentes
    - Considera a duração do procedimento

    Args:
        id_profissional: UUID do profissional
        data: Data no formato YYYY-MM-DD
        duracao_minutos: Duração do procedimento (padrão 60 minutos)

    Returns:
        Lista de horários disponíveis
    """
    try:
        # Parse da data
        try:
            data_agendamento = datetime.strptime(data, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Data inválida. Use o formato YYYY-MM-DD")

        # Validar UUID do profissional
        try:
            uuid.UUID(id_profissional)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de profissional inválido")

        # Validar duração
        if duracao_minutos < 15 or duracao_minutos > 480:
            raise HTTPException(status_code=400, detail="Duração deve estar entre 15 e 480 minutos")

        # Buscar agendamentos existentes do profissional nesta data
        # Suporta profissionais com ou sem clínica
        query = text("""
            SELECT a.dt_agendamento, a.nr_duracao_minutos
            FROM tb_agendamentos a
            LEFT JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE a.id_profissional = :id_profissional
              AND DATE(a.dt_agendamento) = :data
              AND a.ds_status NOT IN ('cancelado')
              AND (c.id_empresa = :id_empresa OR a.id_clinica IS NULL)
            ORDER BY a.dt_agendamento
        """)

        result = await db.execute(query, {
            "id_profissional": id_profissional,
            "data": data_agendamento,
            "id_empresa": str(current_user.id_empresa)
        })

        agendamentos_existentes = [
            {
                "inicio": row.dt_agendamento,
                "fim": row.dt_agendamento + timedelta(minutes=row.nr_duracao_minutos)
            }
            for row in result.fetchall()
        ]

        # Gerar slots de horário (08:00 às 18:00, intervalos de 30 minutos)
        horarios_disponiveis = []
        horario_inicio = time(8, 0)  # 08:00
        horario_fim = time(18, 0)    # 18:00

        horario_atual = datetime.combine(data_agendamento, horario_inicio)
        horario_limite = datetime.combine(data_agendamento, horario_fim)

        while horario_atual < horario_limite:
            # Calcular fim do slot considerando a duração do procedimento
            fim_slot = horario_atual + timedelta(minutes=duracao_minutos)

            # Verificar se o slot cabe no horário comercial
            if fim_slot > horario_limite:
                break

            # Verificar conflitos com agendamentos existentes
            conflito = False
            motivo_indisponivel = None

            for agendamento in agendamentos_existentes:
                # Verifica se há sobreposição de horários
                if (horario_atual < agendamento["fim"] and fim_slot > agendamento["inicio"]):
                    conflito = True
                    motivo_indisponivel = "Horário já reservado"
                    break

            # Verificar se é no passado
            if horario_atual < datetime.now():
                conflito = True
                motivo_indisponivel = "Horário no passado"

            horarios_disponiveis.append(HorarioDisponivel(
                dt_horario=horario_atual,
                disponivel=not conflito,
                motivo=motivo_indisponivel
            ))

            # Próximo slot (intervalo de 30 minutos)
            horario_atual += timedelta(minutes=30)

        logger.info(
            f"Disponibilidade consultada: profissional={id_profissional}, "
            f"data={data}, slots={len(horarios_disponiveis)}"
        )

        return horarios_disponiveis

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao consultar disponibilidade: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar disponibilidade: {str(e)}")


@router.get("/disponiveis", response_model=List[HorarioDisponivel])
async def obter_disponibilidade_periodo(
    id_profissional: str = Query(..., description="ID do profissional"),
    dt_inicio: str = Query(..., description="Data início no formato YYYY-MM-DD"),
    dt_fim: str = Query(..., description="Data fim no formato YYYY-MM-DD"),
    duracao_minutos: int = Query(60, description="Duração do procedimento em minutos"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna horários disponíveis para um profissional em um período

    Lógica:
    - Horário comercial: 08:00 às 18:00
    - Intervalo de 30 minutos entre slots
    - Verifica conflitos com agendamentos existentes
    - Considera a duração do procedimento
    - Retorna slots de todos os dias no período

    Args:
        id_profissional: UUID do profissional
        dt_inicio: Data início no formato YYYY-MM-DD
        dt_fim: Data fim no formato YYYY-MM-DD
        duracao_minutos: Duração do procedimento (padrão 60 minutos)

    Returns:
        Lista de horários disponíveis em todo o período
    """
    try:
        # Parse das datas
        try:
            data_inicio = datetime.strptime(dt_inicio, "%Y-%m-%d").date()
            data_fim = datetime.strptime(dt_fim, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Data inválida. Use o formato YYYY-MM-DD")

        # Validar que data_fim >= data_inicio
        if data_fim < data_inicio:
            raise HTTPException(status_code=400, detail="Data fim deve ser maior ou igual à data início")

        # Validar período máximo (ex: 90 dias)
        dias_periodo = (data_fim - data_inicio).days + 1
        if dias_periodo > 90:
            raise HTTPException(status_code=400, detail="Período máximo permitido é 90 dias")

        # Validar UUID do profissional
        try:
            uuid.UUID(id_profissional)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de profissional inválido")

        # Validar duração
        if duracao_minutos < 15 or duracao_minutos > 480:
            raise HTTPException(status_code=400, detail="Duração deve estar entre 15 e 480 minutos")

        # Buscar todos os agendamentos do profissional no período
        # Suporta profissionais com ou sem clínica
        query = text("""
            SELECT a.dt_agendamento, a.nr_duracao_minutos
            FROM tb_agendamentos a
            LEFT JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            WHERE a.id_profissional = :id_profissional
              AND DATE(a.dt_agendamento) BETWEEN :data_inicio AND :data_fim
              AND a.ds_status NOT IN ('cancelado')
              AND (c.id_empresa = :id_empresa OR a.id_clinica IS NULL)
            ORDER BY a.dt_agendamento
        """)

        result = await db.execute(query, {
            "id_profissional": id_profissional,
            "data_inicio": data_inicio,
            "data_fim": data_fim,
            "id_empresa": str(current_user.id_empresa)
        })

        agendamentos_existentes = [
            {
                "inicio": row.dt_agendamento,
                "fim": row.dt_agendamento + timedelta(minutes=row.nr_duracao_minutos)
            }
            for row in result.fetchall()
        ]

        # Gerar slots para cada dia do período
        horarios_disponiveis = []
        data_atual = data_inicio

        while data_atual <= data_fim:
            # Horário comercial: 08:00 às 18:00
            horario_inicio = time(8, 0)
            horario_fim = time(18, 0)

            horario_atual = datetime.combine(data_atual, horario_inicio)
            horario_limite = datetime.combine(data_atual, horario_fim)

            while horario_atual < horario_limite:
                # Calcular fim do slot considerando a duração
                fim_slot = horario_atual + timedelta(minutes=duracao_minutos)

                # Verificar se cabe no horário comercial
                if fim_slot > horario_limite:
                    break

                # Verificar conflitos
                conflito = False
                motivo_indisponivel = None

                for agendamento in agendamentos_existentes:
                    if (horario_atual < agendamento["fim"] and fim_slot > agendamento["inicio"]):
                        conflito = True
                        motivo_indisponivel = "Horário já reservado"
                        break

                # Verificar se é no passado
                if horario_atual < datetime.now():
                    conflito = True
                    motivo_indisponivel = "Horário no passado"

                horarios_disponiveis.append(HorarioDisponivel(
                    dt_horario=horario_atual,
                    disponivel=not conflito,
                    motivo=motivo_indisponivel
                ))

                # Próximo slot (30 minutos)
                horario_atual += timedelta(minutes=30)

            # Próximo dia
            data_atual += timedelta(days=1)

        logger.info(
            f"Disponibilidade consultada (período): profissional={id_profissional}, "
            f"dt_inicio={dt_inicio}, dt_fim={dt_fim}, slots={len(horarios_disponiveis)}"
        )

        return horarios_disponiveis

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao consultar disponibilidade (período): {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar disponibilidade: {str(e)}")


# ============================================
# Buscar Profissionais Disponíveis por Procedimento e Data
# ============================================

class ProfissionalDisponivelResponse(BaseModel):
    id_profissional: str
    nm_profissional: str
    ds_especialidades: Optional[List[str]] = None
    nr_avaliacao_media: Optional[float] = None
    nr_total_avaliacoes: Optional[int] = None
    ds_foto_perfil: Optional[str] = None
    id_clinica: str
    nm_clinica: str
    ds_endereco_clinica: Optional[str] = None
    total_horarios_disponiveis: int
    primeiro_horario_disponivel: Optional[str] = None
    ultimo_horario_disponivel: Optional[str] = None

@router.get("/profissionais-disponiveis", response_model=List[ProfissionalDisponivelResponse])
async def buscar_profissionais_disponiveis(
    id_procedimento: str = Query(..., description="ID do procedimento"),
    data_inicio: str = Query(..., description="Data início no formato YYYY-MM-DD"),
    data_fim: Optional[str] = Query(None, description="Data fim no formato YYYY-MM-DD (opcional)"),
    data_horario: Optional[str] = Query(None, description="Data e horário preferidos no formato YYYY-MM-DDTHH:MM"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Busca profissionais que:
    1. Realizam o procedimento especificado (através da clínica)
    2. Têm disponibilidade no período (data_inicio até data_fim)
    3. Quando informado, possuem o horário exato livre

    Se data_fim não for informada, considera apenas data_inicio.
    Retorna lista ordenada por: disponibilidade total > avaliação > nome
    """
    try:
        # Parse datas
        data_inicio_obj = datetime.strptime(data_inicio, "%Y-%m-%d").date()
        data_fim_obj = datetime.strptime(data_fim, "%Y-%m-%d").date() if data_fim else data_inicio_obj

        # Buscar duração do procedimento para cálculo do horário final
        procedimento_stmt = text("""
            SELECT nr_duracao_minutos
            FROM tb_procedimentos
            WHERE id_procedimento = :id_procedimento
              AND st_ativo = TRUE
        """)

        proc_result = await db.execute(procedimento_stmt, {"id_procedimento": id_procedimento})
        proc_row = proc_result.fetchone()

        if not proc_row:
            raise HTTPException(status_code=404, detail="Procedimento não encontrado ou inativo")

        duracao_minutos = proc_row.nr_duracao_minutos or 60

        data_horario_inicio = None
        data_horario_fim = None

        if data_horario:
            try:
                data_horario_inicio = datetime.strptime(data_horario, "%Y-%m-%dT%H:%M")
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Data e horário inválidos: {str(e)}")

            if not (data_inicio_obj <= data_horario_inicio.date() <= data_fim_obj):
                raise HTTPException(status_code=400, detail="O horário preferido precisa estar dentro do período selecionado")

            data_horario_fim = data_horario_inicio + timedelta(minutes=duracao_minutos)

        # Query complexa que busca profissionais disponíveis no período
        query = text("""
            WITH clinicas_procedimento AS (
                SELECT DISTINCT
                    p.id_clinica,
                    c.nm_clinica,
                    c.ds_endereco,
                    c.nm_cidade,
                    c.nm_estado
                FROM tb_procedimentos p
                INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
                WHERE p.id_procedimento = :id_procedimento
                    AND p.st_ativo = TRUE
                    AND c.st_ativo = TRUE
                    AND c.id_empresa = :id_empresa
            ),
            profissionais_clinicas AS (
                SELECT
                    p.id_profissional,
                    p.id_clinica,
                    p.nm_profissional,
                    p.ds_especialidades,
                    p.nr_avaliacao_media,
                    p.nr_total_avaliacoes,
                    p.ds_foto,
                    c.nm_clinica,
                    c.ds_endereco,
                    c.nm_cidade,
                    c.nm_estado
                FROM tb_profissionais p
                INNER JOIN clinicas_procedimento c ON p.id_clinica = c.id_clinica
                WHERE p.st_ativo = TRUE
            ),
            horarios_ocupados AS (
                SELECT
                    a.id_profissional,
                    a.dt_agendamento,
                    a.nr_duracao_minutos
                FROM tb_agendamentos a
                WHERE DATE(a.dt_agendamento) BETWEEN :data_inicio AND :data_fim
                    AND a.ds_status NOT IN ('cancelado', 'nao_compareceu')
            )
            SELECT
                pc.id_profissional::text,
                pc.nm_profissional,
                pc.ds_especialidades,
                pc.nr_avaliacao_media,
                pc.nr_total_avaliacoes,
                pc.ds_foto as ds_foto_perfil,
                pc.id_clinica::text,
                pc.nm_clinica,
                CONCAT(pc.ds_endereco, ' - ', pc.nm_cidade, '/', pc.nm_estado) as ds_endereco_clinica,
                CASE
                    WHEN :data_horario_inicio::timestamp IS NOT NULL THEN
                        CASE WHEN SUM(CASE WHEN conflito.id_agendamento IS NOT NULL THEN 1 ELSE 0 END) = 0 THEN 1 ELSE 0 END
                    ELSE GREATEST(0, 20 - COUNT(ho.id_profissional))
                END as total_horarios_disponiveis,
                CASE
                    WHEN :data_horario_inicio::timestamp IS NOT NULL THEN TO_CHAR(:data_horario_inicio::time, 'HH24:MI')
                    ELSE '08:00'
                END as primeiro_horario_disponivel,
                CASE
                    WHEN :data_horario_inicio::timestamp IS NOT NULL THEN TO_CHAR(:data_horario_inicio::time, 'HH24:MI')
                    ELSE '18:00'
                END as ultimo_horario_disponivel
            FROM profissionais_clinicas pc
            LEFT JOIN horarios_ocupados ho ON pc.id_profissional = ho.id_profissional
            LEFT JOIN tb_agendamentos conflito
                ON :data_horario_inicio::timestamp IS NOT NULL
                AND conflito.id_profissional = pc.id_profissional
                AND conflito.ds_status NOT IN ('cancelado', 'nao_compareceu')
                AND conflito.dt_agendamento < :data_horario_fim
                AND (conflito.dt_agendamento + (conflito.nr_duracao_minutos || ' minutes')::interval) > :data_horario_inicio
            GROUP BY
                pc.id_profissional,
                pc.nm_profissional,
                pc.ds_especialidades,
                pc.nr_avaliacao_media,
                pc.nr_total_avaliacoes,
                pc.ds_foto,
                pc.id_clinica,
                pc.nm_clinica,
                pc.ds_endereco,
                pc.nm_cidade,
                pc.nm_estado
            HAVING
                (
                    :data_horario_inicio::timestamp IS NULL
                    AND GREATEST(0, 20 - COUNT(ho.id_profissional)) > 0
                )
                OR (
                    :data_horario_inicio::timestamp IS NOT NULL
                    AND SUM(CASE WHEN conflito.id_agendamento IS NOT NULL THEN 1 ELSE 0 END) = 0
                )
            ORDER BY
                total_horarios_disponiveis DESC,
                pc.nr_avaliacao_media DESC NULLS LAST,
                pc.nm_profissional ASC
        """)

        result = await db.execute(query, {
            "id_procedimento": id_procedimento,
            "id_empresa": str(current_user.id_empresa),
            "data_inicio": data_inicio_obj,
            "data_fim": data_fim_obj,
            "data_horario_inicio": data_horario_inicio,
            "data_horario_fim": data_horario_fim
        })

        rows = result.fetchall()

        profissionais = []
        for row in rows:
            profissionais.append(ProfissionalDisponivelResponse(
                id_profissional=row.id_profissional,
                nm_profissional=row.nm_profissional,
                ds_especialidades=row.ds_especialidades,
                nr_avaliacao_media=float(row.nr_avaliacao_media) if row.nr_avaliacao_media else None,
                nr_total_avaliacoes=row.nr_total_avaliacoes,
                ds_foto_perfil=row.ds_foto_perfil,
                id_clinica=row.id_clinica,
                nm_clinica=row.nm_clinica,
                ds_endereco_clinica=row.ds_endereco_clinica,
                total_horarios_disponiveis=row.total_horarios_disponiveis,
                primeiro_horario_disponivel=row.primeiro_horario_disponivel,
                ultimo_horario_disponivel=row.ultimo_horario_disponivel,
            ))

        logger.info(
            f"Encontrados {len(profissionais)} profissionais disponíveis para procedimento {id_procedimento} "
            f"no período {data_inicio} a {data_fim} "
            f"com horário preferido {data_horario if data_horario else 'não informado'}"
        )

        return profissionais

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Período inválido: {str(e)}")
    except Exception as e:
        logger.error(f"Erro ao buscar profissionais disponíveis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar profissionais: {str(e)}")


@router.get("/{id_agendamento}", response_model=AgendamentoResponse)
@require_permission(grupo="clinica", recurso="agendamentos", acao="visualizar")
async def obter_agendamento(
    id_agendamento: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Obter detalhes de um agendamento.

    **Permissão necessária**: clinica.agendamentos.visualizar
    """
    try:
        # 🔒 SEGURANÇA: Validar que o usuário tem acesso à empresa
        id_empresa_user = current_user.id_empresa

        query = text("""
            SELECT
                a.id_agendamento,
                a.id_paciente,
                a.id_profissional,
                a.id_clinica,
                a.id_procedimento,
                a.dt_agendamento,
                a.nr_duracao_minutos,
                a.ds_status,
                a.ds_motivo,
                a.ds_observacoes,
                a.st_confirmado,
                a.dt_confirmacao,
                a.vl_valor,
                a.st_pago,
                a.st_avaliado,
                a.dt_criacao,
                pac.nm_paciente,
                prof.nm_profissional,
                c.nm_clinica,
                proc.nm_procedimento
            FROM tb_agendamentos a
            LEFT JOIN tb_pacientes pac ON a.id_paciente = pac.id_paciente
            LEFT JOIN tb_profissionais prof ON a.id_profissional = prof.id_profissional
            LEFT JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            LEFT JOIN tb_procedimentos proc ON a.id_procedimento = proc.id_procedimento
            WHERE a.id_agendamento = :id_agendamento
              AND (c.id_empresa = :id_empresa OR a.id_clinica IS NULL)
        """)

        result = await db.execute(query, {
            "id_agendamento": id_agendamento,
            "id_empresa": str(id_empresa_user)
        })
        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado ou você não tem permissão para acessá-lo"
            )

        return AgendamentoResponse(
            id_agendamento=str(row[0]),
            id_paciente=str(row[1]),
            id_profissional=str(row[2]),
            id_clinica=str(row[3]),
            id_procedimento=str(row[4]) if row[4] else None,
            dt_agendamento=row[5],
            nr_duracao_minutos=row[6],
            ds_status=row[7],
            ds_motivo=row[8],
            ds_observacoes=row[9],
            st_confirmado=row[10],
            dt_confirmacao=row[11],
            vl_valor=row[12],
            st_pago=row[13],
            st_avaliado=row[14],
            dt_criacao=row[15],
            nm_paciente=row[16],
            nm_profissional=row[17],
            nm_clinica=row[18],
            nm_procedimento=row[19],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar agendamento: {str(e)}")


@router.get("/", response_model=dict)
# @require_permission(grupo="clinica", recurso="agendamentos", acao="visualizar")  # TODO: Fix decorator for API Key auth
async def listar_agendamentos(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    id_clinica: Optional[str] = None,
    id_profissional: Optional[str] = None,
    id_paciente: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    status: Optional[str] = None,
    apenas_confirmados: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """
    Listar agendamentos com filtros.

    **Autenticação**: JWT ou API Key

    - **Pacientes**: Veem apenas seus próprios agendamentos
    - **Profissionais/Admin/Gestor**: Veem agendamentos da sua empresa
    """
    try:
        from src.middleware.apikey_auth import get_current_user_optional, get_current_apikey_optional

        conditions = []

        # Tentar obter usuário via JWT primeiro
        jwt_user = get_current_user_optional(request)

        if jwt_user:
            # Autenticado via JWT
            user_id = jwt_user.get("uid")
            user_empresa_id = jwt_user.get("id_empresa")
            user_role = jwt_user.get("role")
        else:
            # Tentar obter via API Key
            api_key = get_current_apikey_optional(request)
            if api_key:
                # Autenticado via API Key
                user_id = str(api_key.id_user) if api_key.id_user else None
                user_empresa_id = str(api_key.id_empresa) if api_key.id_empresa else None
                # API Key não tem role explícito, assumir que tem empresa = gestor/admin
                user_role = "admin" if user_empresa_id else "paciente"
            else:
                # Nenhum método de autenticação válido
                raise HTTPException(status_code=401, detail="Autenticação necessária")

        if not user_id:
            raise HTTPException(status_code=401, detail="ID de usuário não encontrado")

        # ⚠️ FILTRO POR TIPO DE USUÁRIO:
        # - PACIENTE: Filtra apenas seus próprios agendamentos (por id_paciente)
        # - OUTROS (admin, gestor, profissional, recepcionista): Filtra por empresa

        if user_role == "paciente" or not user_empresa_id:
            # Usuário é paciente (ou não tem empresa) → Filtrar por ID do paciente
            # Buscar id_paciente na tabela tb_pacientes usando id_user
            paciente_query = text("""
                SELECT id_paciente FROM tb_pacientes WHERE id_user = :id_user LIMIT 1
            """)
            paciente_result = await db.execute(paciente_query, {"id_user": user_id})
            paciente_row = paciente_result.fetchone()

            if paciente_row:
                user_paciente_id = str(paciente_row[0])
                conditions.append(f"a.id_paciente = '{user_paciente_id}'")
            else:
                # Paciente não cadastrado ainda → Retornar lista vazia
                logger.warning(f"Usuário {user_id} é paciente mas não tem registro em tb_pacientes")
                return {
                    "items": [],
                    "meta": {
                        "totalItems": 0,
                        "itemsPerPage": size,
                        "totalPages": 0,
                        "currentPage": page,
                    }
                }
        else:
            # Usuário tem empresa (admin, gestor, profissional, recepcionista) → Filtrar por empresa
            # INCLUI agendamentos de profissionais independentes (sem clínica)
            conditions.append(f"(cli.id_empresa = '{user_empresa_id}' OR a.id_clinica IS NULL)")

        if id_clinica:
            conditions.append(f"a.id_clinica = '{id_clinica}'")

        if id_profissional:
            conditions.append(f"a.id_profissional = '{id_profissional}'")

        if id_paciente:
            conditions.append(f"a.id_paciente = '{id_paciente}'")

        if data_inicio:
            conditions.append(f"a.dt_agendamento >= '{data_inicio}'")

        if data_fim:
            conditions.append(f"a.dt_agendamento <= '{data_fim}'")

        if status:
            conditions.append(f"a.ds_status = '{status}'")

        if apenas_confirmados:
            conditions.append("a.st_confirmado = TRUE")

        where_clause = " AND ".join(conditions) if conditions else "TRUE"

        # Count total (LEFT JOIN para permitir pacientes sem empresa)
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_agendamentos a
            LEFT JOIN tb_clinicas cli ON a.id_clinica = cli.id_clinica
            WHERE {where_clause}
        """)
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Paginação
        offset = (page - 1) * size

        # Buscar agendamentos (LEFT JOIN para permitir pacientes sem empresa)
        query = text(f"""
            SELECT
                a.id_agendamento,
                a.id_profissional,
                a.id_paciente,
                a.dt_agendamento,
                a.nr_duracao_minutos,
                a.ds_status,
                a.st_confirmado,
                pac.nm_paciente,
                prof.nm_profissional,
                proc.nm_procedimento,
                a.vl_valor,
                a.ds_observacoes,
                cli.nm_clinica,
                cli.ds_endereco,
                prof.ds_especialidades
            FROM tb_agendamentos a
            LEFT JOIN tb_clinicas cli ON a.id_clinica = cli.id_clinica
            LEFT JOIN tb_pacientes pac ON a.id_paciente = pac.id_paciente
            LEFT JOIN tb_profissionais prof ON a.id_profissional = prof.id_profissional
            LEFT JOIN tb_procedimentos proc ON a.id_procedimento = proc.id_procedimento
            WHERE {where_clause}
            ORDER BY a.dt_agendamento DESC
            LIMIT {size} OFFSET {offset}
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        agendamentos = []
        for row in rows:
            # ds_especialidades is an array, join to string or use first
            especialidade = None
            if row[14] is not None and len(row[14]) > 0:
                especialidade = row[14][0] if isinstance(row[14], list) else row[14]

            agendamentos.append({
                "id_agendamento": str(row[0]),
                "id_profissional": str(row[1]),  # ADICIONADO
                "id_paciente": str(row[2]) if row[2] else None,  # ADICIONADO
                "dt_agendamento": row[3],
                "nr_duracao_minutos": row[4],
                "ds_status": row[5],
                "st_confirmado": row[6],
                "nm_paciente": row[7],
                "nm_profissional": row[8],
                "nm_procedimento": row[9],
                "vl_procedimento": float(row[10]) if row[10] is not None else None,
                "ds_observacoes": row[11],
                "ds_local": row[12],  # nm_clinica
                "ds_endereco": row[13],
                "ds_especialidade": especialidade,
            })

        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "items": agendamentos,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            }
        }

    except Exception as e:
        logger.error(f"Erro ao listar agendamentos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar agendamentos: {str(e)}")


@router.post("/{id_agendamento}/confirmar")
async def confirmar_agendamento(
    id_agendamento: str,
    confirmado_por: str = Query(..., description="Nome de quem confirmou"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Confirmar um agendamento"""
    try:
        # 🔒 SEGURANÇA: Validar que o agendamento pertence à empresa do usuário
        id_empresa_user = current_user.id_empresa

        query = text("""
            UPDATE tb_agendamentos a
            SET st_confirmado = TRUE,
                dt_confirmacao = NOW(),
                nm_confirmado_por = :confirmado_por
            FROM tb_clinicas c
            WHERE a.id_agendamento = :id_agendamento
              AND a.id_clinica = c.id_clinica
              AND c.id_empresa = :id_empresa
              AND a.ds_status = 'agendado'
            RETURNING a.id_agendamento
        """)

        result = await db.execute(query, {
            "id_agendamento": id_agendamento,
            "confirmado_por": confirmado_por,
            "id_empresa": str(id_empresa_user)
        })

        await db.commit()

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado, não pode ser confirmado ou você não tem permissão"
            )

        logger.info(f"Agendamento {id_agendamento} confirmado por {confirmado_por}")

        return {"message": "Agendamento confirmado com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao confirmar agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao confirmar: {str(e)}")


@router.delete("/{id_agendamento}")
@require_permission(grupo="clinica", recurso="agendamentos", acao="excluir")
async def cancelar_agendamento(
    id_agendamento: str,
    motivo: str = Query(..., description="Motivo do cancelamento"),
    cancelado_por: str = Query(..., description="Nome de quem cancelou"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancelar um agendamento (soft delete).

    **Permissão necessária**: clinica.agendamentos.excluir
    """
    try:
        # 🔒 SEGURANÇA: Validar que o agendamento pertence à empresa do usuário
        id_empresa_user = current_user.id_empresa

        query = text("""
            UPDATE tb_agendamentos a
            SET ds_status = 'cancelado',
                ds_motivo_cancelamento = :motivo,
                dt_cancelamento = NOW(),
                nm_cancelado_por = :cancelado_por
            FROM tb_clinicas c
            WHERE a.id_agendamento = :id_agendamento
              AND a.id_clinica = c.id_clinica
              AND c.id_empresa = :id_empresa
              AND a.ds_status NOT IN ('cancelado', 'concluido')
            RETURNING a.id_agendamento
        """)

        result = await db.execute(query, {
            "id_agendamento": id_agendamento,
            "motivo": motivo,
            "cancelado_por": cancelado_por,
            "id_empresa": str(id_empresa_user)
        })

        await db.commit()

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado, não pode ser cancelado ou você não tem permissão"
            )

        logger.info(f"Agendamento {id_agendamento} cancelado por {cancelado_por}")

        return {"message": "Agendamento cancelado com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao cancelar agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao cancelar: {str(e)}")


# ============================================
# Endpoints para Pacientes (sem permissões de clínica)
# ============================================

class CancelarAgendamentoPacienteRequest(BaseModel):
    """Request para cancelar agendamento pelo paciente"""
    motivo: Optional[str] = Field(None, description="Motivo do cancelamento (opcional)")
    id_paciente: Optional[str] = Field(None, description="ID do paciente (usado por API key de servidor)")


@router.post("/{id_agendamento}/cancelar-paciente")
async def cancelar_agendamento_paciente(
    id_agendamento: str,
    request_data: CancelarAgendamentoPacienteRequest = None,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Cancelar um agendamento pelo próprio paciente.

    O paciente só pode cancelar seus próprios agendamentos.
    Não requer permissões de clínica.
    """
    try:
        from src.middleware.apikey_auth import get_current_user_optional, get_current_apikey_optional

        # Obter usuário autenticado (JWT ou API Key)
        jwt_user = get_current_user_optional(request)
        paciente_id = None

        if jwt_user:
            paciente_id = jwt_user.get("uid")
        else:
            api_key = get_current_apikey_optional(request)
            if api_key:
                # Se API key de servidor, usar id_paciente do request se fornecido
                if request_data and request_data.id_paciente:
                    paciente_id = request_data.id_paciente
                else:
                    paciente_id = str(api_key.id_user) if api_key.id_user else None
            else:
                raise HTTPException(status_code=401, detail="Autenticação necessária")

        if not paciente_id:
            raise HTTPException(status_code=401, detail="ID de paciente não encontrado")

        motivo = request_data.motivo if request_data else None

        # Verificar se o agendamento pertence ao paciente e pode ser cancelado
        query = text("""
            UPDATE tb_agendamentos
            SET ds_status = 'cancelado',
                ds_motivo_cancelamento = :motivo,
                dt_cancelamento = NOW(),
                nm_cancelado_por = 'Paciente'
            WHERE id_agendamento = :id_agendamento
              AND id_paciente = :id_paciente
              AND ds_status NOT IN ('cancelado', 'concluido')
            RETURNING id_agendamento
        """)

        result = await db.execute(query, {
            "id_agendamento": id_agendamento,
            "motivo": motivo or "Cancelado pelo paciente",
            "id_paciente": paciente_id
        })

        await db.commit()

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado, já foi cancelado/concluído, ou você não tem permissão"
            )

        logger.info(f"Agendamento {id_agendamento} cancelado pelo paciente {user_id}")

        return {"message": "Agendamento cancelado com sucesso", "id_agendamento": id_agendamento}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao cancelar agendamento pelo paciente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao cancelar: {str(e)}")


class RemarcarAgendamentoPacienteRequest(BaseModel):
    """Request para remarcar agendamento pelo paciente"""
    nova_data_hora: str = Field(..., description="Nova data e hora no formato ISO (YYYY-MM-DDTHH:MM:SS)")
    motivo: Optional[str] = Field(None, description="Motivo da remarcação (opcional)")
    id_paciente: Optional[str] = Field(None, description="ID do paciente (usado por API key de servidor)")


@router.post("/{id_agendamento}/remarcar-paciente")
async def remarcar_agendamento_paciente(
    id_agendamento: str,
    request_data: RemarcarAgendamentoPacienteRequest,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Remarcar um agendamento pelo próprio paciente.

    O paciente só pode remarcar seus próprios agendamentos.
    Não requer permissões de clínica.
    """
    try:
        from src.middleware.apikey_auth import get_current_user_optional, get_current_apikey_optional
        from datetime import datetime

        # Obter usuário autenticado (JWT ou API Key)
        jwt_user = get_current_user_optional(request)
        paciente_id = None

        if jwt_user:
            paciente_id = jwt_user.get("uid")
        else:
            api_key = get_current_apikey_optional(request)
            if api_key:
                # Se API key de servidor, usar id_paciente do request se fornecido
                if request_data.id_paciente:
                    paciente_id = request_data.id_paciente
                else:
                    paciente_id = str(api_key.id_user) if api_key.id_user else None
            else:
                raise HTTPException(status_code=401, detail="Autenticação necessária")

        if not paciente_id:
            raise HTTPException(status_code=401, detail="ID de paciente não encontrado")

        # Converter string para datetime
        try:
            nova_data = datetime.fromisoformat(request_data.nova_data_hora.replace('Z', '+00:00'))
            # Remover timezone se presente para armazenar como naive datetime
            if nova_data.tzinfo is not None:
                nova_data = nova_data.replace(tzinfo=None)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de data inválido. Use ISO format (YYYY-MM-DDTHH:MM:SS)")

        # Verificar se a nova data é no futuro
        if nova_data <= datetime.now():
            raise HTTPException(status_code=400, detail="A nova data deve ser no futuro")

        # Verificar se o agendamento pertence ao paciente e pode ser remarcado
        query = text("""
            UPDATE tb_agendamentos
            SET dt_agendamento = :nova_data,
                ds_observacoes = COALESCE(ds_observacoes, '') || ' | Remarcado: ' || :motivo,
                dt_atualizacao = NOW()
            WHERE id_agendamento = :id_agendamento
              AND id_paciente = :id_paciente
              AND ds_status NOT IN ('cancelado', 'concluido')
            RETURNING id_agendamento, dt_agendamento
        """)

        result = await db.execute(query, {
            "id_agendamento": id_agendamento,
            "nova_data": nova_data,
            "motivo": request_data.motivo or "Remarcado pelo paciente",
            "id_paciente": paciente_id
        })

        await db.commit()

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado, já foi cancelado/concluído, ou você não tem permissão"
            )

        logger.info(f"Agendamento {id_agendamento} remarcado pelo paciente {paciente_id} para {nova_data}")

        return {
            "message": "Agendamento remarcado com sucesso",
            "id_agendamento": id_agendamento,
            "nova_data_hora": nova_data.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao remarcar agendamento pelo paciente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao remarcar: {str(e)}")


# ============================================
# Disponibilidade em Batch (Otimizado)
# ============================================

class DisponibilidadeBatchRequest(BaseModel):
    """Requisição para buscar disponibilidade de múltiplos profissionais"""
    ids_profissionais: List[str] = Field(..., description="Lista de IDs dos profissionais")
    data_inicio: str = Field(..., description="Data inicial no formato YYYY-MM-DD")
    num_dias: int = Field(7, description="Número de dias a buscar", ge=1, le=30)
    duracao_minutos: int = Field(60, description="Duração do procedimento em minutos", ge=15, le=480)

class ProfissionalDisponibilidade(BaseModel):
    """Disponibilidade de um profissional"""
    id_profissional: str
    horarios: List[HorarioDisponivel]

@router.post("/disponibilidade/batch", response_model=List[ProfissionalDisponibilidade])
async def obter_disponibilidade_batch(
    request: DisponibilidadeBatchRequest,
    db: AsyncSession = Depends(get_db),
    # ✅ SEM autenticação obrigatória - busca pública
    # Aceita tanto JWT (usuários logados) quanto API Key (frontend sem login)
):
    """
    **ENDPOINT OTIMIZADO:** Retorna disponibilidade de múltiplos profissionais de uma vez.

    Ao invés de fazer N requisições (uma por profissional/dia), este endpoint
    retorna todos os horários disponíveis em uma única requisição.

    **Exemplo:**
    - Antes: 10 profissionais × 7 dias = 70 requisições
    - Agora: 1 requisição única

    **Performance:**
    - Reduz drasticamente o número de requisições HTTP
    - Evita sobrecarga no pool de conexões do banco
    - Tempo de resposta ~2-3x mais rápido

    **Busca Pública:**
    - Não requer autenticação - disponível para busca pública
    - Aceita tanto JWT (usuários logados) quanto API Key (frontend)

    Args:
        request: Contém lista de IDs, data início, número de dias e duração

    Returns:
        Lista com disponibilidade de cada profissional
    """
    try:

        # Parse da data início
        try:
            data_inicio = datetime.strptime(request.data_inicio, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Data inválida. Use o formato YYYY-MM-DD")

        # Validar IDs dos profissionais
        for id_prof in request.ids_profissionais:
            try:
                uuid.UUID(id_prof)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"ID de profissional inválido: {id_prof}")
        
        # Validar número de dias
        if request.num_dias < 1 or request.num_dias > 30:
            raise HTTPException(status_code=400, detail="Número de dias deve estar entre 1 e 30")
        
        # Gerar lista de datas
        datas = [data_inicio + timedelta(days=i) for i in range(request.num_dias)]
        
        # Buscar TODOS os agendamentos de TODOS os profissionais no período de UMA VEZ
        data_fim = data_inicio + timedelta(days=request.num_dias)
        
        # ✅ Converter lista de IDs para UUIDs
        ids_uuid = [uuid.UUID(id_prof) for id_prof in request.ids_profissionais]

        # ✅ Usar bindparam com expanding=True para IN clause
        from sqlalchemy import bindparam

        # ✅ Busca pública: Sem filtro de empresa para mostrar disponibilidade de todos os profissionais
        query_agendamentos = text("""
            SELECT
                a.id_profissional::text,
                a.dt_agendamento,
                a.nr_duracao_minutos
            FROM tb_agendamentos a
            WHERE a.id_profissional IN :ids_profissionais
              AND DATE(a.dt_agendamento) >= :data_inicio
              AND DATE(a.dt_agendamento) < :data_fim
              AND a.ds_status NOT IN ('cancelado')
            ORDER BY a.id_profissional, a.dt_agendamento
        """).bindparams(bindparam("ids_profissionais", expanding=True))

        result = await db.execute(query_agendamentos, {
            "ids_profissionais": ids_uuid,  # ✅ Lista de UUIDs com expanding
            "data_inicio": data_inicio,
            "data_fim": data_fim
        })
        
        # Organizar agendamentos por profissional e data
        agendamentos_por_prof = {}
        for row in result.fetchall():
            id_prof = row[0]
            dt_agend = row[1]
            duracao = row[2]
            
            if id_prof not in agendamentos_por_prof:
                agendamentos_por_prof[id_prof] = []
            
            agendamentos_por_prof[id_prof].append({
                "inicio": dt_agend,
                "fim": dt_agend + timedelta(minutes=duracao)
            })
        
        # Gerar horários disponíveis para cada profissional
        resultado = []
        
        for id_profissional in request.ids_profissionais:
            horarios_todos = []
            agendamentos_prof = agendamentos_por_prof.get(id_profissional, [])
            
            # Para cada data, gerar os slots
            for data in datas:
                horario_inicio = time(8, 0)  # 08:00
                horario_fim = time(18, 0)    # 18:00
                
                horario_atual = datetime.combine(data, horario_inicio)
                horario_limite = datetime.combine(data, horario_fim)
                
                while horario_atual < horario_limite:
                    fim_slot = horario_atual + timedelta(minutes=request.duracao_minutos)
                    
                    # Verificar se cabe no horário comercial
                    if fim_slot > horario_limite:
                        break
                    
                    # Verificar conflitos
                    conflito = False
                    motivo_indisponivel = None
                    
                    # Verificar se é no passado
                    if horario_atual < datetime.now():
                        conflito = True
                        motivo_indisponivel = "Horário no passado"
                    else:
                        # Verificar conflitos com agendamentos
                        for agendamento in agendamentos_prof:
                            if (horario_atual < agendamento["fim"] and fim_slot > agendamento["inicio"]):
                                conflito = True
                                motivo_indisponivel = "Horário já reservado"
                                break
                    
                    horarios_todos.append(HorarioDisponivel(
                        dt_horario=horario_atual,
                        disponivel=not conflito,
                        motivo=motivo_indisponivel
                    ))
                    
                    # Próximo slot (30 minutos)
                    horario_atual += timedelta(minutes=30)
            
            resultado.append(ProfissionalDisponibilidade(
                id_profissional=id_profissional,
                horarios=horarios_todos
            ))
        
        logger.info(
            f"Disponibilidade batch: {len(request.ids_profissionais)} profissionais, "
            f"{request.num_dias} dias, total de {sum(len(r.horarios) for r in resultado)} slots"
        )
        
        return resultado
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao consultar disponibilidade batch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar disponibilidade: {str(e)}")


# ============================================================================
# ENDPOINTS MULTI-CLÍNICA
# ============================================================================

@router.get("/profissional/{id_profissional}/")
async def listar_agendamentos_profissional(
    id_profissional: str,
    dt_inicio: Optional[str] = Query(None, description="Data início (YYYY-MM-DD)"),
    dt_fim: Optional[str] = Query(None, description="Data fim (YYYY-MM-DD)"),
    id_clinica: Optional[str] = Query(None, description="Filtrar por clínica específica"),
    ds_status: Optional[str] = Query(None, description="Filtrar por status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista agendamentos de um profissional em TODAS as suas clínicas.

    **Suporte Multi-Clínica**: Retorna agendamentos de todas as clínicas onde o profissional trabalha.
    **Segurança**: Apenas profissionais podem ver seus próprios agendamentos, ou admins da mesma empresa.

    Query Parameters:
    - dt_inicio: Data de início para filtrar (opcional)
    - dt_fim: Data de fim para filtrar (opcional)
    - id_clinica: Filtrar apenas uma clínica específica (opcional)
    - ds_status: Filtrar por status (pendente, confirmado, concluido, cancelado)

    Returns:
        Lista de agendamentos com dados completos (paciente, procedimento, clínica)
    """
    try:
        # 🔒 SEGURANÇA: Validar acesso ao profissional
        id_empresa_user = current_user.id_empresa
        id_user = str(current_user.id_user)

        # Verificar se o profissional pertence à empresa do usuário OU se o usuário é o próprio profissional
        # Suporta profissionais com ou sem clínica
        check_profissional = text("""
            SELECT p.id_user, c.id_empresa
            FROM tb_profissionais p
            LEFT JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE p.id_profissional = :id_profissional
            LIMIT 1
        """)

        result_check = await db.execute(check_profissional, {"id_profissional": id_profissional})
        prof_row = result_check.fetchone()

        if not prof_row:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")

        prof_id_user = str(prof_row[0]) if prof_row[0] else None
        prof_id_empresa = str(prof_row[1]) if prof_row[1] else None

        # Permitir acesso se:
        # 1. Usuário é o próprio profissional
        # 2. Usuário pertence à mesma empresa do profissional
        if id_user != prof_id_user and str(id_empresa_user) != prof_id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para acessar os agendamentos deste profissional"
            )

        # Construir query base
        query_str = """
            SELECT
                a.id_agendamento,
                a.id_paciente,
                a.id_profissional,
                a.id_clinica,
                a.id_procedimento,
                a.dt_agendamento,
                a.hr_inicio,
                a.hr_fim,
                a.nr_duracao_minutos,
                a.ds_status,
                a.ds_observacoes,
                a.st_confirmado,
                a.dt_confirmacao,
                a.vl_valor,
                a.st_pago,
                a.st_avaliado,
                a.dt_criacao,
                a.dt_atualizacao,
                -- Dados do paciente
                pac.nm_completo as nm_paciente,
                pac.nr_telefone as telefone_paciente,
                pac.nm_email as email_paciente,
                pac.ds_foto_url as foto_paciente,
                -- Dados do procedimento
                proc.nm_procedimento,
                proc.ds_descricao as ds_procedimento,
                proc.vl_preco as vl_procedimento,
                proc.nr_duracao_estimada,
                -- Dados da clínica
                c.nm_clinica,
                c.ds_endereco,
                c.ds_telefone as telefone_clinica,
                -- Dados do profissional
                prof.nm_profissional,
                prof.ds_especialidades
            FROM tb_agendamentos a
            INNER JOIN tb_profissionais_clinicas pc
                ON a.id_profissional = pc.id_profissional
                AND a.id_clinica = pc.id_clinica
                AND pc.st_ativo = true
            LEFT JOIN tb_pacientes pac ON a.id_paciente = pac.id_paciente
            LEFT JOIN tb_procedimentos proc ON a.id_procedimento = proc.id_procedimento
            LEFT JOIN tb_clinicas c ON a.id_clinica = c.id_clinica
            LEFT JOIN tb_profissionais prof ON a.id_profissional = prof.id_profissional
            WHERE a.id_profissional = :id_profissional
                AND a.st_deletado = false
                AND c.id_empresa = :id_empresa
        """

        params = {
            "id_profissional": id_profissional,
            "id_empresa": str(id_empresa_user)
        }

        # Adicionar filtros opcionais
        if dt_inicio:
            query_str += " AND a.dt_agendamento >= :dt_inicio"
            params["dt_inicio"] = dt_inicio

        if dt_fim:
            query_str += " AND a.dt_agendamento <= :dt_fim"
            params["dt_fim"] = dt_fim

        if id_clinica:
            query_str += " AND a.id_clinica = :id_clinica"
            params["id_clinica"] = id_clinica

        if ds_status:
            query_str += " AND a.ds_status = :ds_status"
            params["ds_status"] = ds_status

        # Ordenar por data e hora
        query_str += " ORDER BY a.dt_agendamento DESC, a.hr_inicio DESC"

        # Executar query
        result = await db.execute(text(query_str), params)
        rows = result.fetchall()

        # Transformar resultado
        agendamentos = []
        for row in rows:
            agendamento = {
                "id_agendamento": str(row.id_agendamento),
                "id_paciente": str(row.id_paciente),
                "id_profissional": str(row.id_profissional),
                "id_clinica": str(row.id_clinica),
                "id_procedimento": str(row.id_procedimento) if row.id_procedimento else None,
                "dt_agendamento": row.dt_agendamento.isoformat() if row.dt_agendamento else None,
                "hr_inicio": row.hr_inicio.strftime("%H:%M") if row.hr_inicio else None,
                "hr_fim": row.hr_fim.strftime("%H:%M") if row.hr_fim else None,
                "nr_duracao_minutos": row.nr_duracao_minutos,
                "st_status": row.ds_status,
                "ds_observacoes": row.ds_observacoes,
                "bo_primeira_vez": False,  # TODO: Implementar lógica
                "bo_confirmado_sms": row.st_confirmado,
                "bo_confirmado_whatsapp": row.st_confirmado,
                "dt_confirmacao": row.dt_confirmacao.isoformat() if row.dt_confirmacao else None,
                "dt_criacao": row.dt_criacao.isoformat() if row.dt_criacao else None,
                "dt_atualizacao": row.dt_atualizacao.isoformat() if row.dt_atualizacao else None,
                "id_usuario_criacao": str(row.id_profissional),
                # Dados desnormalizados
                "paciente": {
                    "id_paciente": str(row.id_paciente),
                    "nm_completo": row.nm_paciente,
                    "nr_telefone": row.telefone_paciente,
                    "nm_email": row.email_paciente,
                    "ds_foto_url": row.foto_paciente,
                } if row.nm_paciente else None,
                "procedimento": {
                    "id_procedimento": str(row.id_procedimento) if row.id_procedimento else None,
                    "nm_procedimento": row.nm_procedimento,
                    "nr_duracao_minutos": row.nr_duracao_estimada or row.nr_duracao_minutos,
                    "vl_preco": float(row.vl_procedimento) if row.vl_procedimento else 0.0,
                    "ds_cor_hex": "#3B82F6",  # Azul padrão - TODO: Configurável
                    "nr_buffer_minutos": 15,
                } if row.nm_procedimento else None,
                "clinica": {
                    "id_clinica": str(row.id_clinica),
                    "nm_clinica": row.nm_clinica,
                    "ds_endereco": row.ds_endereco,
                    "ds_cor_hex": "#8B5CF6",  # Roxo padrão - TODO: Configurável por clínica
                } if row.nm_clinica else None,
                "profissional": {
                    "id_profissional": str(row.id_profissional),
                    "nm_completo": row.nm_profissional,
                    "nm_especialidade": row.ds_especialidades,
                    "ds_cor_agenda": "#10B981",  # Verde padrão
                } if row.nm_profissional else None,
            }
            agendamentos.append(agendamento)

        logger.info(
            f"Agendamentos listados: profissional={id_profissional}, "
            f"total={len(agendamentos)}, clinica_filtro={id_clinica}"
        )

        return agendamentos

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar agendamentos do profissional: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar agendamentos: {str(e)}"
        )
