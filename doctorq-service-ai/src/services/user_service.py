# src/services/user_service.py
import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from fastapi import Depends, HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.cache_config import get_cache_client
from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import (
    PapelUsuario,
    User,
    UserChatInfo,
    UserCreate,
    UserRegister,
    UserLoginLocal,
    UserUpdate,
)
from src.services.sei.sei_service import SeiService
from src.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
)

logger = get_logger(__name__)


class UserService:
    """Service para operaÃ§Ãµes com usuÃ¡rios"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_data: UserCreate) -> User:
        """Criar um novo usuário"""
        try:
            # Normalizar email (trim + lower) e verificar duplicidade
            normalized_email = user_data.nm_email.strip().lower()
            existing_email = await self.get_user_by_email(normalized_email)
            if existing_email:
                raise ValueError(f"Usuário com email '{user_data.nm_email}' jÃ¡ existe")

            # Mapear campos do Pydantic para SQLAlchemy
            # Ignorar Microsoft ID ao criar novo usuÃ¡rio
            db_user = User(
                nm_email=normalized_email,
                nm_completo=user_data.nm_completo,
                nm_papel=(
                    user_data.nm_papel.value
                    if user_data.nm_papel
                    else PapelUsuario.USUARIO.value
                ),
                st_ativo=user_data.st_ativo or "S",
                dt_ultimo_login=datetime.now(),
                nr_total_logins="1",
            )

            self.db.add(db_user)
            await self.db.commit()
            await self.db.refresh(db_user)

            logger.info(f"Usuário criado: {user_data.nm_email}")
            return db_user

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao criar Usuário: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar Usuário: {str(e)}") from e

    async def register_local_user(self, register_data: UserRegister) -> User:
        """Registrar usuário local com email/senha."""
        # Normalizar email e validar duplicidade
        normalized_email = register_data.nm_email.strip().lower()
        existing_email = await self.get_user_by_email(normalized_email)
        if existing_email:
            raise ValueError("Email já cadastrado")

        password_hash = hash_password(register_data.senha)
        db_user = User(
            nm_email=normalized_email,
            nm_completo=register_data.nm_completo,
            nm_papel=(register_data.nm_papel or PapelUsuario.USUARIO).value,
            st_ativo="S",
            dt_ultimo_login=None,
            nr_total_logins="0",
            nm_password_hash=password_hash,
        )
        try:
            self.db.add(db_user)
            await self.db.commit()
            await self.db.refresh(db_user)
            logger.info(f"Usuário registrado: {register_data.nm_email}")
            return db_user
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao registrar usuário: {e}")
            raise

    async def login_local(self, login_data: UserLoginLocal) -> str:
        """Login local e geração de JWT."""
        normalized_email = login_data.nm_email.strip().lower()
        user = await self.get_user_by_email(normalized_email)
        logger.debug(f"[LOGIN] User found: {user is not None}, email: {normalized_email}")
        if user:
            hash_preview = user.nm_password_hash[:40] if user.nm_password_hash else "None"
            logger.debug(f"[LOGIN] User hash present: {user.nm_password_hash is not None}, hash length: {len(user.nm_password_hash) if user.nm_password_hash else 0}, preview: {hash_preview}")
        if not user or not user.nm_password_hash:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        password_valid = verify_password(login_data.senha, user.nm_password_hash)
        logger.debug(f"[LOGIN] Password valid: {password_valid}")
        if not password_valid:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")

        # Atualiza metadados de login
        user.dt_ultimo_login = datetime.now()
        user.nr_total_logins = str(int(user.nr_total_logins) + 1)
        await self.db.commit()

        # Cria JWT com claims completos (incluindo id_empresa)
        claims = {
            "role": user.nm_papel,
            "uid": str(user.id_user),
            "id_empresa": str(user.id_empresa) if user.id_empresa else None,
        }
        token = create_access_token(subject=user.nm_email, additional_claims=claims)
        return token

    async def oauth_login(self, oauth_data: "UserOAuthLogin") -> Tuple[User, str]:
        """
        Login/registro via OAuth (Google, Microsoft, Apple).
        Cria usuário se não existir, atualiza se já existir.
        Retorna (user, access_token)
        """
        from src.models.user import UserOAuthLogin

        normalized_email = oauth_data.email.strip().lower()

        # Buscar usuário existente por email
        user = await self.get_user_by_email(normalized_email)

        if user:
            # Usuário já existe - atualizar informações e metadados de login
            logger.info(
                f"Usuário OAuth já existe: {normalized_email} (provider: {oauth_data.provider})"
            )

            # Atualizar nome se vier diferente
            if oauth_data.name and oauth_data.name != user.nm_completo:
                user.nm_completo = oauth_data.name

            # Atualizar foto se fornecida
            if oauth_data.image:
                user.ds_foto_url = oauth_data.image

            # Atualizar metadados de login
            user.dt_ultimo_login = datetime.now()
            user.nr_total_logins = str(int(user.nr_total_logins or "0") + 1)
            user.dt_atualizacao = datetime.now()

            await self.db.commit()
            await self.db.refresh(user)

        else:
            # Criar novo usuário
            logger.info(
                f"Criando novo usuário OAuth: {normalized_email} (provider: {oauth_data.provider})"
            )

            user = User(
                nm_email=normalized_email,
                nm_completo=oauth_data.name,
                nm_papel=PapelUsuario.USUARIO.value,
                st_ativo="S",
                dt_ultimo_login=datetime.now(),
                nr_total_logins="1",
                ds_foto_url=oauth_data.image,
                nm_password_hash=None,  # OAuth users don't have password
            )

            try:
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)
                logger.info(f"Usuário OAuth criado com sucesso: {normalized_email}")
            except Exception as e:
                await self.db.rollback()
                logger.error(f"Erro ao criar usuário OAuth: {e}")
                raise RuntimeError(f"Erro ao criar usuário OAuth: {str(e)}") from e

        # Gerar JWT token com claims completos (incluindo id_empresa)
        claims = {
            "role": user.nm_papel,
            "uid": str(user.id_user),
            "id_empresa": str(user.id_empresa) if user.id_empresa else None,
        }
        token = create_access_token(subject=user.nm_email, additional_claims=claims)

        return user, token


    async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Obter usuÃ¡rio por ID"""
        try:
            stmt = select(User).where(User.id_user == user_id)
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                logger.debug(f"UsuÃ¡rio nÃ£o encontrado: {user_id}")

            return user

        except Exception as e:
            logger.error(f"Erro ao buscar usuÃ¡rio por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar usuÃ¡rio: {str(e)}") from e


    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Obter usuÃ¡rio por email"""
        try:
            normalized_email = email.strip().lower()
            stmt = select(User).where(func.lower(User.nm_email) == normalized_email)
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                logger.debug(f"UsuÃ¡rio nÃ£o encontrado por email: {normalized_email}")

            return user

        except Exception as e:
            logger.error(f"Erro ao buscar usuÃ¡rio por email: {str(e)}")
            raise RuntimeError(f"Erro ao buscar usuÃ¡rio: {str(e)}") from e

    async def get_user_chat_info(self, user_id: uuid.UUID) -> Optional[UserChatInfo]:
        """Obter informaÃ§Ãµes do usuÃ¡rio para uso em chat/agentes"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return None

            return UserChatInfo(
                id_user=user.id_user,
                nm_display=user.nm_display or user.nm_primeiro or user.nm_completo,
                nm_email=user.nm_email,
                nm_papel=PapelUsuario(user.nm_papel),
            )

        except Exception as e:
            logger.error(f"Erro ao buscar info de chat do usuÃ¡rio: {str(e)}")
            raise RuntimeError(f"Erro ao buscar informaÃ§Ãµes: {str(e)}") from e

    async def update_user(
        self, user_id: uuid.UUID, user_update: UserUpdate
    ) -> Optional[User]:
        """Atualizar um usuÃ¡rio existente"""
        try:
            # Buscar o usuÃ¡rio
            user = await self.get_user_by_id(user_id)
            if not user:
                logger.warning(f"UsuÃ¡rio nÃ£o encontrado: {user_id}")
                return None

            # Aplicar os campos que vieram no payload
            data = user_update.model_dump(exclude_unset=True)
            field_map = {
                "nm_completo": "nm_completo",
                "nm_papel": "nm_papel",
                "st_ativo": "st_ativo",
            }

            for key, attr in field_map.items():
                if key in data:
                    value = data[key]
                    if key == "nm_papel" and value:
                        value = value.value  # Converter enum para string
                    setattr(user, attr, value)

            # Atualizar timestamp
            user.dt_atualizacao = datetime.now()

            # Persistir e retornar
            await self.db.commit()
            await self.db.refresh(user)
            logger.info(f"UsuÃ¡rio atualizado: {user.nm_email}")
            return user

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar usuÃ¡rio: {e}")
            raise RuntimeError(f"Erro ao atualizar usuÃ¡rio: {str(e)}") from e

    async def delete_user(self, user_id: uuid.UUID) -> bool:
        """Deletar um usuÃ¡rio"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                logger.warning(f"UsuÃ¡rio nÃ£o encontrado para deleÃ§Ã£o: {user_id}")
                return False

            await self.db.delete(user)
            await self.db.commit()
            logger.info(f"UsuÃ¡rio deletado: {user.nm_email}")
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar usuÃ¡rio: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar usuÃ¡rio: {str(e)}") from e

    async def deactivate_user(self, user_id: uuid.UUID) -> Optional[User]:
        """Desativar usuÃ¡rio (st_ativo = 'N')"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return None

            user.st_ativo = "N"
            user.dt_atualizacao = datetime.now()

            await self.db.commit()
            await self.db.refresh(user)
            logger.info(f"UsuÃ¡rio desativado: {user.nm_email}")
            return user

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao desativar usuÃ¡rio: {str(e)}")
            raise RuntimeError(f"Erro ao desativar usuÃ¡rio: {str(e)}") from e

    async def list_users(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        papel_filter: Optional[PapelUsuario] = None,
        ativo_filter: Optional[str] = None,
        empresa_filter: Optional[uuid.UUID] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
    ) -> Tuple[List[User], int]:
        """Listar usuÃ¡rios com filtros e paginaÃ§Ã£o"""
        try:
            # Validar campo de ordenaÃ§Ã£o
            valid_order_fields = [
                "dt_criacao",
                "dt_atualizacao",
                "nm_completo",
                "nm_email",
                "nm_papel",
                "dt_ultimo_login",
                "nr_total_logins",
            ]
            if order_by not in valid_order_fields:
                logger.warning(
                    f"Campo de ordenaÃ§Ã£o invÃ¡lido: {order_by}, usando dt_criacao"
                )
                order_by = "dt_criacao"

            # Query base para contar
            count_stmt = select(func.count(User.id_user))

            # Query base para dados
            stmt = select(User)

            # Aplicar filtros
            filters = []
            if search:
                search_filter = or_(
                    User.nm_completo.ilike(f"%{search}%"),
                    User.nm_email.ilike(f"%{search}%"),
                )
                filters.append(search_filter)

            if papel_filter:
                filters.append(User.nm_papel == papel_filter.value)

            if ativo_filter:
                filters.append(User.st_ativo == ativo_filter)

            if empresa_filter:
                filters.append(User.id_empresa == empresa_filter)

            if filters:
                count_stmt = count_stmt.where(and_(*filters))
                stmt = stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Aplicar ordenaÃ§Ã£o
            order_column = getattr(User, order_by, User.dt_criacao)
            if order_desc:
                stmt = stmt.order_by(order_column.desc())
            else:
                stmt = stmt.order_by(order_column.asc())

            # Aplicar paginaÃ§Ã£o
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            users = result.scalars().all()
            return list(users), total

        except Exception as e:
            logger.error(f"Erro ao listar usuÃ¡rios: {str(e)}")
            raise RuntimeError(f"Erro ao listar usuÃ¡rios: {str(e)}") from e

    def _extrair_nome_login(self, email: str) -> str:
        """Extrai nome_login do email (parte antes do @)"""
        try:
            if "@" in email:
                return email.split("@")[0]
            return email
        except Exception as e:
            logger.error(f"Erro ao extrair nome_login do email {email}: {str(e)}")
            return email

    async def get_unidade_sei(self, user_id: str) -> Dict:
        """Recupera unidades SEI do usuÃ¡rio do Redis"""
        try:
            redis_client = await get_cache_client()
            if not redis_client:
                logger.warning("Redis nÃ£o disponÃ­vel para buscar unidades SEI")
                return {"unidades": [], "total": 0, "ultimo_sync": None}

            cache_key = f"user:{user_id}:sei:unidades"
            cached_data = await redis_client.get(cache_key)

            if cached_data:
                data = json.loads(cached_data)
                logger.debug(
                    f"Unidades SEI recuperadas do cache para usuÃ¡rio {user_id}"
                )
                return data

            logger.debug(
                f"Nenhuma unidade SEI encontrada no cache para usuÃ¡rio {user_id}"
            )
            return {"unidades": [], "total": 0, "ultimo_sync": None}

        except Exception as e:
            logger.error(
                f"Erro ao recuperar unidades SEI do usuÃ¡rio {user_id}: {str(e)}"
            )
            return {"unidades": [], "total": 0, "ultimo_sync": None}

    async def sync_sei_unidades(self, user_email: str, user_id: str):
        """Sincroniza unidades SEI do usuÃ¡rio no login"""
        try:
            # Extrair nome_login do email
            nome_login = self._extrair_nome_login(user_email)
            logger.debug(f"Sincronizando unidades SEI para usuÃ¡rio {nome_login}")

            # Buscar usuÃ¡rio no SEI
            sei_service = SeiService(db_session=self.db)
            resultado_usuario = await sei_service.pesquisar_usuario(nome_login)

            if not resultado_usuario.success or not resultado_usuario.data:
                logger.info(f"UsuÃ¡rio {nome_login} nÃ£o encontrado no SEI")
                await self._salvar_unidades_redis(user_id, [])
                return

            # Pegar primeiro usuÃ¡rio encontrado
            usuario_sei = resultado_usuario.data[0]

            # Buscar unidades do usuÃ¡rio
            resultado_unidades = await sei_service.pesquisar_usuario_unidade(
                usuario_sei.id_usuario
            )

            unidades = []
            if resultado_unidades.success and resultado_unidades.data:
                unidades = [unidade.to_dict() for unidade in resultado_unidades.data]

            # Salvar no Redis
            await self._salvar_unidades_redis(user_id, unidades)
            logger.info(
                f"Sincronizadas {len(unidades)} unidades SEI para usuÃ¡rio {user_id}"
            )

        except Exception as e:
            logger.error(
                f"Erro ao sincronizar unidades SEI para usuÃ¡rio {user_email}: {str(e)}"
            )
            # Em caso de erro, salvar lista vazia no cache para evitar tentativas repetidas
            await self._salvar_unidades_redis(user_id, [])

    async def _salvar_unidades_redis(self, user_id: str, unidades: List[Dict]):
        """Salva unidades SEI no Redis"""
        try:
            redis_client = await get_cache_client()
            if not redis_client:
                logger.warning("Redis nÃ£o disponÃ­vel para salvar unidades SEI")
                return

            cache_key = f"user:{user_id}:sei:unidades"
            data_with_timestamp = {
                "unidades": unidades,
                "ultimo_sync": datetime.now().isoformat(),
                "total": len(unidades),
            }

            # TTL de 24 horas
            ttl = timedelta(hours=24)
            await redis_client.setex(
                cache_key,
                int(ttl.total_seconds()),
                json.dumps(data_with_timestamp, default=str),
            )

            logger.debug(
                f"Unidades SEI salvas no cache para usuÃ¡rio {user_id} com TTL de 24h"
            )

        except Exception as e:
            logger.error(
                f"Erro ao salvar unidades SEI no Redis para usuÃ¡rio {user_id}: {str(e)}"
            )

    def schedule_sei_sync_background(self, user_email: str, user_id: str):
        """
        Agenda sincronizaÃ§Ã£o SEI em background (nÃ£o-bloqueante)
        Para ser chamado no login sem afetar a experiÃªncia do usuÃ¡rio
        """
        try:
            # Criar task assÃ­ncrona em background
            asyncio.create_task(self._sync_sei_background(user_email, user_id))
            logger.debug(
                f"Task de sincronizaÃ§Ã£o SEI agendada para usuÃ¡rio {user_email}"
            )
        except Exception as e:
            logger.error(f"Erro ao agendar sincronizaÃ§Ã£o SEI em background: {str(e)}")

    async def _sync_sei_background(self, user_email: str, user_id: str):
        """
        Executa sincronizaÃ§Ã£o SEI em background com tratamento robusto de erros
        NÃ£o deve afetar o login do usuÃ¡rio, apenas logar erros
        """
        try:
            logger.debug(f"Iniciando sincronizaÃ§Ã£o SEI em background para {user_email}")

            # Aguardar um pouco para nÃ£o impactar o login
            await asyncio.sleep(2)

            # Extrair nome_login do email
            nome_login = self._extrair_nome_login(user_email)

            # Buscar usuÃ¡rio no SEI
            sei_service = SeiService(db_session=self.db)
            resultado_usuario = await sei_service.pesquisar_usuario(nome_login)

            if not resultado_usuario.success or not resultado_usuario.data:
                logger.info(
                    f"UsuÃ¡rio {nome_login} nÃ£o encontrado no SEI (background sync)"
                )
                await self._salvar_unidades_redis(user_id, [])
                return

            # Pegar primeiro usuÃ¡rio encontrado
            usuario_sei = resultado_usuario.data[0]

            # Buscar unidades do usuÃ¡rio
            resultado_unidades = await sei_service.pesquisar_usuario_unidade(
                usuario_sei.id_usuario
            )

            unidades = []
            if resultado_unidades.success and resultado_unidades.data:
                unidades = [unidade.to_dict() for unidade in resultado_unidades.data]

            # Salvar no Redis
            await self._salvar_unidades_redis(user_id, unidades)
            logger.info(
                f"[Background] Sincronizadas {len(unidades)} unidades SEI para usuÃ¡rio {user_email}"
            )

        except Exception as e:
            logger.error(
                f"[Background] Erro na sincronizaÃ§Ã£o SEI para {user_email}: {str(e)}"
            )
            # Salvar lista vazia no cache para evitar tentativas repetidas desnecessÃ¡rias
            try:
                await self._salvar_unidades_redis(user_id, [])
            except Exception as cache_error:
                logger.error(f"[Background] Erro ao salvar cache vazio: {cache_error}")

    async def force_sei_sync(self, user_email: str, user_id: str) -> Dict:
        """
        ForÃ§a sincronizaÃ§Ã£o SEI imediata (para retry manual)
        Retorna resultado da sincronizaÃ§Ã£o
        """
        try:
            logger.info(f"SincronizaÃ§Ã£o SEI forÃ§ada para usuÃ¡rio {user_email}")
            await self.sync_sei_unidades(user_email, user_id)

            # Retornar dados atualizados
            return await self.get_unidade_sei(user_id)

        except Exception as e:
            logger.error(
                f"Erro na sincronizaÃ§Ã£o SEI forÃ§ada para {user_email}: {str(e)}"
            )
            return {"unidades": [], "total": 0, "ultimo_sync": None, "erro": str(e)}

    async def change_password(
        self, user_id: uuid.UUID, senha_atual: str, senha_nova: str
    ) -> bool:
        """
        Altera a senha do usuário

        Args:
            user_id: ID do usuário
            senha_atual: Senha atual para validação
            senha_nova: Nova senha a ser definida

        Returns:
            bool: True se senha alterada com sucesso

        Raises:
            ValueError: Se senha atual incorreta ou usuário não encontrado
            Exception: Outros erros
        """
        try:
            from src.utils.security import verify_password, get_password_hash

            # Buscar usuário
            query = select(User).where(User.id_user == user_id)
            result = await self.db.execute(query)
            user = result.scalar_one_or_none()

            if not user:
                raise ValueError("Usuário não encontrado")

            # Verificar se usuário tem senha cadastrada (pode ser OAuth only)
            if not user.nm_password_hash:
                raise ValueError(
                    "Este usuário não possui senha. Utilize login social (Google/Microsoft/Apple)"
                )

            # Verificar senha atual
            if not verify_password(senha_atual, user.nm_password_hash):
                raise ValueError("Senha atual incorreta")

            # Hash da nova senha
            new_hash = get_password_hash(senha_nova)

            # Atualizar senha
            user.nm_password_hash = new_hash
            user.dt_atualizacao = func.now()

            await self.db.commit()
            await self.db.refresh(user)

            logger.info(f"Senha alterada com sucesso para usuário {user_id}")
            return True

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao alterar senha do usuário {user_id}: {str(e)}")
            raise


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Factory function para criar instÃ¢ncia do UserService"""
    return UserService(db)
