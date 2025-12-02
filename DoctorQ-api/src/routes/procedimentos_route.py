"""
Rotas para Marketplace de Procedimentos Estéticos
"""

import uuid
from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_, or_, desc, asc, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/procedimentos", tags=["procedimentos"])

# ============================================
# Models
# ============================================

class ProcedimentoResponse(BaseModel):
    id_procedimento: str
    id_clinica: Optional[str]
    nm_procedimento: str
    ds_procedimento: Optional[str]
    ds_categoria: Optional[str]
    ds_subcategoria: Optional[str]
    vl_preco: Optional[Decimal]
    vl_preco_promocional: Optional[Decimal]
    nr_duracao_minutos: int
    nr_sessoes_recomendadas: Optional[int]
    ds_indicacoes: Optional[str]
    ds_contraindicacoes: Optional[str]
    ds_preparacao: Optional[str]
    ds_cuidados_pos: Optional[str]
    ds_resultados_esperados: Optional[str]
    ds_foto_principal: Optional[str]
    ds_fotos: Optional[List[str]]
    ds_video: Optional[str]
    st_requer_avaliacao: Optional[bool]
    st_disponivel_online: Optional[bool]
    nr_idade_minima: Optional[int]
    st_ativo: Optional[bool]

    # Dados da clínica (quando aplicável)
    nm_clinica: Optional[str] = None
    ds_endereco: Optional[str] = None
    nr_avaliacao_clinica: Optional[Decimal] = None

class ProcedimentoListItem(BaseModel):
    id_procedimento: str
    nm_procedimento: str
    ds_categoria: Optional[str]
    vl_preco: Optional[Decimal]
    vl_preco_promocional: Optional[Decimal]
    nr_duracao_minutos: int
    nr_sessoes_recomendadas: Optional[int]
    ds_foto_principal: Optional[str]
    nm_clinica: Optional[str] = None
    st_disponivel_online: Optional[bool]

class CategoriaResponse(BaseModel):
    ds_categoria: str
    total_procedimentos: int

class ProcedimentoCreateRequest(BaseModel):
    """Model para criação de procedimento"""
    id_clinica: Optional[str] = Field(None, description="ID da clínica (opcional para procedimentos genéricos)")
    nm_procedimento: str = Field(..., max_length=255, description="Nome do procedimento")
    ds_descricao: Optional[str] = Field(None, alias="ds_procedimento", description="Descrição detalhada")
    ds_categoria: Optional[str] = Field(None, max_length=100)
    ds_subcategoria: Optional[str] = Field(None, max_length=100)
    vl_preco: Optional[Decimal] = Field(None, ge=0, description="Preço base")
    vl_preco_promocional: Optional[Decimal] = Field(None, ge=0)
    nr_duracao: int = Field(..., alias="nr_duracao_minutos", ge=15, le=480, description="Duração em minutos")
    nr_sessoes_recomendadas: Optional[int] = Field(None, ge=1)
    ds_indicacoes: Optional[str] = None
    ds_contraindicacoes: Optional[str] = None
    ds_preparacao: Optional[str] = None
    ds_cuidados_pos: Optional[str] = None
    ds_resultados_esperados: Optional[str] = None
    ds_foto_principal: Optional[str] = None
    ds_fotos: Optional[List[str]] = None
    ds_video: Optional[str] = None
    st_requer_avaliacao: Optional[bool] = Field(False)
    st_disponivel_online: Optional[bool] = Field(True)
    nr_idade_minima: Optional[int] = Field(None, ge=0, le=100)
    fg_ativo: Optional[bool] = Field(True, alias="st_ativo")

    class Config:
        populate_by_name = True

# ============================================
# Procedimentos - Criar
# ============================================

@router.post("/", response_model=dict, status_code=201)
async def criar_procedimento(
    data: ProcedimentoCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Criar novo procedimento

    - Se `id_clinica` for fornecido, valida que a clínica pertence à empresa do usuário
    - Se `id_clinica` for None, cria procedimento genérico (disponível para toda empresa)
    """
    try:
        # Validar empresa do usuário
        if not current_user.id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada"
            )

        # Se id_clinica fornecido, validar ownership
        if data.id_clinica:
            try:
                clinica_uuid = uuid.UUID(data.id_clinica)
            except ValueError:
                raise HTTPException(status_code=400, detail="ID de clínica inválido")

            # Verificar se clínica pertence à empresa do usuário
            check_query = text("""
                SELECT id_clinica
                FROM tb_clinicas
                WHERE id_clinica = :id_clinica
                  AND id_empresa = :id_empresa
                  AND st_ativo = TRUE
            """)
            result = await db.execute(check_query, {
                "id_clinica": str(clinica_uuid),
                "id_empresa": str(current_user.id_empresa)
            })
            if not result.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Clínica não encontrada ou não pertence à sua empresa"
                )

        # Gerar ID para o procedimento
        novo_id = uuid.uuid4()

        # Preparar dados para inserção
        insert_data = {
            "id_procedimento": str(novo_id),
            "id_clinica": str(uuid.UUID(data.id_clinica)) if data.id_clinica else None,
            "nm_procedimento": data.nm_procedimento,
            "ds_procedimento": data.ds_descricao,
            "ds_categoria": data.ds_categoria,
            "ds_subcategoria": data.ds_subcategoria,
            "vl_preco": float(data.vl_preco) if data.vl_preco else None,
            "vl_preco_promocional": float(data.vl_preco_promocional) if data.vl_preco_promocional else None,
            "nr_duracao_minutos": data.nr_duracao,
            "nr_sessoes_recomendadas": data.nr_sessoes_recomendadas,
            "ds_indicacoes": data.ds_indicacoes,
            "ds_contraindicacoes": data.ds_contraindicacoes,
            "ds_preparacao": data.ds_preparacao,
            "ds_cuidados_pos": data.ds_cuidados_pos,
            "ds_resultados_esperados": data.ds_resultados_esperados,
            "ds_foto_principal": data.ds_foto_principal,
            "ds_fotos": data.ds_fotos,
            "ds_video": data.ds_video,
            "st_requer_avaliacao": data.st_requer_avaliacao,
            "st_disponivel_online": data.st_disponivel_online,
            "nr_idade_minima": data.nr_idade_minima,
            "st_ativo": data.fg_ativo,
        }

        # INSERT
        insert_query = text("""
            INSERT INTO tb_procedimentos (
                id_procedimento, id_clinica, nm_procedimento, ds_procedimento,
                ds_categoria, ds_subcategoria, vl_preco, vl_preco_promocional,
                nr_duracao_minutos, nr_sessoes_recomendadas,
                ds_indicacoes, ds_contraindicacoes, ds_preparacao, ds_cuidados_pos,
                ds_resultados_esperados, ds_foto_principal, ds_fotos, ds_video,
                st_requer_avaliacao, st_disponivel_online, nr_idade_minima, st_ativo,
                dt_criacao
            ) VALUES (
                :id_procedimento, :id_clinica, :nm_procedimento, :ds_procedimento,
                :ds_categoria, :ds_subcategoria, :vl_preco, :vl_preco_promocional,
                :nr_duracao_minutos, :nr_sessoes_recomendadas,
                :ds_indicacoes, :ds_contraindicacoes, :ds_preparacao, :ds_cuidados_pos,
                :ds_resultados_esperados, :ds_foto_principal, :ds_fotos, :ds_video,
                :st_requer_avaliacao, :st_disponivel_online, :nr_idade_minima, :st_ativo,
                NOW()
            )
            RETURNING id_procedimento
        """)

        await db.execute(insert_query, insert_data)
        await db.commit()

        logger.info(f"Procedimento {novo_id} criado com sucesso por usuário {current_user.id_user}")

        # Buscar procedimento criado com dados completos
        select_query = text("""
            SELECT
                p.id_procedimento,
                p.id_clinica,
                p.nm_procedimento,
                p.ds_procedimento,
                p.ds_categoria,
                p.ds_subcategoria,
                p.vl_preco,
                p.vl_preco_promocional,
                p.nr_duracao_minutos,
                p.nr_sessoes_recomendadas,
                p.ds_indicacoes,
                p.ds_contraindicacoes,
                p.ds_preparacao,
                p.ds_cuidados_pos,
                p.ds_resultados_esperados,
                p.ds_foto_principal,
                p.ds_fotos,
                p.ds_video,
                p.st_requer_avaliacao,
                p.st_disponivel_online,
                p.nr_idade_minima,
                p.st_ativo,
                p.dt_criacao
            FROM tb_procedimentos p
            WHERE p.id_procedimento = :id_procedimento
        """)

        result = await db.execute(select_query, {"id_procedimento": str(novo_id)})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=500, detail="Erro ao recuperar procedimento criado")

        procedimento_criado = {
            "id_procedimento": str(row[0]),
            "id_clinica": str(row[1]) if row[1] else None,
            "nm_procedimento": row[2],
            "ds_procedimento": row[3],
            "ds_categoria": row[4],
            "ds_subcategoria": row[5],
            "vl_preco": float(row[6]) if row[6] is not None else None,
            "vl_preco_promocional": float(row[7]) if row[7] is not None else None,
            "nr_duracao_minutos": row[8],
            "nr_sessoes_recomendadas": row[9],
            "ds_indicacoes": row[10],
            "ds_contraindicacoes": row[11],
            "ds_preparacao": row[12],
            "ds_cuidados_pos": row[13],
            "ds_resultados_esperados": row[14],
            "ds_foto_principal": row[15],
            "ds_fotos": row[16] if row[16] else [],
            "ds_video": row[17],
            "st_requer_avaliacao": row[18],
            "st_disponivel_online": row[19],
            "nr_idade_minima": row[20],
            "st_ativo": row[21],
            "dt_criacao": row[22].isoformat() if row[22] else None,
        }

        return procedimento_criado

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar procedimento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar procedimento: {str(e)}")

# ============================================
# Procedimentos - Listagem e Filtros
# ============================================

@router.get("/", response_model=dict)
async def listar_procedimentos(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(20, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por nome ou descrição"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    subcategoria: Optional[str] = Query(None, description="Filtrar por subcategoria"),
    preco_min: Optional[float] = Query(None, description="Preço mínimo"),
    preco_max: Optional[float] = Query(None, description="Preço máximo"),
    duracao_max: Optional[int] = Query(None, description="Duração máxima em minutos"),
    clinica_id: Optional[str] = Query(None, description="Filtrar por clínica"),
    disponivel_online: Optional[bool] = Query(None, description="Apenas procedimentos disponíveis online"),
    ordenar_por: str = Query("relevancia", description="Ordenar por: relevancia, preco_asc, preco_desc, duracao, nome"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar procedimentos com filtros e paginação"""
    try:
        # Filtros
        conditions = ["p.st_ativo = TRUE"]

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas procedimentos da empresa do usuário logado
        if not current_user.id_empresa:
            raise HTTPException(
                status_code=403,
                detail="Usuário não possui empresa associada. Entre em contato com o suporte."
            )
        conditions.append(f"c.id_empresa = '{current_user.id_empresa}'")

        if search:
            # Busca por nome ou descrição
            search_term = search.replace("'", "''")  # Escape single quotes
            conditions.append(f"(p.nm_procedimento ILIKE '%{search_term}%' OR p.ds_procedimento ILIKE '%{search_term}%')")

        if categoria:
            categoria_escaped = categoria.replace("'", "''")
            conditions.append(f"p.ds_categoria = '{categoria_escaped}'")

        if subcategoria:
            subcategoria_escaped = subcategoria.replace("'", "''")
            conditions.append(f"p.ds_subcategoria = '{subcategoria_escaped}'")

        if preco_min is not None:
            conditions.append(f"p.vl_preco >= {preco_min}")

        if preco_max is not None:
            conditions.append(f"p.vl_preco <= {preco_max}")

        if duracao_max is not None:
            conditions.append(f"p.nr_duracao_minutos <= {duracao_max}")

        if clinica_id:
            conditions.append(f"p.id_clinica = '{clinica_id}'")

        if disponivel_online is not None:
            conditions.append(f"p.st_disponivel_online = {disponivel_online}")

        where_clause = " AND ".join(conditions)

        # Ordenação
        order_clause = "p.nr_ordem_exibicao ASC, p.nm_procedimento ASC"
        if ordenar_por == "preco_asc":
            order_clause = "p.vl_preco ASC NULLS LAST"
        elif ordenar_por == "preco_desc":
            order_clause = "p.vl_preco DESC NULLS LAST"
        elif ordenar_por == "duracao":
            order_clause = "p.nr_duracao_minutos ASC"
        elif ordenar_por == "nome":
            order_clause = "p.nm_procedimento ASC"

        # Count total
        count_query = text(f"""
            SELECT COUNT(*)
            FROM tb_procedimentos p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE {where_clause}
        """)
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Paginação
        offset = (page - 1) * size

        # Buscar procedimentos com dados da clínica
        query = text(f"""
            SELECT
                p.id_procedimento,
                p.nm_procedimento,
                p.ds_categoria,
                p.vl_preco,
                p.vl_preco_promocional,
                p.nr_duracao_minutos,
                p.nr_sessoes_recomendadas,
                p.ds_foto_principal,
                p.st_disponivel_online,
                c.nm_clinica
            FROM tb_procedimentos p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE {where_clause}
            ORDER BY {order_clause}
            LIMIT {size} OFFSET {offset}
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        procedimentos = []
        for row in rows:
            procedimentos.append({
                "id_procedimento": str(row[0]),
                "nm_procedimento": row[1],
                "ds_categoria": row[2],
                "vl_preco": float(row[3]) if row[3] is not None else None,
                "vl_preco_promocional": float(row[4]) if row[4] is not None else None,
                "nr_duracao_minutos": row[5],
                "nr_sessoes_recomendadas": row[6],
                "ds_foto_principal": row[7],
                "st_disponivel_online": row[8],
                "nm_clinica": row[9],
            })

        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "items": procedimentos,
            "meta": {
                "totalItems": total,
                "itemsPerPage": size,
                "totalPages": total_pages,
                "currentPage": page,
            }
        }

    except Exception as e:
        logger.error(f"Erro ao listar procedimentos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar procedimentos: {str(e)}")


@router.get("/categorias", response_model=List[CategoriaResponse])
async def listar_categorias(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar todas as categorias de procedimentos disponíveis"""
    try:
        query = text("""
            SELECT
                p.ds_categoria,
                COUNT(*) as total
            FROM tb_procedimentos p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE p.st_ativo = TRUE
              AND c.id_empresa = :id_empresa
            GROUP BY p.ds_categoria
            ORDER BY p.ds_categoria
        """)

        result = await db.execute(query, {"id_empresa": str(current_user.id_empresa)})
        rows = result.fetchall()

        categorias = []
        for row in rows:
            categorias.append({
                "ds_categoria": row[0],
                "total_procedimentos": row[1]
            })

        return categorias

    except Exception as e:
        logger.error(f"Erro ao listar categorias: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar categorias: {str(e)}")


@router.get("/{procedimento_id}", response_model=dict)
async def obter_procedimento(
    procedimento_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obter detalhes completos de um procedimento"""
    try:
        try:
            procedimento_uuid = uuid.UUID(procedimento_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="Procedimento não encontrado")

        query = text("""
            SELECT
                p.id_procedimento,
                p.id_clinica,
                p.nm_procedimento,
                p.ds_procedimento,
                p.ds_categoria,
                p.ds_subcategoria,
                p.vl_preco,
                p.vl_preco_promocional,
                p.nr_duracao_minutos,
                p.nr_sessoes_recomendadas,
                p.ds_indicacoes,
                p.ds_contraindicacoes,
                p.ds_preparacao,
                p.ds_cuidados_pos,
                p.ds_resultados_esperados,
                p.ds_foto_principal,
                p.ds_fotos,
                p.ds_video,
                p.st_requer_avaliacao,
                p.st_disponivel_online,
                p.nr_idade_minima,
                p.st_ativo,
                c.nm_clinica,
                c.ds_endereco,
                c.nr_avaliacao_media
            FROM tb_procedimentos p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE p.id_procedimento = :procedimento_id
              AND p.st_ativo = TRUE
              AND c.id_empresa = :id_empresa
        """)

        result = await db.execute(query, {
            "procedimento_id": str(procedimento_uuid),
            "id_empresa": str(current_user.id_empresa)
        })
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Procedimento não encontrado")

        procedimento = {
            "id_procedimento": str(row[0]),
            "id_clinica": str(row[1]) if row[1] else None,
            "nm_procedimento": row[2],
            "ds_procedimento": row[3],
            "ds_categoria": row[4],
            "ds_subcategoria": row[5],
            "vl_preco": float(row[6]) if row[6] is not None else None,
            "vl_preco_promocional": float(row[7]) if row[7] is not None else None,
            "nr_duracao_minutos": row[8],
            "nr_sessoes_recomendadas": row[9],
            "ds_indicacoes": row[10],
            "ds_contraindicacoes": row[11],
            "ds_preparacao": row[12],
            "ds_cuidados_pos": row[13],
            "ds_resultados_esperados": row[14],
            "ds_foto_principal": row[15],
            "ds_fotos": row[16] if row[16] else [],
            "ds_video": row[17],
            "st_requer_avaliacao": row[18],
            "st_disponivel_online": row[19],
            "nr_idade_minima": row[20],
            "st_ativo": row[21],
            "nm_clinica": row[22],
            "ds_endereco": row[23],
            "nr_avaliacao_clinica": float(row[24]) if row[24] is not None else None,
        }

        return procedimento

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter procedimento {procedimento_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar procedimento: {str(e)}")


@router.get("/comparar/{nome_procedimento}", response_model=dict)
async def comparar_procedimento_entre_clinicas(
    nome_procedimento: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Comparar o mesmo procedimento entre diferentes clínicas.
    Retorna todas as clínicas que oferecem o procedimento especificado.
    """
    try:
        # Buscar procedimento em diferentes clínicas
        query = text("""
            SELECT
                p.id_procedimento,
                p.nm_procedimento,
                p.vl_preco,
                p.vl_preco_promocional,
                p.nr_duracao_minutos,
                p.nr_sessoes_recomendadas,
                p.ds_foto_principal,
                c.id_clinica,
                c.nm_clinica,
                c.ds_endereco,
                c.nm_bairro,
                c.nm_cidade,
                c.nm_estado,
                c.nr_avaliacao_media,
                c.nr_total_avaliacoes
            FROM tb_procedimentos p
            INNER JOIN tb_clinicas c ON p.id_clinica = c.id_clinica
            WHERE p.nm_procedimento ILIKE :nome_procedimento
              AND p.st_ativo = TRUE
              AND c.st_ativo = TRUE
              AND c.id_empresa = :id_empresa
            ORDER BY p.vl_preco ASC NULLS LAST
        """)

        result = await db.execute(query, {
            "nome_procedimento": f"%{nome_procedimento}%",
            "id_empresa": str(current_user.id_empresa)
        })
        rows = result.fetchall()

        if not rows:
            raise HTTPException(
                status_code=404,
                detail=f"Nenhuma clínica oferece o procedimento '{nome_procedimento}'"
            )

        comparacao = []
        for row in rows:
            # Calcular preço com desconto se houver
            vl_preco = float(row[2]) if row[2] is not None else None
            vl_preco_promocional = float(row[3]) if row[3] is not None else None
            vl_final = vl_preco_promocional if vl_preco_promocional else vl_preco

            # Calcular desconto percentual
            desconto_percentual = None
            if vl_preco and vl_preco_promocional and vl_preco > vl_preco_promocional:
                desconto_percentual = round(((vl_preco - vl_preco_promocional) / vl_preco) * 100, 1)

            comparacao.append({
                "id_procedimento": str(row[0]),
                "nm_procedimento": row[1],
                "vl_preco": vl_preco,
                "vl_preco_promocional": vl_preco_promocional,
                "vl_final": vl_final,
                "desconto_percentual": desconto_percentual,
                "nr_duracao_minutos": row[4],
                "nr_sessoes_recomendadas": row[5],
                "ds_foto_principal": row[6],
                "clinica": {
                    "id_clinica": str(row[7]),
                    "nm_clinica": row[8],
                    "ds_endereco": row[9],
                    "ds_bairro": row[10],
                    "ds_cidade": row[11],
                    "ds_estado": row[12],
                    "nr_avaliacao_media": float(row[13]) if row[13] is not None else None,
                    "nr_total_avaliacoes": row[14],
                }
            })

        # Estatísticas da comparação
        precos_validos = [item["vl_final"] for item in comparacao if item["vl_final"] is not None]
        stats = {
            "total_clinicas": len(comparacao),
            "preco_minimo": min(precos_validos) if precos_validos else None,
            "preco_maximo": max(precos_validos) if precos_validos else None,
            "preco_medio": round(sum(precos_validos) / len(precos_validos), 2) if precos_validos else None,
        }

        return {
            "procedimento": nome_procedimento,
            "comparacao": comparacao,
            "estatisticas": stats
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao comparar procedimento '{nome_procedimento}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao comparar procedimento: {str(e)}")
