# src/services/perfil_service.py
import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.perfil import Perfil, PerfilCreate, PerfilUpdate

logger = get_logger(__name__)


class PerfilService:
    """Service para operações com perfis"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_perfil(self, perfil_data: PerfilCreate) -> Perfil:
        """Criar um novo perfil"""
        try:
            # Converter permissões Pydantic para dict
            permissoes_dict = perfil_data.ds_permissoes.model_dump()

            # Criar perfil
            db_perfil = Perfil(
                id_empresa=perfil_data.id_empresa,
                nm_perfil=perfil_data.nm_perfil,
                ds_perfil=perfil_data.ds_perfil,
                nm_tipo=perfil_data.nm_tipo,
                ds_permissoes=permissoes_dict,
                ds_grupos_acesso=perfil_data.ds_grupos_acesso or [],
                ds_permissoes_detalhadas=perfil_data.ds_permissoes_detalhadas or {},
                ds_rotas_permitidas=perfil_data.ds_rotas_permitidas or [],
                st_ativo=perfil_data.st_ativo,
            )

            self.db.add(db_perfil)
            await self.db.commit()
            await self.db.refresh(db_perfil)

            logger.info(f"Perfil criado: {db_perfil.nm_perfil} (ID: {db_perfil.id_perfil})")
            return db_perfil

        except Exception as e:
            logger.error(f"Erro ao criar perfil: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao criar perfil: {str(e)}") from e

    async def get_perfil_by_id(
        self, perfil_id: uuid.UUID, include_empresa: bool = False
    ) -> Optional[Perfil]:
        """Obter um perfil por ID"""
        try:
            stmt = select(Perfil).where(Perfil.id_perfil == perfil_id)

            if include_empresa:
                stmt = stmt.options(selectinload(Perfil.empresa))

            result = await self.db.execute(stmt)
            perfil = result.scalar_one_or_none()

            if not perfil:
                logger.debug(f"Perfil não encontrado: {perfil_id}")

            return perfil

        except Exception as e:
            logger.error(f"Erro ao buscar perfil por ID: {str(e)}")
            raise RuntimeError(f"Erro ao buscar perfil: {str(e)}") from e

    async def list_perfis(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        tipo_filter: Optional[str] = None,
        empresa_id: Optional[uuid.UUID] = None,
        ativo_filter: Optional[str] = None,
        order_by: str = "dt_criacao",
        order_desc: bool = True,
        include_empresa: bool = False,
    ) -> Tuple[List[Perfil], int]:
        """Listar perfis com filtros e paginação"""
        try:
            # Validar campo de ordenação
            valid_order_fields = [
                "dt_criacao",
                "dt_atualizacao",
                "nm_perfil",
                "nm_tipo",
                "id_perfil",
            ]
            if order_by not in valid_order_fields:
                logger.warning(f"Campo de ordenação inválido: {order_by}, usando dt_criacao")
                order_by = "dt_criacao"

            # Query base para contar
            count_stmt = select(func.count(Perfil.id_perfil))

            # Query base para dados
            stmt = select(Perfil)

            if include_empresa:
                stmt = stmt.options(selectinload(Perfil.empresa))

            # Aplicar filtros
            filters = []
            if search:
                search_filter = or_(
                    Perfil.nm_perfil.ilike(f"%{search}%"),
                    Perfil.ds_perfil.ilike(f"%{search}%"),
                )
                filters.append(search_filter)

            if tipo_filter:
                filters.append(Perfil.nm_tipo == tipo_filter)

            if empresa_id:
                # Buscar perfis da empresa + perfis globais (id_empresa NULL)
                filters.append(
                    or_(Perfil.id_empresa == empresa_id, Perfil.id_empresa.is_(None))
                )

            if ativo_filter:
                filters.append(Perfil.st_ativo == ativo_filter)

            if filters:
                count_stmt = count_stmt.where(and_(*filters))
                stmt = stmt.where(and_(*filters))

            # Contar total
            total_result = await self.db.execute(count_stmt)
            total = total_result.scalar()

            # Aplicar ordenação
            order_column = getattr(Perfil, order_by, Perfil.dt_criacao)
            if order_desc:
                stmt = stmt.order_by(order_column.desc())
            else:
                stmt = stmt.order_by(order_column.asc())

            # Aplicar paginação
            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            # Executar query
            result = await self.db.execute(stmt)
            perfis = result.scalars().all()

            logger.debug(f"Listados {len(perfis)} perfis (total: {total})")
            return list(perfis), total

        except Exception as e:
            logger.error(f"Erro ao listar perfis: {str(e)}")
            raise RuntimeError(f"Erro ao listar perfis: {str(e)}") from e

    async def update_perfil(
        self,
        perfil_id: uuid.UUID,
        perfil_update: PerfilUpdate,
    ) -> Optional[Perfil]:
        """Atualizar um perfil existente"""
        try:
            # Buscar o perfil
            perfil = await self.get_perfil_by_id(perfil_id)
            if not perfil:
                logger.warning(f"Perfil não encontrado: {perfil_id}")
                return None

            # Aplicar os campos que vieram no payload
            data = perfil_update.model_dump(exclude_unset=True)

            # Validar se é perfil system e restringir campos editáveis
            is_system_profile = perfil.nm_tipo == "system"

            if is_system_profile:
                # Para perfis de sistema, permitir APENAS edição de rotas granulares
                allowed_fields = {"ds_rotas_permitidas"}
                requested_fields = set(data.keys())
                forbidden_fields = requested_fields - allowed_fields

                if forbidden_fields:
                    logger.warning(
                        f"Tentativa de editar campos protegidos em perfil de sistema {perfil_id}: {forbidden_fields}"
                    )
                    raise ValueError(
                        f"Perfis de sistema só permitem edição do campo 'ds_rotas_permitidas'. "
                        f"Campos não permitidos: {', '.join(forbidden_fields)}"
                    )

            # Aplicar atualizações (todos os campos para perfis custom, apenas ds_rotas_permitidas para system)
            if "nm_perfil" in data and not is_system_profile:
                perfil.nm_perfil = data["nm_perfil"]
            if "ds_perfil" in data and not is_system_profile:
                perfil.ds_perfil = data["ds_perfil"]
            if "ds_permissoes" in data and data["ds_permissoes"] and not is_system_profile:
                # ds_permissoes agora é Dict diretamente (não precisa converter)
                perfil.ds_permissoes = data["ds_permissoes"]
            if "ds_grupos_acesso" in data and not is_system_profile:
                perfil.ds_grupos_acesso = data["ds_grupos_acesso"]
            if "ds_permissoes_detalhadas" in data and not is_system_profile:
                perfil.ds_permissoes_detalhadas = data["ds_permissoes_detalhadas"]
            if "ds_rotas_permitidas" in data:
                # Este campo pode ser editado tanto em system quanto em custom
                perfil.ds_rotas_permitidas = data["ds_rotas_permitidas"]
            if "st_ativo" in data and not is_system_profile:
                perfil.st_ativo = data["st_ativo"]

            # Atualizar timestamp
            perfil.dt_atualizacao = datetime.now()

            await self.db.commit()
            await self.db.refresh(perfil)

            logger.info(f"Perfil atualizado: {perfil.nm_perfil}")
            return perfil

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao atualizar perfil: {e}")
            raise RuntimeError(f"Erro ao atualizar perfil: {str(e)}") from e

    async def delete_perfil(self, perfil_id: uuid.UUID) -> bool:
        """Deletar um perfil (soft delete - desativar)"""
        try:
            perfil = await self.get_perfil_by_id(perfil_id)
            if not perfil:
                logger.warning(f"Perfil não encontrado para deleção: {perfil_id}")
                return False

            # Validar se é perfil system
            if perfil.nm_tipo == "system":
                logger.warning(f"Tentativa de deletar perfil de sistema: {perfil_id}")
                raise ValueError("Perfis de sistema não podem ser deletados")

            # Soft delete
            perfil.st_ativo = "N"
            perfil.dt_atualizacao = datetime.now()

            await self.db.commit()

            logger.info(f"Perfil desativado: {perfil.nm_perfil}")
            return True

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro ao deletar perfil: {str(e)}")
            await self.db.rollback()
            raise RuntimeError(f"Erro ao deletar perfil: {str(e)}") from e

    async def count_usuarios_com_perfil(self, perfil_id: uuid.UUID) -> int:
        """Contar quantos usuários têm este perfil"""
        try:
            from src.models.user import User

            stmt = select(func.count(User.id_user)).where(User.id_perfil == perfil_id)
            result = await self.db.execute(stmt)
            count = result.scalar()

            return count or 0

        except Exception as e:
            logger.error(f"Erro ao contar usuários com perfil: {str(e)}")
            return 0

    async def get_perfis_disponiveis_para_empresa(
        self, empresa_id: Optional[uuid.UUID] = None
    ) -> List[Perfil]:
        """Obter perfis disponíveis para uma empresa (perfis da empresa + perfis globais)"""
        try:
            stmt = select(Perfil).where(
                and_(
                    Perfil.st_ativo == "S",
                    or_(Perfil.id_empresa == empresa_id, Perfil.id_empresa.is_(None)),
                )
            ).order_by(Perfil.nm_perfil.asc())

            result = await self.db.execute(stmt)
            perfis = result.scalars().all()

            return list(perfis)

        except Exception as e:
            logger.error(f"Erro ao buscar perfis disponíveis: {str(e)}")
            return []

    # ==========================================
    # NOVOS MÉTODOS - GESTÃO HIERÁRQUICA
    # ==========================================

    async def get_perfis_tree(self, tipo_acesso_filter: Optional[str] = None) -> List[dict]:
        """
        Obter perfis em estrutura de árvore hierárquica.

        Retorna perfis raiz com seus sub-perfis aninhados.
        """
        try:
            # Buscar todos os perfis system ativos
            stmt = select(Perfil).where(
                Perfil.st_ativo == "S",
                Perfil.nm_tipo == "system"
            )

            if tipo_acesso_filter:
                stmt = stmt.where(Perfil.nm_tipo_acesso == tipo_acesso_filter)

            stmt = stmt.order_by(Perfil.nm_tipo_acesso, Perfil.nr_ordem)

            result = await self.db.execute(stmt)
            all_perfis = list(result.scalars().all())

            # Criar dicionário de perfis por ID para lookup rápido
            perfis_dict = {str(p.id_perfil): p for p in all_perfis}

            # Construir árvore
            tree = []
            for perfil in all_perfis:
                if perfil.id_perfil_pai is None:
                    # Perfil raiz
                    perfil_data = await self._build_perfil_node(perfil, perfis_dict, all_perfis)
                    tree.append(perfil_data)

            return tree

        except Exception as e:
            logger.error(f"Erro ao buscar árvore de perfis: {str(e)}")
            return []

    async def _build_perfil_node(
        self, perfil: Perfil, perfis_dict: dict, all_perfis: List[Perfil]
    ) -> dict:
        """Helper para construir nó da árvore com sub-perfis."""
        from src.models.user import User

        # Contar usuários
        stmt = select(func.count(User.id_user)).where(User.id_perfil == perfil.id_perfil)
        result = await self.db.execute(stmt)
        nr_usuarios = result.scalar() or 0

        # Buscar sub-perfis diretos
        sub_perfis = [
            p for p in all_perfis
            if p.id_perfil_pai == perfil.id_perfil
        ]

        # Construir nós dos sub-perfis recursivamente
        children = []
        for sub in sub_perfis:
            child_node = await self._build_perfil_node(sub, perfis_dict, all_perfis)
            children.append(child_node)

        return {
            "id_perfil": str(perfil.id_perfil),
            "nm_perfil": perfil.nm_perfil,
            "ds_perfil": perfil.ds_perfil,
            "nm_tipo_acesso": perfil.nm_tipo_acesso,
            "id_perfil_pai": str(perfil.id_perfil_pai) if perfil.id_perfil_pai else None,
            "nr_ordem": perfil.nr_ordem,
            "st_ativo": perfil.st_ativo,
            "nr_usuarios": nr_usuarios,
            "children": children
        }

    async def get_perfis_stats_by_tipo(self) -> dict:
        """
        Obter estatísticas de perfis por tipo de acesso.

        Retorna contagem de perfis, sub-perfis e usuários por tipo.
        """
        try:
            from src.models.user import User

            # Buscar todos os perfis system ativos
            stmt = select(Perfil).where(
                Perfil.st_ativo == "S",
                Perfil.nm_tipo == "system"
            )
            result = await self.db.execute(stmt)
            all_perfis = list(result.scalars().all())

            # Agrupar por tipo de acesso
            stats = {}
            tipos_acesso = set([p.nm_tipo_acesso for p in all_perfis if p.nm_tipo_acesso])

            for tipo in sorted(tipos_acesso):
                perfis_do_tipo = [p for p in all_perfis if p.nm_tipo_acesso == tipo]
                perfis_raiz = [p for p in perfis_do_tipo if p.id_perfil_pai is None]
                sub_perfis = [p for p in perfis_do_tipo if p.id_perfil_pai is not None]

                # Contar usuários total do tipo
                perfil_ids = [p.id_perfil for p in perfis_do_tipo]
                stmt = select(func.count(User.id_user)).where(User.id_perfil.in_(perfil_ids))
                result = await self.db.execute(stmt)
                total_usuarios = result.scalar() or 0

                stats[tipo] = {
                    "nm_tipo_acesso": tipo,
                    "total_perfis": len(perfis_do_tipo),
                    "perfis_raiz": len(perfis_raiz),
                    "sub_perfis": len(sub_perfis),
                    "total_usuarios": total_usuarios,
                    "perfis": [
                        {
                            "id_perfil": str(p.id_perfil),
                            "nm_perfil": p.nm_perfil,
                            "ds_perfil": p.ds_perfil,
                            "is_raiz": p.id_perfil_pai is None
                        }
                        for p in perfis_do_tipo
                    ]
                }

            return {
                "stats_by_tipo": stats,
                "total_tipos": len(tipos_acesso),
                "total_perfis_system": len(all_perfis)
            }

        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas de perfis: {str(e)}")
            return {}

    async def get_permissoes_com_heranca(self, perfil_id: uuid.UUID) -> Optional[dict]:
        """
        Obter permissões completas de um perfil com herança do perfil pai.

        Combina permissões do perfil pai (se houver) com permissões próprias.
        As permissões do filho sobrescrevem as do pai.
        """
        try:
            perfil = await self.get_perfil_by_id(perfil_id)
            if not perfil:
                return None

            # Permissões do perfil atual
            permissoes = perfil.ds_permissoes or {}

            # Se tiver perfil pai, herdar permissões
            if perfil.id_perfil_pai:
                perfil_pai = await self.get_perfil_by_id(perfil.id_perfil_pai)
                if perfil_pai and perfil_pai.ds_permissoes:
                    # Combinar: permissões do pai + permissões próprias
                    # Permissões próprias sobrescrevem as do pai
                    permissoes_herdadas = perfil_pai.ds_permissoes.copy()
                    permissoes_herdadas.update(permissoes)
                    permissoes = permissoes_herdadas

            return {
                "id_perfil": str(perfil.id_perfil),
                "nm_perfil": perfil.nm_perfil,
                "id_perfil_pai": str(perfil.id_perfil_pai) if perfil.id_perfil_pai else None,
                "permissoes": permissoes,
                "tem_heranca": perfil.id_perfil_pai is not None
            }

        except Exception as e:
            logger.error(f"Erro ao buscar permissões com herança: {str(e)}")
            return None

    async def get_perfis_by_tipo_acesso(self, tipo_acesso: str) -> List[Perfil]:
        """Buscar perfis por tipo de acesso (admin, parceiro, fornecedor, paciente)."""
        try:
            stmt = select(Perfil).where(
                Perfil.nm_tipo_acesso == tipo_acesso,
                Perfil.st_ativo == "S",
                Perfil.nm_tipo == "system"
            ).order_by(
                Perfil.id_perfil_pai.is_(None).desc(),  # Perfis raiz primeiro
                Perfil.nr_ordem
            )

            result = await self.db.execute(stmt)
            perfis = list(result.scalars().all())

            return perfis

        except Exception as e:
            logger.error(f"Erro ao buscar perfis por tipo de acesso: {str(e)}")
            return []

    async def clone_perfil_template(
        self,
        id_perfil_template: uuid.UUID,
        id_empresa: uuid.UUID,
        nm_perfil_novo: Optional[str] = None
    ) -> Optional[Perfil]:
        """
        Clona um perfil template para uma empresa específica.

        Args:
            id_perfil_template: UUID do perfil template a ser clonado
            id_empresa: UUID da empresa para a qual clonar
            nm_perfil_novo: Nome customizado para o perfil clonado (opcional)

        Returns:
            Perfil clonado ou None se template não encontrado

        Raises:
            ValueError: Se perfil template não for template (fg_template=false)
        """
        try:
            # 1. Buscar perfil template
            perfil_template = await self.get_perfil_by_id(id_perfil_template)

            if not perfil_template:
                logger.error(f"Perfil template {id_perfil_template} não encontrado")
                return None

            # Validar que é um template
            if not perfil_template.fg_template:
                raise ValueError(f"Perfil {id_perfil_template} não é um template (fg_template=false)")

            # Validar que template é global (id_empresa = NULL)
            if perfil_template.id_empresa is not None:
                raise ValueError(f"Template deve ter id_empresa=NULL, mas tem: {perfil_template.id_empresa}")

            # 2. Verificar se já existe clone para esta empresa
            stmt = select(Perfil).where(
                Perfil.nm_perfil == perfil_template.nm_perfil,
                Perfil.id_empresa == id_empresa,
                Perfil.fg_template == False,
                Perfil.st_ativo == "S",
            )
            result = await self.db.execute(stmt)
            perfil_existente = result.scalar_one_or_none()

            if perfil_existente:
                logger.warning(
                    f"Perfil '{perfil_template.nm_perfil}' já existe para empresa {id_empresa}. "
                    "Retornando perfil existente."
                )
                return perfil_existente

            # 3. Criar clone do perfil
            nome_clone = nm_perfil_novo if nm_perfil_novo else perfil_template.nm_perfil

            perfil_clone = Perfil(
                id_perfil=uuid.uuid4(),
                id_empresa=id_empresa,
                nm_perfil=nome_clone,
                ds_perfil=perfil_template.ds_perfil,
                nm_tipo="custom",  # Clones são sempre custom
                st_ativo="S",
                fg_template=False,  # Clones NÃO são templates
                # Copiar permissões
                ds_permissoes=perfil_template.ds_permissoes.copy() if perfil_template.ds_permissoes else {},
                ds_grupos_acesso=(
                    perfil_template.ds_grupos_acesso.copy()
                    if perfil_template.ds_grupos_acesso else []
                ),
                ds_permissoes_detalhadas=(
                    perfil_template.ds_permissoes_detalhadas.copy()
                    if perfil_template.ds_permissoes_detalhadas else {}
                ),
                # Copiar hierarquia
                nm_tipo_acesso=perfil_template.nm_tipo_acesso,
                id_perfil_pai=perfil_template.id_perfil_pai,
                nr_ordem=perfil_template.nr_ordem,
            )

            self.db.add(perfil_clone)
            await self.db.commit()
            await self.db.refresh(perfil_clone)

            logger.info(
                f"✅ Perfil '{nome_clone}' clonado para empresa {id_empresa} | "
                f"Template: {id_perfil_template} → Clone: {perfil_clone.id_perfil}"
            )

            return perfil_clone

        except ValueError:
            raise  # Re-raise validation errors
        except Exception as e:
            logger.error(f"Erro ao clonar perfil template: {str(e)}")
            await self.db.rollback()
            return None


def get_perfil_service(db: AsyncSession = Depends(get_db)) -> PerfilService:
    """Factory function para criar instância do PerfilService"""
    return PerfilService(db)
