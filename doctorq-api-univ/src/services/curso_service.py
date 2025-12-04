"""
Service de Cursos
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import logger
from src.models.curso import Curso, Aula, Matricula


class CursoService:
    """Service para gerenciamento de cursos"""

    @staticmethod
    async def buscar_curso(db: AsyncSession, id_curso: UUID) -> Optional[Curso]:
        """Busca curso por ID"""
        try:
            stmt = select(Curso).where(Curso.id_curso == id_curso)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar curso {id_curso}: {e}")
            return None

    @staticmethod
    async def listar_cursos(
        db: AsyncSession,
        categoria: Optional[str] = None,
        nivel: Optional[str] = None,
        apenas_ativos: bool = True,
        page: int = 1,
        size: int = 20
    ) -> list[Curso]:
        """Lista cursos com filtros"""
        try:
            stmt = select(Curso)

            if apenas_ativos:
                stmt = stmt.where(Curso.fg_ativo == True)
                stmt = stmt.where(Curso.fg_publicado == True)

            if categoria:
                stmt = stmt.where(Curso.categoria == categoria)

            if nivel:
                stmt = stmt.where(Curso.nivel == nivel)

            stmt = stmt.order_by(Curso.dt_criacao.desc())
            stmt = stmt.offset((page - 1) * size).limit(size)

            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Erro ao listar cursos: {e}")
            return []

    @staticmethod
    async def buscar_aula(db: AsyncSession, id_aula: UUID) -> Optional[Aula]:
        """Busca aula por ID"""
        try:
            stmt = select(Aula).where(Aula.id_aula == id_aula)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar aula {id_aula}: {e}")
            return None

    @staticmethod
    async def listar_aulas_curso(
        db: AsyncSession,
        id_curso: UUID,
        apenas_ativas: bool = True
    ) -> list[Aula]:
        """Lista aulas de um curso"""
        try:
            stmt = select(Aula).where(Aula.id_curso == id_curso)

            if apenas_ativas:
                stmt = stmt.where(Aula.fg_ativo == True)

            stmt = stmt.order_by(Aula.ordem)

            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Erro ao listar aulas do curso {id_curso}: {e}")
            return []

    @staticmethod
    async def buscar_matricula(
        db: AsyncSession,
        id_usuario: UUID,
        id_curso: UUID
    ) -> Optional[Matricula]:
        """Busca matricula de usuario em curso"""
        try:
            stmt = select(Matricula).where(
                Matricula.id_usuario == id_usuario,
                Matricula.id_curso == id_curso,
                Matricula.fg_ativo == True
            )
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar matricula: {e}")
            return None

    @staticmethod
    async def listar_cursos_usuario(
        db: AsyncSession,
        id_usuario: UUID,
        status: Optional[str] = None
    ) -> list[dict]:
        """Lista cursos de um usuario com progresso"""
        try:
            stmt = select(Matricula).where(
                Matricula.id_usuario == id_usuario,
                Matricula.fg_ativo == True
            )

            if status:
                stmt = stmt.where(Matricula.status == status)

            result = await db.execute(stmt)
            matriculas = list(result.scalars().all())

            cursos = []
            for matricula in matriculas:
                curso = await CursoService.buscar_curso(db, matricula.id_curso)
                if curso:
                    cursos.append({
                        "curso": curso,
                        "matricula": matricula,
                        "progresso": matricula.progresso_percentual
                    })

            return cursos
        except Exception as e:
            logger.error(f"Erro ao listar cursos do usuario {id_usuario}: {e}")
            return []
