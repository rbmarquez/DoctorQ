"""
Service para gerenciamento de Anamneses
UC032 - Registrar Anamnese
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.anamnese import (
    TbAnamnese,
    TbAnamneseTemplate,
    AnamneseCreate,
    AnamneseUpdate,
    AnamneseTemplateCreate,
    AnamneseTemplateUpdate,
    AlertaAnamnese,
    RespostaAnamnese,
    TEMPLATE_ANAMNESE_GERAL
)


class AnamneseTemplateService:
    """Service para gerenciamento de templates de anamnese"""

    @staticmethod
    async def criar_template(
        db: AsyncSession,
        id_empresa: Optional[UUID],
        data: AnamneseTemplateCreate
    ) -> TbAnamneseTemplate:
        """
        Cria um novo template de anamnese

        Args:
            db: Sessão do banco
            id_empresa: ID da empresa (None = template global)
            data: Dados do template

        Returns:
            Template criado
        """
        template = TbAnamneseTemplate(
            id_empresa=id_empresa,
            nm_template=data.nm_template,
            ds_template=data.ds_template,
            tp_template=data.tp_template,
            ds_perguntas=[p.model_dump() for p in data.ds_perguntas],
            ds_regras_validacao=data.ds_regras_validacao,
            ds_regras_alertas=data.ds_regras_alertas,
            fg_publico=data.fg_publico
        )

        db.add(template)
        await db.commit()
        await db.refresh(template)

        return template

    @staticmethod
    async def listar_templates(
        db: AsyncSession,
        id_empresa: Optional[UUID] = None,
        tp_template: Optional[str] = None,
        apenas_ativos: bool = True,
        page: int = 1,
        size: int = 50
    ) -> tuple[List[TbAnamneseTemplate], int]:
        """
        Lista templates de anamnese

        Args:
            db: Sessão do banco
            id_empresa: Filtrar por empresa (None = todos + globais)
            tp_template: Filtrar por tipo
            apenas_ativos: Apenas templates ativos
            page: Página
            size: Tamanho da página

        Returns:
            (Lista de templates, Total de registros)
        """
        query = select(TbAnamneseTemplate)

        filters = []

        if id_empresa:
            # Templates da empresa + templates públicos
            filters.append(
                or_(
                    TbAnamneseTemplate.id_empresa == id_empresa,
                    and_(
                        TbAnamneseTemplate.id_empresa.is_(None),
                        TbAnamneseTemplate.fg_publico == "S"
                    )
                )
            )
        else:
            # Apenas templates públicos
            filters.append(TbAnamneseTemplate.fg_publico == "S")

        if tp_template:
            filters.append(TbAnamneseTemplate.tp_template == tp_template)

        if apenas_ativos:
            filters.append(TbAnamneseTemplate.fg_ativo == "S")

        if filters:
            query = query.where(and_(*filters))

        # Total de registros
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)

        # Paginação
        query = query.offset((page - 1) * size).limit(size)
        query = query.order_by(TbAnamneseTemplate.dt_criacao.desc())

        result = await db.execute(query)
        templates = result.scalars().all()

        return list(templates), total or 0

    @staticmethod
    async def buscar_template_por_id(
        db: AsyncSession,
        id_template: UUID
    ) -> Optional[TbAnamneseTemplate]:
        """Busca template por ID"""
        query = select(TbAnamneseTemplate).where(
            TbAnamneseTemplate.id_template == id_template
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def atualizar_template(
        db: AsyncSession,
        id_template: UUID,
        data: AnamneseTemplateUpdate
    ) -> Optional[TbAnamneseTemplate]:
        """Atualiza um template"""
        template = await AnamneseTemplateService.buscar_template_por_id(db, id_template)

        if not template:
            return None

        # Atualizar campos
        if data.nm_template is not None:
            template.nm_template = data.nm_template
        if data.ds_template is not None:
            template.ds_template = data.ds_template
        if data.tp_template is not None:
            template.tp_template = data.tp_template
        if data.ds_perguntas is not None:
            template.ds_perguntas = [p.model_dump() for p in data.ds_perguntas]
        if data.ds_regras_validacao is not None:
            template.ds_regras_validacao = data.ds_regras_validacao
        if data.ds_regras_alertas is not None:
            template.ds_regras_alertas = data.ds_regras_alertas
        if data.fg_ativo is not None:
            template.fg_ativo = data.fg_ativo
        if data.fg_publico is not None:
            template.fg_publico = data.fg_publico

        template.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(template)

        return template

    @staticmethod
    async def criar_template_padrao(
        db: AsyncSession,
        id_empresa: Optional[UUID] = None
    ) -> TbAnamneseTemplate:
        """
        Cria o template padrão de anamnese geral

        Args:
            db: Sessão do banco
            id_empresa: ID da empresa (None = template global)

        Returns:
            Template criado
        """
        template = TbAnamneseTemplate(
            id_empresa=id_empresa,
            nm_template=TEMPLATE_ANAMNESE_GERAL["nm_template"],
            ds_template=TEMPLATE_ANAMNESE_GERAL["ds_template"],
            tp_template=TEMPLATE_ANAMNESE_GERAL["tp_template"],
            ds_perguntas=TEMPLATE_ANAMNESE_GERAL["ds_perguntas"],
            ds_regras_alertas=TEMPLATE_ANAMNESE_GERAL.get("ds_regras_alertas"),
            fg_publico=id_empresa is None
        )

        db.add(template)
        await db.commit()
        await db.refresh(template)

        return template


class AnamneseService:
    """Service para gerenciamento de anamneses preenchidas"""

    @staticmethod
    async def criar_anamnese(
        db: AsyncSession,
        id_empresa: UUID,
        data: AnamneseCreate
    ) -> TbAnamnese:
        """
        Cria uma nova anamnese preenchida

        Args:
            db: Sessão do banco
            id_empresa: ID da empresa
            data: Dados da anamnese

        Returns:
            Anamnese criada
        """
        # Buscar template
        template = await AnamneseTemplateService.buscar_template_por_id(db, data.id_template)

        if not template:
            raise ValueError(f"Template {data.id_template} não encontrado")

        # Validar respostas obrigatórias
        await AnamneseService._validar_respostas(template, data.ds_respostas)

        # Gerar alertas
        alertas, tem_criticos = await AnamneseService._gerar_alertas(
            template,
            data.ds_respostas
        )

        # Criar anamnese
        anamnese = TbAnamnese(
            id_empresa=id_empresa,
            id_paciente=data.id_paciente,
            id_procedimento=data.id_procedimento,
            id_template=data.id_template,
            ds_respostas=[r.model_dump() for r in data.ds_respostas],
            ds_observacoes=data.ds_observacoes,
            fg_alertas_criticos=tem_criticos,
            ds_alertas=[a.model_dump() for a in alertas] if alertas else None,
            nm_assinatura_paciente=data.nm_assinatura_paciente,
            dt_assinatura_paciente=datetime.utcnow() if data.nm_assinatura_paciente else None
        )

        db.add(anamnese)
        await db.commit()
        await db.refresh(anamnese)

        return anamnese

    @staticmethod
    async def _validar_respostas(
        template: TbAnamneseTemplate,
        respostas: List[RespostaAnamnese]
    ) -> None:
        """
        Valida se todas as perguntas obrigatórias foram respondidas

        Args:
            template: Template da anamnese
            respostas: Respostas fornecidas

        Raises:
            ValueError: Se alguma pergunta obrigatória não foi respondida
        """
        perguntas = template.ds_perguntas
        respostas_dict = {r.id_pergunta: r.vl_resposta for r in respostas}

        erros = []

        for pergunta in perguntas:
            id_pergunta = pergunta.get("id_pergunta")
            obrigatoria = pergunta.get("fg_obrigatoria", False)

            if obrigatoria:
                if id_pergunta not in respostas_dict:
                    erros.append(f"Pergunta obrigatória não respondida: {pergunta.get('nm_pergunta')}")
                elif not respostas_dict[id_pergunta]:
                    erros.append(f"Resposta vazia para pergunta obrigatória: {pergunta.get('nm_pergunta')}")

        if erros:
            raise ValueError("; ".join(erros))

    @staticmethod
    async def _gerar_alertas(
        template: TbAnamneseTemplate,
        respostas: List[RespostaAnamnese]
    ) -> tuple[List[AlertaAnamnese], bool]:
        """
        Gera alertas baseados nas respostas

        Args:
            template: Template da anamnese
            respostas: Respostas fornecidas

        Returns:
            (Lista de alertas, Tem alertas críticos?)
        """
        alertas = []
        tem_criticos = False

        regras_alertas = template.ds_regras_alertas

        if not regras_alertas:
            return alertas, tem_criticos

        # Converter respostas para dict para fácil acesso
        respostas_dict = {r.id_pergunta: r.vl_resposta for r in respostas}

        # Processar alertas críticos
        alertas_criticos = regras_alertas.get("alertas_criticos", [])

        for regra in alertas_criticos:
            condicao = regra.get("condicao")
            alerta_data = regra.get("alerta")

            # Avaliar condição (simplificado - em produção usar AST ou parser seguro)
            try:
                # Substituir IDs de perguntas por valores
                condicao_avaliada = condicao
                for id_pergunta, valor in respostas_dict.items():
                    condicao_avaliada = condicao_avaliada.replace(
                        id_pergunta,
                        repr(valor)
                    )

                # Avaliar (CUIDADO: em produção usar método mais seguro)
                if eval(condicao_avaliada, {"__builtins__": {}}, respostas_dict):
                    alerta = AlertaAnamnese(**alerta_data)
                    alertas.append(alerta)

                    if alerta.tp_alerta == "critico":
                        tem_criticos = True

            except Exception:
                # Ignorar erros de avaliação
                pass

        return alertas, tem_criticos

    @staticmethod
    async def listar_anamneses(
        db: AsyncSession,
        id_empresa: UUID,
        id_paciente: Optional[UUID] = None,
        id_profissional: Optional[UUID] = None,
        id_procedimento: Optional[UUID] = None,
        apenas_com_alertas: bool = False,
        apenas_ativos: bool = True,
        page: int = 1,
        size: int = 50
    ) -> tuple[List[TbAnamnese], int]:
        """Lista anamneses com filtros"""
        query = select(TbAnamnese).where(TbAnamnese.id_empresa == id_empresa)

        if id_paciente:
            query = query.where(TbAnamnese.id_paciente == id_paciente)

        if id_profissional:
            query = query.where(TbAnamnese.id_profissional == id_profissional)

        if id_procedimento:
            query = query.where(TbAnamnese.id_procedimento == id_procedimento)

        if apenas_com_alertas:
            query = query.where(TbAnamnese.fg_alertas_criticos == "S")

        if apenas_ativos:
            query = query.where(TbAnamnese.fg_ativo == "S")

        # Total de registros
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)

        # Paginação
        query = query.offset((page - 1) * size).limit(size)
        query = query.order_by(TbAnamnese.dt_criacao.desc())

        result = await db.execute(query)
        anamneses = result.scalars().all()

        return list(anamneses), total or 0

    @staticmethod
    async def buscar_anamnese_por_id(
        db: AsyncSession,
        id_anamnese: UUID,
        id_empresa: UUID
    ) -> Optional[TbAnamnese]:
        """Busca anamnese por ID"""
        query = select(TbAnamnese).where(
            and_(
                TbAnamnese.id_anamnese == id_anamnese,
                TbAnamnese.id_empresa == id_empresa
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def atualizar_anamnese(
        db: AsyncSession,
        id_anamnese: UUID,
        id_empresa: UUID,
        data: AnamneseUpdate
    ) -> Optional[TbAnamnese]:
        """Atualiza uma anamnese"""
        anamnese = await AnamneseService.buscar_anamnese_por_id(db, id_anamnese, id_empresa)

        if not anamnese:
            return None

        # Atualizar campos
        if data.ds_respostas is not None:
            # Re-validar e re-gerar alertas
            template = await AnamneseTemplateService.buscar_template_por_id(db, anamnese.id_template)

            if template:
                await AnamneseService._validar_respostas(template, data.ds_respostas)
                alertas, tem_criticos = await AnamneseService._gerar_alertas(template, data.ds_respostas)

                anamnese.ds_respostas = [r.model_dump() for r in data.ds_respostas]
                anamnese.fg_alertas_criticos = tem_criticos
                anamnese.ds_alertas = [a.model_dump() for a in alertas] if alertas else None

        if data.ds_observacoes is not None:
            anamnese.ds_observacoes = data.ds_observacoes

        if data.nm_assinatura_profissional is not None:
            anamnese.nm_assinatura_profissional = data.nm_assinatura_profissional
            anamnese.dt_assinatura_profissional = datetime.utcnow()

        anamnese.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(anamnese)

        return anamnese

    @staticmethod
    async def assinar_anamnese_paciente(
        db: AsyncSession,
        id_anamnese: UUID,
        id_empresa: UUID,
        nm_assinatura: str
    ) -> Optional[TbAnamnese]:
        """Paciente assina a anamnese"""
        anamnese = await AnamneseService.buscar_anamnese_por_id(db, id_anamnese, id_empresa)

        if not anamnese:
            return None

        anamnese.nm_assinatura_paciente = nm_assinatura
        anamnese.dt_assinatura_paciente = datetime.utcnow()
        anamnese.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(anamnese)

        return anamnese

    @staticmethod
    async def assinar_anamnese_profissional(
        db: AsyncSession,
        id_anamnese: UUID,
        id_empresa: UUID,
        id_profissional: UUID,
        nm_assinatura: str
    ) -> Optional[TbAnamnese]:
        """Profissional assina a anamnese"""
        anamnese = await AnamneseService.buscar_anamnese_por_id(db, id_anamnese, id_empresa)

        if not anamnese:
            return None

        anamnese.id_profissional = id_profissional
        anamnese.nm_assinatura_profissional = nm_assinatura
        anamnese.dt_assinatura_profissional = datetime.utcnow()
        anamnese.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(anamnese)

        return anamnese

    @staticmethod
    async def desativar_anamnese(
        db: AsyncSession,
        id_anamnese: UUID,
        id_empresa: UUID
    ) -> Optional[TbAnamnese]:
        """Desativa uma anamnese (soft delete)"""
        anamnese = await AnamneseService.buscar_anamnese_por_id(db, id_anamnese, id_empresa)

        if not anamnese:
            return None

        anamnese.fg_ativo = False
        anamnese.dt_atualizacao = datetime.utcnow()

        await db.commit()
        await db.refresh(anamnese)

        return anamnese
