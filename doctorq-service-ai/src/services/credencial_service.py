# src/services/credencial_service.py
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db_context, ORMConfig
from src.models.credencial import Credencial, CredencialCreate, CredencialUpdate
from src.models.credencial_schemas import CredencialFactory
from src.utils.crypto import get_crypto_service

logger = get_logger(__name__)


class CredencialService:
    """Service para operaÃ§Ãµes com credenciais - VersÃ£o com gerenciamento de sessÃ£o corrigido"""

    def __init__(self):
        """
        Inicializar service sem sessÃ£o fixa.
        Cada mÃ©todo criarÃ¡ sua prÃ³pria sessÃ£o.
        """
        self.crypto_service = get_crypto_service()

    async def _execute_with_session(self, operation):
        """
        Executar operaÃ§Ã£o com sessÃ£o gerenciada automaticamente

        Args:
            operation: FunÃ§Ã£o async que recebe uma sessÃ£o como parÃ¢metro
        """
        async with get_db_context() as db_session:
            try:
                result = await operation(db_session)
                await db_session.commit()
                return result
            except Exception as e:
                await db_session.rollback()
                raise e

    async def _execute_read_only(self, operation):
        """
        Executar operaÃ§Ã£o de leitura com sessÃ£o gerenciada

        Args:
            operation: FunÃ§Ã£o async que recebe uma sessÃ£o como parÃ¢metro
        """
        async with get_db_context() as db_session:
            return await operation(db_session)

    async def create_credencial(self, dados: CredencialCreate) -> Credencial:
        """Criar nova credencial"""

        async def _create_operation(db_session: AsyncSession):
            try:
                # Validate credential type
                if dados.nome_credencial not in CredencialFactory.get_supported_types():
                    raise ValueError(
                        f"Tipo de credencial nÃ£o suportado: {dados.nome_credencial}"
                    )

                # If dados_criptografado is a dict, validate and encrypt it
                if isinstance(dados.dados_criptografado, dict):
                    # Validate the credential data structure
                    CredencialFactory.create_credencial(
                        dados.nome_credencial, dados.dados_criptografado
                    )

                    # Encrypt the data
                    encrypted_data = self.crypto_service.encrypt_json(
                        dados.dados_criptografado
                    )
                else:
                    # Assume it's already encrypted string
                    encrypted_data = dados.dados_criptografado

                cred = Credencial(
                    nome=dados.nome,
                    nome_credencial=dados.nome_credencial,
                    dados_criptografado=encrypted_data,
                )

                db_session.add(cred)
                await db_session.flush()
                await db_session.refresh(cred)

                logger.debug(f"Credencial criada com sucesso: {cred.nome}")
                return cred

            except ValueError:
                raise
            except Exception as e:
                logger.error(f"Erro ao criar credencial: {str(e)}")
                raise RuntimeError(f"Erro ao criar credencial: {str(e)}") from e

        return await self._execute_with_session(_create_operation)

    async def get_credencial_by_id(
        self, credencial_id: uuid.UUID
    ) -> Optional[Credencial]:
        """Buscar credencial por ID"""

        async def _get_operation(db_session: AsyncSession):
            try:
                stmt = select(Credencial).where(
                    Credencial.id_credencial == credencial_id
                )
                # âœ… SessÃ£o gerenciada adequadamente
                result = await db_session.execute(stmt)
                credencial = result.scalar_one_or_none()

                return credencial

            except Exception as e:
                logger.error(f"Erro ao buscar credencial {credencial_id}: {str(e)}")
                raise RuntimeError(f"Erro ao buscar credencial: {str(e)}") from e

        return await self._execute_read_only(_get_operation)

    async def get_credencial_decrypted(
        self, credencial_id: uuid.UUID
    ) -> Optional[Dict[str, Any]]:
        """Buscar credencial por ID e descriptografar os dados"""

        async def _get_decrypted_operation(db_session: AsyncSession):
            try:
                logger.debug(f"Buscando credencial com ID: {credencial_id}")
                # Buscar credencial usando a sessÃ£o local
                stmt = select(Credencial).where(
                    Credencial.id_credencial == credencial_id
                )
                # SessÃ£o gerenciada adequadamente
                result = await db_session.execute(stmt)
                credencial = result.scalar_one_or_none()

                if not credencial:
                    logger.warning(
                        f"Credencial nÃ£o encontrada no banco: {credencial_id}"
                    )

                    return None

                logger.debug(
                    f"Credencial encontrada: {credencial.nome} ({credencial.nome_credencial})"
                )

                # Descriptografar os dados
                dados_descriptografados = self.crypto_service.decrypt_json(
                    credencial.dados_criptografado
                )

                return {
                    "id_credencial": credencial.id_credencial,
                    "nome": credencial.nome,
                    "nome_credencial": credencial.nome_credencial,
                    "dados": dados_descriptografados,
                    "dt_criacao": credencial.dt_criacao,
                    "dt_atualizacao": credencial.dt_atualizacao,
                }

            except Exception as e:
                logger.error(
                    f"Erro ao descriptografar credencial {credencial_id}: {str(e)}"
                )
                raise RuntimeError(
                    f"Erro ao descriptografar credencial: {str(e)}"
                ) from e

        return await self._execute_read_only(_get_decrypted_operation)

    async def get_credenciais(
        self, page: int = 1, size: int = 10
    ) -> tuple[List[Credencial], int]:
        """Listar credenciais com paginaÃ§Ã£o"""

        async def _list_operation(db_session: AsyncSession):
            try:
                # Validar parÃ¢metros
                validated_page = max(page, 1)
                validated_size = size
                if validated_size < 1 or validated_size > 100:
                    validated_size = 10

                offset = (validated_page - 1) * validated_size

                # Buscar credenciais
                stmt = (
                    select(Credencial)
                    .offset(offset)
                    .limit(validated_size)
                    .order_by(Credencial.dt_criacao.desc())
                )
                result = await db_session.execute(stmt)
                credenciais = list(result.scalars().all())

                # Contar total
                count_stmt = select(func.count(Credencial.id_credencial))
                total_result = await db_session.execute(count_stmt)
                total = total_result.scalar() or 0

                logger.debug(
                    f"Listadas {len(credenciais)} credenciais de {total} total"
                )
                return credenciais, total

            except Exception as e:
                logger.error(f"Erro ao listar credenciais: {str(e)}")
                raise RuntimeError(f"Erro ao listar credenciais: {str(e)}") from e

        return await self._execute_read_only(_list_operation)

    async def get_credenciais_by_type(
        self, tipo: str, limit: int = 1
    ) -> List[Credencial]:
        """Buscar credenciais por tipo"""

        async def _list_by_type_operation(db_session: AsyncSession):
            try:
                # Buscar credenciais por tipo
                stmt = (
                    select(Credencial)
                    .where(Credencial.nome_credencial == tipo)
                    .order_by(Credencial.dt_criacao.desc())
                    .limit(limit)
                )
                result = await db_session.execute(stmt)
                credenciais = list(result.scalars().all())

                logger.debug(
                    f"Encontradas {len(credenciais)} credenciais do tipo {tipo}"
                )
                return credenciais

            except Exception as e:
                logger.error(f"Erro ao buscar credenciais do tipo {tipo}: {str(e)}")
                raise RuntimeError(
                    f"Erro ao buscar credenciais do tipo {tipo}: {str(e)}"
                ) from e

        return await self._execute_read_only(_list_by_type_operation)

    async def update_credencial(
        self, credencial_data: CredencialUpdate
    ) -> Optional[Credencial]:
        """Atualizar credencial"""

        async def _update_operation(db_session: AsyncSession):
            try:
                stmt = select(Credencial).where(
                    Credencial.id_credencial == credencial_data.id_credencial
                )
                result = await db_session.execute(stmt)
                db_credencial = result.scalar_one_or_none()

                if not db_credencial:
                    logger.warning(
                        f"Credencial nÃ£o encontrada para atualizaÃ§Ã£o: {credencial_data.id_credencial}"
                    )
                    return None

                # Atualizar campos nÃ£o nulos
                updated = False

                if credencial_data.nome is not None:
                    db_credencial.nome = credencial_data.nome
                    updated = True

                if credencial_data.nome_credencial is not None:
                    db_credencial.nome_credencial = credencial_data.nome_credencial
                    updated = True

                if credencial_data.dados_criptografado is not None:
                    # If it's a dict, validate and encrypt
                    if isinstance(credencial_data.dados_criptografado, dict):
                        # Validate the credential data structure
                        CredencialFactory.create_credencial(
                            credencial_data.nome_credencial
                            or db_credencial.nome_credencial,
                            credencial_data.dados_criptografado,
                        )
                        # Encrypt the data
                        encrypted_data = self.crypto_service.encrypt_json(
                            credencial_data.dados_criptografado
                        )
                    else:
                        encrypted_data = credencial_data.dados_criptografado

                    db_credencial.dados_criptografado = encrypted_data
                    updated = True

                if updated:
                    await db_session.flush()
                    await db_session.refresh(db_credencial)
                    logger.debug(
                        f"Credencial atualizada: {credencial_data.id_credencial}"
                    )
                else:
                    logger.debug(
                        f"Nenhuma alteraÃ§Ã£o para credencial: {credencial_data.id_credencial}"
                    )

                return db_credencial

            except Exception as e:
                logger.error(
                    f"Erro ao atualizar credencial {credencial_data.id_credencial}: {str(e)}"
                )
                raise RuntimeError(f"Erro ao atualizar credencial: {str(e)}") from e

        return await self._execute_with_session(_update_operation)

    async def delete_credencial(self, credencial_id: uuid.UUID) -> bool:
        """Deletar credencial"""

        async def _delete_operation(db_session: AsyncSession):
            try:
                stmt = select(Credencial).where(
                    Credencial.id_credencial == credencial_id
                )
                result = await db_session.execute(stmt)
                db_credencial = result.scalar_one_or_none()

                if not db_credencial:
                    logger.warning(
                        f"Credencial nÃ£o encontrada para exclusÃ£o: {credencial_id}"
                    )
                    return False

                await db_session.delete(db_credencial)
                await db_session.flush()

                logger.debug(f"Credencial deletada: {credencial_id}")
                return True

            except Exception as e:
                logger.error(f"Erro ao deletar credencial {credencial_id}: {str(e)}")
                raise RuntimeError(f"Erro ao deletar credencial: {str(e)}") from e

        return await self._execute_with_session(_delete_operation)


def get_credencial_service() -> CredencialService:
    """FunÃ§Ã£o de dependÃªncia para obter o service de credencial"""
    return CredencialService()
