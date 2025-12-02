# src/services/email_service.py

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço para envio de emails via SMTP"""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from = os.getenv("SMTP_FROM", "DoctorQ <noreply@doctorq.app>")
        self.frontend_url = os.getenv(
            "FRONTEND_URL",
            os.getenv("URL_PERMITIDA", "http://localhost:3000"),
        )

        # Validar configurações
        if not self.smtp_user or not self.smtp_password:
            logger.warning(
                "Configurações de email não definidas. Emails não serão enviados."
            )

    def _create_message(
        self, to: str, subject: str, html_body: str, text_body: Optional[str] = None
    ) -> MIMEMultipart:
        """Cria mensagem de email"""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.smtp_from
        msg["To"] = to

        # Adicionar corpo texto plano (fallback)
        if text_body:
            part1 = MIMEText(text_body, "plain")
            msg.attach(part1)

        # Adicionar corpo HTML
        part2 = MIMEText(html_body, "html")
        msg.attach(part2)

        return msg

    def send_email(
        self,
        to: str | List[str],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        """
        Envia email via SMTP

        Args:
            to: Email(s) de destino
            subject: Assunto do email
            html_body: Corpo do email em HTML
            text_body: Corpo do email em texto plano (opcional)

        Returns:
            True se enviado com sucesso, False caso contrário
        """
        if not self.smtp_user or not self.smtp_password:
            logger.error("Configurações de email não definidas")
            return False

        try:
            # Converter para lista se for string
            recipients = [to] if isinstance(to, str) else to

            # Criar conexão SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)

                # Enviar para cada destinatário
                for recipient in recipients:
                    msg = self._create_message(recipient, subject, html_body, text_body)
                    server.send_message(msg)
                    logger.info(f"Email enviado com sucesso para {recipient}")

            return True

        except smtplib.SMTPAuthenticationError:
            logger.error("Erro de autenticação SMTP - verifique usuário e senha")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"Erro ao enviar email: {e}")
            return False
        except Exception as e:
            logger.error(f"Erro inesperado ao enviar email: {e}")
            return False

    def send_password_reset_email(self, email: str, token: str, user_name: str) -> bool:
        """
        Envia email de recuperação de senha

        Args:
            email: Email do usuário
            token: Token de recuperação
            user_name: Nome do usuário

        Returns:
            True se enviado com sucesso
        """
        # Construir link de reset
        reset_link = f"{self.frontend_url}/redefinir-senha?token={token}"

        # Corpo HTML
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - DoctorQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!-- Container principal -->
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header com gradiente -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                ✨ DoctorQ
                            </h1>
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: bold;">
                                Recuperação de Senha
                            </h2>

                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Olá <strong>{user_name}</strong>,
                            </p>

                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Você solicitou a recuperação de senha da sua conta DoctorQ.
                            </p>

                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Clique no botão abaixo para criar uma nova senha:
                            </p>

                            <!-- Botão -->
                            <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
                                        <a href="{reset_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            Redefinir Senha
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Informações adicionais -->
                            <div style="margin-top: 32px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: bold;">
                                    ⚠️ Importante:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <li>Este link expira em <strong>1 hora</strong></li>
                                    <li>Só pode ser usado uma vez</li>
                                    <li>Se você não solicitou esta recuperação, ignore este email</li>
                                </ul>
                            </div>

                            <!-- Link alternativo -->
                            <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                            </p>
                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px;">
                                {reset_link}
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Esta é uma mensagem automática, por favor não responda.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        # Corpo texto plano (fallback)
        text_body = f"""
DoctorQ - Recuperação de Senha

Olá {user_name},

Você solicitou a recuperação de senha da sua conta DoctorQ.

Para criar uma nova senha, acesse o link abaixo:
{reset_link}

IMPORTANTE:
- Este link expira em 1 hora
- Só pode ser usado uma vez
- Se você não solicitou esta recuperação, ignore este email

Esta é uma mensagem automática, por favor não responda.

© 2025 DoctorQ. Todos os direitos reservados.
"""

        return self.send_email(
            to=email,
            subject="Recuperação de Senha - DoctorQ",
            html_body=html_body,
            text_body=text_body,
        )

    def send_password_changed_notification(self, email: str, user_name: str) -> bool:
        """
        Envia notificação de senha alterada

        Args:
            email: Email do usuário
            user_name: Nome do usuário

        Returns:
            True se enviado com sucesso
        """
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Senha Alterada - DoctorQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                ✅ Senha Alterada
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Olá <strong>{user_name}</strong>,
                            </p>

                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Sua senha foi alterada com sucesso!
                            </p>

                            <div style="margin-top: 24px; padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                                <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: bold;">
                                    ⚠️ Se você não fez esta alteração:
                                </p>
                                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                                    Entre em contato com nosso suporte imediatamente pelo email suporte@doctorq.app
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Esta é uma mensagem automática, por favor não responda.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        text_body = f"""
DoctorQ - Senha Alterada

Olá {user_name},

Sua senha foi alterada com sucesso!

Se você não fez esta alteração, entre em contato com nosso suporte imediatamente:
suporte@doctorq.app

Esta é uma mensagem automática, por favor não responda.

© 2025 DoctorQ. Todos os direitos reservados.
"""

        return self.send_email(
            to=email,
            subject="Senha Alterada - DoctorQ",
            html_body=html_body,
            text_body=text_body,
        )

    def send_user_limit_warning_email(
        self,
        email: str,
        empresa_name: str,
        admin_name: str,
        current_users: int,
        limit: int,
        percentage: float,
    ) -> bool:
        """
        Envia notificação de limite de usuários atingindo 90%

        Args:
            email: Email do administrador
            empresa_name: Nome da empresa/clínica
            admin_name: Nome do administrador
            current_users: Quantidade atual de usuários ativos
            limit: Limite máximo de usuários
            percentage: Percentual de uso (ex: 92.5)

        Returns:
            True se enviado com sucesso
        """
        # Link para gerenciar usuários
        manage_link = f"{self.frontend_url}/admin/usuarios"
        upgrade_link = f"{self.frontend_url}/admin/billing"

        # Determinar cor baseado no percentual
        if percentage >= 95:
            alert_color = "#dc2626"  # Vermelho crítico
            alert_bg = "#fef2f2"
            alert_icon = "🚨"
            alert_text = "Crítico"
        elif percentage >= 90:
            alert_color = "#f59e0b"  # Laranja atenção
            alert_bg = "#fef3c7"
            alert_icon = "⚠️"
            alert_text = "Atenção"
        else:
            alert_color = "#3b82f6"  # Azul info
            alert_bg = "#eff6ff"
            alert_icon = "ℹ️"
            alert_text = "Informação"

        # Corpo HTML
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Limite de Usuários - DoctorQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!-- Container principal -->
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header com gradiente -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, {alert_color} 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                {alert_icon} Limite de Usuários
                            </h1>
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: bold;">
                                {alert_text}: {percentage:.1f}% do limite atingido
                            </h2>

                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Olá <strong>{admin_name}</strong>,
                            </p>

                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                A empresa <strong>{empresa_name}</strong> está próxima do limite de usuários ativos.
                            </p>

                            <!-- Estatísticas -->
                            <div style="margin: 24px 0; padding: 24px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">
                                            Usuários Ativos:
                                        </td>
                                        <td style="padding: 12px 0; text-align: right; color: #1f2937; font-size: 18px; font-weight: bold;">
                                            {current_users}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                                            Limite do Plano:
                                        </td>
                                        <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; text-align: right; color: #1f2937; font-size: 18px; font-weight: bold;">
                                            {limit}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                                            Vagas Disponíveis:
                                        </td>
                                        <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; text-align: right; color: {alert_color}; font-size: 18px; font-weight: bold;">
                                            {limit - current_users}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-top: 2px solid {alert_color}; color: #6b7280; font-size: 14px;">
                                            Percentual de Uso:
                                        </td>
                                        <td style="padding: 12px 0; border-top: 2px solid {alert_color}; text-align: right; color: {alert_color}; font-size: 20px; font-weight: bold;">
                                            {percentage:.1f}%
                                        </td>
                                    </tr>
                                </table>

                                <!-- Barra de progresso -->
                                <div style="margin-top: 20px; width: 100%; height: 24px; background-color: #e5e7eb; border-radius: 12px; overflow: hidden;">
                                    <div style="width: {percentage}%; height: 100%; background: linear-gradient(90deg, {alert_color} 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                                        {percentage:.1f}%
                                    </div>
                                </div>
                            </div>

                            <!-- Alerta -->
                            <div style="margin: 24px 0; padding: 20px; background-color: {alert_bg}; border-left: 4px solid {alert_color}; border-radius: 4px;">
                                <p style="margin: 0 0 12px; color: {alert_color}; font-size: 14px; font-weight: bold;">
                                    {alert_icon} O que fazer:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: {alert_color}; font-size: 14px; line-height: 1.8;">
                                    <li>Revise seus usuários ativos e remova contas inativas</li>
                                    <li>Considere fazer upgrade do seu plano para aumentar o limite</li>
                                    <li>Gerencie permissões e perfis de acesso</li>
                                </ul>
                            </div>

                            <!-- Botões de ação -->
                            <table role="presentation" style="width: 100%; margin: 24px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding-right: 8px; width: 50%;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="border-radius: 6px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                                                    <a href="{manage_link}" style="display: block; padding: 14px 16px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; text-align: center;">
                                                        👥 Gerenciar Usuários
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="padding-left: 8px; width: 50%;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="border-radius: 6px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                                                    <a href="{upgrade_link}" style="display: block; padding: 14px 16px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; text-align: center;">
                                                        ⬆️ Fazer Upgrade
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Informação adicional -->
                            <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Quando o limite for atingido (100%), não será possível adicionar novos usuários até que você libere vagas ou faça upgrade do plano.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Esta é uma mensagem automática, por favor não responda.
                            </p>
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                                Precisa de ajuda? Entre em contato: <a href="mailto:suporte@doctorq.app" style="color: #8b5cf6;">suporte@doctorq.app</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        # Corpo texto plano (fallback)
        text_body = f"""
DoctorQ - {alert_text}: Limite de Usuários

Olá {admin_name},

A empresa {empresa_name} está próxima do limite de usuários ativos.

ESTATÍSTICAS:
- Usuários Ativos: {current_users}
- Limite do Plano: {limit}
- Vagas Disponíveis: {limit - current_users}
- Percentual de Uso: {percentage:.1f}%

O QUE FAZER:
- Revise seus usuários ativos e remova contas inativas
- Considere fazer upgrade do seu plano para aumentar o limite
- Gerencie permissões e perfis de acesso

AÇÕES:
- Gerenciar usuários: {manage_link}
- Fazer upgrade: {upgrade_link}

Quando o limite for atingido (100%), não será possível adicionar novos usuários até que você libere vagas ou faça upgrade do plano.

Esta é uma mensagem automática, por favor não responda.
Precisa de ajuda? suporte@doctorq.app

© 2025 DoctorQ. Todos os direitos reservados.
"""

        return self.send_email(
            to=email,
            subject=f"⚠️ {empresa_name}: {percentage:.0f}% do limite de usuários atingido",
            html_body=html_body,
            text_body=text_body,
        )

    async def send_upgrade_notification(
        self, email: str, empresa_name: str, new_plan: str
    ) -> bool:
        """
        Envia notificação de upgrade de plano realizado com sucesso

        Args:
            email: Email do administrador
            empresa_name: Nome da empresa/clínica
            new_plan: Nome do novo plano

        Returns:
            True se enviado com sucesso
        """
        billing_link = f"{self.frontend_url}/admin/billing"

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upgrade Realizado - DoctorQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header com gradiente -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                ✨ Upgrade Realizado com Sucesso!
                            </h1>
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: bold;">
                                Parabéns! Seu plano foi atualizado
                            </h2>

                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                A empresa <strong>{empresa_name}</strong> agora está no plano <strong>{new_plan}</strong>!
                            </p>

                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Todos os novos recursos e limites já estão disponíveis para uso imediato.
                            </p>

                            <!-- Informações -->
                            <div style="margin: 24px 0; padding: 24px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
                                <p style="margin: 0 0 12px; color: #065f46; font-size: 14px; font-weight: bold;">
                                    ✅ Benefícios do novo plano:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #065f46; font-size: 14px; line-height: 1.8;">
                                    <li>Limites de uso atualizados automaticamente</li>
                                    <li>Novos recursos disponíveis agora</li>
                                    <li>Acesso a funcionalidades premium</li>
                                    <li>Suporte prioritário</li>
                                </ul>
                            </div>

                            <!-- Botão -->
                            <table role="presentation" style="margin: 24px auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                                        <a href="{billing_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            Ver Detalhes do Plano
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info adicional -->
                            <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                A cobrança será ajustada proporcionalmente no próximo ciclo de faturamento.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Esta é uma mensagem automática, por favor não responda.
                            </p>
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                                Precisa de ajuda? Entre em contato: <a href="mailto:suporte@doctorq.app" style="color: #8b5cf6;">suporte@doctorq.app</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        text_body = f"""
DoctorQ - Upgrade Realizado com Sucesso!

A empresa {empresa_name} agora está no plano {new_plan}!

Todos os novos recursos e limites já estão disponíveis para uso imediato.

BENEFÍCIOS DO NOVO PLANO:
- Limites de uso atualizados automaticamente
- Novos recursos disponíveis agora
- Acesso a funcionalidades premium
- Suporte prioritário

Ver detalhes do plano: {billing_link}

A cobrança será ajustada proporcionalmente no próximo ciclo de faturamento.

Esta é uma mensagem automática, por favor não responda.
Precisa de ajuda? suporte@doctorq.app

© 2025 DoctorQ. Todos os direitos reservados.
"""

        return self.send_email(
            to=email,
            subject=f"✨ {empresa_name}: Upgrade para {new_plan} realizado!",
            html_body=html_body,
            text_body=text_body,
        )

    async def send_trial_ending_notification(
        self, email: str, empresa_name: str, days_remaining: int
    ) -> bool:
        """
        Envia notificação de trial terminando em X dias

        Args:
            email: Email do administrador
            empresa_name: Nome da empresa/clínica
            days_remaining: Dias restantes do trial (normalmente 3)

        Returns:
            True se enviado com sucesso
        """
        billing_link = f"{self.frontend_url}/admin/billing"

        # Definir cores baseado nos dias restantes
        if days_remaining <= 1:
            alert_color = "#dc2626"  # Vermelho
            alert_bg = "#fef2f2"
            alert_icon = "🚨"
        elif days_remaining <= 3:
            alert_color = "#f59e0b"  # Laranja
            alert_bg = "#fef3c7"
            alert_icon = "⚠️"
        else:
            alert_color = "#3b82f6"  # Azul
            alert_bg = "#eff6ff"
            alert_icon = "ℹ️"

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trial Terminando - DoctorQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header com gradiente -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, {alert_color} 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                {alert_icon} Período de Trial Terminando
                            </h1>
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: bold;">
                                Restam apenas {days_remaining} {'dia' if days_remaining == 1 else 'dias'} de trial
                            </h2>

                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                O período de teste da empresa <strong>{empresa_name}</strong> está terminando.
                            </p>

                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Para continuar usando todos os recursos do DoctorQ sem interrupções, escolha um plano agora.
                            </p>

                            <!-- Alerta -->
                            <div style="margin: 24px 0; padding: 20px; background-color: {alert_bg}; border-left: 4px solid {alert_color}; border-radius: 4px;">
                                <p style="margin: 0 0 12px; color: {alert_color}; font-size: 14px; font-weight: bold;">
                                    {alert_icon} O que acontece após o trial:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: {alert_color}; font-size: 14px; line-height: 1.8;">
                                    <li>Recursos premium serão desativados</li>
                                    <li>Acesso limitado ao plano gratuito</li>
                                    <li>Dados salvos permanecerão seguros</li>
                                </ul>
                            </div>

                            <!-- Estatísticas do trial -->
                            <div style="margin: 24px 0; padding: 24px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: bold;">
                                    💎 Durante o trial você teve acesso a:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                                    <li>Recursos premium ilimitados</li>
                                    <li>Suporte prioritário</li>
                                    <li>Todos os módulos do sistema</li>
                                    <li>Integrações avançadas</li>
                                </ul>
                            </div>

                            <!-- Botão -->
                            <table role="presentation" style="margin: 24px auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
                                        <a href="{billing_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            Escolher Plano Agora
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info adicional -->
                            <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Precisa de mais tempo ou tem dúvidas? Entre em contato com nosso time de suporte!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Esta é uma mensagem automática, por favor não responda.
                            </p>
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                                Precisa de ajuda? Entre em contato: <a href="mailto:suporte@doctorq.app" style="color: #8b5cf6;">suporte@doctorq.app</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        text_body = f"""
DoctorQ - Período de Trial Terminando

Restam apenas {days_remaining} {'dia' if days_remaining == 1 else 'dias'} de trial!

O período de teste da empresa {empresa_name} está terminando.

Para continuar usando todos os recursos do DoctorQ sem interrupções, escolha um plano agora.

O QUE ACONTECE APÓS O TRIAL:
- Recursos premium serão desativados
- Acesso limitado ao plano gratuito
- Dados salvos permanecerão seguros

DURANTE O TRIAL VOCÊ TEVE ACESSO A:
- Recursos premium ilimitados
- Suporte prioritário
- Todos os módulos do sistema
- Integrações avançadas

Escolher plano agora: {billing_link}

Precisa de mais tempo ou tem dúvidas? Entre em contato com nosso time de suporte!

Esta é uma mensagem automática, por favor não responda.
Precisa de ajuda? suporte@doctorq.app

© 2025 DoctorQ. Todos os direitos reservados.
"""

        return self.send_email(
            to=email,
            subject=f"{alert_icon} {empresa_name}: Trial termina em {days_remaining} {'dia' if days_remaining == 1 else 'dias'}",
            html_body=html_body,
            text_body=text_body,
        )

    async def send_welcome_email(
        self, email: str, user_name: str, empresa_name: str, is_trial: bool = False
    ) -> bool:
        """
        Envia email de boas-vindas para novo usuário

        Args:
            email: Email do usuário
            user_name: Nome do usuário
            empresa_name: Nome da empresa
            is_trial: Se está em período trial

        Returns:
            True se enviado com sucesso
        """
        dashboard_link = f"{self.frontend_url}/admin/dashboard"

        trial_text = "durante o período de trial gratuito de 14 dias" if is_trial else ""

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Bem-vindo ao DoctorQ - {empresa_name}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
    <table style="width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; font-size: 32px; margin: 0;">
                    🎉 Bem-vindo ao DoctorQ!
                </h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <h2 style="color: #1f2937; margin: 0 0 20px;">Olá {user_name}!</h2>

                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Estamos muito felizes em ter você e a <strong>{empresa_name}</strong> no DoctorQ {trial_text}!
                </p>

                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Você agora tem acesso a uma plataforma completa para gestão de clínicas de estética.
                </p>

                <div style="margin: 30px 0; padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; border-left: 4px solid #10b981;">
                    <h3 style="color: #065f46; margin: 0 0 16px; font-size: 18px;">✨ Próximos Passos</h3>
                    <ul style="color: #065f46; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Complete o perfil da sua empresa</li>
                        <li>Cadastre sua primeira clínica</li>
                        <li>Adicione profissionais à equipe</li>
                        <li>Configure horários de atendimento</li>
                        <li>Comece a agendar procedimentos</li>
                    </ul>
                </div>

                <table style="margin: 30px auto; border-collapse: collapse;">
                    <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
                            <a href="{dashboard_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                Acessar Dashboard
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Precisa de ajuda? Nossa equipe está pronta para te atender!
                    <br>
                    📧 suporte@doctorq.app
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Esta é uma mensagem automática, por favor não responda.
                </p>
                <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                    © 2025 DoctorQ. Todos os direitos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        text_body = f"""
Bem-vindo ao DoctorQ, {user_name}!

Estamos felizes em ter você e a {empresa_name} na plataforma {trial_text}!

PRÓXIMOS PASSOS:
- Complete o perfil da empresa
- Cadastre clínicas e profissionais
- Configure horários de atendimento
- Comece a agendar

Acessar dashboard: {dashboard_link}

Precisa de ajuda? suporte@doctorq.app

© 2025 DoctorQ
"""

        return self.send_email(
            to=email,
            subject=f"🎉 Bem-vindo ao DoctorQ, {user_name}!",
            html_body=html_body,
            text_body=text_body,
        )

    async def send_agendamento_confirmacao(
        self,
        email: str,
        paciente_nome: str,
        procedimento_nome: str,
        data_agendamento: str,
        clinica_nome: str,
        profissional_nome: str,
    ) -> bool:
        """
        Envia confirmação de agendamento

        Args:
            email: Email do paciente
            paciente_nome: Nome do paciente
            procedimento_nome: Nome do procedimento
            data_agendamento: Data/hora formatada
            clinica_nome: Nome da clínica
            profissional_nome: Nome do profissional

        Returns:
            True se enviado com sucesso
        """
        agenda_link = f"{self.frontend_url}/paciente/agendamentos"

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Agendamento Confirmado - DoctorQ</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table style="width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px;">
        <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0;">
                    ✅ Agendamento Confirmado!
                </h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <h2 style="color: #1f2937;">Olá {paciente_nome}!</h2>

                <p style="color: #4b5563; font-size: 16px;">
                    Seu agendamento foi confirmado com sucesso!
                </p>

                <div style="margin: 30px 0; padding: 24px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                    <h3 style="color: #065f46; margin: 0 0 16px;">📋 Detalhes do Agendamento</h3>
                    <table style="width: 100%; color: #065f46;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Procedimento:</td>
                            <td style="padding: 8px 0;">{procedimento_nome}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Data/Hora:</td>
                            <td style="padding: 8px 0;">{data_agendamento}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Clínica:</td>
                            <td style="padding: 8px 0;">{clinica_nome}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Profissional:</td>
                            <td style="padding: 8px 0;">{profissional_nome}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin: 20px 0; padding: 20px; background-color: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>💡 Lembrete:</strong> Você receberá um lembrete 24h e 2h antes do horário agendado.
                    </p>
                </div>

                <table style="margin: 30px auto;">
                    <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
                            <a href="{agenda_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold;">
                                Ver Meus Agendamentos
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Esta é uma mensagem automática, por favor não responda.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        return self.send_email(
            to=email,
            subject=f"✅ Agendamento Confirmado - {procedimento_nome}",
            html_body=html_body,
        )

    async def send_pagamento_confirmacao(
        self,
        email: str,
        cliente_nome: str,
        valor: float,
        metodo_pagamento: str,
        numero_transacao: str,
    ) -> bool:
        """
        Envia confirmação de pagamento

        Args:
            email: Email do cliente
            cliente_nome: Nome do cliente
            valor: Valor pago
            metodo_pagamento: Método de pagamento
            numero_transacao: Número da transação

        Returns:
            True se enviado com sucesso
        """
        financeiro_link = f"{self.frontend_url}/paciente/financeiro"

        html_body = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table style="width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px;">
        <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff;">💰 Pagamento Confirmado!</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <h2 style="color: #1f2937;">Olá {cliente_nome}!</h2>

                <p style="color: #4b5563; font-size: 16px;">
                    Seu pagamento foi processado com sucesso!
                </p>

                <div style="margin: 30px 0; padding: 24px; background-color: #f0fdf4; border-radius: 8px;">
                    <h3 style="color: #065f46; margin: 0 0 16px;">📄 Comprovante de Pagamento</h3>
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #065f46;">Valor:</td>
                            <td style="padding: 8px 0; color: #065f46;">R$ {valor:.2f}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #065f46;">Método:</td>
                            <td style="padding: 8px 0; color: #065f46;">{metodo_pagamento}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #065f46;">Transação:</td>
                            <td style="padding: 8px 0; color: #065f46; font-family: monospace;">{numero_transacao}</td>
                        </tr>
                    </table>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                    Você pode acessar o comprovante completo e histórico de pagamentos na sua área de cliente.
                </p>

                <table style="margin: 30px auto;">
                    <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
                            <a href="{financeiro_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold;">
                                Ver Histórico Financeiro
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        return self.send_email(
            to=email,
            subject=f"💰 Pagamento Confirmado - R$ {valor:.2f}",
            html_body=html_body,
        )


    async def send_nova_candidatura_notification(
        self,
        email_empresa: str,
        nm_cargo: str,
        id_vaga: str,
        nm_candidato: str,
        nm_cargo_desejado: str,
        match_score: int,
    ) -> bool:
        """
        Envia notificação para empresa quando receber nova candidatura.

        Args:
            email_empresa: Email do responsável pela vaga
            nm_cargo: Nome do cargo da vaga
            id_vaga: ID da vaga
            nm_candidato: Nome completo do candidato
            nm_cargo_desejado: Cargo desejado pelo candidato
            match_score: Score de compatibilidade (0-100)

        Returns:
            True se enviado com sucesso
        """
        # Determinar cor do score
        if match_score >= 80:
            score_color = "#059669"  # Verde
            score_label = "Excelente"
        elif match_score >= 60:
            score_color = "#D97706"  # Amarelo
            score_label = "Boa"
        else:
            score_color = "#DC2626"  # Vermelho
            score_label = "Regular"

        candidatos_link = f"{self.frontend_url}/clinica/vagas/{id_vaga}/candidatos"

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nova Candidatura - DoctorQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #E11D48 0%, #9333EA 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                🎉 Nova Candidatura Recebida!
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Você recebeu uma nova candidatura para a vaga de <strong>{nm_cargo}</strong>.
                            </p>

                            <!-- Candidato Info -->
                            <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid #E11D48; border-radius: 4px;">
                                <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 18px;">
                                    👤 Candidato
                                </h3>
                                <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                                    <strong>Nome:</strong> {nm_candidato}
                                </p>
                                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                                    <strong>Cargo desejado:</strong> {nm_cargo_desejado}
                                </p>
                            </div>

                            <!-- Match Score -->
                            <div style="margin: 24px 0; text-align: center;">
                                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; font-weight: 600;">
                                    Score de Compatibilidade
                                </p>
                                <div style="font-size: 48px; font-weight: bold; color: {score_color};">
                                    {match_score}%
                                </div>
                                <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                                    ✨ {score_label} compatibilidade
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 30px auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #E11D48 0%, #9333EA 100%);">
                                        <a href="{candidatos_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            Ver Candidatura Completa
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tip -->
                            <div style="margin: 24px 0; padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                                    💡 <strong>Dica:</strong> Responda rapidamente para aumentar suas chances de contratar os melhores talentos!
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Esta é uma mensagem automática, por favor não responda.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        text_body = f"""
Nova Candidatura Recebida!

Você recebeu uma nova candidatura para a vaga de {nm_cargo}.

CANDIDATO:
- Nome: {nm_candidato}
- Cargo desejado: {nm_cargo_desejado}

SCORE DE COMPATIBILIDADE: {match_score}% ({score_label})

Acesse o sistema para ver a candidatura completa:
{candidatos_link}

---
💡 Dica: Responda rapidamente para aumentar suas chances de contratar os melhores talentos!

Esta é uma mensagem automática, por favor não responda.
© 2025 DoctorQ
"""

        return self.send_email(
            to=email_empresa,
            subject=f"🎉 Nova Candidatura: {nm_cargo}",
            html_body=html_body,
            text_body=text_body,
        )

    async def send_candidatura_status_notification(
        self,
        email_candidato: str,
        nm_candidato: str,
        nm_cargo: str,
        nm_empresa: str,
        novo_status: str,
        feedback: str | None = None,
        dt_entrevista: str | None = None,
    ) -> bool:
        """
        Envia notificação para candidato quando status da candidatura mudar.

        Args:
            email_candidato: Email do candidato
            nm_candidato: Nome do candidato
            nm_cargo: Nome do cargo da vaga
            nm_empresa: Nome da empresa
            novo_status: Novo status (em_analise, entrevista_agendada, aprovado, reprovado)
            feedback: Feedback da empresa (opcional)
            dt_entrevista: Data da entrevista formatada (opcional)

        Returns:
            True se enviado com sucesso
        """
        # Mapear status para info visual
        status_map = {
            "em_analise": {
                "emoji": "👀",
                "titulo": "Sua candidatura está em análise!",
                "mensagem": "A empresa está analisando seu currículo. Você será notificado sobre os próximos passos em breve.",
                "cor": "#3B82F6",
                "bg_cor": "#eff6ff",
            },
            "entrevista_agendada": {
                "emoji": "📅",
                "titulo": "Entrevista Agendada!",
                "mensagem": "Parabéns! A empresa gostou do seu perfil e agendou uma entrevista com você.",
                "cor": "#9333EA",
                "bg_cor": "#faf5ff",
            },
            "aprovado": {
                "emoji": "🎉",
                "titulo": "Parabéns! Você foi aprovado!",
                "mensagem": "Excelente notícia! A empresa decidiu seguir com sua contratação. Em breve você receberá mais informações sobre os próximos passos.",
                "cor": "#059669",
                "bg_cor": "#ecfdf5",
            },
            "reprovado": {
                "emoji": "😔",
                "titulo": "Resultado do Processo Seletivo",
                "mensagem": "Infelizmente, desta vez sua candidatura não foi selecionada. Não desanime! Continue se candidatando a outras vagas.",
                "cor": "#DC2626",
                "bg_cor": "#fef2f2",
            },
        }

        status_info = status_map.get(
            novo_status,
            {
                "emoji": "ℹ️",
                "titulo": "Atualização da Candidatura",
                "mensagem": "Houve uma atualização no status da sua candidatura.",
                "cor": "#6B7280",
                "bg_cor": "#f9fafb",
            },
        )

        candidaturas_link = f"{self.frontend_url}/carreiras/minhas-candidaturas"

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Atualização de Candidatura - DoctorQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #E11D48 0%, #9333EA 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                {status_info['emoji']} {status_info['titulo']}
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Olá <strong>{nm_candidato}</strong>,
                            </p>

                            <!-- Vaga Info -->
                            <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid {status_info['cor']}; border-radius: 4px;">
                                <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 18px;">
                                    📋 Vaga
                                </h3>
                                <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                                    <strong>Cargo:</strong> {nm_cargo}
                                </p>
                                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                                    <strong>Empresa:</strong> {nm_empresa}
                                </p>
                            </div>

                            <!-- Status Badge -->
                            <div style="margin: 24px 0; text-align: center; padding: 20px; background-color: {status_info['bg_cor']}; border-radius: 8px;">
                                <span style="display: inline-block; background: {status_info['cor']}; color: white; padding: 12px 24px; border-radius: 20px; font-weight: 600; font-size: 16px;">
                                    {status_info['emoji']} {status_info['titulo']}
                                </span>
                            </div>

                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                                {status_info['mensagem']}
                            </p>

                            <!-- Entrevista Info -->
                            {"" if not dt_entrevista else f'''
                            <div style="margin: 24px 0; padding: 20px; background-color: #faf5ff; border-left: 4px solid #9333EA; border-radius: 4px;">
                                <h3 style="margin: 0 0 12px; color: #581c87; font-size: 18px;">
                                    📅 Data da Entrevista
                                </h3>
                                <p style="margin: 0; color: #7c3aed; font-size: 20px; font-weight: 600;">
                                    {dt_entrevista}
                                </p>
                                <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px;">
                                    Não se esqueça de comparecer! Boa sorte! 🍀
                                </p>
                            </div>
                            '''}

                            <!-- Feedback -->
                            {"" if not feedback else f'''
                            <div style="margin: 24px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 18px;">
                                    💬 Feedback da Empresa
                                </h3>
                                <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                                    {feedback}
                                </p>
                            </div>
                            '''}

                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 30px auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #E11D48 0%, #9333EA 100%);">
                                        <a href="{candidaturas_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            Ver Minhas Candidaturas
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Mensagem motivacional para reprovados -->
                            {"" if novo_status != "reprovado" else '''
                            <div style="margin: 24px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px;">
                                    💡 <strong>Não desista!</strong> Continue se candidatando a outras vagas. Cada experiência é um aprendizado e te aproxima da oportunidade ideal!
                                </p>
                            </div>
                            '''}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Esta é uma mensagem automática, por favor não responda.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 DoctorQ. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        text_body = f"""
{status_info['emoji']} {status_info['titulo']}

Olá {nm_candidato},

VAGA:
- Cargo: {nm_cargo}
- Empresa: {nm_empresa}

STATUS: {status_info['titulo']}

{status_info['mensagem']}
"""

        if dt_entrevista:
            text_body += f"\n\nDATA DA ENTREVISTA: {dt_entrevista}\nNão se esqueça de comparecer! Boa sorte! 🍀\n"

        if feedback:
            text_body += f"\n\nFEEDBACK DA EMPRESA:\n{feedback}\n"

        text_body += f"""
Acesse o sistema para ver mais detalhes:
{candidaturas_link}
"""

        if novo_status == "reprovado":
            text_body += "\n💡 Não desista! Continue se candidatando. Cada experiência é um aprendizado!\n"

        text_body += """
---
Esta é uma mensagem automática, por favor não responda.
© 2025 DoctorQ
"""

        return self.send_email(
            to=email_candidato,
            subject=f"{status_info['emoji']} {nm_cargo} - {status_info['titulo']}",
            html_body=html_body,
            text_body=text_body,
        )


# Instância global
email_service = EmailService()
