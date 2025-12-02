# src/services/profissional_consolidacao_service.py
"""
Service para consolidação de dados de profissionais que trabalham em múltiplas clínicas.

Este service implementa a lógica de negócio para:
- Listar todas as clínicas onde o profissional trabalha
- Consolidar agendas de todas as clínicas em uma única view
- Listar todos os pacientes de todas as clínicas
- Acessar prontuários de todas as clínicas

Permite que profissionais autônomos ou vinculados a múltiplas clínicas
tenham "um lugar com todas suas agendas, pacientes e prontuários".
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.cache_config import get_cache_client
from src.utils.cache_helper import CacheHelper
from src.models.agendamento_orm import AgendamentoORM as Agendamento
from src.models.clinica_orm import ClinicaORM as Clinica
from src.models.paciente_orm import PacienteORM as Paciente
from src.models.profissionais_orm import ProfissionalORM as Profissional
from src.models.profissional_clinica_orm import ProfissionalClinicaORM as ProfissionalClinica
from src.models.prontuario_orm import ProntuarioORM as Prontuario
from src.models.user import User

logger = get_logger(__name__)


class ProfissionalConsolidacaoService:
    """Service para operações de consolidação de dados multi-clínica"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def validar_acesso_profissional(
        self, id_usuario: uuid.UUID, id_profissional: uuid.UUID
    ) -> bool:
        """
        Valida se usuário tem acesso aos dados do profissional.

        Retorna True se:
        - Usuário é o próprio profissional (user.id vinculado ao profissional)
        - Usuário é admin da mesma empresa do profissional

        Args:
            id_usuario: UUID do usuário solicitante
            id_profissional: UUID do profissional

        Returns:
            True se tem acesso, False caso contrário
        """
        try:
            # Buscar profissional
            stmt_prof = select(Profissional).where(
                Profissional.id_profissional == id_profissional
            )
            result_prof = await self.db.execute(stmt_prof)
            profissional = result_prof.scalar_one_or_none()

            if not profissional:
                return False

            # Buscar usuário
            stmt_user = select(User).where(User.id_user == id_usuario)
            result_user = await self.db.execute(stmt_user)
            user = result_user.scalar_one_or_none()

            if not user:
                return False

            # Validar acesso:
            # 1. Mesmo empresa
            if user.id_empresa == profissional.id_empresa:
                return True

            # 2. Usuário é o próprio profissional (verificar por nome/email - simplificado)
            # Em produção, deveria ter tb_profissionais.id_user
            return False

        except Exception as e:
            logger.error(f"Erro ao validar acesso profissional: {str(e)}")
            return False

    async def listar_clinicas_profissional(
        self, id_profissional: uuid.UUID, apenas_ativas: bool = True
    ) -> List[Dict]:
        """
        Lista todas as clínicas onde o profissional trabalha.

        Args:
            id_profissional: UUID do profissional
            apenas_ativas: Se True, retorna apenas vínculos ativos

        Returns:
            Lista de dicionários com dados das clínicas e vínculos
        """
        try:
            # Buscar vínculos com clínicas
            stmt = (
                select(ProfissionalClinica, Clinica)
                .join(Clinica, ProfissionalClinica.id_clinica == Clinica.id_clinica)
                .where(ProfissionalClinica.id_profissional == id_profissional)
            )

            if apenas_ativas:
                stmt = stmt.where(
                    and_(
                        ProfissionalClinica.st_ativo == "S",
                        ProfissionalClinica.dt_desvinculo.is_(None),
                    )
                )

            stmt = stmt.order_by(ProfissionalClinica.dt_vinculo.desc())

            result = await self.db.execute(stmt)
            rows = result.all()

            clinicas = []
            for row in rows:
                vinculo, clinica = row

                clinicas.append(
                    {
                        "id_vinculo": str(vinculo.id_profissional_clinica),
                        "id_clinica": str(clinica.id_clinica),
                        "nm_clinica": clinica.nm_clinica,
                        "nm_cidade": clinica.nm_cidade,
                        "nm_estado": clinica.nm_estado,
                        "ds_endereco": clinica.ds_endereco,
                        "nr_telefone": clinica.nr_telefone,
                        "dt_vinculo": (
                            vinculo.dt_vinculo.isoformat() if vinculo.dt_vinculo else None
                        ),
                        "dt_desvinculo": (
                            vinculo.dt_desvinculo.isoformat()
                            if vinculo.dt_desvinculo
                            else None
                        ),
                        "st_ativo": vinculo.st_ativo,
                        "ds_observacoes": vinculo.ds_observacoes,
                    }
                )

            return clinicas

        except Exception as e:
            logger.error(f"Erro ao listar clínicas do profissional: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao listar clínicas: {str(e)}"
            )

    async def listar_agendas_consolidadas(
        self,
        id_profissional: uuid.UUID,
        dt_inicio: Optional[datetime] = None,
        dt_fim: Optional[datetime] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Dict], int]:
        """
        Lista agendamentos consolidados de todas as clínicas com paginação e cache.

        Args:
            id_profissional: UUID do profissional
            dt_inicio: Data inicial (default: hoje)
            dt_fim: Data final (default: +30 dias)
            status: Filtrar por status (agendado, confirmado, cancelado, etc.)
            page: Número da página (default: 1)
            size: Tamanho da página (default: 50, max: 100)

        Returns:
            Tupla com (lista de agendamentos, total de registros)
        """
        try:
            # Limitar tamanho máximo da página
            size = min(size, 100)
            offset = (page - 1) * size

            # Definir período padrão
            if not dt_inicio:
                dt_inicio = datetime.now().replace(hour=0, minute=0, second=0)
            if not dt_fim:
                dt_fim = dt_inicio + timedelta(days=30)

            # Gerar chave de cache
            redis_client = await get_cache_client()
            cache_helper = CacheHelper(redis_client) if redis_client else None

            cache_key = None
            if cache_helper:
                cache_key = CacheHelper.generate_cache_key(
                    "agendas",
                    "profissional",
                    str(id_profissional),
                    dt_inicio=dt_inicio.isoformat(),
                    dt_fim=dt_fim.isoformat(),
                    status=status or "all",
                    page=page,
                    size=size
                )

                # Tentar buscar do cache
                cached_data = await cache_helper.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache hit para agendas consolidadas: {cache_key}")
                    return cached_data.get("agendamentos", []), cached_data.get("total", 0)

            # Buscar total de registros (para paginação)
            stmt_count = (
                select(func.count(Agendamento.id_agendamento))
                .where(
                    and_(
                        Agendamento.id_profissional == id_profissional,
                        Agendamento.dt_agendamento >= dt_inicio,
                        Agendamento.dt_agendamento <= dt_fim,
                    )
                )
            )
            if status:
                stmt_count = stmt_count.where(Agendamento.ds_status == status)

            result_count = await self.db.execute(stmt_count)
            total = result_count.scalar() or 0

            # Buscar agendamentos paginados
            stmt = (
                select(Agendamento, Clinica, Paciente)
                .join(Clinica, Agendamento.id_clinica == Clinica.id_clinica, isouter=True)
                .join(Paciente, Agendamento.id_paciente == Paciente.id_paciente, isouter=True)
                .where(
                    and_(
                        Agendamento.id_profissional == id_profissional,
                        Agendamento.dt_agendamento >= dt_inicio,
                        Agendamento.dt_agendamento <= dt_fim,
                    )
                )
            )

            if status:
                stmt = stmt.where(Agendamento.ds_status == status)

            stmt = stmt.order_by(Agendamento.dt_agendamento.asc()).offset(offset).limit(size)

            result = await self.db.execute(stmt)
            rows = result.all()

            agendamentos = []
            for row in rows:
                agendamento, clinica, paciente = row

                agendamentos.append(
                    {
                        "id_agendamento": str(agendamento.id_agendamento),
                        "dt_agendamento": agendamento.dt_agendamento.isoformat(),
                        "nr_duracao_minutos": agendamento.nr_duracao_minutos,
                        "ds_status": agendamento.ds_status,
                        "ds_motivo": agendamento.ds_motivo,
                        "st_confirmado": agendamento.st_confirmado,
                        "vl_valor": float(agendamento.vl_valor) if agendamento.vl_valor else None,
                        "st_pago": agendamento.st_pago,
                        "clinica": {
                            "id_clinica": str(clinica.id_clinica) if clinica else None,
                            "nm_clinica": clinica.nm_clinica if clinica else None,
                            "nm_cidade": clinica.nm_cidade if clinica else None,
                        }
                        if clinica
                        else None,
                        "paciente": {
                            "id_paciente": str(paciente.id_paciente) if paciente else None,
                            "nm_paciente": paciente.nm_paciente if paciente else None,
                            "ds_email": paciente.ds_email if paciente else None,
                        }
                        if paciente
                        else None,
                    }
                )

            # Armazenar no cache (TTL: 5 minutos = 300 segundos)
            if cache_helper and cache_key:
                await cache_helper.set(
                    cache_key,
                    {"agendamentos": agendamentos, "total": total},
                    ttl=300
                )
                logger.debug(f"Dados armazenados no cache: {cache_key}")

            logger.info(
                f"Listados {len(agendamentos)}/{total} agendamentos consolidados "
                f"(profissional: {id_profissional}, página: {page}, período: {dt_inicio} a {dt_fim})"
            )

            return agendamentos, total

        except Exception as e:
            logger.error(f"Erro ao listar agendas consolidadas: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao consolidar agendas: {str(e)}"
            )

    async def listar_pacientes_consolidados(
        self,
        id_profissional: uuid.UUID,
        search: Optional[str] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Dict], int]:
        """
        Lista todos os pacientes únicos que o profissional já atendeu
        em todas as clínicas, com paginação.

        Args:
            id_profissional: UUID do profissional
            search: Buscar por nome ou email
            page: Número da página (default: 1)
            size: Tamanho da página (default: 50, max: 100)

        Returns:
            Tupla com (lista de pacientes, total de registros)
        """
        try:
            # Limitar tamanho máximo da página
            size = min(size, 100)
            offset = (page - 1) * size

            # Contar total de pacientes
            stmt_count = (
                select(func.count(func.distinct(Paciente.id_paciente)))
                .join(Agendamento, Paciente.id_paciente == Agendamento.id_paciente)
                .where(Agendamento.id_profissional == id_profissional)
            )

            if search:
                search_pattern = f"%{search}%"
                stmt_count = stmt_count.where(
                    or_(
                        Paciente.nm_paciente.ilike(search_pattern),
                        Paciente.ds_email.ilike(search_pattern),
                    )
                )

            result_count = await self.db.execute(stmt_count)
            total = result_count.scalar() or 0

            # Buscar pacientes únicos com contagem de agendamentos (paginado)
            stmt = (
                select(
                    Paciente,
                    func.count(Agendamento.id_agendamento).label("qt_agendamentos"),
                    func.array_agg(
                        func.distinct(Clinica.nm_clinica)
                    ).label("clinicas_atendimento"),
                )
                .join(Agendamento, Paciente.id_paciente == Agendamento.id_paciente)
                .join(Clinica, Agendamento.id_clinica == Clinica.id_clinica, isouter=True)
                .where(Agendamento.id_profissional == id_profissional)
            )

            if search:
                search_pattern = f"%{search}%"
                stmt = stmt.where(
                    or_(
                        Paciente.nm_paciente.ilike(search_pattern),
                        Paciente.ds_email.ilike(search_pattern),
                    )
                )

            stmt = (
                stmt.group_by(Paciente.id_paciente)
                .order_by(func.max(Agendamento.dt_agendamento).desc())
                .offset(offset)
                .limit(size)
            )

            result = await self.db.execute(stmt)
            rows = result.all()

            pacientes = []
            for row in rows:
                paciente = row[0]
                qt_agendamentos = row[1]
                clinicas = row[2] if len(row) > 2 else []

                pacientes.append(
                    {
                        "id_paciente": str(paciente.id_paciente),
                        "nm_paciente": paciente.nm_paciente,
                        "ds_email": paciente.ds_email,
                        "nr_telefone": paciente.nr_telefone,
                        "dt_nascimento": (
                            paciente.dt_nascimento.isoformat()
                            if paciente.dt_nascimento
                            else None
                        ),
                        "qt_agendamentos_total": qt_agendamentos,
                        "clinicas_atendimento": [c for c in clinicas if c],
                    }
                )

            logger.info(
                f"Listados {len(pacientes)}/{total} pacientes consolidados "
                f"(profissional: {id_profissional}, página: {page})"
            )

            return pacientes, total

        except Exception as e:
            logger.error(f"Erro ao listar pacientes consolidados: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao consolidar pacientes: {str(e)}"
            )

    async def estatisticas_profissional(self, id_profissional: uuid.UUID) -> Dict:
        """
        Retorna estatísticas consolidadas do profissional.

        Args:
            id_profissional: UUID do profissional

        Returns:
            Dict com qt_clinicas, qt_pacientes, qt_agendamentos_mes, etc.
        """
        try:
            # Contar clínicas ativas
            stmt_clinicas = select(func.count(ProfissionalClinica.id_profissional_clinica)).where(
                and_(
                    ProfissionalClinica.id_profissional == id_profissional,
                    ProfissionalClinica.st_ativo == "S",
                    ProfissionalClinica.dt_desvinculo.is_(None),
                )
            )
            result_clinicas = await self.db.execute(stmt_clinicas)
            qt_clinicas = result_clinicas.scalar() or 0

            # Contar pacientes únicos
            stmt_pacientes = (
                select(func.count(func.distinct(Agendamento.id_paciente)))
                .where(Agendamento.id_profissional == id_profissional)
            )
            result_pacientes = await self.db.execute(stmt_pacientes)
            qt_pacientes = result_pacientes.scalar() or 0

            # Contar agendamentos do mês atual
            inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0)
            fim_mes = (inicio_mes + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)

            stmt_agendamentos = select(func.count(Agendamento.id_agendamento)).where(
                and_(
                    Agendamento.id_profissional == id_profissional,
                    Agendamento.dt_agendamento >= inicio_mes,
                    Agendamento.dt_agendamento <= fim_mes,
                )
            )
            result_agendamentos = await self.db.execute(stmt_agendamentos)
            qt_agendamentos_mes = result_agendamentos.scalar() or 0

            return {
                "qt_clinicas_ativas": qt_clinicas,
                "qt_pacientes_total": qt_pacientes,
                "qt_agendamentos_mes_atual": qt_agendamentos_mes,
            }

        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas do profissional: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao calcular estatísticas: {str(e)}"
            )

    async def listar_prontuarios_consolidados(
        self,
        id_profissional: uuid.UUID,
        dt_inicio: Optional[datetime] = None,
        dt_fim: Optional[datetime] = None,
        id_paciente: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Dict], int]:
        """
        Lista prontuários consolidados de todas as clínicas onde o profissional trabalha,
        com paginação.

        Args:
            id_profissional: UUID do profissional
            dt_inicio: Data inicial do filtro (opcional)
            dt_fim: Data final do filtro (opcional)
            id_paciente: UUID do paciente para filtrar (opcional)
            page: Número da página (default: 1)
            size: Tamanho da página (default: 50, max: 100)

        Returns:
            Tupla com (lista de prontuários, total de registros)

        Raises:
            HTTPException: Se ocorrer erro na consulta
        """
        try:
            # Limitar tamanho máximo da página
            size = min(size, 100)
            offset = (page - 1) * size

            # Período padrão: últimos 90 dias
            if not dt_inicio:
                dt_inicio = datetime.now() - timedelta(days=90)
            if not dt_fim:
                dt_fim = datetime.now()

            # Contar total de prontuários
            stmt_count = (
                select(func.count(Prontuario.id_prontuario))
                .where(
                    and_(
                        Prontuario.id_profissional == id_profissional,
                        Prontuario.dt_consulta >= dt_inicio,
                        Prontuario.dt_consulta <= dt_fim,
                    )
                )
            )
            if id_paciente:
                stmt_count = stmt_count.where(Prontuario.id_paciente == id_paciente)

            result_count = await self.db.execute(stmt_count)
            total = result_count.scalar() or 0

            # Query com joins para obter dados completos (paginado)
            stmt = (
                select(
                    Prontuario,
                    Clinica.nm_clinica,
                    Clinica.id_clinica,
                    Paciente.nm_paciente,
                    Paciente.ds_email,
                    Paciente.nr_telefone,
                    Paciente.dt_nascimento,
                )
                .join(Clinica, Prontuario.id_clinica == Clinica.id_clinica, isouter=True)
                .join(Paciente, Prontuario.id_paciente == Paciente.id_paciente, isouter=True)
                .where(
                    and_(
                        Prontuario.id_profissional == id_profissional,
                        Prontuario.dt_consulta >= dt_inicio,
                        Prontuario.dt_consulta <= dt_fim,
                    )
                )
            )

            # Filtro opcional por paciente
            if id_paciente:
                stmt = stmt.where(Prontuario.id_paciente == id_paciente)

            # Ordenar por data de consulta (mais recente primeiro) e paginar
            stmt = stmt.order_by(Prontuario.dt_consulta.desc()).offset(offset).limit(size)

            result = await self.db.execute(stmt)
            rows = result.all()

            # Formatar resposta
            prontuarios = []
            for row in rows:
                prontuario = row[0]
                nm_clinica = row[1]
                id_clinica = row[2]
                nm_paciente = row[3]
                ds_email = row[4]
                nr_telefone = row[5]
                dt_nascimento = row[6]

                prontuarios.append(
                    {
                        "id_prontuario": str(prontuario.id_prontuario),
                        "dt_consulta": (
                            prontuario.dt_consulta.isoformat() if prontuario.dt_consulta else None
                        ),
                        "ds_tipo": prontuario.ds_tipo,
                        "ds_queixa_principal": prontuario.ds_queixa_principal,
                        "ds_diagnostico": prontuario.ds_diagnostico,
                        "ds_procedimentos_realizados": prontuario.ds_procedimentos_realizados,
                        "dt_retorno_sugerido": (
                            prontuario.dt_retorno_sugerido.isoformat()
                            if prontuario.dt_retorno_sugerido
                            else None
                        ),
                        "dt_assinatura": (
                            prontuario.dt_assinatura.isoformat() if prontuario.dt_assinatura else None
                        ),
                        "clinica": {
                            "id_clinica": str(id_clinica) if id_clinica else None,
                            "nm_clinica": nm_clinica,
                        },
                        "paciente": {
                            "id_paciente": str(prontuario.id_paciente),
                            "nm_paciente": nm_paciente,
                            "ds_email": ds_email,
                            "nr_telefone": nr_telefone,
                            "dt_nascimento": (
                                dt_nascimento.isoformat() if dt_nascimento else None
                            ),
                        },
                    }
                )

            logger.info(
                f"Listados {len(prontuarios)}/{total} prontuários consolidados "
                f"(profissional: {id_profissional}, página: {page})"
            )

            return prontuarios, total

        except Exception as e:
            logger.error(f"Erro ao listar prontuários consolidados: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao listar prontuários: {str(e)}"
            )
