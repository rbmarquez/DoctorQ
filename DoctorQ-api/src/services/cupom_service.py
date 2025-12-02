"""
Serviço para gerenciamento de cupons de desconto
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
import uuid

from src.models.cupom import CupomORM, CupomUsoORM
from src.config.logger_config import get_logger

logger = get_logger(__name__)


class CupomService:
    """Serviço para gerenciar cupons de desconto"""

    @staticmethod
    async def validar_cupom(
        db: AsyncSession,
        codigo: str,
        user_id: uuid.UUID,
        valor_carrinho: Decimal,
        produtos_ids: Optional[List[uuid.UUID]] = None,
        categorias_ids: Optional[List[uuid.UUID]] = None,
    ) -> Dict[str, Any]:
        """
        Valida um cupom e retorna informações sobre desconto

        Args:
            db: Sessão do banco
            codigo: Código do cupom
            user_id: ID do usuário
            valor_carrinho: Valor total do carrinho
            produtos_ids: IDs dos produtos no carrinho
            categorias_ids: IDs das categorias dos produtos

        Returns:
            Dict com: valido (bool), desconto (Decimal), mensagem (str), cupom (dict)

        Raises:
            Exception: Erros de validação
        """
        try:
            # 1. Buscar cupom pelo código
            query = select(CupomORM).where(
                and_(
                    CupomORM.ds_codigo == codigo.upper(),
                    CupomORM.st_ativo == "S"
                )
            )
            result = await db.execute(query)
            cupom = result.scalar_one_or_none()

            if not cupom:
                return {
                    "valido": False,
                    "desconto": Decimal("0.00"),
                    "mensagem": "Cupom não encontrado ou inativo",
                    "cupom": None
                }

            # 2. Verificar validade (data)
            now = datetime.utcnow()
            if now < cupom.dt_inicio:
                return {
                    "valido": False,
                    "desconto": Decimal("0.00"),
                    "mensagem": f"Cupom ainda não está disponível. Válido a partir de {cupom.dt_inicio.strftime('%d/%m/%Y')}",
                    "cupom": None
                }

            if now > cupom.dt_fim:
                return {
                    "valido": False,
                    "desconto": Decimal("0.00"),
                    "mensagem": f"Cupom expirado em {cupom.dt_fim.strftime('%d/%m/%Y')}",
                    "cupom": None
                }

            # 3. Verificar valor mínimo de compra
            if cupom.vl_minimo_compra and valor_carrinho < cupom.vl_minimo_compra:
                return {
                    "valido": False,
                    "desconto": Decimal("0.00"),
                    "mensagem": f"Valor mínimo de compra: R$ {cupom.vl_minimo_compra:.2f}. Carrinho atual: R$ {valor_carrinho:.2f}",
                    "cupom": None
                }

            # 4. Verificar limite de usos totais
            if cupom.nr_usos_maximos is not None and cupom.nr_usos_atuais >= cupom.nr_usos_maximos:
                return {
                    "valido": False,
                    "desconto": Decimal("0.00"),
                    "mensagem": "Cupom esgotado. Limite de usos atingido",
                    "cupom": None
                }

            # 5. Verificar usos por usuário
            query_usos = select(func.count()).select_from(CupomUsoORM).where(
                and_(
                    CupomUsoORM.id_cupom == cupom.id_cupom,
                    CupomUsoORM.id_user == user_id
                )
            )
            result_usos = await db.execute(query_usos)
            usos_usuario = result_usos.scalar() or 0

            if usos_usuario >= cupom.nr_usos_por_usuario:
                return {
                    "valido": False,
                    "desconto": Decimal("0.00"),
                    "mensagem": f"Você já usou este cupom {cupom.nr_usos_por_usuario} vez(es). Limite atingido",
                    "cupom": None
                }

            # 6. Verificar restrição de primeira compra
            if cupom.st_primeira_compra:
                # Verificar se usuário já tem pedidos
                from src.models.pedido import PedidoORM
                query_pedidos = select(func.count()).select_from(PedidoORM).where(
                    PedidoORM.id_user == user_id
                )
                result_pedidos = await db.execute(query_pedidos)
                total_pedidos = result_pedidos.scalar() or 0

                if total_pedidos > 0:
                    return {
                        "valido": False,
                        "desconto": Decimal("0.00"),
                        "mensagem": "Este cupom é válido apenas para primeira compra",
                        "cupom": None
                    }

            # 7. Verificar restrições de produtos/categorias
            if cupom.ds_produtos_validos and produtos_ids:
                # Verificar se algum produto do carrinho está na lista válida
                produtos_validos = set([uuid.UUID(str(p)) for p in cupom.ds_produtos_validos])
                produtos_carrinho = set(produtos_ids)

                if not produtos_validos.intersection(produtos_carrinho):
                    return {
                        "valido": False,
                        "desconto": Decimal("0.00"),
                        "mensagem": "Nenhum produto do carrinho é elegível para este cupom",
                        "cupom": None
                    }

            if cupom.ds_categorias_validas and categorias_ids:
                categorias_validas = set([uuid.UUID(str(c)) for c in cupom.ds_categorias_validas])
                categorias_carrinho = set(categorias_ids)

                if not categorias_validas.intersection(categorias_carrinho):
                    return {
                        "valido": False,
                        "desconto": Decimal("0.00"),
                        "mensagem": "Nenhuma categoria do carrinho é elegível para este cupom",
                        "cupom": None
                    }

            # 8. Calcular desconto
            if cupom.ds_tipo_desconto == "percentual":
                desconto = valor_carrinho * (cupom.nr_percentual_desconto / Decimal("100.0"))
                desconto_texto = f"{cupom.nr_percentual_desconto}%"
            elif cupom.ds_tipo_desconto == "fixo":
                desconto = cupom.vl_desconto_fixo
                desconto_texto = f"R$ {cupom.vl_desconto_fixo:.2f}"
            else:
                logger.error(f"Tipo de desconto inválido: {cupom.ds_tipo_desconto}")
                return {
                    "valido": False,
                    "desconto": Decimal("0.00"),
                    "mensagem": "Erro ao calcular desconto",
                    "cupom": None
                }

            # 9. Aplicar limite máximo de desconto (se existir)
            if cupom.vl_maximo_desconto and desconto > cupom.vl_maximo_desconto:
                desconto = cupom.vl_maximo_desconto

            # 10. Garantir que desconto não ultrapasse valor do carrinho
            if desconto > valor_carrinho:
                desconto = valor_carrinho

            # Sucesso!
            return {
                "valido": True,
                "desconto": desconto,
                "mensagem": f"Cupom válido! Desconto de {desconto_texto} aplicado (R$ {desconto:.2f})",
                "cupom": cupom.to_dict()
            }

        except Exception as e:
            logger.error(f"Erro ao validar cupom: {str(e)}")
            raise

    @staticmethod
    async def registrar_uso(
        db: AsyncSession,
        cupom_id: uuid.UUID,
        user_id: uuid.UUID,
        pedido_id: uuid.UUID,
        valor_desconto: Decimal
    ):
        """
        Registra o uso de um cupom após finalização do pedido

        Args:
            db: Sessão do banco
            cupom_id: ID do cupom
            user_id: ID do usuário
            pedido_id: ID do pedido
            valor_desconto: Valor do desconto aplicado
        """
        try:
            # Registrar uso
            uso = CupomUsoORM(
                id_cupom=cupom_id,
                id_user=user_id,
                id_pedido=pedido_id,
                vl_desconto_aplicado=valor_desconto
            )
            db.add(uso)

            # Incrementar contador de usos
            query = select(CupomORM).where(CupomORM.id_cupom == cupom_id)
            result = await db.execute(query)
            cupom = result.scalar_one_or_none()

            if cupom:
                cupom.nr_usos_atuais = (cupom.nr_usos_atuais or 0) + 1

            await db.commit()
            logger.info(f"Uso de cupom registrado: {cupom_id} para pedido {pedido_id}")

        except Exception as e:
            await db.rollback()
            logger.error(f"Erro ao registrar uso de cupom: {str(e)}")
            raise

    @staticmethod
    async def listar_cupons_disponiveis(
        db: AsyncSession,
        user_id: uuid.UUID,
        empresa_id: Optional[uuid.UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Lista cupons disponíveis para um usuário

        Args:
            db: Sessão do banco
            user_id: ID do usuário
            empresa_id: ID da empresa (filtro opcional)

        Returns:
            Lista de cupons disponíveis
        """
        try:
            now = datetime.utcnow()

            # Query base
            query = select(CupomORM).where(
                and_(
                    CupomORM.st_ativo == "S",
                    CupomORM.dt_inicio <= now,
                    CupomORM.dt_fim >= now
                )
            )

            # Filtro por empresa
            if empresa_id:
                query = query.where(CupomORM.id_empresa == empresa_id)

            # Executar query
            result = await db.execute(query)
            cupons = result.scalars().all()

            cupons_disponiveis = []
            for cupom in cupons:
                # Verificar se usuário ainda pode usar
                query_usos = select(func.count()).select_from(CupomUsoORM).where(
                    and_(
                        CupomUsoORM.id_cupom == cupom.id_cupom,
                        CupomUsoORM.id_user == user_id
                    )
                )
                result_usos = await db.execute(query_usos)
                usos_usuario = result_usos.scalar() or 0

                if usos_usuario < cupom.nr_usos_por_usuario:
                    # Verificar se não está esgotado
                    if cupom.nr_usos_maximos is None or cupom.nr_usos_atuais < cupom.nr_usos_maximos:
                        cupons_disponiveis.append(cupom.to_dict())

            return cupons_disponiveis

        except Exception as e:
            logger.error(f"Erro ao listar cupons disponíveis: {str(e)}")
            raise
