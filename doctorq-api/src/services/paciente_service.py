"""
Service para gerenciamento de Pacientes - UC030
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.paciente import TbPaciente, PacienteCreate, PacienteUpdate
from src.config.logger_config import get_logger

logger = get_logger("paciente_service")


class PacienteService:
    """Service para gerenciamento de pacientes"""

    @staticmethod
    async def criar_paciente(
        db: AsyncSession,
        data: PacienteCreate
    ) -> TbPaciente:
        """Cria um novo paciente"""

        # Verificar se CPF já existe
        if data.nr_cpf:
            cpf_existe = await PacienteService.buscar_por_cpf(db, data.nr_cpf)
            if cpf_existe:
                raise ValueError(f"CPF {data.nr_cpf} já cadastrado")

        paciente = TbPaciente(**data.model_dump())

        db.add(paciente)
        await db.commit()
        await db.refresh(paciente)

        logger.info(f"Paciente criado: {paciente.id_paciente} - {paciente.nm_paciente}")

        return paciente

    @staticmethod
    async def buscar_por_cpf(
        db: AsyncSession,
        cpf: str
    ) -> Optional[TbPaciente]:
        """Busca paciente por CPF"""
        cpf_limpo = ''.join(filter(str.isdigit, cpf))

        query = select(TbPaciente).where(TbPaciente.nr_cpf == cpf_limpo)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def listar_pacientes(
        db: AsyncSession,
        id_clinica: Optional[UUID] = None,
        id_profissional: Optional[UUID] = None,
        id_empresa: Optional[UUID] = None,
        busca: Optional[str] = None,
        apenas_ativos: bool = True,
        page: int = 1,
        size: int = 50
    ) -> tuple[List[TbPaciente], int]:
        """
        Lista pacientes com filtros

        Args:
            id_clinica: Filtra por clínica específica
            id_profissional: Filtra por profissional (seus pacientes + pacientes das clínicas onde atende)
            id_empresa: Filtra por empresa (busca clínicas da empresa e retorna pacientes dessas clínicas)
            busca: Busca por nome, email, CPF ou telefone
            apenas_ativos: Retorna apenas pacientes ativos

        Lógica atualizada (2025-11-11):
        - Se id_profissional: retorna pacientes onde (id_profissional = X OU id_clinica IN clínicas do profissional)
        - Se id_clinica: retorna apenas pacientes daquela clínica
        - Se id_empresa: retorna pacientes de todas as clínicas da empresa
        """
        from src.models.clinica_orm import ClinicaORM
        from src.models.profissional_clinica import TbProfissionalClinica

        query = select(TbPaciente)

        filters = []

        # Filtrar por profissional (seus pacientes + pacientes das clínicas onde atende)
        if id_profissional:
            from src.models.profissionais_orm import ProfissionalORM

            clinicas_profissional = []

            # 1. Buscar clínica principal do profissional (tb_profissionais.id_clinica)
            prof_query = select(ProfissionalORM.id_clinica).where(
                ProfissionalORM.id_profissional == id_profissional
            )
            prof_result = await db.execute(prof_query)
            clinica_principal = prof_result.scalar_one_or_none()

            if clinica_principal:
                clinicas_profissional.append(clinica_principal)

            # 2. Buscar clínicas onde o profissional atende (tb_profissionais_clinicas)
            clinicas_query = select(TbProfissionalClinica.id_clinica).where(
                TbProfissionalClinica.id_profissional == id_profissional,
                TbProfissionalClinica.st_ativo == True
            )
            clinicas_result = await db.execute(clinicas_query)
            clinicas_vinculo = [row[0] for row in clinicas_result.fetchall()]
            clinicas_profissional.extend(clinicas_vinculo)

            # Filtro: pacientes do profissional OU pacientes das clínicas onde ele atende
            if clinicas_profissional:
                profissional_filter = or_(
                    TbPaciente.id_profissional == id_profissional,
                    TbPaciente.id_clinica.in_(clinicas_profissional)
                )
            else:
                # Se não tem clínicas, apenas filtrar por id_profissional
                profissional_filter = TbPaciente.id_profissional == id_profissional

            filters.append(profissional_filter)

        # Filtrar por empresa (através do join com tb_clinicas)
        elif id_empresa and not id_clinica:
            # Se id_empresa for passado mas não id_clinica, buscar clínicas da empresa
            query = query.join(ClinicaORM, TbPaciente.id_clinica == ClinicaORM.id_clinica)
            filters.append(ClinicaORM.id_empresa == id_empresa)

        # Filtrar por clínica específica (sobrescreve filtro por empresa)
        elif id_clinica:
            filters.append(TbPaciente.id_clinica == id_clinica)

        # Busca por texto
        if busca:
            busca_lower = f"%{busca.lower()}%"
            filters.append(
                or_(
                    func.lower(TbPaciente.nm_paciente).like(busca_lower),
                    func.lower(TbPaciente.ds_email).like(busca_lower),
                    TbPaciente.nr_cpf.like(f"%{busca}%"),
                    TbPaciente.nr_telefone.like(f"%{busca}%")
                )
            )

        # Filtrar apenas ativos
        if apenas_ativos:
            filters.append(TbPaciente.st_ativo == True)

        if filters:
            query = query.where(and_(*filters))

        # Total de registros
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)

        # Paginação
        query = query.offset((page - 1) * size).limit(size)
        query = query.order_by(TbPaciente.nm_paciente.asc())

        result = await db.execute(query)
        pacientes = result.scalars().all()

        return list(pacientes), total or 0

    @staticmethod
    async def buscar_paciente_por_id(
        db: AsyncSession,
        id_paciente: UUID
    ) -> Optional[TbPaciente]:
        """Busca paciente por ID"""
        query = select(TbPaciente).where(TbPaciente.id_paciente == id_paciente)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def atualizar_paciente(
        db: AsyncSession,
        id_paciente: UUID,
        data: PacienteUpdate
    ) -> Optional[TbPaciente]:
        """Atualiza um paciente"""
        paciente = await PacienteService.buscar_paciente_por_id(db, id_paciente)

        if not paciente:
            return None

        # Verificar CPF duplicado
        if data.nr_cpf and data.nr_cpf != paciente.nr_cpf:
            cpf_existe = await PacienteService.buscar_por_cpf(db, data.nr_cpf)
            if cpf_existe:
                raise ValueError(f"CPF {data.nr_cpf} já cadastrado")

        # Atualizar campos
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(paciente, field, value)

        paciente.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(paciente)

        logger.info(f"Paciente atualizado: {paciente.id_paciente}")

        return paciente

    @staticmethod
    async def desativar_paciente(
        db: AsyncSession,
        id_paciente: UUID
    ) -> Optional[TbPaciente]:
        """Desativa um paciente (soft delete)"""
        paciente = await PacienteService.buscar_paciente_por_id(db, id_paciente)

        if not paciente:
            return None

        paciente.st_ativo = False
        paciente.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(paciente)

        logger.info(f"Paciente desativado: {paciente.id_paciente}")

        return paciente

    @staticmethod
    async def reativar_paciente(
        db: AsyncSession,
        id_paciente: UUID
    ) -> Optional[TbPaciente]:
        """Reativa um paciente"""
        paciente = await PacienteService.buscar_paciente_por_id(db, id_paciente)

        if not paciente:
            return None

        paciente.st_ativo = True
        paciente.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(paciente)

        logger.info(f"Paciente reativado: {paciente.id_paciente}")

        return paciente

    @staticmethod
    async def atualizar_estatisticas(
        db: AsyncSession,
        id_paciente: UUID,
        dt_consulta: Optional[datetime] = None
    ) -> Optional[TbPaciente]:
        """Atualiza estatísticas do paciente após consulta"""
        paciente = await PacienteService.buscar_paciente_por_id(db, id_paciente)

        if not paciente:
            return None

        if dt_consulta is None:
            dt_consulta = datetime.utcnow()

        if paciente.dt_primeira_consulta is None:
            paciente.dt_primeira_consulta = dt_consulta

        paciente.dt_ultima_consulta = dt_consulta
        paciente.nr_total_consultas += 1
        paciente.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(paciente)

        logger.info(f"Estatísticas atualizadas para paciente: {paciente.id_paciente}")

        return paciente
