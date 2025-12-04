"""
Serviço de Geração de PDFs (Certificados)
"""
from io import BytesIO
from datetime import datetime
import qrcode

from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from src.config import logger, settings


class PDFService:
    """Serviço para geração de PDFs"""

    @staticmethod
    def gerar_certificado_pdf(dados_certificado: dict) -> BytesIO:
        """
        Gera PDF de certificado

        Args:
            dados_certificado: {
                "codigo": "EST-2026-001234",
                "nome_aluno": "Dr. João Silva",
                "curso": "Toxina Botulínica Avançada",
                "carga_horaria": 20,
                "nota_final": 95.5,
                "data_conclusao": "2026-01-15",
                "instrutor": "Dra. Ana Costa",
                "acreditacoes": ["SBCP", "SBME"]
            }

        Returns:
            BytesIO: PDF em memória
        """
        buffer = BytesIO()

        # Cria canvas (A4 landscape para certificado)
        c = canvas.Canvas(buffer, pagesize=(11*inch, 8.5*inch))

        # Configurações
        width, height = 11*inch, 8.5*inch

        # BORDA DECORATIVA
        c.setStrokeColor(colors.HexColor("#8B5CF6"))  # Roxo
        c.setLineWidth(3)
        c.rect(0.5*inch, 0.5*inch, width-1*inch, height-1*inch)

        c.setStrokeColor(colors.HexColor("#A78BFA"))  # Roxo claro
        c.setLineWidth(1)
        c.rect(0.6*inch, 0.6*inch, width-1.2*inch, height-1.2*inch)

        # LOGO (placeholder - adicione logo real)
        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(colors.HexColor("#8B5CF6"))
        c.drawCentredString(width/2, height-1.5*inch, "🎓 Universidade da Beleza")

        # TÍTULO
        c.setFont("Helvetica", 16)
        c.setFillColor(colors.HexColor("#6B7280"))
        c.drawCentredString(width/2, height-2*inch, "Certifica que")

        # NOME DO ALUNO
        c.setFont("Helvetica-Bold", 32)
        c.setFillColor(colors.black)
        c.drawCentredString(width/2, height-2.8*inch, dados_certificado["nome_aluno"])

        # LINHA DECORATIVA
        c.setStrokeColor(colors.HexColor("#8B5CF6"))
        c.setLineWidth(1)
        c.line(2*inch, height-3.1*inch, width-2*inch, height-3.1*inch)

        # TEXTO PRINCIPAL
        c.setFont("Helvetica", 14)
        c.setFillColor(colors.HexColor("#374151"))

        texto_conclusao = f"concluiu com êxito o curso de"
        c.drawCentredString(width/2, height-3.6*inch, texto_conclusao)

        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(colors.HexColor("#8B5CF6"))
        c.drawCentredString(width/2, height-4.2*inch, dados_certificado["curso"])

        # CARGA HORÁRIA E NOTA
        c.setFont("Helvetica", 12)
        c.setFillColor(colors.HexColor("#6B7280"))

        carga_texto = f"Carga Horária: {dados_certificado['carga_horaria']}h"
        nota_texto = f"Nota Final: {dados_certificado['nota_final']:.1f}"

        c.drawCentredString(width/2 - 1.5*inch, height-4.8*inch, carga_texto)
        c.drawCentredString(width/2 + 1.5*inch, height-4.8*inch, nota_texto)

        # DATA
        c.setFont("Helvetica", 11)
        data_formatada = datetime.strptime(
            dados_certificado["data_conclusao"], "%Y-%m-%d"
        ).strftime("%d de %B de %Y")

        c.drawCentredString(width/2, height-5.4*inch, f"Emitido em {data_formatada}")

        # ASSINATURA (placeholder)
        c.setFont("Helvetica-Oblique", 10)
        c.setFillColor(colors.HexColor("#9CA3AF"))
        c.drawCentredString(width/2, height-6.2*inch, f"Instrutor: {dados_certificado.get('instrutor', 'DoctorQ Team')}")

        # ACREDITAÇÕES
        if dados_certificado.get("acreditacoes"):
            c.setFont("Helvetica", 9)
            c.setFillColor(colors.HexColor("#6B7280"))
            acred_text = "Acreditado por: " + ", ".join(dados_certificado["acreditacoes"])
            c.drawCentredString(width/2, height-6.6*inch, acred_text)

        # QR CODE (canto inferior direito)
        qr = qrcode.QRCode(version=1, box_size=3, border=1)
        qr_url = f"{settings.DOCTORQ_API_URL}/certificados/verificar/{dados_certificado['codigo']}"
        qr.add_data(qr_url)
        qr.make(fit=True)

        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)

        c.drawImage(qr_buffer, width-2*inch, 0.8*inch, 1.2*inch, 1.2*inch)

        # CÓDIGO DO CERTIFICADO
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor("#9CA3AF"))
        c.drawString(width-2*inch, 0.6*inch, f"Código: {dados_certificado['codigo']}")

        # RODAPÉ
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor("#D1D5DB"))
        c.drawCentredString(width/2, 0.4*inch, "Universidade da Beleza - DoctorQ Platform")
        c.drawCentredString(width/2, 0.2*inch, "Certificado digital com autenticidade verificável via QR Code")

        # Finaliza
        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer


    @staticmethod
    def gerar_relatorio_progresso_pdf(dados_aluno: dict) -> BytesIO:
        """
        Gera PDF de relatório de progresso do aluno

        Args:
            dados_aluno: {
                "nome": "João Silva",
                "cursos_concluidos": 5,
                "total_xp": 2500,
                "nivel": 12,
                "badges": 8,
                "tempo_estudo_horas": 87.5
            }

        Returns:
            BytesIO: PDF em memória
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)

        # Implementação básica (pode ser expandida)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(inch, 10*inch, "Relatório de Progresso")

        c.setFont("Helvetica", 12)
        y = 9*inch
        for key, value in dados_aluno.items():
            c.drawString(inch, y, f"{key}: {value}")
            y -= 0.3*inch

        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer
