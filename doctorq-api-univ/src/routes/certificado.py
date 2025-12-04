"""
Rotas de Certificados
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_db
from src.models.certificado import CertificadoResponse
from src.services.certificado_service import CertificadoService
from src.services.curso_service import CursoService
from src.services.pdf_service import PDFService

router = APIRouter(prefix="/certificados", tags=["Certificados"])


@router.get("/usuario/{id_usuario}/", response_model=list[CertificadoResponse])
async def listar_certificados_usuario(
    id_usuario: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Lista certificados de um usuário"""
    certificados = await CertificadoService.listar_certificados_usuario(db, id_usuario)
    return certificados


@router.get("/verificar/{codigo}/")
async def verificar_certificado(
    codigo: str,
    db: AsyncSession = Depends(get_db)
):
    """Verifica autenticidade de um certificado"""
    resultado = await CertificadoService.verificar_validade(db, codigo)

    if not resultado["valido"]:
        return {
            "valido": False,
            "motivo": resultado["motivo"]
        }

    certificado = resultado["certificado"]
    return {
        "valido": True,
        "codigo": certificado.codigo_verificacao,
        "id_usuario": certificado.id_usuario,
        "id_curso": certificado.id_curso,
        "tipo": certificado.tipo_certificacao,
        "nota_final": certificado.nota_final,
        "carga_horaria": certificado.carga_horaria,
        "dt_emissao": certificado.dt_emissao,
        "dt_validade": certificado.dt_validade,
        "acreditacoes": certificado.acreditacoes
    }


class EmitirCertificadoRequest(BaseModel):
    id_usuario: UUID
    id_curso: UUID
    nota_final: float
    carga_horaria: int
    tipo_certificacao: str = "bronze"


@router.post("/emitir/", response_model=CertificadoResponse, status_code=201)
async def emitir_certificado(
    data: EmitirCertificadoRequest,
    db: AsyncSession = Depends(get_db)
):
    """Emite novo certificado"""
    certificado = await CertificadoService.emitir_certificado(
        db,
        data.id_usuario,
        data.id_curso,
        data.nota_final,
        data.carga_horaria,
        data.tipo_certificacao
    )
    return certificado


@router.get("/{id_certificado}/", response_model=CertificadoResponse)
async def buscar_certificado(
    id_certificado: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Busca certificado por ID"""
    certificado = await CertificadoService.buscar_certificado(db, id_certificado)
    if not certificado:
        raise HTTPException(status_code=404, detail="Certificado não encontrado")
    return certificado


@router.get("/{id_certificado}/download/")
async def download_certificado_pdf(
    id_certificado: UUID,
    nome_aluno: str = Query(None, description="Nome do aluno (opcional)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Download certificado em PDF

    **Parâmetros:**
    - id_certificado: ID do certificado
    - nome_aluno: Nome completo do aluno (opcional, usa "Aluno" se não fornecido)

    **Retorna:** PDF do certificado para download
    """
    # Busca certificado
    certificado = await CertificadoService.buscar_certificado(db, id_certificado)
    if not certificado:
        raise HTTPException(status_code=404, detail="Certificado não encontrado")

    # Busca dados do curso
    curso = await CursoService.buscar_curso(db, certificado.id_curso)
    if not curso:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    # Monta dados para o PDF
    dados_certificado = {
        "codigo": certificado.codigo_verificacao,
        "nome_aluno": nome_aluno or "Aluno",
        "curso": curso.titulo,
        "carga_horaria": certificado.carga_horaria,
        "nota_final": float(certificado.nota_final),
        "data_conclusao": certificado.dt_emissao.strftime("%Y-%m-%d"),
        "instrutor": curso.instrutor_nome or "DoctorQ Team",
        "acreditacoes": certificado.acreditacoes or ["DoctorQ Universidade"]
    }

    # Gera PDF
    pdf_buffer = PDFService.gerar_certificado_pdf(dados_certificado)

    # Retorna como download
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=certificado-{certificado.codigo_verificacao}.pdf"
        }
    )
