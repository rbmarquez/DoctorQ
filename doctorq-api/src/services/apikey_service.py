# src/services/apikey_service.py
import secrets
import string
import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.apikey import ApiKey, ApiKeyCreate, ApiKeyUpdate
from src.utils.crypto import get_crypto_service

logger = get_logger(__name__)


class ApiKeyService:
    """Service para operaÃ§Ãµes com API Keys"""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_api_key(self) -> str:
        """Gera uma nova API key com formato vf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"""
        # 32 caracteres alfanumÃ©ricos apÃ³s o prefixo vf_
        chars = string.ascii_letters + string.digits
        random_part = "".join(secrets.choice(chars) for _ in range(32))
        return f"vf_{random_part}"

    def _generate_api_secret(self) -> str:
        """Gera um novo API secret com 64 caracteres seguros"""
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return "".join(secrets.choice(chars) for _ in range(64))

    async def create_apikey(self, apikey_data: ApiKeyCreate) -> Tuple[ApiKey, str]:
        """Criar uma nova API key e retornar com o secret nÃ£o criptografado"""
        try:
            # Verificar se jÃ¡ existe uma API key com o mesmo nome
            existing_apikey = await self.get_apikey_by_name(apikey_data.keyName)
            if existing_apikey:
                raise ValueError(f"API Key com nome '{apikey_data.keyName}' jÃ¡ existe")

            # Gerar API key e secret
            api_key = self._generate_api_key()
            api_secret = self._generate_api_secret()

            # Verificar se a API key gerada jÃ¡ existe (improvÃ¡vel, mas seguro)
            existing_key = await self.get_apikey_by_key(api_key)
            if existing_key:
                # Tentar novamente uma vez
                api_key = self._generate_api_key()
                existing_key = await self.get_apikey_by_key(api_key)
                if existing_key:
                    raise RuntimeError("Erro ao gerar API key Ãºnica")

            # Criptografar o secret antes de salvar
            encrypted_secret = get_crypto_service().encrypt_text(api_secret)

            # Criar o modelo SQLAlchemy
            db_apikey = ApiKey(
                apiKey=api_key,
                apiSecret=encrypted_secret,
                keyName=apikey_data.keyName,
            )

            # Salvar no banco
            self.db.add(db_apikey)
            await self.db.commit()
            await self.db.refresh(db_apikey)

            logger.info(
                f"API Key criada: {apikey_data.keyName} (key: {api_key[:8]}...)"
            )
            return db_apikey, api_secret

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar API key: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar API key: {str(e)}") from e

    async def get_apikey_by_id(self, apikey_id: uuid.UUID) -> Optional[ApiKey]:
        """Obter uma API key por ID"""
        try:
            stmt = select(ApiKey).where(ApiKey.id == apikey_id)
            result = await self.db.execute(stmt)
            apikey = result.scalar_one_or_none()

            if not apikey:
                logger.debug(f"API Key nÃ£o encontrada: {apikey_id}")

            return apikey

        except Exception as e:
            logger.error(f"Erro ao buscar API key por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar API key: {str(e)}") from e

    async def get_apikey_by_key(self, api_key: str) -> Optional[ApiKey]:
        """Obter uma API key pela chave pÃºblica"""
        try:
            stmt = select(ApiKey).where(ApiKey.apiKey == api_key)
            result = await self.db.execute(stmt)
            apikey = result.scalar_one_or_none()

            if not apikey:
                logger.debug(f"API Key nÃ£o encontrada: {api_key[:8]}...")

            return apikey

        except Exception as e:
            logger.error(f"Erro ao buscar API key por chave: {str(e)}")
            raise RuntimeError(f"Erro ao buscar API key: {str(e)}") from e

    async def get_apikey_by_name(self, name: str) -> Optional[ApiKey]:
        """Obter uma API key por nome"""
        try:
            stmt = select(ApiKey).where(ApiKey.keyName == name)
            result = await self.db.execute(stmt)
            apikey = result.scalar_one_or_none()

            if not apikey:
                logger.debug(f"API Key nÃ£o encontrada: {name}")

            return apikey

        except Exception as e:
            logger.error(f"Erro ao buscar API key por nome: {str(e)}")
            raise RuntimeError(f"Erro ao buscar API key: {str(e)}") from e

    async def validate_api_credentials(
        self, api_key: str, api_secret: str
    ) -> Optional[ApiKey]:
        """Validar credenciais da API key"""
        try:
            # Buscar a API key
            apikey = await self.get_apikey_by_key(api_key)
            if not apikey:
                logger.debug(f"API Key nÃ£o encontrada para validaÃ§Ã£o: {api_key[:8]}...")
                return None

            # Descriptografar e comparar o secret
            try:
                decrypted_secret = get_crypto_service().decrypt_text(apikey.apiSecret)
                if decrypted_secret == api_secret:
                    return apikey

                logger.debug(f"API Secret invÃ¡lido para key: {api_key[:8]}...")
                return None
            except Exception as decrypt_error:
                logger.error(f"Erro ao descriptografar API secret: {decrypt_error}")
                return None

        except Exception as e:
            logger.error(f"Erro ao validar credenciais da API: {str(e)}")
            return None

    async def list_apikeys(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        order_by: str = "updatedDate",
        order_desc: bool = True,
    ) -> Tuple[List[ApiKey], int]:
        """Listar API keys com filtros e paginaÃ§Ã£o"""
        try:
            # Validar campo de ordenaÃ§Ã£o
            valid_order_fields = ["updatedDate", "keyName", "apiKey", "id"]
            if order_by not in valid_order_fields:
                logger.warning(
                    f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando updatedDate"
                )
                order_by = "updatedDate"

            # Query base para contar
            count_stmt = select(func.count(ApiKey.id))

            # Query base para dados
            stmt = select(ApiKey)

            # Aplicar filtros
            filters = []
            if search:
                search_filter = or_(
                    ApiKey.keyName.ilike(f"%{search}%"),
                    ApiKey.apiKey.ilike(f"%{search}%"),
                )
                filters.append(search_filter)

            if filters:
                count_stmt = count_stmt.where(and_(*filters))
                stmt = stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Aplicar ordenaÃ§Ã£o
            order_column = getattr(ApiKey, order_by, ApiKey.updatedDate)
            if order_desc:
                stmt = stmt.order_by(order_column.desc())
            else:
                stmt = stmt.order_by(order_column.asc())

            # Aplicar paginaÃ§Ã£o
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            apikeys = result.scalars().all()
            return list(apikeys), total or 0

        except Exception as e:
            logger.error(f"Erro ao listar API keys: {str(e)}")
            raise RuntimeError(f"Erro ao listar API keys: {str(e)}") from e

    async def update_apikey(
        self, apikey_id: uuid.UUID, apikey_update: ApiKeyUpdate
    ) -> Optional[ApiKey]:
        """Atualizar uma API key existente"""
        try:
            # Buscar a API key
            apikey = await self.get_apikey_by_id(apikey_id)
            if not apikey:
                logger.warning(f"API Key nÃ£o encontrada: {apikey_id}")
                return None

            # Se o nome mudar, validar duplicidade
            if apikey_update.keyName and apikey_update.keyName != apikey.keyName:
                existing = await self.get_apikey_by_name(apikey_update.keyName)
                if existing and str(existing.id) != str(apikey_id):
                    raise ValueError(
                        f"API Key com nome '{apikey_update.keyName}' jÃ¡ existe"
                    )

            # Aplicar campos atualizados
            data = apikey_update.model_dump(exclude_unset=True)
            for key, value in data.items():
                if hasattr(apikey, key):
                    setattr(apikey, key, value)

            # Atualizar timestamp
            apikey.updatedDate = datetime.now()

            # Salvar
            await self.db.commit()
            await self.db.refresh(apikey)
            logger.info(f"API Key atualizada: {apikey.keyName}")
            return apikey

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar API key: {e}")
            raise RuntimeError(f"Erro ao atualizar API key: {str(e)}") from e

    async def delete_apikey(self, apikey_id: uuid.UUID) -> bool:
        """Deletar uma API key"""
        try:
            apikey = await self.get_apikey_by_id(apikey_id)
            if not apikey:
                logger.warning(f"API Key nÃ£o encontrada para deleÃ§Ã£o: {apikey_id}")
                return False

            await self.db.delete(apikey)
            await self.db.commit()
            logger.info(f"API Key deletada: {apikey.keyName}")
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar API key: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar API key: {str(e)}") from e

    async def regenerate_secret(
        self, apikey_id: uuid.UUID
    ) -> Optional[Tuple[ApiKey, str]]:
        """Regenerar o secret de uma API key"""
        try:
            apikey = await self.get_apikey_by_id(apikey_id)
            if not apikey:
                logger.warning(f"API Key nÃ£o encontrada para regeneraÃ§Ã£o: {apikey_id}")
                return None

            # Gerar novo secret
            new_secret = self._generate_api_secret()
            encrypted_secret = get_crypto_service().encrypt_text(new_secret)

            # Atualizar no banco
            apikey.apiSecret = encrypted_secret
            apikey.updatedDate = datetime.now()

            await self.db.commit()
            await self.db.refresh(apikey)

            logger.info(f"Secret regenerado para API Key: {apikey.keyName}")
            return apikey, new_secret

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao regenerar secret: {str(e)}")
            raise RuntimeError(f"Erro ao regenerar secret: {str(e)}") from e


def get_apikey_service(db: AsyncSession = Depends(get_db)) -> ApiKeyService:
    """Factory function para criar instÃ¢ncia do ApiKeyService"""
    return ApiKeyService(db)
