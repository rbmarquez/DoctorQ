"""
Services do DoctorQ Universidade da Beleza
"""
from src.services.certificado_service import CertificadoService
from src.services.curso_service import CursoService
from src.services.email_service import EmailService
from src.services.pdf_service import PDFService

__all__ = [
    "CertificadoService",
    "CursoService",
    "EmailService",
    "PDFService",
]
