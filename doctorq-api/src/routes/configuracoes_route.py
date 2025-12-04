"""
Rotas para Gerenciamento de Configurações do Sistema
"""

import base64
from typing import List, Optional
from cryptography.fernet import Fernet
import os

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger_config import get_logger
from src.config.orm_config import get_db
from src.models.user import User
from src.utils.auth import get_current_apikey, get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/configuracoes", tags=["configuracoes"])

# ============================================
# Criptografia para valores sensíveis
# ============================================

# Chave de criptografia (deve estar no .env em produção)
ENCRYPTION_KEY = os.getenv("CONFIG_ENCRYPTION_KEY", Fernet.generate_key())
if isinstance(ENCRYPTION_KEY, str):
    ENCRYPTION_KEY = ENCRYPTION_KEY.encode()

cipher = Fernet(ENCRYPTION_KEY)


def criptografar_valor(valor: str) -> str:
    """Criptografa um valor sensível"""
    if not valor:
        return ""
    return cipher.encrypt(valor.encode()).decode()


def descriptografar_valor(valor_criptografado: str) -> str:
    """Descriptografa um valor sensível"""
    if not valor_criptografado:
        return ""
    try:
        return cipher.decrypt(valor_criptografado.encode()).decode()
    except Exception as e:
        logger.error(f"Erro ao descriptografar valor: {str(e)}")
        return ""


# ============================================
# Models
# ============================================

class ConfiguracaoResponse(BaseModel):
    id_configuracao: str
    nm_chave: str
    ds_valor: Optional[str]
    ds_tipo: str
    ds_categoria: str
    ds_descricao: Optional[str]
    st_criptografado: bool
    st_ativo: bool
    dt_criacao: str
    dt_atualizacao: str

    # Valor descriptografado (apenas para visualização)
    ds_valor_real: Optional[str] = None


class ConfiguracaoUpdateRequest(BaseModel):
    ds_valor: str


class ConfiguracaoCreateRequest(BaseModel):
    nm_chave: str = Field(description="Chave única da configuração (ex: whatsapp_token)")
    ds_valor: str
    ds_tipo: str = Field(default="texto", description="texto, numero, boolean, json, senha")
    ds_categoria: str = Field(description="whatsapp, email, sms, pagamento, geral")
    ds_descricao: Optional[str] = None
    st_criptografado: bool = False


class ConfiguracaoCategoriaResponse(BaseModel):
    ds_categoria: str
    total_configuracoes: int


# ============================================
# Endpoints
# ============================================

@router.get("/", response_model=dict)
async def listar_configuracoes(
    categoria: Optional[str] = None,
    apenas_ativas: bool = True,
    mostrar_valores: bool = False,  # Por segurança, valores sensíveis ocultos por padrão
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista todas as configurações do sistema.
    Por padrão, valores de configurações criptografadas são ocultados.
    """
    try:
        conditions = []

        # ⚠️ FILTRO OBRIGATÓRIO: Apenas configurações da empresa do usuário logado
        conditions.append(f"id_empresa = '{current_user.id_empresa}'")

        if categoria:
            conditions.append(f"ds_categoria = '{categoria}'")

        if apenas_ativas:
            conditions.append("st_ativo = TRUE")

        where_clause = " AND ".join(conditions)

        query = text(f"""
            SELECT
                id_configuracao,
                nm_chave,
                ds_valor,
                ds_tipo,
                ds_categoria,
                ds_descricao,
                st_criptografado,
                st_ativo,
                dt_criacao,
                dt_atualizacao
            FROM tb_configuracoes
            WHERE {where_clause}
            ORDER BY ds_categoria, nm_chave
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        configuracoes = []
        for row in rows:
            st_criptografado = row[6]
            ds_valor = row[2]

            # Se é criptografado e deve mostrar valores, descriptografar
            if st_criptografado and ds_valor and mostrar_valores:
                ds_valor_real = descriptografar_valor(ds_valor)
            else:
                ds_valor_real = ds_valor if not st_criptografado else "********"

            configuracoes.append({
                "id_configuracao": str(row[0]),
                "nm_chave": row[1],
                "ds_valor": "********" if st_criptografado and not mostrar_valores else ds_valor,
                "ds_valor_real": ds_valor_real if mostrar_valores else None,
                "ds_tipo": row[3],
                "ds_categoria": row[4],
                "ds_descricao": row[5],
                "st_criptografado": st_criptografado,
                "st_ativo": row[7],
                "dt_criacao": row[8].isoformat() if row[8] else None,
                "dt_atualizacao": row[9].isoformat() if row[9] else None,
            })

        return {
            "items": configuracoes,
            "total": len(configuracoes)
        }

    except Exception as e:
        logger.error(f"Erro ao listar configurações: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar configurações: {str(e)}")


@router.get("/categorias", response_model=List[ConfiguracaoCategoriaResponse])
async def listar_categorias(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista todas as categorias de configurações disponíveis"""
    try:
        query = text("""
            SELECT
                ds_categoria,
                COUNT(*) as total
            FROM tb_configuracoes
            WHERE st_ativo = TRUE
              AND id_empresa = :id_empresa
            GROUP BY ds_categoria
            ORDER BY ds_categoria
        """)

        result = await db.execute(query, {"id_empresa": str(current_user.id_empresa)})
        rows = result.fetchall()

        categorias = []
        for row in rows:
            categorias.append({
                "ds_categoria": row[0],
                "total_configuracoes": row[1]
            })

        return categorias

    except Exception as e:
        logger.error(f"Erro ao listar categorias: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{chave}")
async def obter_configuracao(
    chave: str,
    descriptografar: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtém uma configuração específica pela chave.
    Se descriptografar=True, retorna o valor real de configurações criptografadas.
    """
    try:
        query = text("""
            SELECT
                id_configuracao,
                nm_chave,
                ds_valor,
                ds_tipo,
                ds_categoria,
                ds_descricao,
                st_criptografado,
                st_ativo
            FROM tb_configuracoes
            WHERE nm_chave = :chave
              AND id_empresa = :id_empresa
        """)

        result = await db.execute(query, {
            "chave": chave,
            "id_empresa": str(current_user.id_empresa)
        })
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Configuração não encontrada")

        st_criptografado = row[6]
        ds_valor = row[2]

        # Descriptografar se solicitado e se for criptografado
        if st_criptografado and ds_valor and descriptografar:
            ds_valor_real = descriptografar_valor(ds_valor)
        else:
            ds_valor_real = ds_valor if not st_criptografado else "********"

        return {
            "id_configuracao": str(row[0]),
            "nm_chave": row[1],
            "ds_valor": "********" if st_criptografado and not descriptografar else ds_valor,
            "ds_valor_real": ds_valor_real if descriptografar else None,
            "ds_tipo": row[3],
            "ds_categoria": row[4],
            "ds_descricao": row[5],
            "st_criptografado": st_criptografado,
            "st_ativo": row[7],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter configuração: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{chave}")
async def atualizar_configuracao(
    chave: str,
    request: ConfiguracaoUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Atualiza o valor de uma configuração.
    Se a configuração for marcada como criptografada, o valor será criptografado automaticamente.
    """
    try:
        # Verificar se configuração existe e se é criptografada
        check_query = text("""
            SELECT st_criptografado
            FROM tb_configuracoes
            WHERE nm_chave = :chave
        """)

        result = await db.execute(check_query, {"chave": chave})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Configuração não encontrada")

        st_criptografado = row[0]

        # Criptografar valor se necessário
        valor_final = request.ds_valor
        if st_criptografado and request.ds_valor:
            valor_final = criptografar_valor(request.ds_valor)

        # Atualizar
        update_query = text("""
            UPDATE tb_configuracoes
            SET ds_valor = :valor,
                dt_atualizacao = NOW()
            WHERE nm_chave = :chave
            RETURNING id_configuracao
        """)

        result = await db.execute(update_query, {
            "chave": chave,
            "valor": valor_final
        })

        await db.commit()

        row = result.fetchone()

        logger.info(f"Configuração '{chave}' atualizada")

        return {
            "success": True,
            "message": "Configuração atualizada com sucesso",
            "id_configuracao": str(row[0])
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao atualizar configuração: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def criar_configuracao(
    request: ConfiguracaoCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """Cria uma nova configuração"""
    try:
        # Criptografar valor se necessário
        valor_final = request.ds_valor
        if request.st_criptografado and request.ds_valor:
            valor_final = criptografar_valor(request.ds_valor)

        query = text("""
            INSERT INTO tb_configuracoes (
                nm_chave,
                ds_valor,
                ds_tipo,
                ds_categoria,
                ds_descricao,
                st_criptografado
            ) VALUES (
                :nm_chave,
                :ds_valor,
                :ds_tipo,
                :ds_categoria,
                :ds_descricao,
                :st_criptografado
            )
            RETURNING id_configuracao
        """)

        result = await db.execute(query, {
            "nm_chave": request.nm_chave,
            "ds_valor": valor_final,
            "ds_tipo": request.ds_tipo,
            "ds_categoria": request.ds_categoria,
            "ds_descricao": request.ds_descricao,
            "st_criptografado": request.st_criptografado
        })

        await db.commit()

        row = result.fetchone()

        logger.info(f"Configuração '{request.nm_chave}' criada")

        return {
            "success": True,
            "message": "Configuração criada com sucesso",
            "id_configuracao": str(row[0])
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar configuração: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{chave}")
async def desativar_configuracao(
    chave: str,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_apikey),
):
    """
    Desativa uma configuração (soft delete).
    Configurações não são deletadas fisicamente para manter histórico.
    """
    try:
        query = text("""
            UPDATE tb_configuracoes
            SET st_ativo = FALSE,
                dt_atualizacao = NOW()
            WHERE nm_chave = :chave
            RETURNING id_configuracao
        """)

        result = await db.execute(query, {"chave": chave})
        await db.commit()

        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Configuração não encontrada")

        logger.info(f"Configuração '{chave}' desativada")

        return {
            "success": True,
            "message": "Configuração desativada com sucesso"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao desativar configuração: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Helpers para uso interno
# ============================================

async def get_config_value(chave: str, db: AsyncSession) -> Optional[str]:
    """
    Helper para buscar valor de configuração (uso interno na API).
    Retorna valor descriptografado se for criptografado.
    """
    try:
        query = text("""
            SELECT ds_valor, st_criptografado
            FROM tb_configuracoes
            WHERE nm_chave = :chave AND st_ativo = TRUE
        """)

        result = await db.execute(query, {"chave": chave})
        row = result.fetchone()

        if not row:
            return None

        ds_valor = row[0]
        st_criptografado = row[1]

        if st_criptografado and ds_valor:
            return descriptografar_valor(ds_valor)

        return ds_valor

    except Exception as e:
        logger.error(f"Erro ao buscar configuração '{chave}': {str(e)}")
        return None
