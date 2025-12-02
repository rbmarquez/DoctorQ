from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from src.models.curriculo import TbCurriculos
from src.schemas.curriculo_schema import (
    CriarCurriculoRequest,
    AtualizarCurriculoRequest,
    CurriculoResponse,
    CurriculoListResponse,
    CurriculoFiltros
)


class CurriculoService:
    """Service para gerenciamento de currículos"""

    @staticmethod
    async def criar_curriculo(
        db: AsyncSession,
        data: CriarCurriculoRequest,
        id_usuario: str
    ) -> TbCurriculos:
        """Cria um novo currículo"""

        # Verificar se usuário já tem currículo
        curriculo_existente = await CurriculoService.buscar_por_usuario(db, id_usuario)
        if curriculo_existente:
            raise ValueError("Usuário já possui um currículo cadastrado. Use atualizar ao invés de criar.")

        curriculo = TbCurriculos(
            id_usuario=uuid.UUID(id_usuario),
            **data.dict(exclude={"id_usuario"})
        )

        db.add(curriculo)
        await db.commit()
        await db.refresh(curriculo)

        return curriculo

    @staticmethod
    async def buscar_por_id(
        db: AsyncSession,
        id_curriculo: str
    ) -> Optional[TbCurriculos]:
        """Busca currículo por ID"""

        query = select(TbCurriculos).where(
            TbCurriculos.id_curriculo == uuid.UUID(id_curriculo)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def buscar_por_usuario(
        db: AsyncSession,
        id_usuario: str
    ) -> Optional[TbCurriculos]:
        """Busca currículo por ID do usuário"""

        query = select(TbCurriculos).where(
            TbCurriculos.id_usuario == uuid.UUID(id_usuario)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def listar_curriculos(
        db: AsyncSession,
        filtros: CurriculoFiltros
    ) -> CurriculoListResponse:
        """Lista currículos com filtros e paginação"""

        # Base query
        query = select(TbCurriculos)

        # Aplicar filtros
        conditions = []

        # Apenas currículos visíveis para recrutadores (padrão)
        if filtros.fg_visivel_recrutadores:
            conditions.append(TbCurriculos.fg_visivel_recrutadores == True)

        # Filtro por cargo
        if filtros.nm_cargo:
            conditions.append(
                TbCurriculos.nm_cargo_desejado.ilike(f"%{filtros.nm_cargo}%")
            )

        # Filtro por localização
        if filtros.nm_cidade:
            conditions.append(
                TbCurriculos.nm_cidade.ilike(f"%{filtros.nm_cidade}%")
            )

        if filtros.nm_estado:
            conditions.append(TbCurriculos.nm_estado == filtros.nm_estado.upper())

        # Filtro por nível
        if filtros.nm_nivel:
            conditions.append(TbCurriculos.nm_nivel_experiencia == filtros.nm_nivel)

        # Filtro por habilidades (qualquer uma das habilidades)
        if filtros.habilidades:
            habilidades_conditions = []
            for habilidade in filtros.habilidades:
                habilidades_conditions.append(
                    TbCurriculos.habilidades.contains([habilidade])
                )
            conditions.append(or_(*habilidades_conditions))

        # Filtro por tipos de contrato aceitos
        if filtros.tipos_contrato:
            contrato_conditions = []
            for tipo in filtros.tipos_contrato:
                contrato_conditions.append(
                    TbCurriculos.tipos_contrato_aceitos.contains([tipo])
                )
            conditions.append(or_(*contrato_conditions))

        # Filtro por regimes de trabalho aceitos
        if filtros.regimes_trabalho:
            regime_conditions = []
            for regime in filtros.regimes_trabalho:
                regime_conditions.append(
                    TbCurriculos.regimes_trabalho_aceitos.contains([regime])
                )
            conditions.append(or_(*regime_conditions))

        # Filtro por faixa salarial
        if filtros.vl_salario_min:
            conditions.append(
                or_(
                    TbCurriculos.vl_pretensao_salarial_min <= filtros.vl_salario_min,
                    TbCurriculos.vl_pretensao_salarial_min.is_(None)
                )
            )

        if filtros.vl_salario_max:
            conditions.append(
                or_(
                    TbCurriculos.vl_pretensao_salarial_max >= filtros.vl_salario_max,
                    TbCurriculos.vl_pretensao_salarial_max.is_(None)
                )
            )

        if conditions:
            query = query.where(and_(*conditions))

        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.execute(count_query)
        total = total.scalar()

        # Ordenar por data de atualização (mais recentes primeiro)
        query = query.order_by(TbCurriculos.dt_atualizacao.desc())

        # Paginação
        offset = (filtros.page - 1) * filtros.size
        query = query.offset(offset).limit(filtros.size)

        result = await db.execute(query)
        curriculos = result.scalars().all()

        total_pages = (total + filtros.size - 1) // filtros.size

        return CurriculoListResponse(
            curriculos=[CurriculoResponse.from_orm(c) for c in curriculos],
            total=total,
            page=filtros.page,
            size=filtros.size,
            total_pages=total_pages
        )

    @staticmethod
    async def atualizar_curriculo(
        db: AsyncSession,
        id_curriculo: str,
        data: AtualizarCurriculoRequest,
        id_usuario: str
    ) -> TbCurriculos:
        """Atualiza um currículo existente"""

        curriculo = await CurriculoService.buscar_por_id(db, id_curriculo)

        if not curriculo:
            raise ValueError("Currículo não encontrado")

        # Verificar se o currículo pertence ao usuário
        if str(curriculo.id_usuario) != id_usuario:
            raise PermissionError("Você não tem permissão para atualizar este currículo")

        # Atualizar apenas campos não-nulos
        update_data = data.dict(exclude_unset=True, exclude_none=True)

        for field, value in update_data.items():
            setattr(curriculo, field, value)

        curriculo.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(curriculo)

        return curriculo

    @staticmethod
    async def deletar_curriculo(
        db: AsyncSession,
        id_curriculo: str,
        id_usuario: str
    ) -> bool:
        """Deleta um currículo"""

        curriculo = await CurriculoService.buscar_por_id(db, id_curriculo)

        if not curriculo:
            raise ValueError("Currículo não encontrado")

        # Verificar se o currículo pertence ao usuário
        if str(curriculo.id_usuario) != id_usuario:
            raise PermissionError("Você não tem permissão para deletar este currículo")

        await db.delete(curriculo)
        await db.commit()

        return True

    @staticmethod
    async def alterar_visibilidade(
        db: AsyncSession,
        id_curriculo: str,
        id_usuario: str,
        visivel: bool
    ) -> TbCurriculos:
        """Altera visibilidade do currículo para recrutadores"""

        curriculo = await CurriculoService.buscar_por_id(db, id_curriculo)

        if not curriculo:
            raise ValueError("Currículo não encontrado")

        # Verificar se o currículo pertence ao usuário
        if str(curriculo.id_usuario) != id_usuario:
            raise PermissionError("Você não tem permissão para alterar este currículo")

        curriculo.fg_visivel_recrutadores = visivel
        curriculo.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(curriculo)

        return curriculo

    @staticmethod
    async def incrementar_visualizacoes(
        db: AsyncSession,
        id_curriculo: str
    ) -> None:
        """Incrementa contador de visualizações"""

        curriculo = await CurriculoService.buscar_por_id(db, id_curriculo)

        if curriculo:
            curriculo.nr_visualizacoes += 1
            await db.commit()

    @staticmethod
    async def incrementar_candidaturas(
        db: AsyncSession,
        id_curriculo: str
    ) -> None:
        """Incrementa contador de candidaturas"""

        curriculo = await CurriculoService.buscar_por_id(db, id_curriculo)

        if curriculo:
            curriculo.nr_candidaturas += 1
            await db.commit()
