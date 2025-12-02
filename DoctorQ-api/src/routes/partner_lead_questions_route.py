"""
Rotas para Partner Lead Questions (Perguntas de Leads de Parceiros)
"""

import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.orm_config import ORMConfig
from src.models.partner_lead_question import (
    PartnerLeadQuestionCreate,
    PartnerLeadQuestionListResponse,
    PartnerLeadQuestionResponse,
    PartnerLeadQuestionUpdate,
    PartnerTypeEnum,
    TbPartnerLeadQuestion,
)

router = APIRouter(prefix="/partner/lead-questions", tags=["Partner Lead Questions"])


# ============================================================================
# CRUD Endpoints
# ============================================================================


@router.get("/", response_model=PartnerLeadQuestionListResponse)
async def listar_perguntas(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Itens por página"),
    tp_partner: Optional[PartnerTypeEnum] = Query(None, description="Filtrar por tipo de parceiro"),
    st_active: Optional[bool] = Query(None, description="Filtrar por status ativo/inativo"),
    search: Optional[str] = Query(None, description="Buscar no texto da pergunta"),
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Lista perguntas de leads com paginação e filtros.

    **Filtros disponíveis:**
    - tp_partner: paciente, profissional, clinica, fornecedor
    - st_active: true/false
    - search: busca no texto da pergunta (case-insensitive)

    **Ordenação:** Por tp_partner e nr_order
    """
    try:
        # Construir query base
        query = select(TbPartnerLeadQuestion)
        count_query = select(func.count()).select_from(TbPartnerLeadQuestion)

        # Aplicar filtros
        filters = []

        if tp_partner:
            filters.append(TbPartnerLeadQuestion.tp_partner == tp_partner)

        if st_active is not None:
            filters.append(TbPartnerLeadQuestion.st_active == st_active)

        if search:
            filters.append(
                TbPartnerLeadQuestion.nm_question.ilike(f"%{search}%")
            )

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        # Contar total
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Ordenar
        query = query.order_by(
            TbPartnerLeadQuestion.tp_partner,
            TbPartnerLeadQuestion.nr_order,
        )

        # Paginação
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Executar query
        result = await db.execute(query)
        questions = result.scalars().all()

        # Calcular total de páginas
        pages = math.ceil(total / size) if total > 0 else 0

        return PartnerLeadQuestionListResponse(
            items=[PartnerLeadQuestionResponse.model_validate(q) for q in questions],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar perguntas: {str(e)}")


@router.get("/{id_question}/", response_model=PartnerLeadQuestionResponse)
async def obter_pergunta(
    id_question: UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Obtém uma pergunta específica por ID.
    """
    try:
        query = select(TbPartnerLeadQuestion).where(
            TbPartnerLeadQuestion.id_question == id_question
        )
        result = await db.execute(query)
        question = result.scalar_one_or_none()

        if not question:
            raise HTTPException(status_code=404, detail="Pergunta não encontrada")

        return PartnerLeadQuestionResponse.model_validate(question)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter pergunta: {str(e)}")


@router.post("/", response_model=PartnerLeadQuestionResponse, status_code=201)
async def criar_pergunta(
    data: PartnerLeadQuestionCreate,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Cria uma nova pergunta de lead.

    **Validações:**
    - tp_partner deve ser: paciente, profissional, clinica, fornecedor
    - tp_input deve ser: text, textarea, select, radio, checkbox, number, email, tel, date
    - ds_options é obrigatório para select, radio e checkbox
    """
    try:
        # Validar ds_options para tipos que requerem opções
        if data.tp_input in ["select", "radio", "checkbox"]:
            if not data.ds_options or "options" not in data.ds_options:
                raise HTTPException(
                    status_code=400,
                    detail=f"ds_options com lista 'options' é obrigatório para tipo '{data.tp_input}'",
                )

        # Criar nova pergunta
        new_question = TbPartnerLeadQuestion(**data.model_dump())

        db.add(new_question)
        await db.commit()
        await db.refresh(new_question)

        return PartnerLeadQuestionResponse.model_validate(new_question)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar pergunta: {str(e)}")


@router.put("/{id_question}/", response_model=PartnerLeadQuestionResponse)
async def atualizar_pergunta(
    id_question: UUID,
    data: PartnerLeadQuestionUpdate,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Atualiza uma pergunta existente.

    **Todos os campos são opcionais** - apenas os campos fornecidos serão atualizados.
    """
    try:
        # Buscar pergunta
        query = select(TbPartnerLeadQuestion).where(
            TbPartnerLeadQuestion.id_question == id_question
        )
        result = await db.execute(query)
        question = result.scalar_one_or_none()

        if not question:
            raise HTTPException(status_code=404, detail="Pergunta não encontrada")

        # Atualizar apenas campos fornecidos
        update_data = data.model_dump(exclude_unset=True)

        # Validar ds_options se tp_input foi alterado
        if "tp_input" in update_data and update_data["tp_input"] in ["select", "radio", "checkbox"]:
            options = update_data.get("ds_options", question.ds_options)
            if not options or "options" not in options:
                raise HTTPException(
                    status_code=400,
                    detail=f"ds_options com lista 'options' é obrigatório para tipo '{update_data['tp_input']}'",
                )

        for key, value in update_data.items():
            setattr(question, key, value)

        await db.commit()
        await db.refresh(question)

        return PartnerLeadQuestionResponse.model_validate(question)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar pergunta: {str(e)}")


@router.delete("/{id_question}/", status_code=204)
async def deletar_pergunta(
    id_question: UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Deleta uma pergunta.

    **Atenção:** Esta ação é permanente e não pode ser desfeita.
    """
    try:
        # Buscar pergunta
        query = select(TbPartnerLeadQuestion).where(
            TbPartnerLeadQuestion.id_question == id_question
        )
        result = await db.execute(query)
        question = result.scalar_one_or_none()

        if not question:
            raise HTTPException(status_code=404, detail="Pergunta não encontrada")

        # Deletar
        await db.delete(question)
        await db.commit()

        return None

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao deletar pergunta: {str(e)}")


# ============================================================================
# Endpoints Especiais
# ============================================================================


@router.get("/public/{tp_partner}/", response_model=list[PartnerLeadQuestionResponse])
async def listar_perguntas_publicas(
    tp_partner: PartnerTypeEnum,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Lista perguntas ativas para um tipo de parceiro (endpoint público).

    **Uso:** Formulários de lead em páginas públicas (busca, onboarding).

    **Retorna:** Perguntas ordenadas por nr_order, apenas ativas.
    """
    try:
        query = (
            select(TbPartnerLeadQuestion)
            .where(
                and_(
                    TbPartnerLeadQuestion.tp_partner == tp_partner,
                    TbPartnerLeadQuestion.st_active == True,
                )
            )
            .order_by(TbPartnerLeadQuestion.nr_order)
        )

        result = await db.execute(query)
        questions = result.scalars().all()

        return [PartnerLeadQuestionResponse.model_validate(q) for q in questions]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar perguntas públicas: {str(e)}"
        )


@router.patch("/{id_question}/toggle-active/", response_model=PartnerLeadQuestionResponse)
async def toggle_active(
    id_question: UUID,
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Ativa/desativa uma pergunta (toggle do campo st_active).
    """
    try:
        # Buscar pergunta
        query = select(TbPartnerLeadQuestion).where(
            TbPartnerLeadQuestion.id_question == id_question
        )
        result = await db.execute(query)
        question = result.scalar_one_or_none()

        if not question:
            raise HTTPException(status_code=404, detail="Pergunta não encontrada")

        # Toggle
        question.st_active = not question.st_active

        await db.commit()
        await db.refresh(question)

        return PartnerLeadQuestionResponse.model_validate(question)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao alternar status: {str(e)}")


@router.post("/reorder/", status_code=204)
async def reordenar_perguntas(
    questions: list[dict],
    db: AsyncSession = Depends(ORMConfig.get_session),
):
    """
    Reordena múltiplas perguntas de uma vez.

    **Body:**
    ```json
    {
      "questions": [
        {"id_question": "uuid1", "nr_order": 1},
        {"id_question": "uuid2", "nr_order": 2}
      ]
    }
    ```
    """
    try:
        for item in questions:
            id_question = UUID(item["id_question"])
            nr_order = item["nr_order"]

            query = select(TbPartnerLeadQuestion).where(
                TbPartnerLeadQuestion.id_question == id_question
            )
            result = await db.execute(query)
            question = result.scalar_one_or_none()

            if question:
                question.nr_order = nr_order

        await db.commit()
        return None

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao reordenar perguntas: {str(e)}")
