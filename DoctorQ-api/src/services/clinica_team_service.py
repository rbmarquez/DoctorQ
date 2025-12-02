# src/services/clinica_team_service.py
"""
Service para gestão de equipe (sub-usuários) de clínicas.

Este service implementa a lógica de negócio para:
- Criação de sub-usuários (Recepcionista, Financeiro, etc.)
- Validação de limites de usuários por empresa/clínica
- Listagem e remoção de membros da equipe
- Controle de permissões (apenas admin de clínica pode gerenciar)
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.models.empresa import Empresa
from src.models.perfil import Perfil
from src.models.user import User
from src.services.email_service import email_service
from src.utils.security import hash_password

logger = get_logger(__name__)


class ClinicaTeamService:
    """Service para operações de gestão de equipe de clínicas"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def validar_permissao_admin(
        self, id_usuario: uuid.UUID, id_empresa: uuid.UUID
    ) -> bool:
        """
        Valida se usuário tem permissão de administrador da clínica.

        Retorna True se:
        - Usuário pertence à empresa
        - Usuário tem perfil com grupo 'clinica' ou 'admin'
        - Usuário tem permissão 'clinica.usuarios.criar'

        Args:
            id_usuario: UUID do usuário a validar
            id_empresa: UUID da empresa/clínica

        Returns:
            True se tem permissão, False caso contrário
        """
        try:
            stmt = (
                select(User, Perfil)
                .join(Perfil, User.id_perfil == Perfil.id_perfil)
                .where(
                    and_(
                        User.id_user == id_usuario,
                        User.id_empresa == id_empresa,
                        User.st_ativo == "S",
                    )
                )
            )
            result = await self.db.execute(stmt)
            row = result.first()

            if not row:
                return False

            user, perfil = row

            # Verificar se tem grupo 'admin' ou 'clinica'
            grupos = perfil.ds_grupos_acesso or []
            if "admin" in grupos:
                return True

            if "clinica" not in grupos:
                return False

            # Verificar permissões detalhadas
            permissoes = perfil.ds_permissoes_detalhadas or {}
            clinica_perms = permissoes.get("clinica", {})
            usuarios_perms = clinica_perms.get("usuarios", {})

            return usuarios_perms.get("criar", False)

        except Exception as e:
            logger.error(f"Erro ao validar permissão de admin: {str(e)}")
            return False

    async def verificar_limite(self, id_empresa: uuid.UUID) -> Dict:
        """
        Verifica status do limite de usuários da empresa.

        Args:
            id_empresa: UUID da empresa

        Returns:
            Dict com:
            - qt_limite_usuarios: limite configurado
            - qt_usuarios_atuais: usuários ativos atuais
            - qt_usuarios_disponiveis: vagas disponíveis
            - fg_limite_atingido: True se limite foi atingido
        """
        try:
            # Buscar empresa
            stmt_empresa = select(Empresa).where(Empresa.id_empresa == id_empresa)
            result_empresa = await self.db.execute(stmt_empresa)
            empresa = result_empresa.scalar_one_or_none()

            if not empresa:
                raise HTTPException(status_code=404, detail="Empresa não encontrada")

            # Contar usuários ativos
            stmt_count = select(func.count(User.id_user)).where(
                and_(User.id_empresa == id_empresa, User.st_ativo == "S")
            )
            result_count = await self.db.execute(stmt_count)
            qt_usuarios_atuais = result_count.scalar() or 0

            qt_limite = empresa.qt_limite_usuarios or 5
            qt_disponiveis = qt_limite - qt_usuarios_atuais
            fg_limite_atingido = qt_usuarios_atuais >= qt_limite

            return {
                "qt_limite_usuarios": qt_limite,
                "qt_usuarios_atuais": qt_usuarios_atuais,
                "qt_usuarios_disponiveis": qt_disponiveis,
                "fg_limite_atingido": fg_limite_atingido,
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erro ao verificar limite de usuários: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao verificar limite: {str(e)}"
            )

    async def verificar_e_notificar_limite(
        self, id_empresa: uuid.UUID
    ) -> None:
        """
        Verifica percentual de uso do limite de usuários e envia notificação se >= 90%.

        A notificação é enviada para o(s) administrador(es) da empresa.

        Args:
            id_empresa: UUID da empresa/clínica
        """
        try:
            # Buscar informações do limite
            limite_info = await self.verificar_limite(id_empresa)

            qt_usuarios_atuais = limite_info["qt_usuarios_atuais"]
            qt_limite = limite_info["qt_limite_usuarios"]

            # Calcular percentual
            if qt_limite > 0:
                percentual = (qt_usuarios_atuais / qt_limite) * 100
            else:
                percentual = 0

            # Enviar notificação apenas se >= 90%
            if percentual >= 90.0:
                # Buscar empresa e administrador principal
                stmt_empresa = select(Empresa).where(Empresa.id_empresa == id_empresa)
                result_empresa = await self.db.execute(stmt_empresa)
                empresa = result_empresa.scalar_one_or_none()

                if not empresa:
                    logger.warning(f"Empresa {id_empresa} não encontrada para notificação")
                    return

                # Buscar administrador principal (primeiro admin ativo)
                stmt_admin = (
                    select(User, Perfil)
                    .join(Perfil, User.id_perfil == Perfil.id_perfil)
                    .where(
                        and_(
                            User.id_empresa == id_empresa,
                            User.st_ativo == "S",
                            Perfil.ds_grupos_acesso.contains("admin")
                        )
                    )
                    .limit(1)
                )
                result_admin = await self.db.execute(stmt_admin)
                row = result_admin.first()

                if not row:
                    logger.warning(f"Nenhum administrador encontrado para empresa {id_empresa}")
                    return

                admin, perfil = row

                # Enviar email de notificação (não bloqueia se falhar)
                try:
                    email_enviado = email_service.send_user_limit_warning_email(
                        email=admin.nm_email,
                        empresa_name=empresa.nm_razao_social or empresa.nm_fantasia or "Empresa",
                        admin_name=admin.nm_completo or admin.nm_email,
                        current_users=qt_usuarios_atuais,
                        limit=qt_limite,
                        percentage=percentual,
                    )

                    if email_enviado:
                        logger.info(
                            f"Notificação de limite ({percentual:.1f}%) enviada para {admin.nm_email} "
                            f"da empresa {empresa.nm_fantasia or empresa.nm_razao_social}"
                        )
                    else:
                        logger.warning(
                            f"Falha ao enviar notificação de limite para {admin.nm_email}"
                        )

                except Exception as email_error:
                    # Não falha a operação principal se email falhar
                    logger.error(f"Erro ao enviar email de notificação de limite: {email_error}")

        except Exception as e:
            # Não falha a operação principal se verificação falhar
            logger.error(f"Erro ao verificar e notificar limite: {str(e)}")

    async def criar_usuario_equipe(
        self,
        id_empresa: uuid.UUID,
        id_usuario_criador: uuid.UUID,
        nm_email: str,
        nm_completo: str,
        nm_perfil: str,
        senha: Optional[str] = None,
    ) -> User:
        """
        Cria novo sub-usuário (membro da equipe) para clínica.

        Validações:
        - Usuário criador deve ser admin da clínica
        - Limite de usuários não pode estar atingido
        - Email não pode estar duplicado
        - Perfil deve existir e ser adequado para sub-usuário

        Args:
            id_empresa: UUID da empresa/clínica
            id_usuario_criador: UUID do admin que está criando
            nm_email: Email do novo usuário
            nm_completo: Nome completo
            nm_perfil: Nome do perfil (Recepcionista, Financeiro, etc.)
            senha: Senha opcional (gerada automaticamente se None)

        Returns:
            User: Novo usuário criado

        Raises:
            HTTPException: Se validações falharem
        """
        try:
            # 1. Validar permissão do criador
            tem_permissao = await self.validar_permissao_admin(
                id_usuario_criador, id_empresa
            )
            if not tem_permissao:
                raise HTTPException(
                    status_code=403,
                    detail="Usuário não tem permissão para criar membros da equipe",
                )

            # 2. Verificar limite de usuários
            limite_info = await self.verificar_limite(id_empresa)
            if limite_info["fg_limite_atingido"]:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Limite de {limite_info['qt_limite_usuarios']} usuários "
                        f"atingido. Entre em contato para aumentar seu plano."
                    ),
                )

            # 3. Validar email único
            normalized_email = nm_email.strip().lower()
            stmt_email = select(User).where(User.nm_email == normalized_email)
            result_email = await self.db.execute(stmt_email)
            existing_user = result_email.scalar_one_or_none()

            if existing_user:
                raise HTTPException(
                    status_code=400, detail=f"Email '{nm_email}' já cadastrado"
                )

            # 4. Buscar perfil template ou específico da empresa
            stmt_perfil = (
                select(Perfil)
                .where(
                    and_(
                        Perfil.nm_perfil == nm_perfil,
                        Perfil.st_ativo == "S",
                        or_(
                            and_(Perfil.fg_template == True, Perfil.id_empresa.is_(None)),
                            Perfil.id_empresa == id_empresa,
                        ),
                    )
                )
                .order_by(Perfil.id_empresa.desc().nullslast())  # Priorizar perfil da empresa
            )
            result_perfil = await self.db.execute(stmt_perfil)
            perfil = result_perfil.scalar_one_or_none()

            if not perfil:
                raise HTTPException(
                    status_code=404,
                    detail=f"Perfil '{nm_perfil}' não encontrado. "
                    f"Perfis disponíveis: Recepcionista, Financeiro, Gestor de Clínica",
                )

            # Validar que perfil é apropriado para sub-usuário (não pode ser admin, paciente, etc.)
            grupos = perfil.ds_grupos_acesso or []
            if "admin" in grupos or "paciente" in grupos:
                raise HTTPException(
                    status_code=400,
                    detail=f"Perfil '{nm_perfil}' não pode ser usado para membros da equipe",
                )

            # 5. Gerar senha se não fornecida
            if not senha:
                # Gerar senha temporária: DoctorQ + 6 dígitos aleatórios
                senha_temp = f"DoctorQ{uuid.uuid4().hex[:6].upper()}"
                senha = senha_temp
                logger.info(f"Senha temporária gerada para {nm_email}: {senha_temp}")

            password_hash = hash_password(senha)

            # 6. Criar novo usuário
            novo_usuario = User(
                id_user=uuid.uuid4(),
                nm_email=normalized_email,
                nm_completo=nm_completo,
                nm_password_hash=password_hash,
                id_perfil=perfil.id_perfil,
                id_empresa=id_empresa,
                id_usuario_criador=id_usuario_criador,
                st_ativo="S",
                dt_criacao=datetime.now(),
                nr_total_logins="0",
            )

            self.db.add(novo_usuario)
            await self.db.commit()
            await self.db.refresh(novo_usuario)

            logger.info(
                f"Usuário de equipe criado: {nm_email} (perfil: {nm_perfil}, "
                f"criador: {id_usuario_criador})"
            )

            # 7. Enviar email de boas-vindas (assíncrono, não bloqueia se falhar)
            try:
                from src.services.email_service import EmailService
                from src.models.empresa import Empresa

                # Buscar nome da empresa/clínica
                stmt_empresa = select(Empresa).where(Empresa.id_empresa == id_empresa)
                result_empresa = await self.db.execute(stmt_empresa)
                empresa = result_empresa.scalar_one_or_none()

                if empresa:
                    email_service = EmailService()
                    # Enviar senha temporária apenas se foi gerada automaticamente
                    senha_para_envio = senha if 'DoctorQ' in senha else None
                    email_service.enviar_boas_vindas_usuario(
                        email_destinatario=normalized_email,
                        nome_usuario=nm_completo,
                        nome_clinica=empresa.nm_razao_social or "sua clínica",
                        perfil=nm_perfil,
                        senha_temporaria=senha_para_envio,
                    )
                    logger.info(f"Email de boas-vindas enviado para {nm_email}")
                else:
                    logger.warning(
                        f"Empresa não encontrada para envio de email: {id_empresa}"
                    )
            except Exception as e:
                # Não falha a criação do usuário se email falhar
                logger.warning(
                    f"Erro ao enviar email de boas-vindas (não crítico): {str(e)}"
                )

            # 8. Verificar e notificar se limite de usuários atingiu 90%
            await self.verificar_e_notificar_limite(id_empresa)

            return novo_usuario

        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao criar usuário de equipe: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao criar usuário: {str(e)}"
            )

    async def listar_equipe(
        self, id_empresa: uuid.UUID, id_usuario_solicitante: uuid.UUID
    ) -> List[Dict]:
        """
        Lista todos os membros da equipe da clínica.

        Args:
            id_empresa: UUID da empresa/clínica
            id_usuario_solicitante: UUID do usuário que está solicitando

        Returns:
            Lista de dicionários com informações dos usuários
        """
        try:
            # Validar permissão
            tem_permissao = await self.validar_permissao_admin(
                id_usuario_solicitante, id_empresa
            )
            if not tem_permissao:
                raise HTTPException(
                    status_code=403,
                    detail="Usuário não tem permissão para listar equipe",
                )

            # Buscar usuários da empresa com perfis
            stmt = (
                select(User, Perfil)
                .join(Perfil, User.id_perfil == Perfil.id_perfil, isouter=True)
                .where(
                    and_(
                        User.id_empresa == id_empresa,
                        User.st_ativo == "S",
                    )
                )
                .order_by(User.dt_criacao.desc())
            )

            result = await self.db.execute(stmt)
            rows = result.all()

            equipe = []
            for row in rows:
                user = row[0]
                perfil = row[1]

                # Buscar nome do criador se houver
                nm_criador = None
                if user.id_usuario_criador:
                    stmt_criador = select(User.nm_completo).where(
                        User.id_user == user.id_usuario_criador
                    )
                    result_criador = await self.db.execute(stmt_criador)
                    nm_criador = result_criador.scalar_one_or_none()

                equipe.append(
                    {
                        "id_user": str(user.id_user),
                        "nm_email": user.nm_email,
                        "nm_completo": user.nm_completo,
                        "nm_perfil": perfil.nm_perfil if perfil else None,
                        "ds_perfil": perfil.ds_perfil if perfil else None,
                        "dt_criacao": user.dt_criacao.isoformat() if user.dt_criacao else None,
                        "dt_ultimo_login": (
                            user.dt_ultimo_login.isoformat()
                            if user.dt_ultimo_login
                            else None
                        ),
                        "nr_total_logins": user.nr_total_logins or "0",
                        "id_usuario_criador": (
                            str(user.id_usuario_criador) if user.id_usuario_criador else None
                        ),
                        "nm_criador": nm_criador,
                        "st_ativo": user.st_ativo,
                    }
                )

            return equipe

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erro ao listar equipe: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao listar equipe: {str(e)}"
            )

    async def remover_usuario_equipe(
        self,
        id_empresa: uuid.UUID,
        id_usuario_solicitante: uuid.UUID,
        id_usuario_remover: uuid.UUID,
    ) -> Dict:
        """
        Remove (desativa) usuário da equipe.

        Validações:
        - Usuário solicitante deve ser admin
        - Não pode remover a si mesmo
        - Não pode remover admin da clínica (apenas sub-usuários)

        Args:
            id_empresa: UUID da empresa/clínica
            id_usuario_solicitante: UUID do admin que está removendo
            id_usuario_remover: UUID do usuário a remover

        Returns:
            Dict com mensagem de sucesso
        """
        try:
            # Validar permissão
            tem_permissao = await self.validar_permissao_admin(
                id_usuario_solicitante, id_empresa
            )
            if not tem_permissao:
                raise HTTPException(
                    status_code=403,
                    detail="Usuário não tem permissão para remover membros da equipe",
                )

            # Não pode remover a si mesmo
            if id_usuario_solicitante == id_usuario_remover:
                raise HTTPException(
                    status_code=400, detail="Não é possível remover o próprio usuário"
                )

            # Buscar usuário a remover
            stmt = (
                select(User, Perfil)
                .join(Perfil, User.id_perfil == Perfil.id_perfil, isouter=True)
                .where(
                    and_(
                        User.id_user == id_usuario_remover,
                        User.id_empresa == id_empresa,
                        User.st_ativo == "S",
                    )
                )
            )
            result = await self.db.execute(stmt)
            row = result.first()

            if not row:
                raise HTTPException(
                    status_code=404, detail="Usuário não encontrado ou já inativo"
                )

            user, perfil = row

            # Não pode remover admin principal (apenas sub-usuários criados por ele)
            if perfil:
                grupos = perfil.ds_grupos_acesso or []
                if "admin" in grupos:
                    raise HTTPException(
                        status_code=400,
                        detail="Não é possível remover administradores da clínica",
                    )

            # Desativar usuário (soft delete)
            user.st_ativo = "N"
            user.dt_atualizacao = datetime.now()

            await self.db.commit()

            logger.info(
                f"Usuário {user.nm_email} removido da equipe por {id_usuario_solicitante}"
            )

            return {
                "message": f"Usuário {user.nm_completo} removido da equipe com sucesso",
                "id_usuario": str(user.id_user),
            }

        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao remover usuário da equipe: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao remover usuário: {str(e)}"
            )

    async def alterar_perfil_usuario(
        self,
        id_empresa: uuid.UUID,
        id_usuario_solicitante: uuid.UUID,
        id_usuario_alterar: uuid.UUID,
        novo_nm_perfil: str,
    ) -> Dict:
        """
        Altera o perfil de um sub-usuário da equipe.

        Validações:
        - Usuário solicitante deve ser admin
        - Usuário a alterar deve existir e estar ativo
        - Novo perfil deve existir e ser apropriado
        - Não pode alterar perfil de admin principal

        Args:
            id_empresa: UUID da empresa/clínica
            id_usuario_solicitante: UUID do admin que está alterando
            id_usuario_alterar: UUID do usuário a ter perfil alterado
            novo_nm_perfil: Nome do novo perfil

        Returns:
            Dict com mensagem de sucesso

        Raises:
            HTTPException: Se validações falharem
        """
        try:
            # Validar permissão
            tem_permissao = await self.validar_permissao_admin(
                id_usuario_solicitante, id_empresa
            )
            if not tem_permissao:
                raise HTTPException(
                    status_code=403,
                    detail="Usuário não tem permissão para alterar perfis da equipe",
                )

            # Buscar usuário a alterar
            stmt_user = (
                select(User, Perfil)
                .join(Perfil, User.id_perfil == Perfil.id_perfil, isouter=True)
                .where(
                    and_(
                        User.id_user == id_usuario_alterar,
                        User.id_empresa == id_empresa,
                        User.st_ativo == "S",
                    )
                )
            )
            result_user = await self.db.execute(stmt_user)
            row = result_user.first()

            if not row:
                raise HTTPException(
                    status_code=404, detail="Usuário não encontrado ou inativo"
                )

            user, perfil_atual = row

            # Não pode alterar perfil de admin principal
            if perfil_atual:
                grupos = perfil_atual.ds_grupos_acesso or []
                if "admin" in grupos:
                    raise HTTPException(
                        status_code=400,
                        detail="Não é possível alterar perfil de administradores",
                    )

            # Buscar novo perfil
            stmt_perfil = (
                select(Perfil)
                .where(
                    and_(
                        Perfil.nm_perfil == novo_nm_perfil,
                        Perfil.st_ativo == "S",
                        or_(
                            and_(Perfil.fg_template == True, Perfil.id_empresa.is_(None)),
                            Perfil.id_empresa == id_empresa,
                        ),
                    )
                )
                .order_by(Perfil.id_empresa.desc().nullslast())
            )
            result_perfil = await self.db.execute(stmt_perfil)
            novo_perfil = result_perfil.scalar_one_or_none()

            if not novo_perfil:
                raise HTTPException(
                    status_code=404,
                    detail=f"Perfil '{novo_nm_perfil}' não encontrado",
                )

            # Validar que novo perfil é apropriado (não pode ser admin ou paciente)
            grupos_novo = novo_perfil.ds_grupos_acesso or []
            if "admin" in grupos_novo or "paciente" in grupos_novo:
                raise HTTPException(
                    status_code=400,
                    detail=f"Perfil '{novo_nm_perfil}' não pode ser usado para membros da equipe",
                )

            # Atualizar perfil
            perfil_anterior = perfil_atual.nm_perfil if perfil_atual else "Nenhum"
            user.id_perfil = novo_perfil.id_perfil
            user.dt_atualizacao = datetime.now()

            await self.db.commit()

            logger.info(
                f"Perfil do usuário {user.nm_email} alterado de '{perfil_anterior}' "
                f"para '{novo_nm_perfil}' por {id_usuario_solicitante}"
            )

            return {
                "message": f"Perfil alterado de '{perfil_anterior}' para '{novo_nm_perfil}' com sucesso",
                "id_usuario": str(user.id_user),
                "perfil_anterior": perfil_anterior,
                "perfil_novo": novo_nm_perfil,
            }

        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao alterar perfil do usuário: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao alterar perfil: {str(e)}"
            )

    async def ajustar_limites_empresa(
        self,
        id_empresa: uuid.UUID,
        id_usuario_solicitante: uuid.UUID,
        novo_limite: int,
    ) -> Dict:
        """
        Ajusta o limite de usuários da empresa.

        Validações:
        - Usuário solicitante deve ser admin
        - Novo limite deve ser maior ou igual ao número atual de usuários
        - Novo limite deve estar entre 1 e 1000

        Args:
            id_empresa: UUID da empresa/clínica
            id_usuario_solicitante: UUID do admin que está ajustando
            novo_limite: Novo limite de usuários

        Returns:
            Dict com informações do novo limite

        Raises:
            HTTPException: Se validações falharem
        """
        try:
            # Validar permissão
            tem_permissao = await self.validar_permissao_admin(
                id_usuario_solicitante, id_empresa
            )
            if not tem_permissao:
                raise HTTPException(
                    status_code=403,
                    detail="Usuário não tem permissão para ajustar limites",
                )

            # Validar range do limite
            if novo_limite < 1 or novo_limite > 1000:
                raise HTTPException(
                    status_code=400,
                    detail="Limite deve estar entre 1 e 1000 usuários",
                )

            # Buscar empresa
            stmt_empresa = select(Empresa).where(Empresa.id_empresa == id_empresa)
            result_empresa = await self.db.execute(stmt_empresa)
            empresa = result_empresa.scalar_one_or_none()

            if not empresa:
                raise HTTPException(status_code=404, detail="Empresa não encontrada")

            # Contar usuários ativos
            stmt_count = select(func.count(User.id_user)).where(
                and_(User.id_empresa == id_empresa, User.st_ativo == "S")
            )
            result_count = await self.db.execute(stmt_count)
            qt_usuarios_atuais = result_count.scalar() or 0

            # Validar que novo limite comporta usuários atuais
            if novo_limite < qt_usuarios_atuais:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Novo limite ({novo_limite}) não pode ser menor que "
                        f"o número atual de usuários ativos ({qt_usuarios_atuais})"
                    ),
                )

            # Atualizar limite
            limite_anterior = empresa.qt_limite_usuarios or 5
            empresa.qt_limite_usuarios = novo_limite
            empresa.dt_atualizacao = datetime.now()

            await self.db.commit()

            logger.info(
                f"Limite de usuários da empresa {id_empresa} alterado de "
                f"{limite_anterior} para {novo_limite} por {id_usuario_solicitante}"
            )

            return {
                "message": "Limite de usuários atualizado com sucesso",
                "qt_limite_anterior": limite_anterior,
                "qt_limite_novo": novo_limite,
                "qt_usuarios_atuais": qt_usuarios_atuais,
                "qt_usuarios_disponiveis": novo_limite - qt_usuarios_atuais,
            }

        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao ajustar limites da empresa: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao ajustar limites: {str(e)}"
            )

    async def reativar_usuario_equipe(
        self,
        id_empresa: uuid.UUID,
        id_usuario_solicitante: uuid.UUID,
        id_usuario_reativar: uuid.UUID,
    ) -> Dict:
        """
        Reativa usuário previamente desativado da equipe.

        Validações:
        - Usuário solicitante deve ser admin
        - Usuário deve existir e estar inativo
        - Limite de usuários não pode estar atingido
        - Usuário não pode ser admin principal

        Args:
            id_empresa: UUID da empresa/clínica
            id_usuario_solicitante: UUID do admin que está reativando
            id_usuario_reativar: UUID do usuário a reativar

        Returns:
            Dict com mensagem de sucesso

        Raises:
            HTTPException: Se validações falharem
        """
        try:
            # Validar permissão
            tem_permissao = await self.validar_permissao_admin(
                id_usuario_solicitante, id_empresa
            )
            if not tem_permissao:
                raise HTTPException(
                    status_code=403,
                    detail="Usuário não tem permissão para reativar membros da equipe",
                )

            # Verificar limite de usuários
            limite_info = await self.verificar_limite(id_empresa)
            if limite_info["fg_limite_atingido"]:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Limite de {limite_info['qt_limite_usuarios']} usuários "
                        f"atingido. Aumente o limite ou remova usuários inativos."
                    ),
                )

            # Buscar usuário a reativar
            stmt = (
                select(User, Perfil)
                .join(Perfil, User.id_perfil == Perfil.id_perfil, isouter=True)
                .where(
                    and_(
                        User.id_user == id_usuario_reativar,
                        User.id_empresa == id_empresa,
                        User.st_ativo == "N",  # Deve estar inativo
                    )
                )
            )
            result = await self.db.execute(stmt)
            row = result.first()

            if not row:
                raise HTTPException(
                    status_code=404, detail="Usuário não encontrado ou já está ativo"
                )

            user, perfil = row

            # Não pode reativar admin principal
            if perfil:
                grupos = perfil.ds_grupos_acesso or []
                if "admin" in grupos:
                    raise HTTPException(
                        status_code=400,
                        detail="Não é possível reativar administradores via este endpoint",
                    )

            # Reativar usuário
            user.st_ativo = "S"
            user.dt_atualizacao = datetime.now()

            await self.db.commit()

            logger.info(
                f"Usuário {user.nm_email} reativado por {id_usuario_solicitante}"
            )

            # Verificar e notificar se limite de usuários atingiu 90%
            await self.verificar_e_notificar_limite(id_empresa)

            return {
                "message": f"Usuário {user.nm_completo} reativado com sucesso",
                "id_usuario": str(user.id_user),
                "nm_email": user.nm_email,
                "nm_perfil": perfil.nm_perfil if perfil else None,
            }

        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Erro ao reativar usuário: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao reativar usuário: {str(e)}"
            )
