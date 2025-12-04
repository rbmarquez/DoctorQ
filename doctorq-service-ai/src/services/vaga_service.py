from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid

from src.models.vaga import TbVagas
from src.models import Empresa  # ✅ Importa através de __init__.py
from src.schemas.vaga_schema import (
    CriarVagaRequest,
    AtualizarVagaRequest,
    VagaResponse,
    VagaListResponse,
    VagasFiltros,
    AtualizarStatusVagaRequest
)
from src.config.logger_config import get_logger

logger = get_logger(__name__)


def _to_uuid(value: Any) -> uuid.UUID:
    """
    Converte diferentes representações (str, uuid.UUID, asyncpg UUID etc.) para uuid.UUID.
    """
    if isinstance(value, uuid.UUID):
        return value

    if value is None:
        raise ValueError("UUID inválido: valor None")

    # asyncpg.pgproto.pgproto.UUID expõe .hex (callable) e .bytes
    hex_attr = getattr(value, "hex", None)
    if hex_attr:
        hex_value = hex_attr() if callable(hex_attr) else hex_attr
        if isinstance(hex_value, str):
            try:
                return uuid.UUID(hex_value)
            except ValueError:
                pass

    bytes_attr = getattr(value, "bytes", None)
    if bytes_attr is not None:
        try:
            return uuid.UUID(bytes=bytes(bytes_attr))
        except (TypeError, ValueError):
            pass

    return uuid.UUID(str(value))


class VagaService:
    """Service para gerenciamento de vagas"""

    @staticmethod
    async def criar_vaga(
        db: AsyncSession,
        data: CriarVagaRequest,
        id_empresa: str,
        id_criador: str
    ) -> TbVagas:
        """Cria uma nova vaga"""

        # Buscar informações da empresa para desnormalizar
        empresa_uuid = _to_uuid(id_empresa)
        query = select(Empresa).where(Empresa.id_empresa == empresa_uuid)
        result = await db.execute(query)
        empresa = result.scalar_one_or_none()

        if not empresa:
            raise ValueError("Empresa não encontrada")

        nome_fantasia = getattr(empresa, "nm_fantasia", None)
        display_name = nome_fantasia or getattr(empresa, "nm_empresa", None) or getattr(empresa, "nm_razao_social", None)

        vaga = TbVagas(
            id_empresa=empresa_uuid,
            id_criador=_to_uuid(id_criador),
            nm_empresa=display_name or "Empresa",
            ds_logo_empresa=empresa.ds_logo_url,
            dt_publicacao=datetime.utcnow(),
            ds_status="aberta",
            **data.dict()
        )

        db.add(vaga)
        await db.commit()
        await db.refresh(vaga)

        return vaga

    @staticmethod
    async def buscar_por_id(
        db: AsyncSession,
        id_vaga: str
    ) -> Optional[TbVagas]:
        """Busca vaga por ID"""

        query = select(TbVagas).where(
            TbVagas.id_vaga == _to_uuid(id_vaga)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def listar_vagas(
        db: AsyncSession,
        filtros: VagasFiltros
    ) -> VagaListResponse:
        """Lista vagas com filtros e paginação"""

        # Base query
        query = select(TbVagas)

        # Aplicar filtros
        conditions = []

        # Filtro por status (padrão: apenas abertas) - tolera variações de maiúsculas/minúsculas
        status_filter = (
            filtros.ds_status.strip().lower()
            if isinstance(filtros.ds_status, str) and filtros.ds_status.strip()
            else None
        )
        if status_filter in {"todos", "todas"}:
            status_filter = None

        if status_filter:
            conditions.append(func.lower(func.trim(TbVagas.ds_status)) == status_filter)

        # Filtro por empresa (para dashboard da empresa)
        if filtros.id_empresa:
            conditions.append(TbVagas.id_empresa == _to_uuid(filtros.id_empresa))

        # Filtro por cargo
        if filtros.nm_cargo:
            conditions.append(
                TbVagas.nm_cargo.ilike(f"%{filtros.nm_cargo}%")
            )

        # Filtro por área
        if filtros.nm_area:
            conditions.append(TbVagas.nm_area == filtros.nm_area)

        # Filtro por localização
        if filtros.nm_cidade:
            conditions.append(
                TbVagas.nm_cidade.ilike(f"%{filtros.nm_cidade}%")
            )

        if filtros.nm_estado:
            conditions.append(TbVagas.nm_estado == filtros.nm_estado.upper())

        # Filtro por nível
        if filtros.nm_nivel:
            conditions.append(TbVagas.nm_nivel == filtros.nm_nivel)

        # Filtro por tipo de contrato
        if filtros.nm_tipo_contrato:
            conditions.append(TbVagas.nm_tipo_contrato == filtros.nm_tipo_contrato)

        # Filtro por regime de trabalho
        if filtros.nm_regime_trabalho:
            conditions.append(TbVagas.nm_regime_trabalho == filtros.nm_regime_trabalho)

        # Filtro por aceita remoto
        if filtros.fg_aceita_remoto:
            conditions.append(TbVagas.fg_aceita_remoto == True)

        # Filtro por faixa salarial
        if filtros.vl_salario_min:
            conditions.append(
                or_(
                    TbVagas.vl_salario_min >= filtros.vl_salario_min,
                    TbVagas.fg_salario_a_combinar == True
                )
            )

        if filtros.vl_salario_max:
            conditions.append(
                or_(
                    TbVagas.vl_salario_max <= filtros.vl_salario_max,
                    TbVagas.fg_salario_a_combinar == True
                )
            )

        # Filtro por habilidades (todas as habilidades requeridas)
        if filtros.habilidades:
            for habilidade in filtros.habilidades:
                conditions.append(
                    TbVagas.habilidades_requeridas.contains([habilidade])
                )

        # Filtro por destaque
        if filtros.fg_destaque:
            conditions.append(TbVagas.fg_destaque == True)

        # Filtrar vagas não expiradas apenas quando não há filtro explícito de status.
        # Assim, se o cliente pedir "abertas" ou outro status específico, o campo ds_status
        # é a fonte da verdade mesmo que a empresa esqueça de atualizar dt_expiracao.
        if status_filter is None:
            conditions.append(
                or_(
                    TbVagas.dt_expiracao.is_(None),
                    TbVagas.dt_expiracao >= date.today()
                )
            )

        if conditions:
            query = query.where(and_(*conditions))

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.execute(count_query)
        total = total.scalar()

        # Ordenar (destaques primeiro, depois por data de publicação)
        query = query.order_by(
            TbVagas.fg_destaque.desc(),
            TbVagas.dt_publicacao.desc()
        )

        # Paginação
        offset = (filtros.page - 1) * filtros.size
        query = query.offset(offset).limit(filtros.size)

        result = await db.execute(query)
        vagas = result.scalars().all()

        total_pages = (total + filtros.size - 1) // filtros.size

        return VagaListResponse(
            vagas=[VagaResponse.from_orm(v) for v in vagas],
            total=total,
            page=filtros.page,
            size=filtros.size,
            total_pages=total_pages
        )

    @staticmethod
    async def listar_minhas_vagas(
        db: AsyncSession,
        id_empresa: str,
        filtros: VagasFiltros
    ) -> VagaListResponse:
        """Lista vagas da empresa logada"""

        filtros.id_empresa = id_empresa
        return await VagaService.listar_vagas(db, filtros)

    @staticmethod
    async def atualizar_vaga(
        db: AsyncSession,
        id_vaga: str,
        data: AtualizarVagaRequest,
        id_empresa: str
    ) -> TbVagas:
        """Atualiza uma vaga existente"""

        vaga = await VagaService.buscar_por_id(db, id_vaga)

        if not vaga:
            raise ValueError("Vaga não encontrada")

        # Verificar se a vaga pertence à empresa
        if str(vaga.id_empresa) != id_empresa:
            raise PermissionError("Você não tem permissão para atualizar esta vaga")

        # Atualizar apenas campos não-nulos
        update_data = data.dict(exclude_unset=True, exclude_none=True)

        for field, value in update_data.items():
            setattr(vaga, field, value)

        vaga.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(vaga)

        return vaga

    @staticmethod
    async def atualizar_status_vaga(
        db: AsyncSession,
        id_vaga: str,
        data: AtualizarStatusVagaRequest,
        id_empresa: str
    ) -> TbVagas:
        """Atualiza status da vaga (aberta, pausada, fechada)"""

        vaga = await VagaService.buscar_por_id(db, id_vaga)

        if not vaga:
            raise ValueError("Vaga não encontrada")

        # Verificar se a vaga pertence à empresa
        if str(vaga.id_empresa) != id_empresa:
            raise PermissionError("Você não tem permissão para atualizar esta vaga")

        vaga.ds_status = data.ds_status
        vaga.dt_atualizacao = datetime.utcnow()

        if data.ds_status == "fechada":
            vaga.dt_expiracao = date.today()

        await db.commit()
        await db.refresh(vaga)

        return vaga

    @staticmethod
    async def deletar_vaga(
        db: AsyncSession,
        id_vaga: str,
        id_empresa: str
    ) -> bool:
        """Deleta uma vaga"""

        vaga = await VagaService.buscar_por_id(db, id_vaga)

        if not vaga:
            raise ValueError("Vaga não encontrada")

        # Verificar se a vaga pertence à empresa
        if str(vaga.id_empresa) != id_empresa:
            raise PermissionError("Você não tem permissão para deletar esta vaga")

        await db.delete(vaga)
        await db.commit()

        return True

    @staticmethod
    async def incrementar_visualizacoes(
        db: AsyncSession,
        id_vaga: str
    ) -> None:
        """Incrementa contador de visualizações"""

        vaga = await VagaService.buscar_por_id(db, id_vaga)

        if vaga:
            vaga.nr_visualizacoes += 1
            await db.commit()

    @staticmethod
    async def incrementar_candidatos(
        db: AsyncSession,
        id_vaga: str
    ) -> None:
        """Incrementa contador de candidatos"""

        vaga = await VagaService.buscar_por_id(db, id_vaga)

        if vaga:
            vaga.nr_candidatos += 1
            await db.commit()

    @staticmethod
    async def decrementar_candidatos(
        db: AsyncSession,
        id_vaga: str
    ) -> None:
        """Decrementa contador de candidatos (quando candidato desiste)"""

        vaga = await VagaService.buscar_por_id(db, id_vaga)

        if vaga and vaga.nr_candidatos > 0:
            vaga.nr_candidatos -= 1
            await db.commit()

    @staticmethod
    async def verificar_vagas_expiradas(
        db: AsyncSession
    ) -> int:
        """
        Job para marcar vagas expiradas como "expirada"
        Retorna número de vagas atualizadas
        """

        query = select(TbVagas).where(
            and_(
                TbVagas.dt_expiracao < date.today(),
                TbVagas.ds_status.in_(["aberta", "pausada"])
            )
        )

        result = await db.execute(query)
        vagas = result.scalars().all()

        count = 0
        for vaga in vagas:
            vaga.ds_status = "expirada"
            count += 1

        await db.commit()

        return count
