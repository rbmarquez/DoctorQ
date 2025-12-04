"""
Serviço de Envio de Emails (SMTP)
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict
from datetime import datetime

from src.config import logger, settings


class EmailService:
    """Service para envio de emails via SMTP"""

    def __init__(self):
        """Inicializa configuração SMTP"""
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM

    def _create_smtp_connection(self):
        """Cria conexão SMTP com autenticação"""
        try:
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()  # TLS encryption

            if self.smtp_user and self.smtp_password:
                server.login(self.smtp_user, self.smtp_password)

            return server
        except Exception as e:
            logger.error(f"❌ Erro ao conectar SMTP: {e}")
            raise

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Envia email com template HTML

        Args:
            to_email: Email destinatário
            subject: Assunto
            html_body: Corpo HTML
            text_body: Corpo texto plano (fallback)

        Returns:
            True se enviado com sucesso
        """
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to_email

            # Corpo texto plano (fallback)
            if text_body:
                part1 = MIMEText(text_body, "plain", "utf-8")
                msg.attach(part1)

            # Corpo HTML
            part2 = MIMEText(html_body, "html", "utf-8")
            msg.attach(part2)

            # Envia email
            with self._create_smtp_connection() as server:
                server.sendmail(self.from_email, to_email, msg.as_string())

            logger.info(f"📧 Email enviado para {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao enviar email para {to_email}: {e}")
            return False

    def send_curso_concluido(
        self,
        to_email: str,
        nome_aluno: str,
        curso_titulo: str,
        certificado_url: str,
        nota_final: float
    ) -> bool:
        """
        Envia email de conclusão de curso com link do certificado

        Args:
            to_email: Email do aluno
            nome_aluno: Nome completo
            curso_titulo: Título do curso
            certificado_url: URL para download do certificado
            nota_final: Nota final do aluno
        """
        subject = f"🎓 Parabéns! Você concluiu: {curso_titulo}"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
                           color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }}
                .button {{ display: inline-block; background: #8B5CF6; color: white;
                          padding: 12px 24px; text-decoration: none; border-radius: 6px;
                          margin: 20px 0; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }}
                .stats {{ background: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 Certificado Disponível!</h1>
                </div>
                <div class="content">
                    <h2>Parabéns, {nome_aluno}!</h2>
                    <p>Você concluiu com êxito o curso:</p>
                    <h3 style="color: #8B5CF6;">{curso_titulo}</h3>

                    <div class="stats">
                        <p><strong>📊 Sua Performance:</strong></p>
                        <p>✨ Nota Final: <strong>{nota_final:.1f}</strong></p>
                        <p>🎯 Status: <strong>{"Aprovado" if nota_final >= 7.0 else "Concluído"}</strong></p>
                    </div>

                    <p>Seu certificado digital já está disponível para download:</p>
                    <center>
                        <a href="{certificado_url}" class="button">📥 Baixar Certificado</a>
                    </center>

                    <p style="margin-top: 30px;">
                        <strong>Próximos passos:</strong><br>
                        • Compartilhe seu certificado no LinkedIn<br>
                        • Explore nossos cursos avançados<br>
                        • Participe da comunidade DoctorQ
                    </p>
                </div>
                <div class="footer">
                    <p>Universidade da Beleza - DoctorQ Platform</p>
                    <p>Este é um email automático. Por favor, não responda.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Parabéns, {nome_aluno}!

        Você concluiu com êxito o curso: {curso_titulo}

        Nota Final: {nota_final:.1f}
        Status: {"Aprovado" if nota_final >= 7.0 else "Concluído"}

        Seu certificado digital está disponível em:
        {certificado_url}

        Universidade da Beleza - DoctorQ Platform
        """

        return self.send_email(to_email, subject, html_body, text_body)

    def send_novo_evento(
        self,
        to_email: str,
        nome_aluno: str,
        evento_titulo: str,
        evento_data: datetime,
        evento_url: str
    ) -> bool:
        """
        Envia notificação de novo evento/webinar

        Args:
            to_email: Email do aluno
            nome_aluno: Nome completo
            evento_titulo: Título do evento
            evento_data: Data/hora do evento
            evento_url: URL para inscrição
        """
        subject = f"🎬 Novo Evento: {evento_titulo}"

        data_formatada = evento_data.strftime("%d/%m/%Y às %H:%M")

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
                           color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }}
                .button {{ display: inline-block; background: #10B981; color: white;
                          padding: 12px 24px; text-decoration: none; border-radius: 6px;
                          margin: 20px 0; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }}
                .evento-info {{ background: #F0FDF4; padding: 15px; border-left: 4px solid #10B981;
                               border-radius: 4px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎬 Novo Evento Disponível!</h1>
                </div>
                <div class="content">
                    <h2>Olá, {nome_aluno}!</h2>
                    <p>Temos um novo evento imperdível para você:</p>

                    <div class="evento-info">
                        <h3 style="color: #10B981; margin-top: 0;">{evento_titulo}</h3>
                        <p><strong>📅 Data:</strong> {data_formatada}</p>
                    </div>

                    <p>Reserve sua vaga agora e participe ao vivo com nossos especialistas!</p>

                    <center>
                        <a href="{evento_url}" class="button">🎟️ Fazer Inscrição</a>
                    </center>

                    <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
                        💡 Vagas limitadas! Garanta a sua agora.
                    </p>
                </div>
                <div class="footer">
                    <p>Universidade da Beleza - DoctorQ Platform</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Olá, {nome_aluno}!

        Novo evento disponível:
        {evento_titulo}

        Data: {data_formatada}

        Faça sua inscrição em:
        {evento_url}

        Universidade da Beleza - DoctorQ Platform
        """

        return self.send_email(to_email, subject, html_body, text_body)

    def send_lembrete_aula(
        self,
        to_email: str,
        nome_aluno: str,
        curso_titulo: str,
        aula_titulo: str,
        aula_url: str,
        progresso_percentual: int
    ) -> bool:
        """
        Envia lembrete de aula não assistida

        Args:
            to_email: Email do aluno
            nome_aluno: Nome completo
            curso_titulo: Título do curso
            aula_titulo: Título da aula
            aula_url: URL da aula
            progresso_percentual: Progresso atual no curso
        """
        subject = f"📚 Lembrete: Continue seu curso - {curso_titulo}"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
                           color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }}
                .button {{ display: inline-block; background: #F59E0B; color: white;
                          padding: 12px 24px; text-decoration: none; border-radius: 6px;
                          margin: 20px 0; font-weight: bold; }}
                .progress-bar {{ background: #E5E7EB; height: 24px; border-radius: 12px;
                                overflow: hidden; margin: 15px 0; }}
                .progress-fill {{ background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%);
                                 height: 100%; width: {progresso_percentual}%;
                                 display: flex; align-items: center; justify-content: center;
                                 color: white; font-weight: bold; font-size: 12px; }}
                .footer {{ text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Continue Aprendendo!</h1>
                </div>
                <div class="content">
                    <h2>Olá, {nome_aluno}!</h2>
                    <p>Notamos que você está fazendo o curso:</p>
                    <h3 style="color: #F59E0B;">{curso_titulo}</h3>

                    <p><strong>Seu Progresso:</strong></p>
                    <div class="progress-bar">
                        <div class="progress-fill">{progresso_percentual}%</div>
                    </div>

                    <p>Próxima aula:</p>
                    <p style="background: #FEF3C7; padding: 10px; border-radius: 4px;">
                        <strong>{aula_titulo}</strong>
                    </p>

                    <p>Continue de onde parou e alcance seus objetivos!</p>

                    <center>
                        <a href="{aula_url}" class="button">▶️ Assistir Agora</a>
                    </center>
                </div>
                <div class="footer">
                    <p>Universidade da Beleza - DoctorQ Platform</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Olá, {nome_aluno}!

        Continue seu curso: {curso_titulo}

        Progresso: {progresso_percentual}%
        Próxima aula: {aula_titulo}

        Acesse em:
        {aula_url}

        Universidade da Beleza - DoctorQ Platform
        """

        return self.send_email(to_email, subject, html_body, text_body)

    def send_missao_diaria(
        self,
        to_email: str,
        nome_aluno: str,
        missoes: List[Dict],
        xp_disponivel: int
    ) -> bool:
        """
        Envia notificação de missões diárias disponíveis

        Args:
            to_email: Email do aluno
            nome_aluno: Nome completo
            missoes: Lista de missões [{"titulo": "...", "xp_recompensa": 100}]
            xp_disponivel: Total de XP disponível
        """
        subject = "🎯 Suas Missões Diárias Estão Disponíveis!"

        missoes_html = ""
        for missao in missoes:
            missoes_html += f"""
            <li style="margin: 10px 0; padding: 10px; background: #F9FAFB; border-radius: 4px;">
                <strong>{missao['titulo']}</strong> -
                <span style="color: #8B5CF6;">+{missao['xp_recompensa']} XP</span>
            </li>
            """

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%);
                           color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }}
                .button {{ display: inline-block; background: #EC4899; color: white;
                          padding: 12px 24px; text-decoration: none; border-radius: 6px;
                          margin: 20px 0; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Missões Diárias!</h1>
                </div>
                <div class="content">
                    <h2>Bom dia, {nome_aluno}!</h2>
                    <p>Suas missões de hoje estão prontas:</p>

                    <ul style="list-style: none; padding: 0;">
                        {missoes_html}
                    </ul>

                    <p style="background: #FEF3C7; padding: 15px; border-radius: 6px; text-align: center;">
                        <strong>💎 Total de XP disponível: {xp_disponivel} XP</strong>
                    </p>

                    <p>Complete as missões e ganhe XP para subir de nível!</p>

                    <center>
                        <a href="{settings.DOCTORQ_API_URL}/universidade/missoes" class="button">
                            🚀 Ver Missões
                        </a>
                    </center>
                </div>
                <div class="footer">
                    <p>Universidade da Beleza - DoctorQ Platform</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Bom dia, {nome_aluno}!

        Suas missões de hoje:

        {chr(10).join([f"• {m['titulo']} - +{m['xp_recompensa']} XP" for m in missoes])}

        Total de XP disponível: {xp_disponivel} XP

        Universidade da Beleza - DoctorQ Platform
        """

        return self.send_email(to_email, subject, html_body, text_body)


# Instância global do serviço
email_service = EmailService()
