"""
Service de Certificados
"""
import random
import string
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import logger
from src.models.certificado import Certificado


class CertificadoService:
    """Service para gerenciar certificados"""

    @staticmethod
    def gerar_codigo_verificacao(ano: int = None) -> str:
        """Gera código único de verificação"""
        if ano is None:
            ano = datetime.utcnow().year

        # Formato: EST-2026-XXXXXX (6 dígitos aleatórios)
        random_digits = ''.join(random.choices(string.digits, k=6))
        return f"EST-{ano}-{random_digits}"

    @staticmethod
    async def buscar_certificado(
        db: AsyncSession,
        id_certificado: UUID
    ) -> Optional[Certificado]:
        """Busca certificado por ID"""
        query = select(Certificado).where(Certificado.id_certificado == id_certificado)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def buscar_por_codigo(
        db: AsyncSession,
        codigo_verificacao: str
    ) -> Optional[Certificado]:
        """Busca certificado por código de verificação"""
        query = select(Certificado).where(
            Certificado.codigo_verificacao == codigo_verificacao
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def listar_certificados_usuario(
        db: AsyncSession,
        id_usuario: UUID
    ) -> list[Certificado]:
        """Lista certificados de um usuário"""
        query = select(Certificado).where(
            Certificado.id_usuario == id_usuario
        ).order_by(Certificado.dt_emissao.desc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def emitir_certificado(
        db: AsyncSession,
        id_usuario: UUID,
        id_curso: UUID,
        nota_final: float,
        carga_horaria: int,
        tipo_certificacao: str = "bronze"
    ) -> Certificado:
        """Emite novo certificado"""
        # Gera código único
        codigo = CertificadoService.gerar_codigo_verificacao()

        # Verifica se já existe certificado para este curso/usuário
        query = select(Certificado).where(
            Certificado.id_usuario == id_usuario,
            Certificado.id_curso == id_curso
        )
        result = await db.execute(query)
        certificado_existente = result.scalar_one_or_none()

        if certificado_existente:
            logger.warning(f"⚠️ Certificado já existe: {certificado_existente.codigo_verificacao}")
            return certificado_existente

        # Define validade baseado no tipo
        validade_anos = {
            "bronze": 2,
            "prata": 3,
            "ouro": 5,
            "diamante": None  # Vitalício
        }

        dt_validade = None
        if tipo_certificacao in validade_anos and validade_anos[tipo_certificacao]:
            dt_validade = datetime.utcnow() + timedelta(days=365 * validade_anos[tipo_certificacao])

        # Define acreditações baseado no tipo e nota
        acreditacoes = ["DoctorQ Universidade"]

        # Adiciona acreditações profissionais baseado no desempenho
        if nota_final >= 9.0:
            acreditacoes.extend(["SBCP - Sociedade Brasileira de Cirurgia Plástica",
                                "SBME - Sociedade Brasileira de Medicina Estética"])
        elif nota_final >= 8.0:
            acreditacoes.append("SBME - Sociedade Brasileira de Medicina Estética")

        # Certificações especiais para tipos premium
        if tipo_certificacao in ["ouro", "diamante"]:
            acreditacoes.append("Certificado Internacional")

        # Cria certificado
        certificado = Certificado(
            codigo_verificacao=codigo,
            id_usuario=id_usuario,
            id_curso=id_curso,
            tipo_certificacao=tipo_certificacao,
            nota_final=nota_final,
            carga_horaria=carga_horaria,
            dt_validade=dt_validade,
            acreditacoes=acreditacoes
        )

        db.add(certificado)
        await db.commit()
        await db.refresh(certificado)

        logger.info(f"🎓 Certificado emitido: {codigo} para usuário {id_usuario}")
        return certificado

    @staticmethod
    async def verificar_validade(
        db: AsyncSession,
        codigo_verificacao: str
    ) -> dict:
        """Verifica se certificado é válido"""
        certificado = await CertificadoService.buscar_por_codigo(db, codigo_verificacao)

        if not certificado:
            return {
                "valido": False,
                "motivo": "Certificado não encontrado"
            }

        # Verifica validade
        if certificado.dt_validade and certificado.dt_validade < datetime.utcnow():
            return {
                "valido": False,
                "motivo": "Certificado expirado",
                "dt_validade": certificado.dt_validade
            }

        return {
            "valido": True,
            "certificado": certificado
        }
