"""
Models do DoctorQ Universidade da Beleza
"""
from src.models.certificado import Certificado, CertificadoResponse
from src.models.curso import Curso, Aula, Matricula

__all__ = [
    "Certificado",
    "CertificadoResponse",
    "Curso",
    "Aula",
    "Matricula",
]
