# src/central_atendimento/services/contato_service.py
"""
Serviço para gerenciamento de contatos omnichannel.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_, and_

from src.config.logger_config import get_logger
from src.central_atendimento.models.contato_omni import (
    ContatoOmni,
    ContatoStatus,
    ContatoOmniCreate,
    ContatoOmniUpdate,
    ContatoOmniResponse,
)

logger = get_logger(__name__)


class ContatoOmniService:
    """Serviço para operações de contatos omnichannel."""

    def __init__(self, db: AsyncSession, id_empresa: uuid.UUID):
        self.db = db
        self.id_empresa = id_empresa

    async def criar(self, dados: ContatoOmniCreate) -> ContatoOmni:
        """
        Cria um novo contato.

        Args:
            dados: Dados do contato

        Returns:
            Contato criado
        """
        contato = ContatoOmni(
            id_empresa=self.id_empresa,
            nm_contato=dados.nm_contato,
            nm_apelido=dados.nm_apelido,
            nm_email=dados.nm_email,
            nr_telefone=dados.nr_telefone,
            nr_telefone_secundario=dados.nr_telefone_secundario,
            nr_documento=dados.nr_documento,
            ds_endereco=dados.ds_endereco,
            nm_cidade=dados.nm_cidade,
            nm_estado=dados.nm_estado,
            nr_cep=dados.nr_cep,
            nm_pais=getattr(dados, 'nm_pais', 'Brasil'),
            id_whatsapp=dados.id_whatsapp,
            id_instagram=dados.id_instagram,
            id_facebook=dados.id_facebook,
            st_contato=dados.st_contato,
            ds_tags=dados.ds_tags,
            nm_origem=dados.nm_origem,
            nm_canal_origem=getattr(dados, 'nm_canal_origem', None),
            ds_preferencias=dados.ds_preferencias or {},
            ds_metadata=getattr(dados, 'ds_metadata', {}) or {},
            ds_notas=dados.ds_notas,
            id_paciente=getattr(dados, 'id_paciente', None),
        )

        self.db.add(contato)
        await self.db.commit()
        await self.db.refresh(contato)

        logger.info(f"Contato criado: {contato.id_contato} - {contato.nm_contato}")
        return contato

    async def obter(self, id_contato: uuid.UUID) -> Optional[ContatoOmni]:
        """Obtém um contato pelo ID."""
        stmt = select(ContatoOmni).where(
            ContatoOmni.id_contato == id_contato,
            ContatoOmni.id_empresa == self.id_empresa,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_por_telefone(self, telefone: str) -> Optional[ContatoOmni]:
        """
        Obtém um contato pelo telefone.

        Args:
            telefone: Número do telefone

        Returns:
            Contato ou None
        """
        # Normalizar telefone (remover caracteres especiais)
        telefone_normalizado = "".join(filter(str.isdigit, telefone))

        stmt = select(ContatoOmni).where(
            ContatoOmni.id_empresa == self.id_empresa,
            or_(
                ContatoOmni.nr_telefone.contains(telefone_normalizado),
                ContatoOmni.id_whatsapp == telefone_normalizado,
            ),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_por_email(self, email: str) -> Optional[ContatoOmni]:
        """Obtém um contato pelo email."""
        stmt = select(ContatoOmni).where(
            ContatoOmni.id_empresa == self.id_empresa,
            ContatoOmni.nm_email == email.lower(),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_por_whatsapp(self, id_whatsapp: str) -> Optional[ContatoOmni]:
        """Obtém um contato pelo ID do WhatsApp."""
        stmt = select(ContatoOmni).where(
            ContatoOmni.id_empresa == self.id_empresa,
            ContatoOmni.id_whatsapp == id_whatsapp,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_por_instagram(self, id_instagram: str) -> Optional[ContatoOmni]:
        """Obtém um contato pelo ID do Instagram."""
        stmt = select(ContatoOmni).where(
            ContatoOmni.id_empresa == self.id_empresa,
            ContatoOmni.id_instagram == id_instagram,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def obter_ou_criar(
        self,
        telefone: Optional[str] = None,
        email: Optional[str] = None,
        id_whatsapp: Optional[str] = None,
        nome: str = "Contato",
        origem: Optional[str] = None,
    ) -> tuple[ContatoOmni, bool]:
        """
        Obtém um contato existente ou cria um novo.

        Args:
            telefone: Telefone do contato
            email: Email do contato
            id_whatsapp: ID do WhatsApp
            nome: Nome do contato (para criação)
            origem: Origem do contato (para criação)

        Returns:
            Tuple (contato, criado: bool)
        """
        contato = None

        # Tentar encontrar por diferentes identificadores
        if id_whatsapp:
            contato = await self.obter_por_whatsapp(id_whatsapp)
        if not contato and telefone:
            contato = await self.obter_por_telefone(telefone)
        if not contato and email:
            contato = await self.obter_por_email(email)

        if contato:
            return contato, False

        # Criar novo contato
        dados = ContatoOmniCreate(
            nm_contato=nome,
            nr_telefone=telefone,
            nm_email=email,
            id_whatsapp=id_whatsapp,
            nm_origem=origem,
        )
        contato = await self.criar(dados)
        return contato, True

    async def listar(
        self,
        st_contato: Optional[ContatoStatus] = None,
        tags: Optional[List[str]] = None,
        segmentos: Optional[List[str]] = None,
        score_minimo: Optional[int] = None,
        score_maximo: Optional[int] = None,
        busca: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        ordenar_por: str = "dt_criacao",
        ordem: str = "desc",
    ) -> tuple[List[ContatoOmni], int]:
        """
        Lista contatos com filtros.

        Args:
            st_contato: Filtrar por status
            tags: Filtrar por tags (any match)
            segmentos: Filtrar por segmentos (any match)
            score_minimo: Score mínimo
            score_maximo: Score máximo
            busca: Busca por nome, email ou telefone
            page: Página
            page_size: Itens por página
            ordenar_por: Campo para ordenação
            ordem: "asc" ou "desc"

        Returns:
            Tuple (lista de contatos, total)
        """
        stmt = select(ContatoOmni).where(ContatoOmni.id_empresa == self.id_empresa)

        if st_contato:
            stmt = stmt.where(ContatoOmni.st_contato == st_contato)

        if tags:
            stmt = stmt.where(ContatoOmni.ds_tags.overlap(tags))

        if segmentos:
            stmt = stmt.where(ContatoOmni.ds_segmentos.overlap(segmentos))

        if score_minimo is not None:
            stmt = stmt.where(ContatoOmni.nr_score >= score_minimo)

        if score_maximo is not None:
            stmt = stmt.where(ContatoOmni.nr_score <= score_maximo)

        if busca:
            busca_pattern = f"%{busca}%"
            stmt = stmt.where(
                or_(
                    ContatoOmni.nm_contato.ilike(busca_pattern),
                    ContatoOmni.nm_email.ilike(busca_pattern),
                    ContatoOmni.nr_telefone.ilike(busca_pattern),
                )
            )

        # Contar total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.execute(count_stmt)
        total_count = total.scalar()

        # Ordenação
        ordem_col = getattr(ContatoOmni, ordenar_por, ContatoOmni.dt_criacao)
        if ordem == "desc":
            stmt = stmt.order_by(ordem_col.desc())
        else:
            stmt = stmt.order_by(ordem_col.asc())

        # Paginação
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        contatos = result.scalars().all()

        return list(contatos), total_count

    async def atualizar(
        self,
        id_contato: uuid.UUID,
        dados: ContatoOmniUpdate,
    ) -> Optional[ContatoOmni]:
        """Atualiza um contato."""
        contato = await self.obter(id_contato)
        if not contato:
            return None

        update_data = dados.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(contato, key, value)

        await self.db.commit()
        await self.db.refresh(contato)

        logger.info(f"Contato atualizado: {contato.id_contato}")
        return contato

    async def deletar(self, id_contato: uuid.UUID) -> bool:
        """Deleta um contato."""
        contato = await self.obter(id_contato)
        if not contato:
            return False

        await self.db.delete(contato)
        await self.db.commit()

        logger.info(f"Contato deletado: {id_contato}")
        return True

    async def adicionar_tags(
        self,
        id_contato: uuid.UUID,
        tags: List[str],
    ) -> Optional[ContatoOmni]:
        """Adiciona tags a um contato."""
        contato = await self.obter(id_contato)
        if not contato:
            return None

        tags_atuais = contato.ds_tags or []
        tags_atuais.extend([t for t in tags if t not in tags_atuais])
        contato.ds_tags = tags_atuais

        await self.db.commit()
        await self.db.refresh(contato)
        return contato

    async def remover_tags(
        self,
        id_contato: uuid.UUID,
        tags: List[str],
    ) -> Optional[ContatoOmni]:
        """Remove tags de um contato."""
        contato = await self.obter(id_contato)
        if not contato:
            return None

        tags_atuais = contato.ds_tags or []
        contato.ds_tags = [t for t in tags_atuais if t not in tags]

        await self.db.commit()
        await self.db.refresh(contato)
        return contato

    async def atualizar_score(
        self,
        id_contato: uuid.UUID,
        score: int,
        temperatura: Optional[int] = None,
    ) -> Optional[ContatoOmni]:
        """
        Atualiza o score de um contato.

        Args:
            id_contato: ID do contato
            score: Novo score (0-100)
            temperatura: Nova temperatura (0-100)

        Returns:
            Contato atualizado
        """
        contato = await self.obter(id_contato)
        if not contato:
            return None

        contato.nr_score = max(0, min(100, score))
        if temperatura is not None:
            contato.nr_temperatura = max(0, min(100, temperatura))

        await self.db.commit()
        await self.db.refresh(contato)
        return contato

    async def registrar_interacao(
        self,
        id_contato: uuid.UUID,
        entrada: bool = True,
    ) -> Optional[ContatoOmni]:
        """
        Registra uma interação com o contato.

        Args:
            id_contato: ID do contato
            entrada: True se mensagem do contato, False se para o contato

        Returns:
            Contato atualizado
        """
        contato = await self.obter(id_contato)
        if not contato:
            return None

        # Sincronizado com schema tb_contatos_omni em 22/11/2025
        # Colunas nr_mensagens_recebidas/enviadas não existem - usar nr_conversas_total
        # A contagem de mensagens é feita na conversa, não no contato
        contato.dt_ultimo_contato = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(contato)
        return contato

    async def importar_contatos(
        self,
        contatos: List[ContatoOmniCreate],
        atualizar_existentes: bool = False,
        campanha_origem: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Importa uma lista de contatos em massa.

        Args:
            contatos: Lista de contatos para importar
            atualizar_existentes: Se deve atualizar contatos existentes
            campanha_origem: Nome da campanha de origem
            tags: Tags para adicionar aos contatos

        Returns:
            Resultado da importação
        """
        resultado = {
            "total": len(contatos),
            "criados": 0,
            "atualizados": 0,
            "ignorados": 0,
            "erros": [],
        }

        for i, dados in enumerate(contatos):
            try:
                # Verificar se existe
                contato_existente = None
                if dados.nr_telefone:
                    contato_existente = await self.obter_por_telefone(dados.nr_telefone)
                elif dados.nm_email:
                    contato_existente = await self.obter_por_email(dados.nm_email)

                if contato_existente:
                    if atualizar_existentes:
                        update_dados = ContatoOmniUpdate(
                            nm_contato=dados.nm_contato,
                            nm_email=dados.nm_email,
                            nr_telefone=dados.nr_telefone,
                        )
                        await self.atualizar(contato_existente.id_contato, update_dados)
                        resultado["atualizados"] += 1
                    else:
                        resultado["ignorados"] += 1
                else:
                    # Adicionar informações extras
                    if campanha_origem:
                        dados.nm_campanha_origem = campanha_origem
                    if tags:
                        dados.ds_tags = (dados.ds_tags or []) + tags

                    await self.criar(dados)
                    resultado["criados"] += 1

            except Exception as e:
                resultado["erros"].append({
                    "indice": i,
                    "erro": str(e),
                })

        logger.info(f"Importação concluída: {resultado}")
        return resultado
