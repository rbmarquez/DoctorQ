"""
Service para Emissão de Notas Fiscais - UC063
Integração com Focus NFe, eNotas e NFSe Nacional
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
import httpx
import base64

from sqlalchemy import select, and_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.nota_fiscal import (
    TbNotaFiscal,
    NotaFiscalCreate,
    StatusNotaFiscal,
    TipoNotaFiscal
)
from src.config.logger_config import get_logger

logger = get_logger("nota_fiscal_service")


class NotaFiscalService:
    """Service para emissão de notas fiscais eletrônicas"""

    @staticmethod
    async def criar_nota_fiscal(
        db: AsyncSession,
        id_empresa: UUID,
        data: NotaFiscalCreate
    ) -> TbNotaFiscal:
        """
        Cria e emite nota fiscal

        Processo:
        1. Validar dados
        2. Criar RPS (Recibo Provisório de Serviços)
        3. Enviar para API do provedor (Focus NFe, eNotas, etc)
        4. Armazenar resposta
        5. Atualizar status quando emitida
        """
        # Buscar dados da empresa (CNPJ, inscrição municipal, etc)
        from src.models.empresa import TbEmpresa

        query = select(TbEmpresa).where(TbEmpresa.id_empresa == id_empresa)
        result = await db.execute(query)
        empresa = result.scalar_one_or_none()

        if not empresa:
            raise ValueError("Empresa não encontrada")

        if not empresa.nr_cnpj:
            raise ValueError("Empresa não possui CNPJ cadastrado")

        # Calcular valores
        vl_servicos = data.vl_servicos
        vl_deducoes = data.vl_deducoes or 0
        vl_desconto = data.vl_desconto_incondicionado or 0

        # Base de cálculo ISS
        vl_base_calculo = vl_servicos - vl_deducoes - vl_desconto

        # Calcular ISS
        pc_aliquota_iss = data.servico.aliquota_iss
        vl_iss = vl_base_calculo * (pc_aliquota_iss / 100)

        # Calcular retenções
        vl_pis = data.vl_pis or 0
        vl_cofins = data.vl_cofins or 0
        vl_inss = data.vl_inss or 0
        vl_ir = data.vl_ir or 0
        vl_csll = data.vl_csll or 0

        vl_total_retencoes = vl_pis + vl_cofins + vl_inss + vl_ir + vl_csll
        vl_total_tributos = vl_iss + vl_total_retencoes

        # Valor líquido
        vl_liquido = vl_base_calculo - vl_total_retencoes

        # Gerar número RPS (sequencial por empresa)
        nr_rps = await NotaFiscalService._gerar_numero_rps(db, id_empresa)

        # Criar nota fiscal
        nota = TbNotaFiscal(
            id_empresa=id_empresa,
            id_pedido=data.id_pedido,
            id_fatura=data.id_fatura,
            tp_nota=TipoNotaFiscal.NFSE.value,
            nr_rps=nr_rps,
            st_nota=StatusNotaFiscal.PENDENTE.value,
            vl_servicos=vl_servicos,
            vl_deducoes=vl_deducoes,
            vl_pis=vl_pis,
            vl_cofins=vl_cofins,
            vl_inss=vl_inss,
            vl_ir=vl_ir,
            vl_csll=vl_csll,
            vl_iss=vl_iss,
            vl_desconto_incondicionado=vl_desconto,
            vl_outras_retencoes=0,
            vl_total_tributos=vl_total_tributos,
            vl_liquido=vl_liquido,
            pc_aliquota_iss=pc_aliquota_iss,
            ds_tomador_cnpj_cpf=data.tomador.cnpj_cpf,
            ds_tomador_razao_social=data.tomador.razao_social,
            ds_tomador_email=data.tomador.email,
            ds_tomador_endereco=data.tomador.endereco,
            ds_prestador_cnpj=empresa.nr_cnpj,
            ds_prestador_razao_social=empresa.nm_razao_social or empresa.nm_empresa,
            ds_prestador_inscricao_municipal=empresa.nr_inscricao_municipal,
            ds_prestador_endereco={
                "logradouro": empresa.ds_endereco,
                "numero": empresa.ds_numero,
                "complemento": empresa.ds_complemento,
                "bairro": empresa.ds_bairro,
                "cidade": empresa.ds_cidade,
                "uf": empresa.ds_estado,
                "cep": empresa.ds_cep,
            },
            ds_discriminacao=data.servico.discriminacao,
            ds_codigo_servico=data.servico.codigo_servico,
            ds_item_lista_servico=data.servico.item_lista_servico,
            ds_provedor_nfe=data.provedor_nfe,
        )

        db.add(nota)
        await db.commit()
        await db.refresh(nota)

        # Tentar emitir a nota imediatamente
        try:
            await NotaFiscalService.emitir_nota_fiscal(db, nota.id_nota_fiscal, data.provedor_nfe)
        except Exception as e:
            logger.error(f"Erro ao emitir nota fiscal {nota.id_nota_fiscal}: {str(e)}")
            # Nota fica com status pendente para retry posterior

        return nota

    @staticmethod
    async def _gerar_numero_rps(db: AsyncSession, id_empresa: UUID) -> str:
        """Gera número sequencial de RPS por empresa"""
        query = select(func.count(TbNotaFiscal.id_nota_fiscal)).where(
            TbNotaFiscal.id_empresa == id_empresa
        )
        total = await db.scalar(query)
        return str((total or 0) + 1).zfill(6)  # Ex: 000001, 000002, etc

    @staticmethod
    async def emitir_nota_fiscal(
        db: AsyncSession,
        id_nota_fiscal: UUID,
        provedor: str = "focus_nfe"
    ) -> TbNotaFiscal:
        """
        Emite nota fiscal via API do provedor
        """
        query = select(TbNotaFiscal).where(TbNotaFiscal.id_nota_fiscal == id_nota_fiscal)
        result = await db.execute(query)
        nota = result.scalar_one_or_none()

        if not nota:
            raise ValueError("Nota fiscal não encontrada")

        if nota.st_nota == StatusNotaFiscal.EMITIDA.value:
            raise ValueError("Nota fiscal já foi emitida")

        if nota.fg_cancelada:
            raise ValueError("Nota fiscal está cancelada")

        # Atualizar status
        nota.st_nota = StatusNotaFiscal.PROCESSANDO.value
        await db.commit()

        try:
            # Chamar API do provedor
            if provedor == "focus_nfe":
                resposta = await NotaFiscalService._emitir_focus_nfe(nota)
            elif provedor == "enotas":
                resposta = await NotaFiscalService._emitir_enotas(nota)
            elif provedor == "nfse_nacional":
                resposta = await NotaFiscalService._emitir_nfse_nacional(nota)
            else:
                raise ValueError(f"Provedor {provedor} não suportado")

            # Atualizar nota com resposta
            nota.st_nota = StatusNotaFiscal.EMITIDA.value
            nota.nr_nota = resposta.get("numero")
            nota.ds_serie = resposta.get("serie")
            nota.ds_chave_acesso = resposta.get("chave_acesso")
            nota.ds_codigo_verificacao = resposta.get("codigo_verificacao")
            nota.ds_url_nfe = resposta.get("url_nfe")
            nota.ds_url_pdf = resposta.get("url_pdf")
            nota.ds_ref_externa = resposta.get("ref_externa")
            nota.ds_xml_nfe = resposta.get("xml_nfe")
            nota.ds_dados_completos = resposta
            nota.dt_emissao = datetime.fromisoformat(resposta.get("data_emissao")) if resposta.get("data_emissao") else datetime.utcnow()
            nota.ds_status_mensagem = "Nota fiscal emitida com sucesso"

            await db.commit()
            await db.refresh(nota)

            logger.info(f"Nota fiscal {id_nota_fiscal} emitida: {nota.nr_nota}")

            # Enviar email com nota para o cliente
            if nota.ds_tomador_email:
                await NotaFiscalService._enviar_email_nota(nota)

            return nota

        except Exception as e:
            nota.st_nota = StatusNotaFiscal.ERRO.value
            nota.ds_status_mensagem = str(e)
            await db.commit()
            logger.error(f"Erro ao emitir nota {id_nota_fiscal}: {str(e)}")
            raise

    @staticmethod
    async def _emitir_focus_nfe(nota: TbNotaFiscal) -> Dict[str, Any]:
        """
        Integração com Focus NFe
        API: https://focusnfe.com.br/api/

        NOTA: Requer credenciais Focus NFe configuradas
        """
        # TODO: Buscar credenciais da tabela tb_credenciais
        # API_TOKEN = await obter_credencial("FOCUS_NFE_API_TOKEN")

        # Mock de resposta (em produção, fazer request real)
        async with httpx.AsyncClient() as client:
            # headers = {
            #     "Authorization": f"Bearer {API_TOKEN}",
            #     "Content-Type": "application/json"
            # }

            # payload = {
            #     "data_emissao": datetime.now().isoformat(),
            #     "prestador": {
            #         "cnpj": nota.ds_prestador_cnpj,
            #         "inscricao_municipal": nota.ds_prestador_inscricao_municipal,
            #     },
            #     "tomador": {
            #         "cnpj_cpf": nota.ds_tomador_cnpj_cpf,
            #         "razao_social": nota.ds_tomador_razao_social,
            #         "email": nota.ds_tomador_email,
            #         "endereco": nota.ds_tomador_endereco,
            #     },
            #     "servico": {
            #         "discriminacao": nota.ds_discriminacao,
            #         "valor_servicos": float(nota.vl_servicos),
            #         "valor_iss": float(nota.vl_iss),
            #         "aliquota": float(nota.pc_aliquota_iss),
            #         "item_lista_servico": nota.ds_item_lista_servico,
            #     }
            # }

            # response = await client.post(
            #     "https://api.focusnfe.com.br/v2/nfse",
            #     headers=headers,
            #     json=payload,
            #     timeout=60.0
            # )
            # resposta = response.json()

            # Mock para desenvolvimento
            resposta = {
                "ref_externa": f"FOCUS_{nota.id_nota_fiscal}",
                "numero": f"{int(nota.nr_rps) + 10000}",
                "serie": "001",
                "chave_acesso": "".join([str(i % 10) for i in range(44)]),
                "codigo_verificacao": "ABCD1234",
                "url_nfe": f"https://nfse.prefeitura.sp.gov.br/verificacao?chave={''.join([str(i % 10) for i in range(44)])}",
                "url_pdf": f"https://api.focusnfe.com.br/v2/nfse/{nota.id_nota_fiscal}/pdf",
                "data_emissao": datetime.now().isoformat(),
                "xml_nfe": "<NFSe>mock</NFSe>",
            }

            logger.info(f"Focus NFe: Nota emitida (mock) - {resposta['numero']}")
            return resposta

    @staticmethod
    async def _emitir_enotas(nota: TbNotaFiscal) -> Dict[str, Any]:
        """
        Integração com eNotas
        API: https://www.enotas.com.br/docs

        NOTA: Requer credenciais eNotas configuradas
        """
        # TODO: Implementar integração real

        # Mock para desenvolvimento
        resposta = {
            "ref_externa": f"ENOTAS_{nota.id_nota_fiscal}",
            "numero": f"{int(nota.nr_rps) + 20000}",
            "serie": "002",
            "chave_acesso": "".join([str((i+1) % 10) for i in range(44)]),
            "codigo_verificacao": "EFGH5678",
            "url_nfe": f"https://enotas.com.br/nota/{nota.id_nota_fiscal}",
            "url_pdf": f"https://enotas.com.br/nota/{nota.id_nota_fiscal}/pdf",
            "data_emissao": datetime.now().isoformat(),
            "xml_nfe": "<NFSe>mock eNotas</NFSe>",
        }

        logger.info(f"eNotas: Nota emitida (mock) - {resposta['numero']}")
        return resposta

    @staticmethod
    async def _emitir_nfse_nacional(nota: TbNotaFiscal) -> Dict[str, Any]:
        """
        Integração com NFSe Nacional
        API: https://nfse.gov.br/

        NOTA: Sistema unificado do governo
        """
        # TODO: Implementar integração real

        resposta = {
            "ref_externa": f"NFSE_{nota.id_nota_fiscal}",
            "numero": f"{int(nota.nr_rps) + 30000}",
            "serie": "003",
            "chave_acesso": "".join([str((i+2) % 10) for i in range(44)]),
            "codigo_verificacao": "IJKL9012",
            "url_nfe": f"https://nfse.gov.br/consulta/{nota.id_nota_fiscal}",
            "url_pdf": f"https://nfse.gov.br/pdf/{nota.id_nota_fiscal}",
            "data_emissao": datetime.now().isoformat(),
            "xml_nfe": "<NFSe>mock NFSe Nacional</NFSe>",
        }

        logger.info(f"NFSe Nacional: Nota emitida (mock) - {resposta['numero']}")
        return resposta

    @staticmethod
    async def _enviar_email_nota(nota: TbNotaFiscal):
        """Envia email com nota fiscal para o cliente"""
        # TODO: Integrar com service de email (UC095)
        logger.info(f"Email enviado (mock) para {nota.ds_tomador_email}: Nota {nota.nr_nota}")

    @staticmethod
    async def cancelar_nota_fiscal(
        db: AsyncSession,
        id_nota_fiscal: UUID,
        motivo: str
    ) -> TbNotaFiscal:
        """Cancela nota fiscal emitida"""
        query = select(TbNotaFiscal).where(TbNotaFiscal.id_nota_fiscal == id_nota_fiscal)
        result = await db.execute(query)
        nota = result.scalar_one_or_none()

        if not nota:
            raise ValueError("Nota fiscal não encontrada")

        if nota.st_nota != StatusNotaFiscal.EMITIDA.value:
            raise ValueError("Apenas notas emitidas podem ser canceladas")

        if nota.fg_cancelada:
            raise ValueError("Nota já está cancelada")

        # Cancelar na API do provedor
        # TODO: Implementar cancelamento real nas APIs

        # Atualizar nota
        nota.fg_cancelada = True
        nota.st_nota = StatusNotaFiscal.CANCELADA.value
        nota.dt_cancelamento = datetime.utcnow()
        nota.ds_motivo_cancelamento = motivo

        await db.commit()
        await db.refresh(nota)

        logger.info(f"Nota fiscal {id_nota_fiscal} cancelada: {motivo}")
        return nota

    @staticmethod
    async def listar_notas(
        db: AsyncSession,
        id_empresa: UUID,
        status: Optional[str] = None,
        dt_inicio: Optional[datetime] = None,
        dt_fim: Optional[datetime] = None,
        page: int = 1,
        size: int = 50
    ) -> tuple[List[TbNotaFiscal], int]:
        """Lista notas fiscais com filtros"""
        query = select(TbNotaFiscal).where(TbNotaFiscal.id_empresa == id_empresa)

        if status:
            query = query.where(TbNotaFiscal.st_nota == status)

        if dt_inicio:
            query = query.where(TbNotaFiscal.dt_criacao >= dt_inicio)

        if dt_fim:
            query = query.where(TbNotaFiscal.dt_criacao <= dt_fim)

        # Total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)

        # Paginação
        query = query.offset((page - 1) * size).limit(size).order_by(desc(TbNotaFiscal.dt_criacao))
        result = await db.execute(query)

        return list(result.scalars().all()), total or 0

    @staticmethod
    async def reenviar_email(
        db: AsyncSession,
        id_nota_fiscal: UUID,
        email: str
    ) -> bool:
        """Reenvia nota fiscal por email"""
        query = select(TbNotaFiscal).where(TbNotaFiscal.id_nota_fiscal == id_nota_fiscal)
        result = await db.execute(query)
        nota = result.scalar_one_or_none()

        if not nota or nota.st_nota != StatusNotaFiscal.EMITIDA.value:
            raise ValueError("Nota não encontrada ou não emitida")

        # TODO: Enviar email real
        logger.info(f"Nota {nota.nr_nota} reenviada para {email}")
        return True

    @staticmethod
    async def obter_estatisticas(
        db: AsyncSession,
        id_empresa: UUID,
        dt_inicio: Optional[datetime] = None,
        dt_fim: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Obtém estatísticas de notas fiscais"""
        query_base = select(TbNotaFiscal).where(TbNotaFiscal.id_empresa == id_empresa)

        if dt_inicio:
            query_base = query_base.where(TbNotaFiscal.dt_criacao >= dt_inicio)
        if dt_fim:
            query_base = query_base.where(TbNotaFiscal.dt_criacao <= dt_fim)

        # Total emitidas
        query_emitidas = select(func.count(TbNotaFiscal.id_nota_fiscal)).select_from(
            query_base.where(TbNotaFiscal.st_nota == StatusNotaFiscal.EMITIDA.value).subquery()
        )
        total_emitidas = await db.scalar(query_emitidas) or 0

        # Total canceladas
        query_canceladas = select(func.count(TbNotaFiscal.id_nota_fiscal)).select_from(
            query_base.where(TbNotaFiscal.fg_cancelada == "S").subquery()
        )
        total_canceladas = await db.scalar(query_canceladas) or 0

        # Total pendentes
        query_pendentes = select(func.count(TbNotaFiscal.id_nota_fiscal)).select_from(
            query_base.where(TbNotaFiscal.st_nota == StatusNotaFiscal.PENDENTE.value).subquery()
        )
        total_pendentes = await db.scalar(query_pendentes) or 0

        # Total erro
        query_erro = select(func.count(TbNotaFiscal.id_nota_fiscal)).select_from(
            query_base.where(TbNotaFiscal.st_nota == StatusNotaFiscal.ERRO.value).subquery()
        )
        total_erro = await db.scalar(query_erro) or 0

        # Valores
        query_valores = select(
            func.coalesce(func.sum(TbNotaFiscal.vl_liquido), 0),
            func.coalesce(func.sum(TbNotaFiscal.vl_iss), 0),
            func.coalesce(func.sum(TbNotaFiscal.vl_total_tributos), 0)
        ).select_from(
            query_base.where(
                and_(
                    TbNotaFiscal.st_nota == StatusNotaFiscal.EMITIDA.value,
                    TbNotaFiscal.fg_cancelada == "N"
                )
            ).subquery()
        )
        result_valores = await db.execute(query_valores)
        vl_total, vl_iss, vl_tributos = result_valores.one()

        return {
            "total_emitidas": total_emitidas,
            "total_canceladas": total_canceladas,
            "total_pendentes": total_pendentes,
            "total_erro": total_erro,
            "vl_total_faturado": float(vl_total or 0),
            "vl_total_iss": float(vl_iss or 0),
            "vl_total_tributos": float(vl_tributos or 0),
        }
