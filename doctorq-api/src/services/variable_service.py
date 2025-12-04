# src/services/variable_service.py
import json
import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.variable import Variable, VariableCreate, VariableUpdate
from src.utils.crypto import get_crypto_service

logger = get_logger(__name__)


class VariableService:
    """Service para operaÃ§Ãµes com variÃ¡veis"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.crypto_service = get_crypto_service()

    async def save_mcp_variables(
        self, mcp_id: uuid.UUID, mcp_name: str, variables: dict
    ):
        """
        Salva ou atualiza um ÃšNICO registro na tb_variaveis para um MCP.
        O valor (vl_variavel) Ã© um JSON CRIPTOGRAFADO contendo todas as variÃ¡veis.
        """
        try:
            json_value = json.dumps(variables)
            encrypted_value = self.crypto_service.encrypt_text(json_value)

            stmt = select(Variable).where(Variable.id_variavel == mcp_id)
            result = await self.db.execute(stmt)
            existing_record = result.scalar_one_or_none()

            if existing_record:
                existing_record.vl_variavel = encrypted_value
                existing_record.nm_variavel = mcp_name
                existing_record.st_criptografado = "S"
                existing_record.dt_atualizacao = datetime.now()
                logger.info(f"Registro de variÃ¡veis atualizado para o MCP {mcp_id}")
            else:
                new_record = Variable(
                    id_variavel=mcp_id,
                    nm_variavel=mcp_name,
                    vl_variavel=encrypted_value,
                    st_criptografado="S",
                )
                self.db.add(new_record)
                logger.info(f"Registro de variÃ¡veis criado para o MCP {mcp_id}")

            await self.db.flush()

        except Exception as e:
            logger.error(f"Erro ao salvar variÃ¡veis do MCP: {str(e)}")
            raise RuntimeError(f"Erro ao salvar variÃ¡veis do MCP: {str(e)}") from e

    async def get_mcp_variables(self, mcp_id: uuid.UUID) -> dict:
        """
        Busca e decriptografa as variÃ¡veis de um MCP especÃ­fico.
        Retorna um dicionÃ¡rio com as variÃ¡veis prontas para uso.
        """
        variable_record = await self.get_variable_by_id(mcp_id)

        if not variable_record:
            return {}

        stored_value = variable_record.vl_variavel

        if variable_record.st_criptografado == "S":
            decrypted_json = self.crypto_service.decrypt_text(stored_value)
        else:
            decrypted_json = stored_value

        return json.loads(decrypted_json)

    async def create_variable(self, variable_data: VariableCreate) -> Variable:
        """Criar uma nova variÃ¡vel"""
        try:
            existing_variable = await self.get_variable_by_name(
                variable_data.nm_variavel
            )
            if existing_variable:
                raise ValueError(
                    f"VariÃ¡vel com nome '{variable_data.nm_variavel}' jÃ¡ existe"
                )

            db_variable = Variable(
                nm_variavel=variable_data.nm_variavel,
                vl_variavel=variable_data.vl_variavel,
                st_criptografado=variable_data.st_criptografado,
            )

            if variable_data.st_criptografado == "S":
                setattr(
                    db_variable,
                    "vl_variavel",
                    get_crypto_service().encrypt_text(variable_data.vl_variavel),
                )

            self.db.add(db_variable)
            await self.db.commit()
            await self.db.refresh(db_variable)
            return db_variable

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar variÃ¡vel: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar variÃ¡vel: {str(e)}") from e

    async def get_variable_by_id(self, variable_id: uuid.UUID) -> Optional[Variable]:
        """Obter uma variÃ¡vel por ID"""
        try:
            stmt = select(Variable).where(Variable.id_variavel == variable_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Erro ao buscar variÃ¡vel por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar variÃ¡vel: {str(e)}") from e

    async def get_variable_by_name(self, name: str) -> Optional[Variable]:
        """Obter uma variÃ¡vel por nome"""
        try:
            stmt = select(Variable).where(Variable.nm_variavel == name)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Service: Erro ao buscar variÃ¡vel por nome: {str(e)}")
            raise RuntimeError(f"Erro ao buscar variÃ¡vel: {str(e)}") from e

    async def list_variables(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        type_filter: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[Variable], int]:
        """Listar variÃ¡veis com filtros e paginaÃ§Ã£o"""
        try:
            valid_order_fields = [
                "dt_criacao",
                "dt_atualizacao",
                "nm_variavel",
                "st_criptografado",
                "id_variavel",
            ]
            if order_by not in valid_order_fields:
                order_by = "dt_criacao"

            count_stmt = select(func.count(Variable.id_variavel))
            stmt = select(Variable)

            filters = []
            if search:
                filters.append(
                    or_(
                        Variable.nm_variavel.ilike(f"%{search}%"),
                        Variable.vl_variavel.ilike(f"%{search}%"),
                    )
                )
            if type_filter:
                filters.append(Variable.st_criptografado == type_filter)

            if filters:
                stmt = stmt.where(and_(*filters))
                count_stmt = count_stmt.where(and_(*filters))

            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar_one()

            order_column = getattr(Variable, order_by)
            stmt = stmt.order_by(
                order_column.desc() if order_desc else order_column.asc()
            )
            stmt = stmt.offset((page - 1) * size).limit(size)

            result = await self.db.execute(stmt)
            variables = result.scalars().all()
            return list(variables), total
        except Exception as e:
            logger.error(f"Service: Erro ao listar variÃ¡veis: {str(e)}")
            raise RuntimeError(f"Erro ao listar variÃ¡veis: {str(e)}") from e

    async def update_variable(
        self, variable_id: uuid.UUID, variable_update: VariableUpdate
    ) -> Optional[Variable]:
        """Atualiza uma variÃ¡vel existente."""
        try:
            variable = await self.get_variable_by_id(variable_id)
            if not variable:
                return None

            update_data = variable_update.model_dump(exclude_unset=True)

            if (
                "nm_variavel" in update_data
                and update_data["nm_variavel"] != variable.nm_variavel
            ):
                existing = await self.get_variable_by_name(update_data["nm_variavel"])
                if existing and existing.id_variavel != variable_id:
                    raise ValueError(
                        f"VariÃ¡vel com nome '{update_data['nm_variavel']}' jÃ¡ existe"
                    )

            for key, value in update_data.items():
                if (
                    key == "vl_variavel"
                    and value == "*****"
                    and (
                        variable.st_criptografado == "S"
                        or update_data.get("st_criptografado") == "S"
                    )
                ):
                    continue

                if key == "vl_variavel" and update_data.get("st_criptografado") == "S":
                    value = get_crypto_service().encrypt_text(value)

                setattr(variable, key, value)

            variable.dt_atualizacao = datetime.now()
            await self.db.commit()
            await self.db.refresh(variable)
            return variable
        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao salvar variÃ¡vel: {e}")
            raise RuntimeError(f"Erro ao atualizar variÃ¡vel: {str(e)}") from e

    async def delete_variable(self, variable_id: uuid.UUID) -> bool:
        """Deletar uma variÃ¡vel"""
        try:
            variable = await self.get_variable_by_id(variable_id)
            if not variable:
                return False
            await self.db.delete(variable)
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar variÃ¡vel: {str(e)}") from e

    async def get_variable_by_vl_variavel(self, name: str) -> Optional[Variable]:
        """Obter uma variÃ¡vel por nome e descriptografar se necessÃ¡rio"""
        try:
            variable = await self.get_variable_by_name(name)
            if variable and variable.st_criptografado == "S":
                try:
                    decrypted_value = get_crypto_service().decrypt_text(
                        variable.vl_variavel
                    )
                    variable.vl_variavel = decrypted_value
                except Exception as decrypt_error:
                    logger.error(
                        f"Erro ao descriptografar variÃ¡vel {name}: {str(decrypt_error)}"
                    )
            return variable
        except Exception as e:
            logger.error(f"Service: Erro ao buscar variÃ¡vel por nome: {str(e)}")
            raise RuntimeError(f"Erro ao buscar variÃ¡vel: {str(e)}") from e


def get_variable_service(db: AsyncSession = Depends(get_db)) -> VariableService:
    """Factory function para criar instÃ¢ncia do VariableService"""
    return VariableService(db)
